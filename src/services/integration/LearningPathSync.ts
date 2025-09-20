/**
 * LearningPathSync Service
 * 
 * Synchronizes learning paths between video playlists, todos, and calendar
 * Core service for the AI-Powered Learning System integration
 */

import { supabase } from '../../lib/supabase/client'
import { 
  UnifiedVideoReference, 
  LearningPathSegment,
  CalendarAction,
  ServiceResponse,
  ProgressSyncEvent 
} from '../../types/shared'
import { Todo } from '../../types/todo'

export class LearningPathSync {

  /**
   * Create a learning path from a series of video references
   */
  async createLearningPath(
    userId: string,
    title: string,
    videoReferences: UnifiedVideoReference[],
    objectives: string[] = [],
    description?: string
  ): Promise<ServiceResponse<string>> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Create the learning path record
      const { data: pathRecord, error: pathError } = await (supabase as any)
        .from('learning_paths')
        .insert({
          user_id: userId,
          name: title,
          description,
          total_estimated_hours: this.calculateEstimatedHours(videoReferences),
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (pathError) throw pathError

      // Create learning path segments
      const segments: LearningPathSegment[] = videoReferences.map((video, index) => ({
        id: `segment_${pathRecord.id}_${index}`,
        order: index + 1,
        title: video.title,
        description: video.relevantSegment || `Watch: ${video.title}`,
        type: 'video',
        estimatedMinutes: Math.floor((video.duration || 1200) / 60), // Convert to minutes
        videoReferences: [video],
        prerequisites: index === 0 ? [] : [`segment_${pathRecord.id}_${index - 1}`],
        objectives: video.learningObjectives || objectives.slice(index * 2, (index + 1) * 2),
        completed: false
      }))

      // Store segments in database
      const segmentRecords = segments.map(segment => ({
        learning_path_id: pathRecord.id,
        step_order: segment.order,
        step_type: 'video',
        title: segment.title,
        description: segment.description,
        estimated_minutes: segment.estimatedMinutes,
        video_references: segment.videoReferences as any,
        status: 'pending',
        created_at: new Date().toISOString()
      }))

      const { error: segmentsError } = await supabase
        .from('learning_path_steps')
        .insert(segmentRecords)

      if (segmentsError) throw segmentsError

      // Generate todos for each segment
      await this.generatePathTodos(userId, pathRecord.id, segments)

      return {
        success: true,
        data: pathRecord.id,
        timestamp: new Date().toISOString(),
        source: 'LearningPathSync'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create learning path',
        timestamp: new Date().toISOString(),
        source: 'LearningPathSync'
      }
    }
  }

  /**
   * Sync learning path progress with video watching and todo completion
   */
  async syncProgress(
    userId: string,
    pathId: string,
    progressEvent: ProgressSyncEvent
  ): Promise<ServiceResponse<void>> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Get current path status
      const { data: pathSteps, error: pathError } = await supabase
        .from('learning_path_steps')
        .select('*')
        .eq('learning_path_id', pathId)
        .order('step_order')

      if (pathError) throw pathError

      let updatedSegments = 0

      if (progressEvent.type === 'video_watched') {
        // Update video completion in path
        const videoSegment = pathSteps.find(
          v => {
            const videoRefs = Array.isArray(v.video_references) ? v.video_references : []
            return videoRefs.some((ref: any) => ref.youtubeId === progressEvent.data.youtubeId)
          }
        )

        if (videoSegment && progressEvent.data.watchedSeconds >= progressEvent.data.totalSeconds * 0.8) {
          await supabase
            .from('learning_path_steps')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', videoSegment.id)

          updatedSegments = 1
        }
      }

      if (progressEvent.type === 'todo_completed') {
        // Check if completed todo is linked to this path
        const { data: pathTodos, error: todosError } = await supabase
          .from('todos')
          .select('id, video_references')
          .eq('user_id', userId)
          .contains('metadata', { learningPathId: pathId })

        if (todosError) throw todosError

        const completedTodo = pathTodos.find(t => t.id === progressEvent.data.todoId)
        const videoReferences = Array.isArray(completedTodo?.video_references) ? completedTodo.video_references : []
        if (videoReferences.length) {
          // Mark associated videos as completed
          for (const videoRef of videoReferences) {
            const stepToUpdate = pathSteps.find(step => {
              const videoRefs = Array.isArray(step.video_references) ? step.video_references : []
              return videoRefs.some((ref: any) => ref.youtubeId === (videoRef as any)?.youtubeId)
            })

            if (stepToUpdate) {
              await supabase
                .from('learning_path_steps')
                .update({
                  status: 'completed',
                  completed_at: new Date().toISOString()
                })
                .eq('id', stepToUpdate.id)

              updatedSegments++
            }
          }
        }
      }

