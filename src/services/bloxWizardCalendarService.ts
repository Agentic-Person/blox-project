import { useCalendarTodoStore, Todo, CalendarEvent } from '@/store/calendarTodoStore'
import { autoBumpService } from '@/services/autoBumpService'
import { format, addDays, addHours, parseISO, startOfDay, endOfDay } from 'date-fns'

interface BloxWizardCommand {
  type: 'schedule' | 'todo' | 'reschedule' | 'query' | 'help'
  action: string
  parameters?: {
    [key: string]: any
  }
}

interface BloxWizardResponse {
  message: string
  suggestedActions?: {
    label: string
    action: () => void
  }[]
  createdTodos?: Todo[]
  createdEvents?: CalendarEvent[]
  rescheduledItems?: {
    type: 'todo' | 'event'
    id: string
    newDate: string
    newTime?: string
  }[]
}

export class BloxWizardCalendarService {
  private store = useCalendarTodoStore.getState()

  /**
   * Process natural language commands for calendar and todo operations
   */
  async processCommand(
    message: string,
    userId: string,
    context?: {
      currentDate?: Date
      selectedTodos?: Todo[]
      selectedEvents?: CalendarEvent[]
    }
  ): Promise<BloxWizardResponse> {
    try {
      const command = this.parseMessage(message)

      switch (command.type) {
        case 'schedule':
          return await this.handleScheduleCommand(command, userId, context)

        case 'todo':
          return await this.handleTodoCommand(command, userId, context)

        case 'reschedule':
          return await this.handleRescheduleCommand(command, userId, context)

        case 'query':
          return await this.handleQueryCommand(command, userId, context)

        default:
          return {
            message: "I can help you with scheduling, managing todos, rescheduling tasks, and answering questions about your calendar. What would you like to do?"
          }
      }
    } catch (error) {
      console.error('BloxWizard command processing error:', error)
      return {
        message: "I'm having trouble understanding that request. Could you try rephrasing it? For example, you can say 'Schedule practice for tomorrow at 3pm' or 'Create a todo to review scripting basics'."
      }
    }
  }

  /**
   * Parse natural language message into structured command
   */
  private parseMessage(message: string): BloxWizardCommand {
    const lowerMessage = message.toLowerCase()

    // Schedule patterns
    if (this.containsAny(lowerMessage, ['schedule', 'book', 'plan', 'set time', 'block time'])) {
      return {
        type: 'schedule',
        action: 'create_event',
        parameters: this.extractScheduleParams(message)
      }
    }

    // Todo patterns
    if (this.containsAny(lowerMessage, ['create todo', 'add task', 'remind me', 'need to', 'todo'])) {
      return {
        type: 'todo',
        action: 'create_todo',
        parameters: this.extractTodoParams(message)
      }
    }

    // Reschedule patterns
    if (this.containsAny(lowerMessage, ['reschedule', 'move', 'postpone', 'delay', 'bump', 'change time'])) {
      return {
        type: 'reschedule',
        action: 'reschedule_items',
        parameters: this.extractRescheduleParams(message)
      }
    }

    // Query patterns
    if (this.containsAny(lowerMessage, ['what', 'when', 'how many', 'show me', 'list', 'find'])) {
      return {
        type: 'query',
        action: 'query_items',
        parameters: this.extractQueryParams(message)
      }
    }

    return {
      type: 'help',
      action: 'general_help'
    }
  }

