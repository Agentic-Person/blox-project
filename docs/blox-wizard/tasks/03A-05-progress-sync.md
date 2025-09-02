# Task 03A-05: Progress Sync Service
**Phase 3A - Calendar/Todo Foundation** | **Priority**: 🟡 Medium | **Time**: 5-6 hours

---

## Overview

Build a comprehensive progress synchronization system that ensures data consistency across todos, calendar schedules, AI Journey system, and video tracking. This service handles real-time updates, conflict resolution, and provides a unified view of user progress across all learning activities.

## Business Requirements

### User Stories
- **As a student**, I want my progress to be automatically updated everywhere when I complete a task so I don't have duplicate work
- **As a student**, I want all my systems to stay in sync so I see consistent progress information
- **As a student**, I want completed videos in chat to automatically mark related todos as done
- **As a student**, I want my calendar to reflect my actual progress, not just planned activities
- **As a student**, I want achievements and milestones to be recognized across all parts of the system

### Key Features
1. **Real-time Synchronization**: Immediate updates across all systems
2. **Bi-directional Sync**: Changes in any system propagate to others
3. **Conflict Resolution**: Handle conflicting data intelligently
4. **Progress Aggregation**: Combine progress from multiple sources
5. **Event-driven Updates**: Efficient update propagation
6. **Achievement Tracking**: Unified milestone and achievement system

---

## Technical Requirements

### Service Architecture

**File**: `src/services/progress-sync.ts`

