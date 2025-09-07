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
      // Create the learning path record
      const { data: pathRecord, error: pathError } = await supabase
        .from('learning_paths')
        .insert({
          user_id: userId,
          title,
          description,
          total_videos: videoReferences.length,
          completed_videos: 0,
          estimated_hours: this.calculateEstimatedHours(videoReferences),
          created_from: 'manual',
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
        path_id: pathRecord.id,
        video_id: segment.videoReferences[0].videoId,
        youtube_id: segment.videoReferences[0].youtubeId,
        order_index: segment.order,
        is_required: true,
        is_completed: false,
        created_at: new Date().toISOString()
      }))

      const { error: segmentsError } = await supabase
        .from('learning_path_videos')
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
      // Get current path status
      const { data: pathVideos, error: pathError } = await supabase
        .from('learning_path_videos')
        .select('*')
        .eq('path_id', pathId)
        .order('order_index')

      if (pathError) throw pathError

      let updatedSegments = 0

      if (progressEvent.type === 'video_watched') {
        // Update video completion in path
        const videoSegment = pathVideos.find(
          v => v.youtube_id === progressEvent.data.youtubeId
        )

        if (videoSegment && progressEvent.data.watchedSeconds >= progressEvent.data.totalSeconds * 0.8) {
          await supabase
            .from('learning_path_videos')
            .update({
              is_completed: true,
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
        if (completedTodo?.video_references?.length) {
          // Mark associated videos as completed
          for (const videoRef of completedTodo.video_references) {
            await supabase
              .from('learning_path_videos')
              .update({
                is_completed: true,
                completed_at: new Date().toISOString()
              })
              .eq('path_id', pathId)
              .eq('youtube_id', videoRef.youtubeId)

            updatedSegments++
          }
        }
      }

      // Update overall path completion
      if (updatedSegments > 0) {
        const completedCount = pathVideos.filter(v => v.is_completed).length + updatedSegments
        const progressPercentage = (completedCount / pathVideos.length) * 100

        await supabase
          .from('learning_paths')
          .update({
            completed_videos: completedCount,
            status: progressPercentage >= 100 ? 'completed' : 'active',
            completed_at: progressPercentage >= 100 ? new Date().toISOString() : null
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
      // Get path videos that aren't completed
      const { data: pathVideos, error: pathError } = await supabase
        .from('learning_path_videos')
        .select('*')
        .eq('path_id', pathId)
        .eq('is_completed', false)
        .order('order_index')

      if (pathError) throw pathError

      const {
        sessionsPerWeek = 3,
        sessionDuration = 60,
        preferredTimes = ['evening'],
        startDate = new Date().toISOString()
      } = preferences

      const calendarActions: CalendarAction[] = []
      const start = new Date(startDate)

      // Schedule videos across the weeks
      pathVideos.forEach((video, index) => {
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

        calendarActions.push({
          type: 'schedule_video',
          title: `Learning Path: ${video.video_id}`,
          description: `Watch and practice video in learning path`,
          startTime: sessionDate.toISOString(),
          endTime: endTime.toISOString(),
          duration: sessionDuration,
          videoReference: {
            videoId: video.video_id,
            youtubeId: video.youtube_id,
            title: `Learning Path Video ${video.order_index}`,
            thumbnailUrl: `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`
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
      // Get path info
      const { data: pathInfo, error: pathError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', pathId)
        .eq('user_id', userId)
        .single()

      if (pathError) throw pathError

      // Get segment progress
      const { data: segments, error: segmentsError } = await supabase
        .from('learning_path_videos')
        .select('*')
        .eq('path_id', pathId)
        .order('order_index')

      if (segmentsError) throw segmentsError

      const completedSegments = segments.filter(s => s.is_completed)
      const completionPercentage = (completedSegments.length / segments.length) * 100
      const currentSegment = segments.find(s => !s.is_completed)
      
      // Calculate estimated completion based on current pace
      const estimatedCompletion = this.calculateEstimatedCompletion(
        segments.length - completedSegments.length,
        pathInfo.estimated_hours
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
      const todoRecords = segments.map((segment, index) => ({
        user_id: userId,
        title: `Complete: ${segment.title}`,
        description: `Watch video and complete practice exercises`,
        status: 'pending' as const,
        priority: 'medium' as const,
        category: 'learn',
        due_date: this.calculateDueDate(index * 2), // Spread over time
        video_references: segment.videoReferences,
        tags: ['learning-path', pathId],
        estimated_minutes: segment.estimatedMinutes,
        metadata: {
          learningPathId: pathId,
          segmentId: segment.id,
          segmentOrder: segment.order
        },
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