  /**
   * Handle schedule-related commands
   */
  private async handleScheduleCommand(
    command: BloxWizardCommand,
    userId: string,
    context?: any
  ): Promise<BloxWizardResponse> {
    const params = command.parameters || {}

    // Extract event details
    const title = params.title || params.activity || 'Learning Session'
    const date = params.date || (context?.currentDate ? format(context.currentDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
    const time = params.time || '10:00'
    const duration = params.duration || 60 // minutes

    const startTime = new Date(`${date}T${time}:00`)
    const endTime = addHours(startTime, duration / 60)

    const eventData = {
      user_id: userId,
      title,
      description: params.description || `Scheduled via Blox Wizard`,
      type: params.type || 'custom',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      all_day: false,
      timezone: 'UTC',
      color: this.getEventColor(params.type || 'custom'),
      status: 'confirmed',
      visibility: 'private',
      created_by: userId,
      reminder_minutes: [15],
      related_todo_ids: [],
      recurrence_exception: false
    }

    try {
      const event = await this.store.createEvent(eventData)

      if (event) {
        return {
          message: `✅ Successfully scheduled "${title}" for ${format(startTime, 'EEEE, MMMM d')} at ${format(startTime, 'h:mm a')}`,
          createdEvents: [event],
          suggestedActions: [
            {
              label: 'Add a todo for this session',
              action: () => this.createRelatedTodo(event, userId)
            },
            {
              label: 'Set a reminder',
              action: () => this.setEventReminder(event.id, [30, 15])
            }
          ]
        }
      } else {
        throw new Error('Failed to create event')
      }
    } catch (error) {
      return {
        message: `❌ Sorry, I couldn't schedule that event. ${error instanceof Error ? error.message : 'Please try again.'}`
      }
    }
  }

  /**
   * Handle todo-related commands
   */
  private async handleTodoCommand(
    command: BloxWizardCommand,
    userId: string,
    context?: any
  ): Promise<BloxWizardResponse> {
    const params = command.parameters || {}

    const todoData = {
      user_id: userId,
      title: params.title || 'New Learning Task',
      description: params.description || 'Created via Blox Wizard',
      priority: params.priority || 'medium',
      status: 'pending' as const,
      estimated_minutes: params.estimatedMinutes || 30,
      due_date: params.dueDate ? new Date(params.dueDate).toISOString() : undefined,
      scheduled_date: params.scheduledDate || undefined,
      scheduled_time: params.scheduledTime || undefined,
      category: params.category || 'learn',
      tags: params.tags || ['ai-generated'],
      order_index: 0,
      auto_bumped: false,
      bump_count: 0,
      auto_generated: true,
      learning_objectives: params.learningObjectives || [],
      prerequisites: params.prerequisites || [],
      video_references: params.videoReferences || [],
      created_by: userId,
      assigned_to: userId
    }

    try {
      const todo = await this.store.createTodo(todoData)

      if (todo) {
        return {
          message: `✅ Created todo: "${todo.title}"${params.scheduledDate ? ` scheduled for ${format(new Date(params.scheduledDate), 'EEEE, MMMM d')}` : ''}`,
          createdTodos: [todo],
          suggestedActions: [
            {
              label: 'Schedule a time for this',
              action: () => this.scheduleTimeForTodo(todo, userId)
            },
            {
              label: 'Add more details',
              action: () => this.expandTodoDetails(todo.id)
            }
          ]
        }
      } else {
        throw new Error('Failed to create todo')
      }
    } catch (error) {
      return {
        message: `❌ Sorry, I couldn't create that todo. ${error instanceof Error ? error.message : 'Please try again.'}`
      }
    }
  }

  /**
   * Handle reschedule commands
   */
  private async handleRescheduleCommand(
    command: BloxWizardCommand,
    userId: string,
    context?: any
  ): Promise<BloxWizardResponse> {
    const params = command.parameters || {}

    // If no specific items mentioned, offer to reschedule overdue items
    if (!params.itemIds && !context?.selectedTodos && !context?.selectedEvents) {
      try {
        const result = await autoBumpService.processAutoBump(userId)

        return {
          message: result.success
            ? `✅ Auto-rescheduled ${result.bumpedCount} overdue items. ${result.skippedCount} items were skipped.`
            : `❌ Had trouble rescheduling items: ${result.errors.join(', ')}`,
          suggestedActions: [
            {
              label: 'View rescheduled items',
              action: () => this.showRescheduledItems()
            }
          ]
        }
      } catch (error) {
        return {
          message: `❌ Couldn't reschedule items automatically. ${error instanceof Error ? error.message : 'Please try again.'}`
        }
      }
    }

    // Handle specific reschedule requests
    const targetDate = params.targetDate || format(addDays(new Date(), 1), 'yyyy-MM-dd')
    const targetTime = params.targetTime

    let rescheduledCount = 0
    const rescheduledItems: any[] = []

    // Reschedule selected todos
    if (context?.selectedTodos) {
      for (const todo of context.selectedTodos) {
        try {
          await this.store.updateTodo(todo.id, {
            scheduled_date: targetDate,
            scheduled_time: targetTime
          })
          rescheduledItems.push({
            type: 'todo',
            id: todo.id,
            newDate: targetDate,
            newTime: targetTime
          })
          rescheduledCount++
        } catch (error) {
          console.error(`Failed to reschedule todo ${todo.id}:`, error)
        }
      }
    }

    // Reschedule selected events
    if (context?.selectedEvents) {
      for (const event of context.selectedEvents) {
        try {
          const currentStart = new Date(event.start_time)
          const currentEnd = new Date(event.end_time)
          const duration = currentEnd.getTime() - currentStart.getTime()

          const newStart = new Date(`${targetDate}T${targetTime || '10:00'}:00`)
          const newEnd = new Date(newStart.getTime() + duration)

          await this.store.updateEvent(event.id, {
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString()
          })

          rescheduledItems.push({
            type: 'event',
            id: event.id,
            newDate: targetDate,
            newTime: targetTime
          })
          rescheduledCount++
        } catch (error) {
          console.error(`Failed to reschedule event ${event.id}:`, error)
        }
      }
    }

    return {
      message: rescheduledCount > 0
        ? `✅ Successfully rescheduled ${rescheduledCount} item(s) to ${format(new Date(targetDate), 'EEEE, MMMM d')}${targetTime ? ` at ${targetTime}` : ''}`
        : `❌ Couldn't reschedule the selected items. Please try again.`,
      rescheduledItems
    }
  }

  /**
   * Handle query commands
   */
  private async handleQueryCommand(
    command: BloxWizardCommand,
    userId: string,
    context?: any
  ): Promise<BloxWizardResponse> {
    const params = command.parameters || {}
    const { todos, events } = this.store

    if (params.queryType === 'schedule' || params.subject?.includes('schedule')) {
      const upcomingEvents = events.filter(e =>
        new Date(e.start_time) > new Date() &&
        new Date(e.start_time) <= addDays(new Date(), 7)
      )

      return {
        message: upcomingEvents.length > 0
          ? `📅 You have ${upcomingEvents.length} upcoming events this week:\n${upcomingEvents.map(e => `• ${e.title} - ${format(new Date(e.start_time), 'EEE, MMM d at h:mm a')}`).join('\n')}`
          : `📅 No upcoming events scheduled for this week.`,
        suggestedActions: [
          {
            label: 'Schedule something new',
            action: () => this.suggestScheduling()
          }
        ]
      }
    }

    if (params.queryType === 'todos' || params.subject?.includes('todo')) {
      const pendingTodos = todos.filter(t => t.status === 'pending')
      const overdueTodos = todos.filter(t =>
        t.due_date &&
        new Date(t.due_date) < new Date() &&
        t.status !== 'completed'
      )

      let message = `📋 You have ${pendingTodos.length} pending todos`
      if (overdueTodos.length > 0) {
        message += ` and ${overdueTodos.length} overdue items`
      }

      if (pendingTodos.length > 0) {
        message += `:\n${pendingTodos.slice(0, 5).map(t => `• ${t.title}${t.due_date ? ` (due ${format(new Date(t.due_date), 'MMM d')})` : ''}`).join('\n')}`
        if (pendingTodos.length > 5) {
          message += `\n... and ${pendingTodos.length - 5} more`
        }
      }

      return {
        message,
        suggestedActions: overdueTodos.length > 0 ? [
          {
            label: 'Reschedule overdue items',
            action: () => this.processCommand('reschedule overdue items', userId, context)
          }
        ] : []
      }
    }

    if (params.queryType === 'progress') {
      const completedTodos = todos.filter(t => t.status === 'completed')
      const totalTodos = todos.length
      const completionRate = totalTodos > 0 ? Math.round((completedTodos.length / totalTodos) * 100) : 0

      return {
        message: `📈 Progress Summary:\n• ${completedTodos.length} of ${totalTodos} todos completed (${completionRate}%)\n• ${events.length} events scheduled\n• Keep up the great work! 🎉`
      }
    }

    return {
      message: "I can help you check your schedule, todos, progress, or answer specific questions. What would you like to know?"
    }
  }

  // Utility methods
  private containsAny(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern))
  }

