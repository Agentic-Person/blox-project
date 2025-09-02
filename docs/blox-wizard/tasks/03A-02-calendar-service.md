# Task 03A-02: Calendar Service Architecture
**Phase 3A - Calendar/Todo Foundation** | **Priority**: 🔴 Critical | **Time**: 8-10 hours

---

## Overview

Build a comprehensive calendar scheduling system that integrates with the existing AI Journey system and todo management. This service will handle time management, scheduling conflicts, recurring tasks, and intelligent schedule optimization for learning activities.

## Business Requirements

### User Stories
- **As a student**, I want to schedule learning activities so I can organize my time effectively
- **As a student**, I want the system to detect scheduling conflicts so I don't double-book myself
- **As a student**, I want recurring tasks for consistent practice so I can build habits
- **As a student**, I want the AI to suggest optimal study times based on my availability and progress
- **As a student**, I want to reschedule items easily when my plans change

### Key Features
1. **Intelligent Scheduling**: AI-powered time slot suggestions based on user patterns
2. **Conflict Detection**: Prevent double-booking and suggest alternative times
3. **Recurring Tasks**: Support for daily, weekly, and custom recurring schedules
4. **Time Zone Support**: Handle scheduling across different time zones
5. **Schedule Optimization**: Optimize learning schedules for maximum effectiveness
6. **Integration**: Deep integration with existing AI Journey schedule system

---

## Technical Requirements

### Database Schema Integration

**Extend existing AI Journey schema:**

```sql
-- Extend existing ai_journey_schedule table
ALTER TABLE ai_journey_schedule 
ADD COLUMN recurrence_rule TEXT, -- RRULE format for recurring events
ADD COLUMN recurrence_exceptions DATE[], -- Dates to skip for recurring events
ADD COLUMN time_zone TEXT DEFAULT 'UTC',
ADD COLUMN scheduling_context JSONB DEFAULT '{}'::jsonb, -- AI context for scheduling decisions
ADD COLUMN original_scheduled_date TIMESTAMPTZ, -- For tracking rescheduled items
ADD COLUMN auto_scheduled BOOLEAN DEFAULT false, -- Whether this was AI-scheduled
ADD COLUMN schedule_source TEXT DEFAULT 'manual' CHECK (schedule_source IN ('manual', 'ai_chat', 'ai_optimization', 'template'));

-- New table for schedule templates
CREATE TABLE schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type VARCHAR(50) NOT NULL, -- 'daily_routine', 'weekly_plan', 'skill_focused', 'project_based'
  schedule_pattern JSONB NOT NULL, -- Pattern definition
  default_duration_minutes INT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_by TEXT, -- User ID who created template
  usage_count INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- New table for user scheduling preferences
CREATE TABLE user_schedule_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  time_zone TEXT NOT NULL DEFAULT 'UTC',
  preferred_study_times JSONB DEFAULT '[]'::jsonb, -- Array of time slots like [{"day": "monday", "start": "14:00", "end": "16:00"}]
  break_preferences JSONB DEFAULT '{}'::jsonb, -- Break duration, frequency
  focus_duration_minutes INT DEFAULT 45, -- Preferred focus session length
  max_daily_study_minutes INT DEFAULT 180, -- Maximum study time per day
  buffer_minutes INT DEFAULT 15, -- Buffer between scheduled items
  weekend_study BOOLEAN DEFAULT true,
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  scheduling_style VARCHAR(20) DEFAULT 'balanced' CHECK (scheduling_style IN ('intensive', 'balanced', 'relaxed')),
  auto_reschedule BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- New table for schedule conflicts and resolutions
CREATE TABLE schedule_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  conflicting_schedule_ids UUID[] NOT NULL, -- Array of conflicting schedule IDs
  conflict_type VARCHAR(30) NOT NULL CHECK (conflict_type IN ('time_overlap', 'resource_conflict', 'dependency_violation', 'user_unavailable')),
  conflict_description TEXT,
  suggested_resolutions JSONB DEFAULT '[]'::jsonb, -- AI-suggested solutions
  resolution_chosen JSONB, -- User's chosen resolution
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX ai_journey_schedule_user_date_idx ON ai_journey_schedule(journey_id, scheduled_date);
CREATE INDEX ai_journey_schedule_recurrence_idx ON ai_journey_schedule(recurrence_rule) WHERE recurrence_rule IS NOT NULL;
CREATE INDEX ai_journey_schedule_source_idx ON ai_journey_schedule(schedule_source);
CREATE INDEX user_schedule_preferences_user_idx ON user_schedule_preferences(user_id);
CREATE INDEX schedule_conflicts_user_idx ON schedule_conflicts(user_id);
CREATE INDEX schedule_conflicts_resolved_idx ON schedule_conflicts(user_id, resolved_at) WHERE resolved_at IS NULL;

-- RLS Policies
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_schedule_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public templates and their own" ON schedule_templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid()::text);

CREATE POLICY "Users can create their own templates" ON schedule_templates
  FOR INSERT WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "Users can manage their own preferences" ON user_schedule_preferences
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can manage their own conflicts" ON schedule_conflicts
  FOR ALL USING (user_id = auth.uid()::text);
```