      // Update overall path completion
      if (updatedSegments > 0) {
        const completedCount = pathSteps.filter(s => s.status === 'completed' || s.completed_at !== null).length + updatedSegments
        const progressPercentage = (completedCount / pathSteps.length) * 100

        await supabase
          .from('learning_paths')
          .update({
            progress_percentage: progressPercentage,
            status: progressPercentage >= 100 ? 'completed' : 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', pathId)

        // Unlock next segment if prerequisites are met
        await this.checkAndUnlockNextSegments(pathId, completedCount)
      }

      return {
        success: true,
        timestamp: new Date().toISOString(),
        source: 'LearningPathSync'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync learning path progress',
        timestamp: new Date().toISOString(),
        source: 'LearningPathSync'
      }
    }
  }

  /**
   * Generate calendar scheduling suggestions for learning path
   */
  async generateSchedulingSuggestions(
    userId: string,
    pathId: string,
    preferences: {
      sessionsPerWeek?: number;
      sessionDuration?: number; // minutes
      preferredTimes?: string[]; // ['morning', 'afternoon', 'evening']
      startDate?: string;
    } = {}
  ): Promise<ServiceResponse<CalendarAction[]>> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Get path steps that aren't completed
      const { data: pathSteps, error: pathError } = await supabase
        .from('learning_path_steps')
        .select('*')
        .eq('learning_path_id', pathId)
        .not('status', 'eq', 'completed')
        .order('step_order')

      if (pathError) throw pathError

      const {
        sessionsPerWeek = 3,
        sessionDuration = 60,
        preferredTimes = ['evening'],
        startDate = new Date().toISOString()
      } = preferences

      const calendarActions: CalendarAction[] = []
      const start = new Date(startDate)

      // Schedule steps across the weeks
      pathSteps.forEach((step, index) => {
        const sessionIndex = index % sessionsPerWeek
        const weekOffset = Math.floor(index / sessionsPerWeek)

        // Calculate session date
        const sessionDate = new Date(start)
        sessionDate.setDate(start.getDate() + (weekOffset * 7) + this.getPreferredDayOffset(sessionIndex, sessionsPerWeek))

        // Set preferred time
        const timeSlot = preferredTimes[sessionIndex % preferredTimes.length]
        this.setPreferredTime(sessionDate, timeSlot)

        const endTime = new Date(sessionDate)
        endTime.setMinutes(sessionDate.getMinutes() + sessionDuration)

        // Extract video reference from step
        const videoRefs = Array.isArray(step.video_references) ? step.video_references : []
        const firstVideoRef = (videoRefs[0] as any) || {}

        calendarActions.push({
          type: 'schedule_video',
          title: `Learning Path: ${step.title}`,
          description: step.description || `Watch and practice video in learning path`,
          startTime: sessionDate.toISOString(),
          endTime: endTime.toISOString(),
          duration: sessionDuration,
          videoReference: {
            videoId: firstVideoRef.videoId || '',
            youtubeId: firstVideoRef.youtubeId || '',
            title: step.title || `Learning Path Step ${step.step_order}`,
            thumbnailUrl: firstVideoRef.youtubeId ? `https://img.youtube.com/vi/${firstVideoRef.youtubeId}/maxresdefault.jpg` : ''
          },
          relatedTodos: [] // Would be populated with generated todos
        })
      })

