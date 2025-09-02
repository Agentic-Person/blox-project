// Calendar System Types
// Part of: Phase 3A Calendar/Todo Implementation

export type TaskType = 'video' | 'practice' | 'project' | 'review';
export type ScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
export type ConflictType = 'overlap' | 'too_close' | 'exceeds_limit';
export type ResolutionStatus = 'unresolved' | 'auto_resolved' | 'user_resolved' | 'ignored';
export type TemplateType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  date?: string;      // YYYY-MM-DD for specific dates
}

export interface ScheduleItem {
  id: string;
  journeyId: string;
  scheduledDate: string;
  taskType: TaskType;
  title: string;
  description?: string;
  startTime?: string;
  duration: number; // minutes
  status: ScheduleStatus;
  todoId?: string;
  videoId?: string;
  priority: 'low' | 'medium' | 'high';
  reminderMinutes?: number;
  metadata: Record<string, any>;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleRequest {
  scheduledDate: string;
  taskType: TaskType;
  title: string;
  description?: string;
  startTime?: string;
  duration: number;
  todoId?: string;
  videoId?: string;
  priority?: 'low' | 'medium' | 'high';
  reminderMinutes?: number;
  metadata?: Record<string, any>;
}

export interface UpdateScheduleRequest {
  scheduledDate?: string;
  taskType?: TaskType;
  title?: string;
  description?: string;
  startTime?: string;
  duration?: number;
  status?: ScheduleStatus;
  priority?: 'low' | 'medium' | 'high';
  reminderMinutes?: number;
  metadata?: Record<string, any>;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  templateType: TemplateType;
  schedulePattern: Record<string, any>;
  defaultDurationMinutes: number;
  isSystemTemplate: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSchedulePreferences {
  id: string;
  userId: string;
  timezone: string;
  preferredStudyTimes: TimeSlot[];
  maxDailyStudyHours: number;
  breakDurationMinutes: number;
  weekendAvailability: boolean;
  preferredSessionLength: number;
  avoidTimes: TimeSlot[];
  autoSchedule: boolean;
  notificationPreferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleConflict {
  id: string;
  userId: string;
  conflictType: ConflictType;
  primaryScheduleId: string;
  conflictingScheduleId?: string;
  conflictDetails: Record<string, any>;
  resolutionStatus: ResolutionStatus;
  resolutionAction?: string;
  detectedAt: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleFilters {
  dateFrom?: string;
  dateTo?: string;
  taskTypes?: TaskType[];
  status?: ScheduleStatus[];
  priority?: ('low' | 'medium' | 'high')[];
  todoId?: string;
  videoId?: string;
  search?: string;
}

export interface OptimalTimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  confidence: number; // 0-1 score
  reasoning: string;
  conflictCount: number;
  userPreferenceMatch: number; // 0-1 score
}

export interface ScheduleAnalytics {
  totalScheduledHours: number;
  completionRate: number; // percentage
  averageSessionLength: number; // minutes
  mostProductiveTimeSlots: TimeSlot[];
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate?: string;
  };
  weeklyBreakdown: {
    week: string;
    scheduled: number;
    completed: number;
    missed: number;
  }[];
  taskTypeBreakdown: Record<TaskType, {
    scheduled: number;
    completed: number;
    averageDuration: number;
  }>;
}

export interface RecurringSchedulePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // For weekly patterns
  dayOfMonth?: number; // For monthly patterns
  endDate?: string;
  maxOccurrences?: number;
}

export interface RecurringScheduleRequest extends CreateScheduleRequest {
  pattern: RecurringSchedulePattern;
}

export interface BulkScheduleOperation {
  operation: 'create' | 'update' | 'delete';
  scheduleIds?: string[];
  scheduleData?: CreateScheduleRequest[];
  updateData?: UpdateScheduleRequest;
}

export interface BulkScheduleResult {
  successful: number;
  failed: number;
  errors: {
    scheduleId?: string;
    error: string;
  }[];
  schedules?: ScheduleItem[];
}

export interface SchedulingConstraints {
  minSessionLength: number; // minutes
  maxSessionLength: number; // minutes
  maxDailyHours: number;
  requiredBreakBetweenSessions: number; // minutes
  blackoutTimes: TimeSlot[];
  preferredTimes: TimeSlot[];
  timezoneName: string;
}

export interface SmartSchedulingSuggestion {
  suggestedSlots: OptimalTimeSlot[];
  totalDuration: number;
  reasoning: string;
  confidence: number;
  alternativeOptions?: OptimalTimeSlot[];
}

// Error types
export class CalendarError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'CalendarError';
  }
}