### Service Architecture

**File**: `src/services/calendar-integration.ts`

```typescript
export interface ScheduleEntry {
  id: string
  journeyId: string
  scheduledDate: Date
  taskType: 'video' | 'practice' | 'project' | 'review'
  taskTitle: string
  taskDescription?: string
  durationMinutes: number
  priority: 'low' | 'medium' | 'high'
  skillId?: string
  moduleId?: string
  videoId?: string
  completed: boolean
  completedAt?: Date
  
  // Calendar-specific fields
  recurrenceRule?: string // RRULE format
  recurrenceExceptions?: Date[]
  timeZone: string
  schedulingContext: Record<string, any>
  originalScheduledDate?: Date
  autoScheduled: boolean
  scheduleSource: 'manual' | 'ai_chat' | 'ai_optimization' | 'template'
}

export interface ScheduleTemplate {
  id: string
  name: string
  description?: string
  templateType: 'daily_routine' | 'weekly_plan' | 'skill_focused' | 'project_based'
  schedulePattern: SchedulePattern
  defaultDurationMinutes?: number
  tags: string[]
  isPublic: boolean
  createdBy: string
  usageCount: number
  rating: number
}

export interface SchedulePattern {
  recurring: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
  daysOfWeek?: number[] // 0 = Sunday, 1 = Monday, etc.
  timeSlots: TimeSlot[]
  duration: number // minutes
  breakBetween?: number // minutes
  totalWeeks?: number
  adaptToProgress?: boolean
}

export interface UserSchedulePreferences {
  id: string
  userId: string
  timeZone: string
  preferredStudyTimes: PreferredTimeSlot[]
  breakPreferences: BreakPreferences
  focusDurationMinutes: number
  maxDailyStudyMinutes: number
  bufferMinutes: number
  weekendStudy: boolean
  notificationPreferences: NotificationPreferences
  schedulingStyle: 'intensive' | 'balanced' | 'relaxed'
  autoReschedule: boolean
}

export interface PreferredTimeSlot {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  preference: 'preferred' | 'acceptable' | 'avoid'
}

export interface ScheduleConflict {
  id: string
  userId: string
  conflictingScheduleIds: string[]
  conflictType: 'time_overlap' | 'resource_conflict' | 'dependency_violation' | 'user_unavailable'
  conflictDescription: string
  suggestedResolutions: ConflictResolution[]
  resolutionChosen?: ConflictResolution
  resolvedAt?: Date
}

export interface ConflictResolution {
  type: 'reschedule' | 'shorten' | 'cancel' | 'merge'
  description: string
  newSchedule?: Partial<ScheduleEntry>[]
  impact: 'minimal' | 'moderate' | 'significant'
  confidence: number // 0-1
}

export class CalendarIntegrationService {
  // Core scheduling operations
  async createScheduleEntry(
    userId: string, 
    entry: Partial<ScheduleEntry>
  ): Promise<ScheduleEntry>
  
  async updateScheduleEntry(
    entryId: string, 
    updates: Partial<ScheduleEntry>
  ): Promise<ScheduleEntry>
  
  async deleteScheduleEntry(entryId: string): Promise<boolean>
  
  async getScheduleEntry(entryId: string): Promise<ScheduleEntry | null>
  
  // Schedule querying
  async getSchedule(
    userId: string, 
    startDate: Date, 
    endDate: Date,
    filters?: ScheduleFilters
  ): Promise<ScheduleEntry[]>
  
  async getDaySchedule(userId: string, date: Date): Promise<ScheduleEntry[]>
  
  async getWeekSchedule(userId: string, weekStart: Date): Promise<ScheduleEntry[]>
  
  // Conflict detection and resolution
  async detectConflicts(
    userId: string, 
    proposedEntry: Partial<ScheduleEntry>
  ): Promise<ScheduleConflict[]>
  
  async resolveConflict(
    conflictId: string, 
    resolution: ConflictResolution
  ): Promise<boolean>
  
  async getSuggestedTimeSlots(
    userId: string,
    requirements: SchedulingRequirements
  ): Promise<SuggestedTimeSlot[]>
  
  // Recurring schedule management
  async createRecurringSchedule(
    userId: string,
    baseEntry: Partial<ScheduleEntry>,
    recurrenceRule: string,
    endDate?: Date
  ): Promise<ScheduleEntry[]>
  
  async updateRecurringSchedule(
    seriesId: string,
    updates: Partial<ScheduleEntry>,
    updateType: 'single' | 'following' | 'all'
  ): Promise<ScheduleEntry[]>
  
  async addRecurrenceException(
    seriesId: string,
    exceptionDate: Date
  ): Promise<boolean>
  
  // Smart scheduling features
  async optimizeSchedule(
    userId: string,
    timeRange: DateRange,
    optimizationGoals: OptimizationGoals
  ): Promise<ScheduleOptimization>
  
  async suggestScheduleFromGoals(
    userId: string,
    learningGoals: string[],
    timeConstraints: TimeConstraints
  ): Promise<ScheduleSuggestion>
  
  async adaptScheduleToProgress(
    userId: string,
    progressUpdate: ProgressUpdate
  ): Promise<ScheduleAdjustment[]>
  
  // Template management
  async getScheduleTemplates(
    userId: string,
    filters?: TemplateFilters
  ): Promise<ScheduleTemplate[]>
  
  async applyScheduleTemplate(
    userId: string,
    templateId: string,
    customization?: TemplateCustomization
  ): Promise<ScheduleEntry[]>
  
  async createCustomTemplate(
    userId: string,
    template: Partial<ScheduleTemplate>
  ): Promise<ScheduleTemplate>
  
  // User preferences
  async getUserPreferences(userId: string): Promise<UserSchedulePreferences>
  
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserSchedulePreferences>
  ): Promise<UserSchedulePreferences>
  
  // Natural language processing
  async parseScheduleRequest(
    userId: string,
    naturalLanguageInput: string,
    context?: SchedulingContext
  ): Promise<ScheduleIntent>
  
  // Integration helpers
  async syncWithTodos(userId: string): Promise<void>
  async syncWithAIJourney(userId: string): Promise<void>
  async createFromChatRecommendation(
    userId: string,
    videoRecommendations: VideoReference[],
    schedulingHint?: string
  ): Promise<ScheduleEntry[]>
}
```

