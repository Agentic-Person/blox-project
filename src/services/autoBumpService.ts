import { supabase as supabaseClient } from '@/lib/supabase/client'
import { Todo } from '@/store/calendarTodoStore'
import { addDays, addHours, format, isWeekend, startOfDay, endOfDay } from 'date-fns'

export interface AutoBumpConfig {
  maxBumpsPerTask: number
  bumpTimeHour: number  // 0-23 hour when to process bumps
  workingDays: number[] // 0-6 (Sunday-Saturday)
  workingHours: { start: number; end: number }
  priorityWeights: {
    urgent: number
    high: number
    medium: number
    low: number
  }
  categoryScheduling: {
    [category: string]: {
      preferredTimes: string[] // HH:MM format
      maxDuration: number // minutes
      bufferTime: number // minutes between tasks
    }
  }
}

const DEFAULT_CONFIG: AutoBumpConfig = {
  maxBumpsPerTask: 3,
  bumpTimeHour: 21, // 9 PM
  workingDays: [1, 2, 3, 4, 5], // Monday-Friday
  workingHours: { start: 9, end: 17 }, // 9 AM - 5 PM
  priorityWeights: {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
  },
  categoryScheduling: {
    video: {
      preferredTimes: ['10:00', '14:00', '16:00'],
      maxDuration: 60,
      bufferTime: 15
    },
    practice: {
      preferredTimes: ['10:30', '14:30', '16:30'],
      maxDuration: 120,
      bufferTime: 30
    },
    learn: {
      preferredTimes: ['09:00', '13:00', '15:00'],
      maxDuration: 90,
      bufferTime: 15
    },
    review: {
      preferredTimes: ['17:00', '18:00', '19:00'],
      maxDuration: 45,
      bufferTime: 10
    },
    build: {
      preferredTimes: ['10:00', '14:00'],
      maxDuration: 180,
      bufferTime: 30
    }
  }
}

interface BumpCandidate extends Todo {
  bumpScore: number
  suggestedDate: Date
  suggestedTime?: string
  bumpReason: string
}

export class AutoBumpService {
  private supabase = supabaseClient
  private config: AutoBumpConfig

  constructor(config?: Partial<AutoBumpConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    if (!this.supabase) {
      throw new Error('Supabase client is not available')
    }
  }