```typescript
export interface ProgressEvent {
  id: string
  userId: string
  eventType: 'video_completed' | 'todo_completed' | 'schedule_completed' | 'milestone_reached' | 'skill_assessed' | 'path_progress_updated'
  sourceSystem: 'video_player' | 'todo_manager' | 'calendar_service' | 'ai_journey' | 'learning_path_generator' | 'chat_system'
  eventData: ProgressEventData
  timestamp: Date
  processed: boolean
  conflictsWith?: string[] // IDs of conflicting events
}

export interface ProgressEventData {
  // Common fields
  activityId?: string // video_id, todo_id, schedule_id, etc.
  activityType: 'video' | 'practice' | 'project' | 'quiz' | 'milestone'
  completionStatus: 'started' | 'in_progress' | 'completed' | 'skipped' | 'failed'
  timeSpent?: number // minutes
  
  // Video-specific data
  videoProgress?: {
    videoId: string
    youtubeId: string
    percentageWatched: number
    timeWatched: number // seconds
    completedAt?: Date
  }
  
  // Todo-specific data
  todoProgress?: {
    todoId: string
    originalDueDate?: Date
    actualCompletionDate: Date
    userRating?: number
    notes?: string
  }
  
  // Schedule-specific data
  scheduleProgress?: {
    scheduleId: string
    scheduledDate: Date
    actualStartTime?: Date
    actualEndTime?: Date
    rescheduledFrom?: Date
  }
  
  // Learning path data
  pathProgress?: {
    pathId: string
    stepId: string
    stepIndex: number
    totalSteps: number
    skillsLearned?: string[]
    difficultyRating?: number
  }
  
  // Skill/milestone data
  skillProgress?: {
    skillId: string
    skillCategory: string
    previousLevel: string
    newLevel: string
    confidence: number
  }
}

export interface ProgressSyncResult {
  eventId: string
  syncedSystems: string[]
  conflicts: ProgressConflict[]
  achievements: Achievement[]
  milestonesReached: Milestone[]
  errors: SyncError[]
  totalProcessingTime: number
}

export interface ProgressConflict {
  conflictType: 'timestamp_mismatch' | 'completion_status_conflict' | 'duplicate_event' | 'data_inconsistency'
  conflictingEvents: ProgressEvent[]
  suggestedResolution: ConflictResolution
  requiresUserInput: boolean
  impact: 'low' | 'medium' | 'high'
}

export interface ConflictResolution {
  resolutionType: 'use_latest' | 'use_most_complete' | 'merge_data' | 'manual_review'
  resolvedData: ProgressEventData
  reasoning: string
  confidence: number
}

export interface Achievement {
  id: string
  type: 'completion' | 'streak' | 'speed' | 'consistency' | 'milestone'
  title: string
  description: string
  earnedAt: Date
  triggerEvent: ProgressEvent
  metadata: Record<string, any>
}

export interface UnifiedProgressView {
  userId: string
  overallProgress: {
    totalActivities: number
    completedActivities: number
    inProgressActivities: number
    percentageComplete: number
    totalTimeSpent: number
    currentStreak: number
  }
  
  skillProgress: Record<string, SkillProgress>
  learningPaths: PathProgressSummary[]
  recentActivities: ActivitySummary[]
  upcomingActivities: ActivitySummary[]
  achievements: Achievement[]
  milestones: Milestone[]
  
  lastSyncTime: Date
  dataConsistencyScore: number // 0-1, higher = more consistent
}

export class ProgressSyncService {
  // Event processing
  async processProgressEvent(event: ProgressEvent): Promise<ProgressSyncResult>
  
  async batchProcessEvents(events: ProgressEvent[]): Promise<ProgressSyncResult[]>
  
  async reprocessFailedEvents(
    eventIds: string[],
    retryStrategy: RetryStrategy
  ): Promise<ProgressSyncResult[]>
  
  // Real-time synchronization
  async syncVideoProgress(
    userId: string,
    videoId: string,
    progressData: VideoProgressData
  ): Promise<ProgressSyncResult>
  
  async syncTodoCompletion(
    userId: string,
    todoId: string,
    completionData: TodoCompletionData
  ): Promise<ProgressSyncResult>
  
  async syncScheduleActivity(
    userId: string,
    scheduleId: string,
    activityData: ScheduleActivityData
  ): Promise<ProgressSyncResult>
  
  async syncLearningPathStep(
    userId: string,
    pathId: string,
    stepId: string,
    stepData: StepProgressData
  ): Promise<ProgressSyncResult>
  
  // Conflict resolution
  async detectConflicts(
    newEvent: ProgressEvent,
    existingEvents: ProgressEvent[]
  ): Promise<ProgressConflict[]>
  
  async resolveConflict(
    conflict: ProgressConflict,
    resolutionChoice?: ConflictResolution
  ): Promise<ConflictResolution>
  
  async autoResolveConflicts(
    conflicts: ProgressConflict[]
  ): Promise<ConflictResolution[]>
  
  // Progress aggregation
  async getUnifiedProgressView(userId: string): Promise<UnifiedProgressView>
  
  async calculateOverallProgress(userId: string): Promise<OverallProgressStats>
  
  async getProgressInsights(
    userId: string,
    timeRange?: DateRange
  ): Promise<ProgressInsights>
  
  async identifyLearningPatterns(
    userId: string
  ): Promise<LearningPattern[]>
  
  // Achievement and milestone tracking
  async checkForAchievements(
    event: ProgressEvent
  ): Promise<Achievement[]>
  
  async updateMilestones(
    userId: string,
    progressUpdate: ProgressUpdate
  ): Promise<Milestone[]>
  
  async calculateStreaks(
    userId: string,
    activityType?: string
  ): Promise<StreakData>
  
  // System integration
  async syncWithAIJourney(
    userId: string,
    progressEvents: ProgressEvent[]
  ): Promise<void>
  
  async syncWithVideoSystem(
    userId: string,
    videoCompletions: VideoCompletion[]
  ): Promise<void>
  
  async syncWithTodoSystem(
    userId: string,
    todoUpdates: TodoUpdate[]
  ): Promise<void>
  
  async syncWithCalendarSystem(
    userId: string,
    scheduleUpdates: ScheduleUpdate[]
  ): Promise<void>
  
  // Data consistency and health
  async validateDataConsistency(
    userId: string
  ): Promise<ConsistencyReport>
  
  async repairDataInconsistencies(
    userId: string,
    inconsistencies: DataInconsistency[]
  ): Promise<RepairResult[]>
  
  async getSystemHealthMetrics(): Promise<SystemHealthMetrics>
  
  // Event subscription and notifications
  async subscribeToProgressEvents(
    userId: string,
    eventTypes: string[],
    callback: ProgressEventCallback
  ): Promise<string> // subscription ID
  
  async unsubscribeFromProgressEvents(
    subscriptionId: string
  ): Promise<boolean>
  
  async publishProgressEvent(
    event: ProgressEvent
  ): Promise<void>
}
```

### Event-Driven Architecture

**File**: `src/services/progress-event-bus.ts`