export class ScheduleConflictError extends CalendarError {
  constructor(message: string, public conflicts: ScheduleConflict[]) {
    super(message, 'SCHEDULE_CONFLICT', 409);
  }
}

export class ScheduleNotFoundError extends CalendarError {
  constructor(scheduleId: string) {
    super(`Schedule with ID ${scheduleId} not found`, 'SCHEDULE_NOT_FOUND', 404);
  }
}

export class InvalidTimeSlotError extends CalendarError {
  constructor(message: string) {
    super(message, 'INVALID_TIME_SLOT', 400);
  }
}

// Service interface
export interface CalendarIntegrationService {
  // CRUD Operations
  createSchedule(userId: string, data: CreateScheduleRequest): Promise<ScheduleItem>;
  getSchedule(userId: string, scheduleId: string): Promise<ScheduleItem>;
  updateSchedule(userId: string, scheduleId: string, data: UpdateScheduleRequest): Promise<ScheduleItem>;
  deleteSchedule(userId: string, scheduleId: string): Promise<void>;
  
  // Schedule retrieval
  getSchedules(userId: string, filters?: ScheduleFilters): Promise<ScheduleItem[]>;
  getSchedulesByDateRange(userId: string, startDate: string, endDate: string): Promise<ScheduleItem[]>;
  getTodaySchedule(userId: string): Promise<ScheduleItem[]>;
  getUpcomingSchedules(userId: string, days?: number): Promise<ScheduleItem[]>;
  
  // Conflict detection and resolution
  detectConflicts(userId: string, scheduleData: CreateScheduleRequest): Promise<ScheduleConflict[]>;
  resolveConflict(userId: string, conflictId: string, resolutionAction: string): Promise<ScheduleConflict>;
  getActiveConflicts(userId: string): Promise<ScheduleConflict[]>;
  
  // Smart scheduling
  findOptimalTimeSlots(userId: string, duration: number, dateRange: {start: string, end: string}, count?: number): Promise<OptimalTimeSlot[]>;
  suggestScheduleForTodo(userId: string, todoId: string): Promise<SmartSchedulingSuggestion>;
  autoScheduleTodos(userId: string, todoIds: string[], constraints?: SchedulingConstraints): Promise<BulkScheduleResult>;
  
  // Recurring schedules
  createRecurringSchedule(userId: string, data: RecurringScheduleRequest): Promise<ScheduleItem[]>;
  updateRecurringSchedule(userId: string, scheduleId: string, updateFuture: boolean, data: UpdateScheduleRequest): Promise<ScheduleItem[]>;
  
  // User preferences
  getUserPreferences(userId: string): Promise<UserSchedulePreferences>;
  updateUserPreferences(userId: string, preferences: Partial<UserSchedulePreferences>): Promise<UserSchedulePreferences>;
  
  // Templates
  getScheduleTemplates(): Promise<ScheduleTemplate[]>;
  createScheduleFromTemplate(userId: string, templateId: string, customizations?: Partial<CreateScheduleRequest>): Promise<ScheduleItem>;
  
  // Bulk operations
  bulkCreateSchedules(userId: string, schedules: CreateScheduleRequest[]): Promise<BulkScheduleResult>;
  bulkUpdateSchedules(userId: string, operation: BulkScheduleOperation): Promise<BulkScheduleResult>;
  
  // Analytics
  getScheduleAnalytics(userId: string, timeRange?: string): Promise<ScheduleAnalytics>;
  getProductivityInsights(userId: string): Promise<{
    bestPerformanceTimes: TimeSlot[];
    strugglingTimes: TimeSlot[];
    recommendations: string[];
  }>;
  
  // Status updates
  markScheduleCompleted(userId: string, scheduleId: string): Promise<ScheduleItem>;
  markScheduleMissed(userId: string, scheduleId: string, reason?: string): Promise<ScheduleItem>;
  
  // Integration helpers
  syncWithTodoSystem(userId: string): Promise<void>;
  generateScheduleFromLearningPath(userId: string, learningPathId: string): Promise<ScheduleItem[]>;
}