  private extractScheduleParams(message: string): any {
    const params: any = {}

    // Extract activity/title
    const activityMatch = message.match(/(?:schedule|book|plan)\s+(.+?)\s+(?:for|on|at)/i)
    if (activityMatch) {
      params.activity = activityMatch[1].trim()
    }

    // Extract time patterns
    const timeMatch = message.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm|AM|PM)?/i)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1])
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      const meridiem = timeMatch[3]?.toLowerCase()

      if (meridiem === 'pm' && hours !== 12) hours += 12
      if (meridiem === 'am' && hours === 12) hours = 0

      params.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }

    // Extract date patterns
    if (message.includes('tomorrow')) {
      params.date = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    } else if (message.includes('next week')) {
      params.date = format(addDays(new Date(), 7), 'yyyy-MM-dd')
    }

    // Extract duration
    const durationMatch = message.match(/(\d+)\s*(minute|min|hour|hr)s?/i)
    if (durationMatch) {
      const value = parseInt(durationMatch[1])
      const unit = durationMatch[2].toLowerCase()
      params.duration = unit.startsWith('hour') ? value * 60 : value
    }

    return params
  }

  private extractTodoParams(message: string): any {
    const params: any = {}

    // Extract title
    const todoMatch = message.match(/(?:todo|task|remind me)\s+(?:to\s+)?(.+?)(?:\s+by|\s+for|\s+on|$)/i)
    if (todoMatch) {
      params.title = todoMatch[1].trim()
    }

    // Extract priority
    if (message.match(/urgent|asap|immediately/i)) {
      params.priority = 'urgent'
    } else if (message.match(/important|high/i)) {
      params.priority = 'high'
    } else if (message.match(/low priority|when I have time/i)) {
      params.priority = 'low'
    }

    // Extract due date
    if (message.includes('tomorrow')) {
      params.dueDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    } else if (message.includes('next week')) {
      params.dueDate = format(addDays(new Date(), 7), 'yyyy-MM-dd')
    }

    return params
  }

  private extractRescheduleParams(message: string): any {
    const params: any = {}

    // Extract target date
    if (message.includes('tomorrow')) {
      params.targetDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    } else if (message.includes('next week')) {
      params.targetDate = format(addDays(new Date(), 7), 'yyyy-MM-dd')
    }

    // Extract target time
    const timeMatch = message.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm|AM|PM)?/i)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1])
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      const meridiem = timeMatch[3]?.toLowerCase()

      if (meridiem === 'pm' && hours !== 12) hours += 12
      if (meridiem === 'am' && hours === 12) hours = 0

      params.targetTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }

    return params
  }

  private extractQueryParams(message: string): any {
    const params: any = {}

    if (message.match(/schedule|calendar|event/i)) {
      params.queryType = 'schedule'
    } else if (message.match(/todo|task/i)) {
      params.queryType = 'todos'
    } else if (message.match(/progress|completion|done/i)) {
      params.queryType = 'progress'
    }

    params.subject = message

    return params
  }

  private getEventColor(type: string): string {
    const colors = {
      video: '#3b82f6',
      practice: '#10b981',
      project: '#8b5cf6',
      review: '#f59e0b',
      meeting: '#ef4444',
      break: '#6b7280',
      custom: '#06b6d4'
    }
    return colors[type as keyof typeof colors] || colors.custom
  }

  // Helper action methods (these would typically open modals or navigate)
  private async createRelatedTodo(event: CalendarEvent, userId: string) {
    // Implementation would create a todo related to this event
    console.log('Creating related todo for event:', event.id)
  }

  private async setEventReminder(eventId: string, minutes: number[]) {
    // Implementation would update event reminders
    console.log('Setting reminder for event:', eventId, minutes)
  }

  private async scheduleTimeForTodo(todo: Todo, userId: string) {
    // Implementation would open scheduling dialog
    console.log('Scheduling time for todo:', todo.id)
  }

  private async expandTodoDetails(todoId: string) {
    // Implementation would open todo edit dialog
    console.log('Expanding todo details:', todoId)
  }

  private showRescheduledItems() {
    // Implementation would show rescheduled items view
    console.log('Showing rescheduled items')
  }

  private suggestScheduling() {
    // Implementation would suggest new scheduling options
    console.log('Suggesting scheduling options')
  }
}

// Export singleton instance
export const bloxWizardCalendarService = new BloxWizardCalendarService()