```typescript
export class ProgressEventBus {
  private subscribers: Map<string, ProgressEventSubscription[]> = new Map()
  private eventQueue: ProgressEvent[] = []
  private processing = false
  
  // Event publishing
  async publish(event: ProgressEvent): Promise<void> {
    await this.validateEvent(event)
    await this.persistEvent(event)
    this.eventQueue.push(event)
    
    if (!this.processing) {
      await this.processQueue()
    }
  }
  
  async publishBatch(events: ProgressEvent[]): Promise<void> {
    for (const event of events) {
      await this.validateEvent(event)
    }
    
    await this.persistEventBatch(events)
    this.eventQueue.push(...events)
    
    if (!this.processing) {
      await this.processQueue()
    }
  }
  
  // Event subscription
  subscribe(
    eventType: string,
    handler: ProgressEventHandler,
    options?: SubscriptionOptions
  ): string {
    const subscription: ProgressEventSubscription = {
      id: generateId(),
      eventType,
      handler,
      options,
      createdAt: new Date()
    }
    
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, [])
    }
    
    this.subscribers.get(eventType)!.push(subscription)
    return subscription.id
  }
  
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subscriptions] of this.subscribers.entries()) {
      const index = subscriptions.findIndex(s => s.id === subscriptionId)
      if (index !== -1) {
        subscriptions.splice(index, 1)
        return true
      }
    }
    return false
  }
  
  // Queue processing
  private async processQueue(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) {
      return
    }
    
    this.processing = true
    
    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!
        await this.processEvent(event)
      }
    } finally {
      this.processing = false
    }
  }
  
  private async processEvent(event: ProgressEvent): Promise<void> {
    const subscribers = this.subscribers.get(event.eventType) || []
    
    const promises = subscribers.map(async (subscription) => {
      try {
        await subscription.handler(event, subscription.options)
      } catch (error) {
        console.error(`Error in progress event handler:`, error)
        // Could implement retry logic or dead letter queue here
      }
    })
    
    await Promise.allSettled(promises)
    
    // Mark event as processed
    await this.markEventProcessed(event.id)
  }
}
```

### Database Schema

```sql
-- Progress events table for event sourcing
CREATE TABLE progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'video_completed', 'todo_completed', 'schedule_completed', 
    'milestone_reached', 'skill_assessed', 'path_progress_updated'
  )),
  source_system VARCHAR(30) NOT NULL CHECK (source_system IN (
    'video_player', 'todo_manager', 'calendar_service', 
    'ai_journey', 'learning_path_generator', 'chat_system'
  )),
  event_data JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  processing_errors JSONB DEFAULT '[]'::jsonb,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress conflicts table
CREATE TABLE progress_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  conflict_type VARCHAR(30) NOT NULL CHECK (conflict_type IN (
    'timestamp_mismatch', 'completion_status_conflict', 
    'duplicate_event', 'data_inconsistency'
  )),
  conflicting_event_ids UUID[] NOT NULL,
  suggested_resolution JSONB NOT NULL,
  actual_resolution JSONB,
  resolved_at TIMESTAMPTZ,
  requires_user_input BOOLEAN DEFAULT false,
  impact VARCHAR(10) CHECK (impact IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unified progress view (materialized view for performance)
CREATE TABLE user_progress_summary (
  user_id TEXT PRIMARY KEY,
  total_activities INT DEFAULT 0,
  completed_activities INT DEFAULT 0,
  in_progress_activities INT DEFAULT 0,
  percentage_complete DECIMAL(5,2) DEFAULT 0.00,
  total_time_spent INT DEFAULT 0, -- minutes
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  
  skill_progress JSONB DEFAULT '{}'::jsonb,
  recent_achievements UUID[] DEFAULT '{}',
  current_milestones UUID[] DEFAULT '{}',
  
  last_activity_date TIMESTAMPTZ,
  last_sync_time TIMESTAMPTZ DEFAULT NOW(),
  data_consistency_score DECIMAL(3,2) DEFAULT 1.00,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  achievement_type VARCHAR(20) NOT NULL CHECK (achievement_type IN (
    'completion', 'streak', 'speed', 'consistency', 'milestone'
  )),
  title TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  trigger_event_id UUID REFERENCES progress_events(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System sync status tracking
CREATE TABLE system_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  source_system VARCHAR(30) NOT NULL,
  target_system VARCHAR(30) NOT NULL,
  last_sync_time TIMESTAMPTZ DEFAULT NOW(),
  sync_status VARCHAR(20) DEFAULT 'healthy' CHECK (sync_status IN ('healthy', 'delayed', 'failed', 'conflict')),
  pending_events_count INT DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_system, target_system)
);

-- Indexes for performance
CREATE INDEX progress_events_user_type_idx ON progress_events(user_id, event_type);
CREATE INDEX progress_events_timestamp_idx ON progress_events(timestamp DESC);
CREATE INDEX progress_events_processed_idx ON progress_events(processed, created_at) WHERE processed = false;
CREATE INDEX progress_events_source_idx ON progress_events(source_system);

CREATE INDEX progress_conflicts_user_idx ON progress_conflicts(user_id);
CREATE INDEX progress_conflicts_unresolved_idx ON progress_conflicts(resolved_at) WHERE resolved_at IS NULL;

CREATE INDEX achievements_user_idx ON achievements(user_id);
CREATE INDEX achievements_type_idx ON achievements(achievement_type);
CREATE INDEX achievements_earned_idx ON achievements(earned_at DESC);

CREATE INDEX system_sync_status_user_idx ON system_sync_status(user_id);
CREATE INDEX system_sync_status_health_idx ON system_sync_status(sync_status, last_sync_time);

-- Row Level Security
ALTER TABLE progress_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_sync_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own progress events" ON progress_events
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view their own conflicts" ON progress_conflicts
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view their own progress summary" ON user_progress_summary
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view their own achievements" ON achievements
  FOR SELECT USING (user_id = auth.uid()::text OR is_public = true);

CREATE POLICY "Users can view their own sync status" ON system_sync_status
  FOR ALL USING (user_id = auth.uid()::text);
```

