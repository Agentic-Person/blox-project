// Calendar Integration Service
// Part of: Phase 3A Calendar/Todo Implementation

import { createClient } from '@/lib/supabase/client';
import type {
  ScheduleItem,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  ScheduleTemplate,
  UserSchedulePreferences,
  ScheduleConflict,
  ScheduleFilters,
  OptimalTimeSlot,
  ScheduleAnalytics,
  RecurringScheduleRequest,
  RecurringSchedulePattern,
  BulkScheduleOperation,
  BulkScheduleResult,
  SchedulingConstraints,
  SmartSchedulingSuggestion,
  TimeSlot,
  CalendarIntegrationService as ICalendarIntegrationService
} from '@/types/calendar';
import {
  CalendarError,
  ScheduleConflictError,
  ScheduleNotFoundError,
  InvalidTimeSlotError
} from '@/types/calendar';

export class CalendarIntegrationService implements ICalendarIntegrationService {
  private supabase = createClient();

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  async createSchedule(userId: string, data: CreateScheduleRequest): Promise<ScheduleItem> {
    try {
      this.validateCreateScheduleRequest(data);

      // Get user's journey for validation
      const { data: journey } = await this.supabase
        .from('ai_journeys')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!journey) {
        throw new CalendarError('User journey not found', 'JOURNEY_NOT_FOUND', 404);
      }

      // Check for conflicts before creating
      const conflicts = await this.detectConflicts(userId, data);
      if (conflicts.length > 0) {
        throw new ScheduleConflictError('Schedule conflicts detected', conflicts);
      }

      const scheduleData = {
        journey_id: journey.id,
        scheduled_date: data.scheduledDate,
        task_type: data.taskType,
        title: data.title,
        description: data.description,
        start_time: data.startTime,
        duration: data.duration,
        todo_id: data.todoId,
        video_id: data.videoId,
        priority: data.priority || 'medium',
        reminder_minutes: data.reminderMinutes,
        metadata: data.metadata || {}
      };

      const { data: schedule, error } = await this.supabase
        .from('ai_journey_schedule')
        .insert(scheduleData)
        .select()
        .single();

      if (error) {
        throw new CalendarError(`Failed to create schedule: ${error.message}`, 'CREATE_FAILED');
      }

      return this.mapScheduleFromDb(schedule);
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      throw new CalendarError(`Unexpected error creating schedule: ${error}`, 'CREATE_ERROR');
    }
  }

  async getSchedule(userId: string, scheduleId: string): Promise<ScheduleItem> {
    try {
      const { data: schedule, error } = await this.supabase
        .from('ai_journey_schedule')
        .select(`
          *,
          ai_journeys!inner(user_id)
        `)
        .eq('id', scheduleId)
        .eq('ai_journeys.user_id', userId)
        .single();

      if (error || !schedule) {
        throw new ScheduleNotFoundError(scheduleId);
      }

      return this.mapScheduleFromDb(schedule);
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      throw new CalendarError(`Error fetching schedule: ${error}`, 'GET_ERROR');
    }
  }

  async updateSchedule(userId: string, scheduleId: string, data: UpdateScheduleRequest): Promise<ScheduleItem> {
    try {
      // Validate schedule exists and belongs to user
      await this.getSchedule(userId, scheduleId);

      this.validateUpdateScheduleRequest(data);

      // Check for conflicts if changing time/date
      if (data.scheduledDate || data.startTime || data.duration) {
        const currentSchedule = await this.getSchedule(userId, scheduleId);
        const checkData: CreateScheduleRequest = {
          scheduledDate: data.scheduledDate || currentSchedule.scheduledDate,
          taskType: data.taskType || currentSchedule.taskType,
          title: data.title || currentSchedule.title,
          startTime: data.startTime || currentSchedule.startTime,
          duration: data.duration || currentSchedule.duration
        };
        
        const conflicts = await this.detectConflicts(userId, checkData, scheduleId);
        if (conflicts.length > 0) {
          throw new ScheduleConflictError('Schedule conflicts detected', conflicts);
        }
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
        ...this.mapUpdateDataToDb(data)
      };

      // Handle status transitions
      if (data.status === 'completed' && !updateData.completed_at) {
        updateData.completed_at = new Date().toISOString();
      } else if (data.status !== 'completed' && updateData.completed_at) {
        updateData.completed_at = null;
      }

      const { data: updatedSchedule, error } = await this.supabase
        .from('ai_journey_schedule')
        .update(updateData)
        .eq('id', scheduleId)
        .select(`
          *,
          ai_journeys!inner(user_id)
        `)
        .eq('ai_journeys.user_id', userId)
        .single();

      if (error) {
        throw new CalendarError(`Failed to update schedule: ${error.message}`, 'UPDATE_FAILED');
      }

      return this.mapScheduleFromDb(updatedSchedule);
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      throw new CalendarError(`Error updating schedule: ${error}`, 'UPDATE_ERROR');
    }
  }

  async deleteSchedule(userId: string, scheduleId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_journey_schedule')
        .delete()
        .eq('id', scheduleId)
        .eq('journey_id', await this.getUserJourneyId(userId));

      if (error) {
        throw new CalendarError(`Failed to delete schedule: ${error.message}`, 'DELETE_FAILED');
      }
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      throw new CalendarError(`Error deleting schedule: ${error}`, 'DELETE_ERROR');
    }
  }

  // ==========================================
  // SCHEDULE RETRIEVAL
  // ==========================================

  async getSchedules(userId: string, filters?: ScheduleFilters): Promise<ScheduleItem[]> {
    try {
      const journeyId = await this.getUserJourneyId(userId);
      
      let query = this.supabase
        .from('ai_journey_schedule')
        .select('*')
        .eq('journey_id', journeyId);

      query = this.applyFilters(query, filters);

      const { data: schedules, error } = await query
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        throw new CalendarError(`Failed to fetch schedules: ${error.message}`, 'FETCH_FAILED');
      }

      return schedules.map(schedule => this.mapScheduleFromDb(schedule));
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      throw new CalendarError(`Error fetching schedules: ${error}`, 'FETCH_ERROR');
    }
  }

  async getSchedulesByDateRange(userId: string, startDate: string, endDate: string): Promise<ScheduleItem[]> {
    const filters: ScheduleFilters = {
      dateFrom: startDate,
      dateTo: endDate
    };
    return this.getSchedules(userId, filters);
  }

  async getTodaySchedule(userId: string): Promise<ScheduleItem[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSchedulesByDateRange(userId, today, today);
  }

  async getUpcomingSchedules(userId: string, days = 7): Promise<ScheduleItem[]> {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    
    return this.getSchedulesByDateRange(
      userId, 
      today.toISOString().split('T')[0], 
      futureDate.toISOString().split('T')[0]
    );
  }

  // ==========================================
  // CONFLICT DETECTION AND RESOLUTION
  // ==========================================

  async detectConflicts(userId: string, scheduleData: CreateScheduleRequest, excludeScheduleId?: string): Promise<ScheduleConflict[]> {
    try {
      if (!scheduleData.startTime) {
        return []; // No conflicts possible without specific time
      }

      const journeyId = await this.getUserJourneyId(userId);
      
      // Get existing schedules for the same date
      let query = this.supabase
        .from('ai_journey_schedule')
        .select('*')
        .eq('journey_id', journeyId)
        .eq('scheduled_date', scheduleData.scheduledDate)
        .not('start_time', 'is', null);

      if (excludeScheduleId) {
        query = query.neq('id', excludeScheduleId);
      }

      const { data: existingSchedules, error } = await query;

      if (error) {
        throw new CalendarError(`Failed to check conflicts: ${error.message}`, 'CONFLICT_CHECK_FAILED');
      }

      const conflicts: ScheduleConflict[] = [];
      const newStartTime = this.parseTimeToMinutes(scheduleData.startTime);
      const newEndTime = newStartTime + scheduleData.duration;

      for (const existing of existingSchedules) {
        if (!existing.start_time) continue;

        const existingStartTime = this.parseTimeToMinutes(existing.start_time);
        const existingEndTime = existingStartTime + existing.duration;

        // Check for overlap
        if (newStartTime < existingEndTime && newEndTime > existingStartTime) {
          conflicts.push(await this.createConflictRecord(userId, 'overlap', existing.id, {
            newSchedule: scheduleData,
            existingSchedule: existing,
            overlapStart: Math.max(newStartTime, existingStartTime),
            overlapEnd: Math.min(newEndTime, existingEndTime)
          }));
        }
      }

      // Check daily hour limits
      const userPreferences = await this.getUserPreferences(userId);
      const dailyScheduledMinutes = existingSchedules.reduce((total, s) => total + s.duration, 0);
      const maxDailyMinutes = userPreferences.maxDailyStudyHours * 60;

      if (dailyScheduledMinutes + scheduleData.duration > maxDailyMinutes) {
        conflicts.push(await this.createConflictRecord(userId, 'exceeds_limit', null, {
          newSchedule: scheduleData,
          currentDailyMinutes: dailyScheduledMinutes,
          maxDailyMinutes,
          exceedBy: (dailyScheduledMinutes + scheduleData.duration) - maxDailyMinutes
        }));
      }

      return conflicts;
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      throw new CalendarError(`Error detecting conflicts: ${error}`, 'CONFLICT_DETECTION_ERROR');
    }
  }

  async resolveConflict(userId: string, conflictId: string, resolutionAction: string): Promise<ScheduleConflict> {
    try {
      const { data: conflict, error } = await this.supabase
        .from('schedule_conflicts')
        .update({
          resolution_status: 'user_resolved',
          resolution_action: resolutionAction,
          resolved_at: new Date().toISOString()
        })
        .eq('id', conflictId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new CalendarError(`Failed to resolve conflict: ${error.message}`, 'CONFLICT_RESOLUTION_FAILED');
      }

      return this.mapConflictFromDb(conflict);
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      throw new CalendarError(`Error resolving conflict: ${error}`, 'CONFLICT_RESOLUTION_ERROR');
    }
  }

  async getActiveConflicts(userId: string): Promise<ScheduleConflict[]> {
    try {
      const { data: conflicts, error } = await this.supabase
        .from('schedule_conflicts')
        .select('*')
        .eq('user_id', userId)
        .eq('resolution_status', 'unresolved')
        .order('detected_at', { ascending: false });

      if (error) {
        throw new CalendarError(`Failed to fetch conflicts: ${error.message}`, 'CONFLICT_FETCH_FAILED');
      }

      return conflicts.map(conflict => this.mapConflictFromDb(conflict));
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      throw new CalendarError(`Error fetching conflicts: ${error}`, 'CONFLICT_FETCH_ERROR');
    }
  }

  // ==========================================
  // SMART SCHEDULING
  // ==========================================

  async findOptimalTimeSlots(
    userId: string, 
    duration: number, 
    dateRange: {start: string, end: string}, 
    count = 5
  ): Promise<OptimalTimeSlot[]> {
    try {
      const userPreferences = await this.getUserPreferences(userId);
      const optimalSlots: OptimalTimeSlot[] = [];
      
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      // Iterate through each date in the range
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        // Get existing schedules for this date
        const existingSchedules = await this.getSchedulesByDateRange(userId, dateStr, dateStr);
        
        // Find optimal slots for this date
        const dailySlots = this.findDailyOptimalSlots(
          dateStr, 
          duration, 
          userPreferences, 
          existingSchedules
        );
        
        optimalSlots.push(...dailySlots);
      }
      
      // Sort by confidence score and return top results
      return optimalSlots
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, count);
    } catch (error) {
      throw new CalendarError(`Error finding optimal time slots: ${error}`, 'OPTIMAL_SLOTS_ERROR');
    }
  }

  async suggestScheduleForTodo(userId: string, todoId: string): Promise<SmartSchedulingSuggestion> {
    try {
      // Get todo details
      const { data: todo, error } = await this.supabase
        .from('todos')
        .select('*')
        .eq('id', todoId)
        .eq('user_id', userId)
        .single();

      if (error || !todo) {
        throw new CalendarError('Todo not found', 'TODO_NOT_FOUND', 404);
      }

      const duration = todo.estimated_minutes || 60;
      const dueDate = todo.due_date;
      
      // Determine date range for scheduling
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = dueDate ? 
        new Date(dueDate).toISOString().split('T')[0] : 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const suggestedSlots = await this.findOptimalTimeSlots(userId, duration, {
        start: startDate,
        end: endDate
      }, 3);

      return {
        suggestedSlots,
        totalDuration: duration,
        reasoning: `Based on your study preferences and ${dueDate ? 'todo due date' : 'next 7 days availability'}`,
        confidence: suggestedSlots.length > 0 ? suggestedSlots[0].confidence : 0,
        alternativeOptions: suggestedSlots.slice(1)
      };
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      throw new CalendarError(`Error suggesting schedule for todo: ${error}`, 'TODO_SUGGESTION_ERROR');
    }
  }

  async autoScheduleTodos(
    userId: string, 
    todoIds: string[], 
    constraints?: SchedulingConstraints
  ): Promise<BulkScheduleResult> {
    try {
      const result: BulkScheduleResult = {
        successful: 0,
        failed: 0,
        errors: [],
        schedules: []
      };

      for (const todoId of todoIds) {
        try {
          const suggestion = await this.suggestScheduleForTodo(userId, todoId);
          
          if (suggestion.suggestedSlots.length > 0) {
            const bestSlot = suggestion.suggestedSlots[0];
            
            const scheduleData: CreateScheduleRequest = {
              scheduledDate: bestSlot.date,
              taskType: 'practice',
              title: `Auto-scheduled: Todo ${todoId}`,
              startTime: bestSlot.startTime,
              duration: suggestion.totalDuration,
              todoId: todoId,
              priority: 'medium'
            };
            
            const schedule = await this.createSchedule(userId, scheduleData);
            result.schedules!.push(schedule);
            result.successful++;
          } else {
            result.failed++;
            result.errors.push({
              error: 'No suitable time slots found'
            });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return result;
    } catch (error) {
      throw new CalendarError(`Error auto-scheduling todos: ${error}`, 'AUTO_SCHEDULE_ERROR');
    }
  }

  // ==========================================
  // USER PREFERENCES
  // ==========================================

  async getUserPreferences(userId: string): Promise<UserSchedulePreferences> {
    try {
      const { data: preferences, error } = await this.supabase
        .from('user_schedule_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Create default preferences if they don't exist
        const defaultPreferences = {
          user_id: userId,
          timezone: 'UTC',
          preferred_study_times: [
            { startTime: '09:00', endTime: '11:00' },
            { startTime: '14:00', endTime: '16:00' },
            { startTime: '19:00', endTime: '21:00' }
          ],
          max_daily_study_hours: 2.0,
          break_duration_minutes: 15,
          weekend_availability: true,
          preferred_session_length: 45,
          avoid_times: [],
          auto_schedule: false,
          notification_preferences: {}
        };

        const { data: created, error: createError } = await this.supabase
          .from('user_schedule_preferences')
          .insert(defaultPreferences)
          .select()
          .single();

        if (createError) {
          throw new CalendarError(`Failed to create preferences: ${createError.message}`, 'PREFERENCES_CREATE_FAILED');
        }

        return this.mapPreferencesFromDb(created);
      }

      return this.mapPreferencesFromDb(preferences);
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      throw new CalendarError(`Error fetching preferences: ${error}`, 'PREFERENCES_ERROR');
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserSchedulePreferences>): Promise<UserSchedulePreferences> {
    try {
      const updateData = this.mapPreferencesToDb(preferences);
      
      const { data: updated, error } = await this.supabase
        .from('user_schedule_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new CalendarError(`Failed to update preferences: ${error.message}`, 'PREFERENCES_UPDATE_FAILED');
      }

      return this.mapPreferencesFromDb(updated);
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      throw new CalendarError(`Error updating preferences: ${error}`, 'PREFERENCES_UPDATE_ERROR');
    }
  }

  // ==========================================
  // STATUS UPDATES
  // ==========================================

  async markScheduleCompleted(userId: string, scheduleId: string): Promise<ScheduleItem> {
    return this.updateSchedule(userId, scheduleId, { 
      status: 'completed'
    });
  }

  async markScheduleMissed(userId: string, scheduleId: string, reason?: string): Promise<ScheduleItem> {
    return this.updateSchedule(userId, scheduleId, { 
      status: 'missed',
      metadata: { missedReason: reason }
    });
  }

  // ==========================================
  // TEMPLATES (Placeholder implementations)
  // ==========================================

  async getScheduleTemplates(): Promise<ScheduleTemplate[]> {
    try {
      const { data: templates, error } = await this.supabase
        .from('schedule_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new CalendarError(`Failed to fetch templates: ${error.message}`, 'TEMPLATE_FETCH_FAILED');
      }

      return templates.map(template => this.mapTemplateFromDb(template));
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      throw new CalendarError(`Error fetching templates: ${error}`, 'TEMPLATE_FETCH_ERROR');
    }
  }

  async createScheduleFromTemplate(userId: string, templateId: string, customizations?: Partial<CreateScheduleRequest>): Promise<ScheduleItem> {
    // Placeholder implementation
    throw new CalendarError('Template scheduling not yet implemented', 'NOT_IMPLEMENTED', 501);
  }

  // ==========================================
  // BULK OPERATIONS (Simplified implementations)
  // ==========================================

  async bulkCreateSchedules(userId: string, schedules: CreateScheduleRequest[]): Promise<BulkScheduleResult> {
    const result: BulkScheduleResult = {
      successful: 0,
      failed: 0,
      errors: [],
      schedules: []
    };

    for (const scheduleData of schedules) {
      try {
        const schedule = await this.createSchedule(userId, scheduleData);
        result.schedules!.push(schedule);
        result.successful++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  async bulkUpdateSchedules(userId: string, operation: BulkScheduleOperation): Promise<BulkScheduleResult> {
    // Simplified implementation
    throw new CalendarError('Bulk update not yet implemented', 'NOT_IMPLEMENTED', 501);
  }

  // ==========================================
  // ANALYTICS (Simplified implementations)
  // ==========================================

  async getScheduleAnalytics(userId: string, timeRange = '30d'): Promise<ScheduleAnalytics> {
    // Placeholder implementation with mock data
    return {
      totalScheduledHours: 45.5,
      completionRate: 78,
      averageSessionLength: 52,
      mostProductiveTimeSlots: [
        { startTime: '14:00', endTime: '16:00' }
      ],
      streakData: {
        currentStreak: 5,
        longestStreak: 12
      },
      weeklyBreakdown: [
        { week: 'Week 1', scheduled: 8, completed: 6, missed: 2 }
      ],
      taskTypeBreakdown: {
        video: { scheduled: 12, completed: 10, averageDuration: 45 },
        practice: { scheduled: 8, completed: 6, averageDuration: 60 },
        project: { scheduled: 3, completed: 2, averageDuration: 120 },
        review: { scheduled: 5, completed: 4, averageDuration: 30 }
      }
    };
  }

  async getProductivityInsights(userId: string): Promise<{bestPerformanceTimes: TimeSlot[], strugglingTimes: TimeSlot[], recommendations: string[]}> {
    // Placeholder implementation
    return {
      bestPerformanceTimes: [
        { startTime: '14:00', endTime: '16:00' }
      ],
      strugglingTimes: [
        { startTime: '08:00', endTime: '09:00' }
      ],
      recommendations: [
        'Schedule more challenging tasks between 2-4 PM',
        'Consider shorter sessions in early morning',
        'Take breaks every 45 minutes for optimal focus'
      ]
    };
  }

  // ==========================================
  // INTEGRATION HELPERS (Placeholder)
  // ==========================================

  async syncWithTodoSystem(userId: string): Promise<void> {
    // This would sync schedules with todo completion status
    // Placeholder for now
  }

  async generateScheduleFromLearningPath(userId: string, learningPathId: string): Promise<ScheduleItem[]> {
    // This would create schedules based on learning path steps
    // Placeholder for now
    return [];
  }

  // ==========================================
  // RECURRING SCHEDULES (Simplified)
  // ==========================================

  async createRecurringSchedule(userId: string, data: RecurringScheduleRequest): Promise<ScheduleItem[]> {
    // Simplified implementation - create first occurrence only
    const scheduleData: CreateScheduleRequest = {
      scheduledDate: data.scheduledDate,
      taskType: data.taskType,
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      duration: data.duration,
      todoId: data.todoId,
      videoId: data.videoId,
      priority: data.priority,
      reminderMinutes: data.reminderMinutes,
      metadata: { 
        ...data.metadata, 
        recurring: true, 
        pattern: data.pattern 
      }
    };

    const schedule = await this.createSchedule(userId, scheduleData);
    return [schedule];
  }

  async updateRecurringSchedule(userId: string, scheduleId: string, updateFuture: boolean, data: UpdateScheduleRequest): Promise<ScheduleItem[]> {
    // Simplified - just update the single schedule
    const updated = await this.updateSchedule(userId, scheduleId, data);
    return [updated];
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  private validateCreateScheduleRequest(data: CreateScheduleRequest): void {
    if (!data.title?.trim()) {
      throw new InvalidTimeSlotError('Title is required');
    }
    if (data.duration < 1 || data.duration > 480) {
      throw new InvalidTimeSlotError('Duration must be between 1 and 480 minutes');
    }
    if (data.startTime && !this.isValidTimeFormat(data.startTime)) {
      throw new InvalidTimeSlotError('Invalid time format. Use HH:MM format');
    }
  }

  private validateUpdateScheduleRequest(data: UpdateScheduleRequest): void {
    if (data.title !== undefined && !data.title?.trim()) {
      throw new InvalidTimeSlotError('Title cannot be empty');
    }
    if (data.duration !== undefined && (data.duration < 1 || data.duration > 480)) {
      throw new InvalidTimeSlotError('Duration must be between 1 and 480 minutes');
    }
    if (data.startTime !== undefined && data.startTime && !this.isValidTimeFormat(data.startTime)) {
      throw new InvalidTimeSlotError('Invalid time format. Use HH:MM format');
    }
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  private parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async getUserJourneyId(userId: string): Promise<string> {
    const { data: journey, error } = await this.supabase
      .from('ai_journeys')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !journey) {
      throw new CalendarError('User journey not found', 'JOURNEY_NOT_FOUND', 404);
    }

    return journey.id;
  }

  private async createConflictRecord(
    userId: string, 
    conflictType: any, 
    conflictingScheduleId: string | null,
    details: any
  ): Promise<ScheduleConflict> {
    // This would create a conflict record in the database
    // Simplified for now - return mock conflict
    return {
      id: 'mock-conflict-id',
      userId,
      conflictType,
      primaryScheduleId: 'mock-primary-id',
      conflictingScheduleId,
      conflictDetails: details,
      resolutionStatus: 'unresolved',
      detectedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private findDailyOptimalSlots(
    date: string, 
    duration: number, 
    preferences: UserSchedulePreferences, 
    existingSchedules: ScheduleItem[]
  ): OptimalTimeSlot[] {
    const slots: OptimalTimeSlot[] = [];
    
    // Simplified implementation - check preferred study times
    for (const preferredSlot of preferences.preferredStudyTimes) {
      const startMinutes = this.parseTimeToMinutes(preferredSlot.startTime);
      const endMinutes = this.parseTimeToMinutes(preferredSlot.endTime);
      
      if (endMinutes - startMinutes >= duration) {
        // Check if slot is free
        const hasConflict = existingSchedules.some(schedule => {
          if (!schedule.startTime) return false;
          const scheduleStart = this.parseTimeToMinutes(schedule.startTime);
          const scheduleEnd = scheduleStart + schedule.duration;
          return !(endMinutes <= scheduleStart || startMinutes >= scheduleEnd);
        });
        
        if (!hasConflict) {
          slots.push({
            date,
            startTime: preferredSlot.startTime,
            endTime: this.minutesToTime(startMinutes + duration),
            confidence: 0.9,
            reasoning: 'Matches your preferred study time',
            conflictCount: 0,
            userPreferenceMatch: 1.0
          });
        }
      }
    }
    
    return slots;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private mapScheduleFromDb(dbSchedule: any): ScheduleItem {
    return {
      id: dbSchedule.id,
      journeyId: dbSchedule.journey_id,
      scheduledDate: dbSchedule.scheduled_date,
      taskType: dbSchedule.task_type,
      title: dbSchedule.title,
      description: dbSchedule.description,
      startTime: dbSchedule.start_time,
      duration: dbSchedule.duration,
      status: dbSchedule.status || 'scheduled',
      todoId: dbSchedule.todo_id,
      videoId: dbSchedule.video_id,
      priority: dbSchedule.priority || 'medium',
      reminderMinutes: dbSchedule.reminder_minutes,
      metadata: dbSchedule.metadata || {},
      completedAt: dbSchedule.completed_at,
      createdAt: dbSchedule.created_at,
      updatedAt: dbSchedule.updated_at
    };
  }

  private mapUpdateDataToDb(data: UpdateScheduleRequest): any {
    const mapped: any = {};
    
    if (data.scheduledDate !== undefined) mapped.scheduled_date = data.scheduledDate;
    if (data.taskType !== undefined) mapped.task_type = data.taskType;
    if (data.title !== undefined) mapped.title = data.title;
    if (data.description !== undefined) mapped.description = data.description;
    if (data.startTime !== undefined) mapped.start_time = data.startTime;
    if (data.duration !== undefined) mapped.duration = data.duration;
    if (data.status !== undefined) mapped.status = data.status;
    if (data.priority !== undefined) mapped.priority = data.priority;
    if (data.reminderMinutes !== undefined) mapped.reminder_minutes = data.reminderMinutes;
    if (data.metadata !== undefined) mapped.metadata = data.metadata;

    return mapped;
  }

  private mapConflictFromDb(dbConflict: any): ScheduleConflict {
    return {
      id: dbConflict.id,
      userId: dbConflict.user_id,
      conflictType: dbConflict.conflict_type,
      primaryScheduleId: dbConflict.primary_schedule_id,
      conflictingScheduleId: dbConflict.conflicting_schedule_id,
      conflictDetails: dbConflict.conflict_details || {},
      resolutionStatus: dbConflict.resolution_status,
      resolutionAction: dbConflict.resolution_action,
      detectedAt: dbConflict.detected_at,
      resolvedAt: dbConflict.resolved_at,
      createdAt: dbConflict.created_at,
      updatedAt: dbConflict.updated_at
    };
  }

  private mapTemplateFromDb(dbTemplate: any): ScheduleTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      description: dbTemplate.description,
      templateType: dbTemplate.template_type,
      schedulePattern: dbTemplate.schedule_pattern || {},
      defaultDurationMinutes: dbTemplate.default_duration_minutes,
      isSystemTemplate: dbTemplate.is_system_template,
      isActive: dbTemplate.is_active,
      createdAt: dbTemplate.created_at,
      updatedAt: dbTemplate.updated_at
    };
  }

  private mapPreferencesFromDb(dbPrefs: any): UserSchedulePreferences {
    return {
      id: dbPrefs.id,
      userId: dbPrefs.user_id,
      timezone: dbPrefs.timezone,
      preferredStudyTimes: dbPrefs.preferred_study_times || [],
      maxDailyStudyHours: dbPrefs.max_daily_study_hours,
      breakDurationMinutes: dbPrefs.break_duration_minutes,
      weekendAvailability: dbPrefs.weekend_availability,
      preferredSessionLength: dbPrefs.preferred_session_length,
      avoidTimes: dbPrefs.avoid_times || [],
      autoSchedule: dbPrefs.auto_schedule,
      notificationPreferences: dbPrefs.notification_preferences || {},
      createdAt: dbPrefs.created_at,
      updatedAt: dbPrefs.updated_at
    };
  }

  private mapPreferencesToDb(preferences: Partial<UserSchedulePreferences>): any {
    const mapped: any = {};
    
    if (preferences.timezone !== undefined) mapped.timezone = preferences.timezone;
    if (preferences.preferredStudyTimes !== undefined) mapped.preferred_study_times = preferences.preferredStudyTimes;
    if (preferences.maxDailyStudyHours !== undefined) mapped.max_daily_study_hours = preferences.maxDailyStudyHours;
    if (preferences.breakDurationMinutes !== undefined) mapped.break_duration_minutes = preferences.breakDurationMinutes;
    if (preferences.weekendAvailability !== undefined) mapped.weekend_availability = preferences.weekendAvailability;
    if (preferences.preferredSessionLength !== undefined) mapped.preferred_session_length = preferences.preferredSessionLength;
    if (preferences.avoidTimes !== undefined) mapped.avoid_times = preferences.avoidTimes;
    if (preferences.autoSchedule !== undefined) mapped.auto_schedule = preferences.autoSchedule;
    if (preferences.notificationPreferences !== undefined) mapped.notification_preferences = preferences.notificationPreferences;

    return mapped;
  }

  private applyFilters(query: any, filters?: ScheduleFilters): any {
    if (!filters) return query;

    if (filters.dateFrom) {
      query = query.gte('scheduled_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('scheduled_date', filters.dateTo);
    }
    if (filters.taskTypes?.length) {
      query = query.in('task_type', filters.taskTypes);
    }
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.priority?.length) {
      query = query.in('priority', filters.priority);
    }
    if (filters.todoId) {
      query = query.eq('todo_id', filters.todoId);
    }
    if (filters.videoId) {
      query = query.eq('video_id', filters.videoId);
    }

    return query;
  }
}

// Export singleton instance
export const calendarIntegrationService = new CalendarIntegrationService();