      return {
        success: true,
        data: calendarActions,
        timestamp: new Date().toISOString(),
        source: 'LearningPathSync'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate scheduling suggestions',
        timestamp: new Date().toISOString(),
        source: 'LearningPathSync'
      }
    }
  }

  /**
   * Get learning path progress and analytics
   */
  async getPathProgress(
    userId: string,
    pathId: string
  ): Promise<ServiceResponse<{
    pathInfo: any;
    completionPercentage: number;
    currentSegment: any;
    nextMilestone: any;
    estimatedCompletion: string;
  }>> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Get path info
      const { data: pathInfo, error: pathError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', pathId)
        .eq('user_id', userId)
        .single()

      if (pathError) throw pathError

      // Get step progress
      const { data: steps, error: stepsError } = await supabase
        .from('learning_path_steps')
        .select('*')
        .eq('learning_path_id', pathId)
        .order('step_order')

      if (stepsError) throw stepsError

      const completedSteps = steps.filter(s => s.status === 'completed' || s.completed_at !== null)
      const completionPercentage = (completedSteps.length / steps.length) * 100
      const currentSegment = steps.find(s => s.status !== 'completed' && s.completed_at === null)
      
      // Calculate estimated completion based on current pace
      const estimatedCompletion = this.calculateEstimatedCompletion(
        steps.length - completedSteps.length,
        pathInfo.total_estimated_hours || 0
      )

      const nextMilestone = this.getNextMilestone(completionPercentage)

      return {
        success: true,
        data: {
          pathInfo,
          completionPercentage,
          currentSegment,
          nextMilestone,
          estimatedCompletion
        },
        timestamp: new Date().toISOString(),
        source: 'LearningPathSync'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get path progress',
        timestamp: new Date().toISOString(),
        source: 'LearningPathSync'
      }
    }
  }

  /**
   * Generate todos for each learning path segment
   */
  private async generatePathTodos(
    userId: string,
    pathId: string,
    segments: LearningPathSegment[]
  ): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const todoRecords = segments.map((segment, index) => ({
        user_id: userId,
        title: `Complete: ${segment.title}`,
        description: `Watch video and complete practice exercises`,
        status: 'pending' as const,
        priority: 'medium' as const,
        category: 'learn',
        due_date: this.calculateDueDate(index * 2), // Spread over time
        video_references: segment.videoReferences as any,
        tags: ['learning-path', pathId],
        estimated_minutes: segment.estimatedMinutes,
        metadata: {
          learningPathId: pathId,
          segmentId: segment.id,
          segmentOrder: segment.order
        } as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      await supabase
        .from('todos')
        .insert(todoRecords)
    } catch (error) {
      console.warn('Failed to generate path todos:', error)
    }
  }

  /**
   * Calculate estimated hours for video sequence
   */
  private calculateEstimatedHours(videoReferences: UnifiedVideoReference[]): number {
    const totalMinutes = videoReferences.reduce((sum, video) => {
      return sum + Math.floor((video.duration || 1200) / 60) // Default 20 minutes if not specified
    }, 0)
    
    // Add practice time (roughly 1.5x watch time)
    return Math.round((totalMinutes * 1.5) / 60)
  }

  /**
   * Calculate due date for todos
   */
  private calculateDueDate(daysFromNow: number): string {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date.toISOString()
  }

  /**
   * Check and unlock next segments based on prerequisites
   */
  private async checkAndUnlockNextSegments(pathId: string, completedCount: number): Promise<void> {
    // Implementation would check prerequisites and enable next segments
    // For now, segments are unlocked sequentially
    console.log(`Unlocking segments after ${completedCount} completions for path ${pathId}`)
  }

  /**
   * Get preferred day offset for scheduling
   */
  private getPreferredDayOffset(sessionIndex: number, sessionsPerWeek: number): number {
    // Spread sessions across week (e.g., Mon, Wed, Fri for 3 sessions/week)
    const daySpacing = Math.floor(7 / sessionsPerWeek)
    return sessionIndex * daySpacing
  }

  /**
   * Set preferred time of day for scheduling
   */
  private setPreferredTime(date: Date, timeSlot: string): void {
    switch (timeSlot) {
      case 'morning':
        date.setHours(9, 0, 0, 0)
        break
      case 'afternoon':
        date.setHours(14, 0, 0, 0)
        break
      case 'evening':
        date.setHours(19, 0, 0, 0)
        break
      default:
        date.setHours(19, 0, 0, 0)
    }
  }

  /**
   * Calculate estimated completion date
   */
  private calculateEstimatedCompletion(remainingSegments: number, estimatedHours: number): string {
    const averageHoursPerWeek = 3 // Assumption
    const weeksRemaining = Math.ceil((remainingSegments * estimatedHours) / averageHoursPerWeek)
    
    const completionDate = new Date()
    completionDate.setDate(completionDate.getDate() + (weeksRemaining * 7))
    return completionDate.toISOString()
  }

  /**
   * Get next milestone based on completion percentage
   */
  private getNextMilestone(completionPercentage: number): { milestone: string; target: number } {
    const milestones = [
      { milestone: '25% Complete', target: 25 },
      { milestone: '50% Complete', target: 50 },
      { milestone: '75% Complete', target: 75 },
      { milestone: '100% Complete', target: 100 }
    ]

    return milestones.find(m => m.target > completionPercentage) || milestones[milestones.length - 1]
  }
}