### API Endpoints

**Base Route**: `/api/calendar`

```typescript
// GET /api/calendar/schedule - Get user's schedule
interface GetScheduleQuery {
  startDate: string // ISO date
  endDate: string // ISO date
  taskType?: string[]
  priority?: string[]
  completed?: boolean
  includeRecurring?: boolean
}

// POST /api/calendar/schedule - Create schedule entry
interface CreateScheduleBody {
  scheduledDate: string // ISO datetime
  taskType: 'video' | 'practice' | 'project' | 'review'
  taskTitle: string
  taskDescription?: string
  durationMinutes: number
  priority?: 'low' | 'medium' | 'high'
  skillId?: string
  moduleId?: string
  videoId?: string
  recurrenceRule?: string
  timeZone?: string
}

// PUT /api/calendar/schedule/[id] - Update schedule entry
interface UpdateScheduleBody {
  scheduledDate?: string
  taskTitle?: string
  taskDescription?: string
  durationMinutes?: number
  priority?: string
  completed?: boolean
  updateRecurring?: 'single' | 'following' | 'all'
}

// POST /api/calendar/conflicts/detect - Detect scheduling conflicts
interface DetectConflictsBody {
  scheduledDate: string
  durationMinutes: number
  taskType?: string
  priority?: string
}

// GET /api/calendar/suggestions - Get suggested time slots
interface GetSuggestionsQuery {
  taskType: string
  durationMinutes: number
  priority?: string
  preferredDays?: string[] // ['monday', 'tuesday', ...]
  preferredTimes?: string[] // ['morning', 'afternoon', 'evening']
  startDate?: string // ISO date
  endDate?: string // ISO date
}

// POST /api/calendar/optimize - Optimize existing schedule
interface OptimizeScheduleBody {
  startDate: string
  endDate: string
  goals: OptimizationGoals
  constraints?: SchedulingConstraints
}

// GET /api/calendar/preferences - Get user preferences
// PUT /api/calendar/preferences - Update user preferences
interface UpdatePreferencesBody {
  timeZone?: string
  preferredStudyTimes?: PreferredTimeSlot[]
  focusDurationMinutes?: number
  maxDailyStudyMinutes?: number
  bufferMinutes?: number
  weekendStudy?: boolean
  schedulingStyle?: 'intensive' | 'balanced' | 'relaxed'
  autoReschedule?: boolean
}

// GET /api/calendar/templates - Get schedule templates
interface GetTemplatesQuery {
  templateType?: string
  isPublic?: boolean
  tags?: string[]
}

// POST /api/calendar/templates/apply - Apply a template
interface ApplyTemplateBody {
  templateId: string
  startDate: string
  customization?: TemplateCustomization
}

// POST /api/calendar/parse - Parse natural language scheduling request
interface ParseScheduleBody {
  text: string
  context?: {
    currentDate?: string
    userTimezone?: string
    recentTopics?: string[]
  }
}
```