  /**
   * Process auto-bump for all overdue/incomplete tasks for a user
   */
  async processAutoBump(userId: string): Promise<{
    success: boolean
    bumpedCount: number
    skippedCount: number
    errors: string[]
  }> {
    try {
      console.log(`🔄 Starting auto-bump process for user ${userId}`)

      // Get user preferences
      const { data: preferences } = await this.supabase!
        .from('calendar_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (preferences && !preferences.enable_auto_bump) {
        console.log('❌ Auto-bump disabled for user')
        return {
          success: true,
          bumpedCount: 0,
          skippedCount: 0,
          errors: ['Auto-bump disabled in user preferences']
        }
      }

      // Get todos that need bumping
      const candidates = await this.findBumpCandidates(userId)
      console.log(`📋 Found ${candidates.length} bump candidates`)

      if (candidates.length === 0) {
        return {
          success: true,
          bumpedCount: 0,
          skippedCount: 0,
          errors: []
        }
      }

      // Get user's existing calendar events and todos to avoid conflicts
      const { existingEvents, existingTodos } = await this.getExistingSchedule(userId)

      // Smart schedule the bumped tasks
      const scheduledCandidates = await this.smartScheduleBumpedTasks(
        candidates,
        existingEvents,
        existingTodos,
        preferences
      )

      let bumpedCount = 0
      let skippedCount = 0
      const errors: string[] = []

      // Execute the bumps
      for (const candidate of scheduledCandidates) {
        try {
          if (candidate.suggestedDate) {
            await this.executeBump(candidate, userId)
            bumpedCount++
          } else {
            skippedCount++
          }
        } catch (error) {
          console.error(`❌ Failed to bump todo ${candidate.id}:`, error)
          errors.push(`Failed to bump "${candidate.title}": ${error}`)
          skippedCount++
        }
      }

      console.log(`✅ Auto-bump complete: ${bumpedCount} bumped, ${skippedCount} skipped`)

      return {
        success: true,
        bumpedCount,
        skippedCount,
        errors
      }
    } catch (error) {
      console.error('❌ Auto-bump process failed:', error)
      return {
        success: false,
        bumpedCount: 0,
        skippedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Find todos that are candidates for auto-bumping
   */
  private async findBumpCandidates(userId: string): Promise<BumpCandidate[]> {
    const now = new Date()
    const today = format(now, 'yyyy-MM-dd')

    // Get todos that are overdue or scheduled for today but incomplete
    const { data: todos, error } = await this.supabase!
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .lt('bump_count', this.config.maxBumpsPerTask)
      .or(`due_date.lt.${now.toISOString()},scheduled_date.lt.${today}`)

    if (error || !todos) {
      throw new Error(`Failed to fetch bump candidates: ${error?.message}`)
    }

    // Score each todo for bumping priority
    const candidates: BumpCandidate[] = todos
      .filter(todo => todo.user_id) // Filter out any todos with null user_id
      .map(todo => {
        const bumpScore = this.calculateBumpScore(todo as Todo, now)
        const bumpReason = this.determineBumpReason(todo as Todo, now)

        return {
          ...(todo as Todo),
          bumpScore,
          suggestedDate: now, // Will be updated by smart scheduling
          bumpReason
        }
      })

    // Sort by bump score (higher = more urgent to bump)
    candidates.sort((a, b) => b.bumpScore - a.bumpScore)

    return candidates
  }

  /**
   * Calculate priority score for bumping a todo
   */
  private calculateBumpScore(todo: Todo, now: Date): number {
    let score = 0

    // Priority weight
    score += this.config.priorityWeights[todo.priority] * 10

    // Overdue penalty (more overdue = higher score)
    if (todo.due_date) {
      const overdueDays = Math.floor(
        (now.getTime() - new Date(todo.due_date).getTime()) / (1000 * 60 * 60 * 24)
      )
      score += Math.max(0, overdueDays) * 5
    }

    if (todo.scheduled_date) {
      const scheduledOverdueDays = Math.floor(
        (now.getTime() - new Date(todo.scheduled_date).getTime()) / (1000 * 60 * 60 * 24)
      )
      score += Math.max(0, scheduledOverdueDays) * 3
    }

    // Bump count penalty (fewer bumps = higher priority)
    score += (this.config.maxBumpsPerTask - todo.bump_count) * 2

    // Estimated time bonus (shorter tasks get slight priority)
    if (todo.estimated_minutes && todo.estimated_minutes <= 30) {
      score += 5
    }

    // Auto-generated tasks get slight penalty
    if (todo.auto_generated) {
      score -= 2
    }

    return score
  }

  /**
   * Determine the reason for bumping this todo
   */
  private determineBumpReason(todo: Todo, now: Date): string {
    if (todo.due_date && new Date(todo.due_date) < now) {
      return 'overdue'
    }
    if (todo.scheduled_date && new Date(todo.scheduled_date) < now) {
      return 'missed_schedule'
    }
    return 'automatic_reschedule'
  }

  /**
   * Get existing events and scheduled todos to avoid conflicts
   */
  private async getExistingSchedule(userId: string) {
    const startDate = new Date()
    const endDate = addDays(startDate, 30) // Look ahead 30 days

    const [eventsResult, todosResult] = await Promise.all([
      this.supabase!
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString()),

      this.supabase!
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .gte('scheduled_date', format(startDate, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(endDate, 'yyyy-MM-dd'))
        .not('scheduled_time', 'is', null)
    ])

    if (eventsResult.error) {
      throw new Error(`Failed to fetch existing events: ${eventsResult.error.message}`)
    }
    if (todosResult.error) {
      throw new Error(`Failed to fetch existing todos: ${todosResult.error.message}`)
    }

    return {
      existingEvents: eventsResult.data || [],
      existingTodos: todosResult.data || []
    }
  }

  /**
   * Smart schedule bumped tasks to optimal time slots
   */
  private async smartScheduleBumpedTasks(
    candidates: BumpCandidate[],
    existingEvents: any[],
    existingTodos: any[],
    preferences: any
  ): Promise<BumpCandidate[]> {
    const now = new Date()

    for (const candidate of candidates) {
      const suggestedSlot = this.findOptimalTimeSlot(
        candidate,
        now,
        existingEvents,
        existingTodos,
        preferences
      )

      if (suggestedSlot) {
        candidate.suggestedDate = suggestedSlot.date
        candidate.suggestedTime = suggestedSlot.time
      }
    }

    return candidates
  }

  /**
   * Find the optimal time slot for a bumped task
   */
  private findOptimalTimeSlot(
    todo: BumpCandidate,
    startFrom: Date,
    existingEvents: any[],
    existingTodos: any[],
    preferences: any
  ): { date: Date; time: string } | null {
    const maxDaysToLookAhead = 14
    const category = todo.category || 'other'
    const categoryConfig = this.config.categoryScheduling[category]

    for (let dayOffset = 1; dayOffset <= maxDaysToLookAhead; dayOffset++) {
      const candidateDate = addDays(startFrom, dayOffset)

      // Skip weekends if not in working days
      if (isWeekend(candidateDate) && !this.config.workingDays.includes(candidateDate.getDay())) {
        continue
      }

      // Skip if not a working day
      if (!this.config.workingDays.includes(candidateDate.getDay())) {
        continue
      }

      // Try preferred times for this category
      const preferredTimes = categoryConfig?.preferredTimes || ['10:00', '14:00', '16:00']

      for (const timeSlot of preferredTimes) {
        if (this.isTimeSlotAvailable(
          candidateDate,
          timeSlot,
          todo.estimated_minutes || 30,
          existingEvents,
          existingTodos
        )) {
          return {
            date: candidateDate,
            time: timeSlot
          }
        }
      }

      // If no preferred times available, try other working hours
      for (let hour = this.config.workingHours.start; hour < this.config.workingHours.end; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`

        if (this.isTimeSlotAvailable(
          candidateDate,
          timeSlot,
          todo.estimated_minutes || 30,
          existingEvents,
          existingTodos
        )) {
          return {
            date: candidateDate,
            time: timeSlot
          }
        }
      }
    }

    // If no slot found, just schedule for tomorrow without time
    return {
      date: addDays(startFrom, 1),
      time: categoryConfig?.preferredTimes[0] || '10:00'
    }
  }

  /**
   * Check if a time slot is available
   */
  private isTimeSlotAvailable(
    date: Date,
    timeSlot: string,
    durationMinutes: number,
    existingEvents: any[],
    existingTodos: any[]
  ): boolean {
    const [hours, minutes] = timeSlot.split(':').map(Number)
    const slotStart = new Date(date)
    slotStart.setHours(hours, minutes, 0, 0)
    const slotEnd = addHours(slotStart, durationMinutes / 60)

    // Check against existing events
    for (const event of existingEvents) {
      const eventStart = new Date(event.start_time)
      const eventEnd = new Date(event.end_time)

      if (
        (slotStart >= eventStart && slotStart < eventEnd) ||
        (slotEnd > eventStart && slotEnd <= eventEnd) ||
        (slotStart <= eventStart && slotEnd >= eventEnd)
      ) {
        return false // Conflict found
      }
    }

    // Check against existing scheduled todos
    const dayString = format(date, 'yyyy-MM-dd')
    const dayTodos = existingTodos.filter(
      todo => todo.scheduled_date === dayString && todo.scheduled_time
    )

    for (const existingTodo of dayTodos) {
      const [existingHours, existingMinutes] = existingTodo.scheduled_time.split(':').map(Number)
      const existingStart = new Date(date)
      existingStart.setHours(existingHours, existingMinutes, 0, 0)
      const existingEnd = addHours(existingStart, (existingTodo.estimated_minutes || 30) / 60)

      if (
        (slotStart >= existingStart && slotStart < existingEnd) ||
        (slotEnd > existingStart && slotEnd <= existingEnd) ||
        (slotStart <= existingStart && slotEnd >= existingEnd)
      ) {
        return false // Conflict found
      }
    }

    return true
  }

  /**
   * Execute the bump by updating the todo and logging the action
   */
  private async executeBump(candidate: BumpCandidate, userId: string): Promise<void> {
    const now = new Date()

    // Update the todo
    const { error: updateError } = await this.supabase!
      .from('todos')
      .update({
        scheduled_date: format(candidate.suggestedDate, 'yyyy-MM-dd'),
        scheduled_time: candidate.suggestedTime,
        auto_bumped: true,
        bump_count: candidate.bump_count + 1,
        last_bumped_at: now.toISOString(),
        original_due_date: candidate.original_due_date || candidate.due_date,
        updated_at: now.toISOString()
      })
      .eq('id', candidate.id)

    if (updateError) {
      throw new Error(`Failed to update todo: ${updateError.message}`)
    }

    // Log the bump action
    const { error: logError } = await this.supabase!
      .from('auto_bump_logs')
      .insert({
        todo_id: candidate.id,
        user_id: userId,
        bump_reason: candidate.bumpReason,
        old_scheduled_date: candidate.scheduled_date,
        new_scheduled_date: format(candidate.suggestedDate, 'yyyy-MM-dd'),
        old_due_date: candidate.due_date,
        new_due_date: candidate.due_date,
        bump_context: {
          bump_score: candidate.bumpScore,
          suggested_time: candidate.suggestedTime,
          original_priority: candidate.priority,
          bump_count: candidate.bump_count + 1
        },
        ai_suggested: true,
        user_confirmed: false
      })

    if (logError) {
      console.error('Failed to log bump action:', logError)
      // Don't throw here - the bump was successful even if logging failed
    }

    console.log(`✅ Bumped todo "${candidate.title}" to ${format(candidate.suggestedDate, 'yyyy-MM-dd')} at ${candidate.suggestedTime}`)
  }

  /**
   * Manual bump a specific todo to a target date/time
   */
  async manualBump(
    todoId: string,
    userId: string,
    targetDate: Date,
    targetTime?: string,
    reason: string = 'manual_reschedule'
  ): Promise<void> {
    // Get the todo
    const { data: todo, error: fetchError } = await this.supabase!
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !todo) {
      throw new Error(`Todo not found: ${fetchError?.message}`)
    }

    // Update the todo
    const now = new Date()
    const { error: updateError } = await this.supabase!
      .from('todos')
      .update({
        scheduled_date: format(targetDate, 'yyyy-MM-dd'),
        scheduled_time: targetTime,
        auto_bumped: false, // Manual bump
        bump_count: (todo.bump_count || 0) + 1,
        last_bumped_at: now.toISOString(),
        original_due_date: todo.original_due_date || todo.due_date,
        updated_at: now.toISOString()
      })
      .eq('id', todoId)

    if (updateError) {
      throw new Error(`Failed to update todo: ${updateError.message}`)
    }

    // Log the manual bump
    await this.supabase!
      .from('auto_bump_logs')
      .insert({
        todo_id: todoId,
        user_id: userId,
        bump_reason: reason,
        old_scheduled_date: todo.scheduled_date,
        new_scheduled_date: format(targetDate, 'yyyy-MM-dd'),
        old_due_date: todo.due_date,
        new_due_date: todo.due_date,
        bump_context: {
          manual_bump: true,
          target_time: targetTime,
          bump_count: (todo.bump_count || 0) + 1
        },
        ai_suggested: false,
        user_confirmed: true
      })
  }

  /**
   * Get bump history for a user or specific todo
   */
  async getBumpHistory(
    userId: string,
    todoId?: string,
    limit: number = 50
  ): Promise<any[]> {
    let query = this.supabase!
      .from('auto_bump_logs')
      .select(`
        *,
        todos:todo_id (
          title,
          priority,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (todoId) {
      query = query.eq('todo_id', todoId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch bump history: ${error.message}`)
    }

    return data || []
  }

  /**
   * Schedule auto-bump to run daily at specified time
   */
  async scheduleAutoBump(userId: string): Promise<void> {
    // This would typically be implemented with a cron job or scheduled function
    // For now, we'll just process it immediately
    await this.processAutoBump(userId)
  }
}

// Export singleton instance
export const autoBumpService = new AutoBumpService()

// Export types
export type { BumpCandidate }