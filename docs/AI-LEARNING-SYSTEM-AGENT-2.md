# Agent 2: Service Builder
> Integration Services for AI-Powered Learning System
> **Agent Role**: Backend Service Architecture & Implementation
> **Time Allocation**: 3 hours
> **Dependencies**: Will use types from Agent 1 (can start with interfaces)

---

## 🎯 Mission Statement

You are responsible for building the core integration services that connect the Blox Wizard transcript system with the Todo/Calendar system. Focus on creating robust service architectures with clear interfaces, even if full implementation waits for types from Agent 1.

---

## 📋 Task List

### Task 2.1: TodoVideoLinker Service (1 hour)
**File**: `src/services/integration/todo-video-linker.ts`

Build the service that creates bidirectional links between todos and videos:

```typescript
import { createClient } from '@/lib/supabase/client'
import type { 
  UnifiedVideoReference, 
  TodoVideoLink,
  Todo 
} from '@/types/shared'

export class TodoVideoLinker {
  private supabase = createClient()

  /**
   * Links a todo to specific video segments
   * Creates a many-to-many relationship with timestamps
   */
  async linkTodoToVideo(
    todoId: string,
    videoReference: UnifiedVideoReference,
    linkType: 'reference' | 'requirement' | 'output' = 'reference'
  ): Promise<TodoVideoLink> {
    try {
      // Validate todo exists
      const { data: todo, error: todoError } = await this.supabase
        .from('todos')
        .select('id, video_references')
        .eq('id', todoId)
        .single()

      if (todoError) throw new Error(`Todo not found: ${todoId}`)

      // Create link record
      const linkData = {
        todo_id: todoId,
        video_id: videoReference.videoId,
        youtube_id: videoReference.youtubeId,
        timestamp_start: videoReference.timestamp,
        relevance_score: videoReference.confidence,
        link_type: linkType,
        created_by: 'system'
      }

      const { data: link, error: linkError } = await this.supabase
        .from('todo_video_links')
        .insert(linkData)
        .select()
        .single()

      if (linkError) throw linkError

      // Update todo's video_references array
      const updatedRefs = [
        ...(todo.video_references || []),
        videoReference
      ]

      await this.supabase
        .from('todos')
        .update({ video_references: updatedRefs })
        .eq('id', todoId)

      return {
        id: link.id,
        todoId,
        videoReference,
        linkType,
        addedAt: link.created_at,
        addedBy: link.created_by
      }
    } catch (error) {
      console.error('Error linking todo to video:', error)
      throw error
    }
  }

  /**
   * Gets all todos related to a specific video
   * Optionally filters by timestamp range
   */
  async getTodosForVideo(
    youtubeId: string,
    timestamp?: string
  ): Promise<Todo[]> {
    try {
      let query = this.supabase
        .from('todo_video_links')
        .select(`
          todo_id,
          timestamp_start,
          timestamp_end,
          todos (*)
        `)
        .eq('youtube_id', youtubeId)

      // If timestamp provided, find todos relevant to that time
      if (timestamp) {
        const seconds = this.timestampToSeconds(timestamp)
        // This would need more complex logic for timestamp ranges
        // For now, return all todos for the video
      }

      const { data, error } = await query

      if (error) throw error

      return data?.map(item => item.todos).filter(Boolean) || []
    } catch (error) {
      console.error('Error getting todos for video:', error)
      return []
    }
  }

  /**
   * Gets all videos linked to a specific todo
   */
  async getVideosForTodo(todoId: string): Promise<UnifiedVideoReference[]> {
    try {
      const { data: links, error } = await this.supabase
        .from('todo_video_links')
        .select('*')
        .eq('todo_id', todoId)

      if (error) throw error

      return links?.map(link => ({
        videoId: link.video_id,
        youtubeId: link.youtube_id,
        title: '', // Would need to fetch from transcripts table
        thumbnailUrl: `https://img.youtube.com/vi/${link.youtube_id}/maxresdefault.jpg`,
        timestamp: link.timestamp_start,
        confidence: link.relevance_score
      })) || []
    } catch (error) {
      console.error('Error getting videos for todo:', error)
      return []
    }
  }

  /**
   * Syncs video watch progress with todo completion
   */
  async syncWatchProgress(
    userId: string,
    youtubeId: string,
    progress: number
  ): Promise<void> {
    try {
      // Update or create progress record
      const { error: progressError } = await this.supabase
        .from('video_progress')
        .upsert({
          user_id: userId,
          youtube_id: youtubeId,
          watch_progress: progress,
          completed: progress >= 90,
          completed_at: progress >= 90 ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,youtube_id'
        })

      if (progressError) throw progressError

      // If video is mostly complete, check for related todos
      if (progress >= 90) {
        await this.autoCompleteTodos(userId, youtubeId)
      }

      // Emit progress event for other systems
      await this.emitProgressEvent({
        type: 'video_watched',
        userId,
        timestamp: new Date().toISOString(),
        source: 'video_player',
        data: { youtubeId, progress },
        relatedEntities: { videoIds: [youtubeId] }
      })
    } catch (error) {
      console.error('Error syncing watch progress:', error)
    }
  }

  /**
   * Auto-completes todos when video is watched
   */
  private async autoCompleteTodos(
    userId: string,
    youtubeId: string
  ): Promise<void> {
    // Get todos linked to this video that are marked for auto-completion
    const todos = await this.getTodosForVideo(youtubeId)
    
    for (const todo of todos) {
      if (todo.metadata?.autoCompleteOnVideoWatch && 
          todo.status !== 'completed' &&
          todo.userId === userId) {
        await this.supabase
          .from('todos')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            actual_minutes: todo.estimatedMinutes
          })
          .eq('id', todo.id)
      }
    }
  }

  /**
   * Utility: Convert timestamp to seconds
   */
  private timestampToSeconds(timestamp: string): number {
    const parts = timestamp.split(':').map(Number)
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return 0
  }

  /**
   * Emit progress event for system-wide sync
   */
  private async emitProgressEvent(event: any): Promise<void> {
    await this.supabase
      .from('progress_sync_log')
      .insert({
        event_type: event.type,
        user_id: event.userId,
        event_data: event,
        source_system: 'todo_video_linker',
        processed: false
      })
  }
}