---

## Smart Scheduling Algorithms

### 1. Optimal Time Slot Detection
```typescript
class OptimalTimeDetector {
  async findOptimalSlots(
    userId: string,
    requirements: SchedulingRequirements
  ): Promise<TimeSlotSuggestion[]> {
    // Algorithm factors:
    // 1. User's historical performance at different times
    // 2. Current schedule density
    // 3. Task type (videos vs practice vs projects)
    // 4. User's stated preferences
    // 5. Break spacing optimization
    // 6. Focus session clustering
    
    const preferences = await this.getUserPreferences(userId)
    const historicalData = await this.getPerformanceHistory(userId)
    const currentSchedule = await this.getCurrentSchedule(userId)
    
    return this.calculateOptimalSlots({
      preferences,
      historicalData,
      currentSchedule,
      requirements
    })
  }
}
```

### 2. Schedule Optimization Engine
```typescript
class ScheduleOptimizer {
  async optimizeWeeklySchedule(
    userId: string,
    currentSchedule: ScheduleEntry[],
    goals: OptimizationGoals
  ): Promise<ScheduleOptimization> {
    // Optimization strategies:
    // 1. Balance learning types (theory vs practice)
    // 2. Respect spaced repetition principles
    // 3. Group related topics
    // 4. Minimize context switching
    // 5. Optimize for user's peak performance times
    // 6. Ensure adequate break distribution
    
    const analysis = await this.analyzeCurrentSchedule(currentSchedule)
    const improvements = await this.identifyImprovements(analysis, goals)
    
    return this.generateOptimizedSchedule(currentSchedule, improvements)
  }
}
```