---

## API Endpoints

**Base Route**: `/api/progress-sync`

```typescript
// POST /api/progress-sync/events - Submit progress event
interface SubmitProgressEventBody {
  eventType: string
  sourceSystem: string
  eventData: ProgressEventData
}

// GET /api/progress-sync/summary - Get unified progress view
// Returns: UnifiedProgressView

// GET /api/progress-sync/conflicts - Get unresolved conflicts
interface GetConflictsQuery {
  status?: 'unresolved' | 'resolved' | 'all'
  impact?: 'low' | 'medium' | 'high'
  conflictType?: string
}

// POST /api/progress-sync/conflicts/[id]/resolve - Resolve conflict
interface ResolveConflictBody {
  resolutionType: 'use_latest' | 'use_most_complete' | 'merge_data' | 'manual_review'
  userData?: any // For manual resolution
}

// GET /api/progress-sync/achievements - Get user achievements
interface GetAchievementsQuery {
  type?: string[]
  startDate?: string
  endDate?: string
  includePublic?: boolean
}

// GET /api/progress-sync/health - Get sync health metrics
// Returns: SystemHealthMetrics

// POST /api/progress-sync/repair - Repair data inconsistencies
interface RepairDataBody {
  inconsistencyTypes: string[]
  autoRepair?: boolean
  dryRun?: boolean
}

// WebSocket endpoint for real-time progress updates
// WS /api/progress-sync/live
interface ProgressUpdateMessage {
  type: 'progress_update' | 'achievement_earned' | 'conflict_detected'
  userId: string
  data: any
}
```

---

## Implementation Plan

### Phase 1: Core Event System (2 hours)
1. **Build event infrastructure**:
   - Create progress event models and types
   - Implement event bus with pub/sub
   - Set up database schema for events
   - Create event validation and persistence

2. **Basic sync functionality**:
   - Implement core ProgressSyncService
   - Add event processing pipeline
   - Create conflict detection logic
   - Set up basic progress aggregation

### Phase 2: System Integration (2 hours)
1. **Connect with existing systems**:
   - Todo system event publishing
   - Calendar system event handling
   - Video progress event processing
   - AI Journey sync integration

2. **Conflict resolution**:
   - Implement conflict detection algorithms
   - Build automatic resolution strategies
   - Create manual resolution interface
   - Add conflict notification system

### Phase 3: Progress Views and Analytics (1 hour)
1. **Build unified progress view**:
   - Aggregate data from all systems
   - Calculate overall progress metrics
   - Generate learning insights
   - Create achievement tracking

2. **Add real-time features**:
   - WebSocket progress updates
   - Live conflict notifications
   - Real-time achievement notifications

### Phase 4: API and Health Monitoring (1 hour)
1. **Complete API endpoints**:
   - All progress sync endpoints
   - Conflict resolution endpoints
   - Health and monitoring endpoints
   - Real-time WebSocket handlers

2. **System health monitoring**:
   - Sync status tracking
   - Performance monitoring
   - Error reporting and recovery
   - Data consistency validation

---

## Testing Strategy