// Export singleton instance
export const todoVideoLinker = new TodoVideoLinker()
```

### Task 2.2: SmartTodoGenerator Service (1 hour)
**File**: `src/services/integration/smart-todo-generator.ts`

AI-powered service that generates todos from video transcripts:

```typescript
import OpenAI from 'openai'
import type { 
  TodoSuggestion, 
  UnifiedVideoReference,
  Todo 
} from '@/types/shared'

export class SmartTodoGenerator {
  private openai: OpenAI
  private supabase = createClient()

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  /**
   * Generates todo suggestions from transcript chunks
   */
  async generateTodosFromTranscript(
    transcriptChunks: any[],
    userLevel: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<TodoSuggestion[]> {
    try {
      // Analyze transcript for actionable content
      const analysis = await this.analyzeTranscriptForTasks(
        transcriptChunks,
        userLevel
      )

      // Generate todo suggestions
      const suggestions: TodoSuggestion[] = []

      for (const task of analysis.tasks) {
        suggestions.push({
          title: task.title,
          description: task.description,
          priority: this.determinePriority(task),
          category: this.categorizeTask(task),
          estimatedMinutes: task.estimatedMinutes || 30,
          videoReferences: [{
            videoId: transcriptChunks[0].video_id,
            youtubeId: transcriptChunks[0].youtube_id,
            title: transcriptChunks[0].title,
            thumbnailUrl: `https://img.youtube.com/vi/${transcriptChunks[0].youtube_id}/maxresdefault.jpg`,
            timestamp: task.relevantTimestamp
          }],
          suggestedDueDate: this.calculateDueDate(task.urgency),
          prerequisites: task.prerequisites || [],
          learningObjectives: task.objectives || [],
          autoGenerated: true,
          confidence: task.confidence || 0.8
        })
      }

      return suggestions
    } catch (error) {
      console.error('Error generating todos from transcript:', error)
      return []
    }
  }

  /**
   * Creates practice exercises based on video concepts
   */
  async createPracticeExercises(
    videoId: string,
    concepts: string[]
  ): Promise<Todo[]> {
    try {
      const exercises: Todo[] = []

      for (const concept of concepts) {
        const prompt = `
          Create a practice exercise for learning: ${concept}
          Target audience: Young Roblox developers (10-25 years)
          Format: Actionable todo task
          Include: Clear steps, expected outcome, time estimate
        `

        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Roblox development instructor creating practice exercises.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })

        const exercise = this.parseExerciseResponse(
          response.choices[0].message.content || ''
        )

        exercises.push({
          id: crypto.randomUUID(),
          userId: '', // Will be set when created
          title: exercise.title,
          description: exercise.description,
          status: 'pending',
          priority: 'medium',
          category: 'practice',
          videoReferences: [{
            videoId,
            youtubeId: videoId,
            title: concept,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          }],
          tags: ['practice', 'auto-generated', concept],
          estimatedMinutes: exercise.estimatedMinutes,
          generatedFrom: 'ai',
          metadata: {
            concept,
            difficulty: exercise.difficulty,
            learningObjectives: exercise.objectives
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Todo)
      }

      return exercises
    } catch (error) {
      console.error('Error creating practice exercises:', error)
      return []
    }
  }

  /**
   * Generates milestone todos for a learning path
   */
  async generateMilestones(learningPath: any): Promise<Todo[]> {
    const milestones: Todo[] = []

    // Create milestone every 5 videos or at key concepts
    let videoCount = 0
    let currentMilestone: string[] = []

    for (const segment of learningPath.segments) {
      currentMilestone.push(segment.title)
      videoCount++

      if (videoCount % 5 === 0 || segment.type === 'project') {
        milestones.push({
          id: crypto.randomUUID(),
          userId: learningPath.userId,
          title: `Milestone: Complete ${currentMilestone[0]} to ${currentMilestone[currentMilestone.length - 1]}`,
          description: `Complete all learning objectives for: ${currentMilestone.join(', ')}`,
          status: 'pending',
          priority: 'high',
          category: 'milestone',
          videoReferences: segment.videoReferences,
          tags: ['milestone', 'learning-path'],
          estimatedMinutes: 15, // Time for review/reflection
          metadata: {
            pathId: learningPath.id,
            segmentIds: currentMilestone,
            videoCount
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Todo)

        currentMilestone = []
      }
    }

    return milestones
  }

  /**
   * Analyzes transcript text for actionable tasks
   */
  private async analyzeTranscriptForTasks(
    chunks: any[],
    userLevel: string
  ): Promise<any> {
    const combinedText = chunks.map(c => c.chunk_text).join(' ')
    
    const prompt = `
      Analyze this Roblox tutorial transcript and identify actionable learning tasks.
      User level: ${userLevel}
      
      Transcript: ${combinedText.substring(0, 2000)}
      
      Return JSON with:
      {
        "tasks": [
          {
            "title": "Clear task title",
            "description": "What to do",
            "estimatedMinutes": 30,
            "urgency": "low|medium|high",
            "prerequisites": [],
            "objectives": [],
            "relevantTimestamp": "MM:SS",
            "confidence": 0.8
          }
        ]
      }
    `

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract actionable tasks from tutorial transcripts. Return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    return JSON.parse(response.choices[0].message.content || '{"tasks":[]}')
  }

  /**
   * Helper: Determine priority based on task analysis
   */
  private determinePriority(task: any): 'low' | 'medium' | 'high' | 'urgent' {
    if (task.urgency === 'high') return 'high'
    if (task.prerequisites?.length > 2) return 'low'
    return 'medium'
  }

  /**
   * Helper: Categorize task type
   */
  private categorizeTask(task: any): string {
    const title = task.title.toLowerCase()
    if (title.includes('practice') || title.includes('try')) return 'practice'
    if (title.includes('learn') || title.includes('understand')) return 'learn'
    if (title.includes('build') || title.includes('create')) return 'build'
    if (title.includes('review') || title.includes('check')) return 'review'
    return 'other'
  }

  /**
   * Helper: Calculate suggested due date
   */
  private calculateDueDate(urgency: string): string {
    const date = new Date()
    switch (urgency) {
      case 'high':
        date.setDate(date.getDate() + 1)
        break
      case 'medium':
        date.setDate(date.getDate() + 3)
        break
      default:
        date.setDate(date.getDate() + 7)
    }
    return date.toISOString()
  }

  /**
   * Helper: Parse exercise response
   */
  private parseExerciseResponse(response: string): any {
    // Parse AI response into structured exercise
    // This would need more sophisticated parsing
    return {
      title: response.split('\n')[0] || 'Practice Exercise',
      description: response,
      estimatedMinutes: 30,
      difficulty: 'medium',
      objectives: []
    }
  }
}

// Export singleton instance
export const smartTodoGenerator = new SmartTodoGenerator()
```

### Task 2.3: LearningPathSync Service (1 hour)
**File**: `src/services/integration/learning-path-sync.ts`

Synchronizes learning paths with video content and calendar:

```typescript
import { createClient } from '@/lib/supabase/client'
import type { 
  LearningPathSegment,
  UnifiedVideoReference,
  CalendarAction 
} from '@/types/shared'

export class LearningPathSync {
  private supabase = createClient()

  /**
   * Creates a learning path from a playlist of videos
   */
  async createPathFromPlaylist(
    videoIds: string[],
    userId: string,
    pathName: string = 'Custom Learning Path'
  ): Promise<any> {
    try {
      // Fetch video details
      const { data: videos, error: videoError } = await this.supabase
        .from('video_transcripts')
        .select('*')
        .in('youtube_id', videoIds)

      if (videoError) throw videoError

      // Create learning path
      const pathData = {
        user_id: userId,
        name: pathName,
        description: `Learning path with ${videoIds.length} videos`,
        total_estimated_hours: this.calculateTotalHours(videos),
        difficulty_level: 'intermediate',
        status: 'active',
        ai_generated: true,
        metadata: {
          videoIds,
          createdFrom: 'playlist'
        }
      }

      const { data: path, error: pathError } = await this.supabase
        .from('learning_paths')
        .insert(pathData)
        .select()
        .single()

      if (pathError) throw pathError

      // Create path segments for each video
      const segments = await this.createSegmentsFromVideos(
        path.id,
        videos
      )

      return {
        ...path,
        segments
      }
    } catch (error) {
      console.error('Error creating path from playlist:', error)
      throw error
    }
  }

  /**
   * Schedules learning sessions on the calendar
   */
  async schedulePathSessions(
    pathId: string,
    preferences: any
  ): Promise<CalendarAction[]> {
    try {
      // Get path details
      const { data: path, error: pathError } = await this.supabase
        .from('learning_paths')
        .select(`
          *,
          learning_path_steps (*)
        `)
        .eq('id', pathId)
        .single()

      if (pathError) throw pathError

      const actions: CalendarAction[] = []
      const startDate = new Date(preferences.startDate || Date.now())
      
      // Schedule each video segment
      path.learning_path_steps.forEach((step: any, index: number) => {
        const sessionDate = new Date(startDate)
        sessionDate.setDate(startDate.getDate() + index * preferences.daysBetweenSessions)

        actions.push({
          type: 'schedule_video',
          title: step.title,
          description: step.description,
          startTime: this.getOptimalTime(sessionDate, preferences),
          duration: step.estimated_minutes,
          videoReference: {
            videoId: step.video_id,
            youtubeId: step.youtube_id,
            title: step.title,
            thumbnailUrl: `https://img.youtube.com/vi/${step.youtube_id}/maxresdefault.jpg`
          },
          relatedTodos: step.todo_ids || []
        })
      })

      // Save schedule to database
      await this.saveScheduleToCalendar(actions, userId)

      return actions
    } catch (error) {
      console.error('Error scheduling path sessions:', error)
      return []
    }
  }

  /**
   * Updates learning progress based on video watch time
   */
  async updateProgressFromVideo(
    userId: string,
    youtubeId: string,
    watchTime: number
  ): Promise<any> {
    try {
      // Find learning paths containing this video
      const { data: paths, error: pathError } = await this.supabase
        .from('learning_path_videos')
        .select(`
          path_id,
          learning_paths (*)
        `)
        .eq('youtube_id', youtubeId)
        .eq('user_id', userId)

      if (pathError) throw pathError

      const updates = []

      for (const pathVideo of paths || []) {
        // Update video completion status
        const { error: updateError } = await this.supabase
          .from('learning_path_videos')
          .update({
            is_completed: watchTime >= 90, // 90% watched = complete
            completed_at: watchTime >= 90 ? new Date().toISOString() : null
          })
          .eq('path_id', pathVideo.path_id)
          .eq('youtube_id', youtubeId)

        if (!updateError) {
          // Recalculate path progress
          const progress = await this.calculatePathProgress(pathVideo.path_id)
          
          await this.supabase
            .from('learning_paths')
            .update({
              progress_percentage: progress,
              updated_at: new Date().toISOString()
            })
            .eq('id', pathVideo.path_id)

          updates.push({
            pathId: pathVideo.path_id,
            progress,
            videoCompleted: watchTime >= 90
          })
        }
      }

      return {
        userId,
        youtubeId,
        watchTime,
        pathsUpdated: updates
      }
    } catch (error) {
      console.error('Error updating progress from video:', error)
      throw error
    }
  }

  /**
   * Gets next recommended video based on progress
   */
  async getNextRecommendedVideo(
    userId: string,
    currentVideoId?: string
  ): Promise<UnifiedVideoReference | null> {
    try {
      // Get active learning paths for user
      const { data: paths, error: pathError } = await this.supabase
        .from('learning_paths')
        .select(`
          *,
          learning_path_videos (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)

      if (pathError || !paths?.length) return null

      const activePath = paths[0]
      
      // Find next incomplete video
      const nextVideo = activePath.learning_path_videos
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .find((v: any) => !v.is_completed)

      if (!nextVideo) return null

      // Get full video details
      const { data: video, error: videoError } = await this.supabase
        .from('video_transcripts')
        .select('*')
        .eq('youtube_id', nextVideo.youtube_id)
        .single()

      if (videoError || !video) return null

      return {
        videoId: video.video_id,
        youtubeId: video.youtube_id,
        title: video.title,
        thumbnailUrl: `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`,
        duration: video.duration_seconds,
        creatorName: video.creator
      }
    } catch (error) {
      console.error('Error getting next video recommendation:', error)
      return null
    }
  }

  /**
   * Helper: Calculate total hours for videos
   */
  private calculateTotalHours(videos: any[]): number {
    const totalSeconds = videos.reduce((sum, v) => sum + (v.duration_seconds || 0), 0)
    return Math.round((totalSeconds / 3600) * 10) / 10 // Round to 1 decimal
  }

  /**
   * Helper: Create learning path segments
   */
  private async createSegmentsFromVideos(pathId: string, videos: any[]): Promise<any[]> {
    const segments = videos.map((video, index) => ({
      learning_path_id: pathId,
      step_order: index + 1,
      title: video.title,
      description: `Learn from: ${video.title}`,
      type: 'video',
      video_id: video.video_id,
      youtube_id: video.youtube_id,
      estimated_minutes: Math.round(video.duration_seconds / 60),
      is_required: true,
      metadata: {
        creator: video.creator,
        originalIndex: index
      }
    }))

    const { data, error } = await this.supabase
      .from('learning_path_steps')
      .insert(segments)
      .select()

    return data || []
  }

  /**
   * Helper: Get optimal scheduling time
   */
  private getOptimalTime(date: Date, preferences: any): string {
    const optimal = new Date(date)
    optimal.setHours(preferences.preferredHour || 15) // 3 PM default
    optimal.setMinutes(0)
    optimal.setSeconds(0)
    return optimal.toISOString()
  }

  /**
   * Helper: Save schedule to calendar
   */
  private async saveScheduleToCalendar(actions: CalendarAction[], userId: string): Promise<void> {
    for (const action of actions) {
      await this.supabase
        .from('ai_journey_schedule')
        .insert({
          journey_id: crypto.randomUUID(),
          scheduled_date: action.startTime,
          duration_minutes: action.duration,
          activity_type: 'video_learning',
          activity_data: action,
          created_at: new Date().toISOString()
        })
    }
  }

  /**
   * Helper: Calculate path completion percentage
   */
  private async calculatePathProgress(pathId: string): Promise<number> {
    const { data: videos, error } = await this.supabase
      .from('learning_path_videos')
      .select('is_completed')
      .eq('path_id', pathId)

    if (error || !videos?.length) return 0

    const completed = videos.filter(v => v.is_completed).length
    return Math.round((completed / videos.length) * 100)
  }
}

// Export singleton instance
export const learningPathSync = new LearningPathSync()
```

---

## 📁 File Structure You'll Create

```
src/
├── services/
│   ├── integration/
│   │   ├── todo-video-linker.ts      ✨ NEW (Task 2.1)
│   │   ├── smart-todo-generator.ts   ✨ NEW (Task 2.2)
│   │   └── learning-path-sync.ts     ✨ NEW (Task 2.3)
│   └── index.ts                       📝 UPDATE - Export all services
```

---

## ✅ Success Criteria

Your services are complete when:

1. **All three services are implemented** with core methods
2. **Error handling is robust** with try/catch blocks
3. **Database operations work** with Supabase
4. **AI integration functions** with OpenAI
5. **Type safety is maintained** (may have some `any` until Agent 1 completes)
6. **Services are exportable** as singleton instances

---

## 🔄 Coordination Points

### Checkpoint 1 (45 minutes)
Confirm service interfaces with Agent 1's types

### Checkpoint 2 (1.5 hours)
Share service methods with Agent 3 for UI integration

### Checkpoint 3 (2.5 hours)
Validate with Agent 4 for testing requirements

### Final (3 hours)
Complete implementations with proper types

---

## 📝 Implementation Notes

### Database Tables You'll Use:
- `todos` - Main todo storage
- `todo_video_links` - Junction table for relationships
- `video_transcripts` - Video metadata
- `transcript_chunks` - For AI analysis
- `learning_paths` - Path definitions
- `learning_path_steps` - Individual segments
- `ai_journey_schedule` - Calendar events
- `video_progress` - Watch tracking
- `progress_sync_log` - Event logging

### Environment Variables Needed:
```env
OPENAI_API_KEY=your-key-here
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### Key Dependencies:
```typescript
import { createClient } from '@/lib/supabase/client'
import OpenAI from 'openai'
```

---

## 🚀 Getting Started

1. Create the `src/services/integration/` directory
2. Start with TodoVideoLinker (most straightforward)
3. Move to SmartTodoGenerator (needs OpenAI)
4. Finish with LearningPathSync (most complex)
5. Create index.ts to export all services

---

## ⚠️ Important Notes

- **Start with interfaces** even without final types
- **Use `any` temporarily** where types aren't ready
- **Focus on structure** over full implementation
- **Document all methods** with JSDoc
- **Handle errors gracefully**
- **Make services singleton** for consistency

---

## 🎯 Deliverables Checklist

- [ ] `todo-video-linker.ts` created with all methods
- [ ] `smart-todo-generator.ts` with AI integration
- [ ] `learning-path-sync.ts` with calendar scheduling
- [ ] All services exported from index.ts
- [ ] Basic error handling in place
- [ ] Database queries structured
- [ ] Coordination checkpoints completed

---

**Agent 2 Ready to Deploy!**
Focus on architecture and interfaces first, implementation details can be refined once types are available from Agent 1.