### 3. Conflict Resolution AI
```typescript
class ConflictResolver {
  async resolveSchedulingConflict(
    conflict: ScheduleConflict,
    userPreferences: UserSchedulePreferences
  ): Promise<ConflictResolution[]> {
    // Resolution strategies:
    // 1. Find alternative time slots
    // 2. Adjust task duration
    // 3. Reschedule lower priority items
    // 4. Split large tasks
    // 5. Move to preferred days
    // 6. Batch similar tasks
    
    const strategies = await this.analyzeConflictType(conflict)
    const alternatives = await this.findAlternatives(conflict, userPreferences)
    
    return this.rankResolutionOptions(strategies, alternatives)
  }
}
```

---

## Integration Points

### 1. Todo System Integration
- Convert todos with due dates to scheduled entries
- Automatically schedule high-priority todos
- Update todo completion when schedule items are completed
- Suggest schedule times based on todo priority and category

### 2. AI Journey Integration
- Read existing `ai_journey_schedule` entries
- Sync completion status bidirectionally
- Use AI Journey goals to suggest scheduling priorities
- Update AI Journey progress when scheduled tasks complete

### 3. Chat System Integration
- Parse scheduling requests from chat ("Schedule this for tomorrow at 2pm")
- Create schedule entries from video recommendations
- Provide schedule status updates in chat responses
- Handle rescheduling requests through chat

### 4. Video System Integration
- Schedule video watching sessions with precise timing
- Track video completion as scheduled task completion
- Suggest practice sessions following video content
- Handle video duration changes automatically

---

## Implementation Plan

### Phase 1: Database and Core Service (3 hours)
1. **Extend database schema**:
   - Add new fields to ai_journey_schedule
   - Create schedule_templates table
   - Create user_schedule_preferences table
   - Create schedule_conflicts table
   - Add indexes and RLS policies

2. **Implement CalendarIntegrationService core**:
   - Basic CRUD operations for schedule entries
   - Schedule querying with date ranges
   - User preferences management
   - Initial conflict detection

### Phase 2: Smart Scheduling Features (3 hours)
1. **Implement optimal time detection**:
   - Algorithm to find best time slots
   - User preference integration
   - Historical performance analysis
   - Time zone handling

2. **Add recurring schedule support**:
   - RRULE parsing and generation
   - Exception handling
   - Series updating logic
   - Conflict detection for recurring items

### Phase 3: Conflict Resolution (2 hours)
1. **Build conflict detection**:
   - Time overlap detection
   - Resource conflict checking
   - User availability validation
   - Dependency violation detection

2. **Implement resolution suggestions**:
   - Alternative time slot finding
   - Automatic rescheduling options
   - Impact assessment
   - User notification system

### Phase 4: API and Integration (2 hours)
1. **Create API endpoints**:
   - All CRUD operations
   - Conflict detection endpoint
   - Suggestions endpoint
   - Template management endpoints

2. **Integration with other systems**:
   - Todo system synchronization
   - AI Journey system sync
   - Chat system integration hooks
   - Video system integration

---

## Testing Strategy