### Unit Tests
```typescript
describe('ProgressSyncService', () => {
  describe('processProgressEvent', () => {
    it('syncs video completion across systems', async () => {
      const event: ProgressEvent = {
        id: 'event123',
        userId: 'user123',
        eventType: 'video_completed',
        sourceSystem: 'video_player',
        eventData: {
          activityId: 'video456',
          activityType: 'video',
          completionStatus: 'completed',
          videoProgress: {
            videoId: 'video456',
            youtubeId: 'abc123',
            percentageWatched: 100,
            timeWatched: 600,
            completedAt: new Date()
          }
        },
        timestamp: new Date(),
        processed: false
      }
      
      const result = await progressSync.processProgressEvent(event)
      
      expect(result.syncedSystems).toContain('todo_manager')
      expect(result.syncedSystems).toContain('calendar_service')
      expect(result.syncedSystems).toContain('ai_journey')
      expect(result.achievements.length).toBeGreaterThanOrEqual(0)
    })
    
    it('detects and resolves timestamp conflicts', async () => {
      const existingEvent = {
        eventType: 'todo_completed',
        eventData: { activityId: 'todo123', completedAt: new Date('2024-01-15T10:00:00Z') }
      }
      
      const newEvent = {
        eventType: 'schedule_completed', 
        eventData: { activityId: 'todo123', completedAt: new Date('2024-01-15T10:30:00Z') }
      }
      
      const conflicts = await progressSync.detectConflicts(newEvent, [existingEvent])
      
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].conflictType).toBe('timestamp_mismatch')
      expect(conflicts[0].suggestedResolution.resolutionType).toBe('use_latest')
    })
  })
  
  describe('getUnifiedProgressView', () => {
    it('aggregates progress from all systems correctly', async () => {
      const progressView = await progressSync.getUnifiedProgressView('user123')
      
      expect(progressView.overallProgress.percentageComplete).toBeLessThanOrEqual(100)
      expect(progressView.skillProgress).toBeDefined()
      expect(progressView.dataConsistencyScore).toBeGreaterThan(0)
    })
  })
})
```

### Integration Tests
```typescript
describe('Progress Sync Integration', () => {
  it('maintains consistency across video, todo, and calendar systems', async () => {
    // Complete a video
    await videoService.markVideoComplete('user123', 'video456')
    
    // Verify todo is updated
    const relatedTodos = await todoService.getTodos('user123', { 
      videoReferences: ['video456'] 
    })
    expect(relatedTodos.some(t => t.status === 'completed')).toBe(true)
    
    // Verify calendar is updated
    const scheduleEntries = await calendarService.getSchedule('user123', startDate, endDate)
    const videoSchedule = scheduleEntries.find(s => s.videoId === 'video456')
    expect(videoSchedule?.completed).toBe(true)
    
    // Verify unified progress
    const progressView = await progressSync.getUnifiedProgressView('user123')
    expect(progressView.overallProgress.completedActivities).toBeGreaterThan(0)
  })
})
```

---

## Success Criteria

### Functional Requirements
- [ ] Real-time sync across all systems (< 5s delay)
- [ ] Conflict detection accuracy > 95%
- [ ] Data consistency maintained across systems
- [ ] Achievement tracking works correctly
- [ ] Progress aggregation is accurate
- [ ] System handles 1000+ concurrent users

### Performance Requirements
- [ ] Event processing < 500ms per event
- [ ] Progress view generation < 1s
- [ ] WebSocket updates < 100ms latency
- [ ] Conflict resolution < 2s
- [ ] Data consistency checks < 30s

### Quality Requirements
- [ ] Zero data loss during sync operations
- [ ] Graceful handling of system downtime
- [ ] Comprehensive error logging and recovery
- [ ] Automatic conflict resolution > 80%
- [ ] User notification system works reliably

---

## Dependencies

### Required Before Starting
- [ ] Tasks 03A-01, 03A-02, 03A-03 completed for system integration
- [ ] AI Journey system interfaces documented
- [ ] Video progress tracking system understood
- [ ] Event-driven architecture pattern agreed upon

### Integration Dependencies
- [ ] All other systems must emit progress events
- [ ] WebSocket infrastructure for real-time updates
- [ ] Notification system for conflict alerts
- [ ] Achievement/badge system requirements defined

---

**This creates the nervous system of the learning platform** - ensuring all progress data stays perfectly synchronized and users have a unified, consistent experience.

---

*Task created by: Senior Developer*  
*Estimated completion: 5-6 hours*  
*Completes Phase 3A foundation*