### Unit Tests
```typescript
describe('CalendarIntegrationService', () => {
  describe('detectConflicts', () => {
    it('detects time overlap conflicts', async () => {
      // Arrange
      const existingEntry = {
        scheduledDate: new Date('2024-01-15T14:00:00Z'),
        durationMinutes: 60
      }
      const newEntry = {
        scheduledDate: new Date('2024-01-15T14:30:00Z'),
        durationMinutes: 60
      }
      
      await calendarService.createScheduleEntry('user123', existingEntry)
      
      // Act
      const conflicts = await calendarService.detectConflicts('user123', newEntry)
      
      // Assert
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].conflictType).toBe('time_overlap')
    })
  })
  
  describe('findOptimalSlots', () => {
    it('respects user preferences for study times', async () => {
      // Arrange
      const preferences = {
        preferredStudyTimes: [
          { day: 'monday', startTime: '14:00', endTime: '16:00', preference: 'preferred' }
        ]
      }
      
      await calendarService.updateUserPreferences('user123', preferences)
      
      // Act
      const suggestions = await calendarService.getSuggestedTimeSlots('user123', {
        durationMinutes: 45,
        taskType: 'video',
        preferredDays: ['monday']
      })
      
      // Assert
      expect(suggestions.some(slot => 
        slot.startTime >= '14:00' && slot.endTime <= '16:00'
      )).toBe(true)
    })
  })
})
```

### Integration Tests
```typescript
describe('Calendar API Endpoints', () => {
  describe('POST /api/calendar/schedule', () => {
    it('creates schedule entry and detects conflicts', async () => {
      const scheduleData = {
        scheduledDate: '2024-01-15T14:00:00Z',
        taskType: 'video',
        taskTitle: 'Learn Scripting Basics',
        durationMinutes: 30
      }
      
      const response = await request(app)
        .post('/api/calendar/schedule')
        .set('Authorization', `Bearer ${userToken}`)
        .send(scheduleData)
        .expect(201)
        
      expect(response.body.id).toBeDefined()
      expect(response.body.conflicts).toHaveLength(0)
    })
  })
})
```

---

## Performance Considerations

### Database Performance
- **Composite Indexes**: Optimize queries by user_id + date range
- **Date Range Queries**: Use efficient date range indexing
- **Recurring Events**: Optimize recurring event expansion
- **Time Zone Handling**: Proper UTC storage with time zone conversion

### Algorithm Performance
- **Conflict Detection**: O(n) algorithm for time overlap checking
- **Optimization**: Limit scope of schedule optimization to reasonable time ranges
- **Caching**: Cache user preferences and frequently accessed schedules
- **Background Processing**: Move complex optimizations to background jobs

### API Performance
- **Pagination**: Implement for large schedule queries
- **Response Caching**: Cache schedule data with appropriate TTL
- **Rate Limiting**: Prevent abuse of optimization endpoints
- **Bulk Operations**: Support bulk schedule operations

---

## Success Criteria

### Functional Requirements
- [ ] Create, read, update, delete schedule entries
- [ ] Detect and resolve scheduling conflicts
- [ ] Support recurring schedules with exceptions
- [ ] Provide intelligent time slot suggestions
- [ ] Handle multiple time zones correctly
- [ ] Integrate with todo and AI Journey systems

### Performance Requirements
- [ ] Schedule queries < 300ms for 1-month range
- [ ] Conflict detection < 200ms
- [ ] Time zone conversion handled correctly
- [ ] Support 1000+ schedule entries per user
- [ ] Optimization algorithms complete < 5s

### Quality Requirements
- [ ] Unit test coverage > 85%
- [ ] Integration tests cover all API endpoints
- [ ] Handles edge cases (DST, leap years, etc.)
- [ ] Graceful degradation when external services fail
- [ ] Comprehensive error logging

---

## Dependencies

### Required Before Starting
- [ ] Task 03A-01 (Todo Management System) completed
- [ ] AI Journey database tables accessible
- [ ] User authentication system functional
- [ ] Time zone handling library selected

### Integration Dependencies
- [ ] Todo system interfaces defined
- [ ] AI Journey sync requirements clarified
- [ ] Chat system message formats agreed upon
- [ ] Video system completion tracking specified

---

**Ready for Implementation**: This provides comprehensive calendar scheduling with smart conflict resolution and optimization features.

---

*Task created by: Senior Developer*  
*Estimated completion: 8-10 hours*  
*Next task: 03A-03 Learning Path Generator*