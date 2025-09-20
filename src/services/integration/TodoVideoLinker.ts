/**
 * TodoVideoLinker Service
 * 
 * Provides bidirectional linking between todos and video content
 * Core service for the AI-Powered Learning System integration
 */

import { supabase } from '../../lib/supabase/client'
import { 
  UnifiedVideoReference, 
  TodoVideoLink, 
  ServiceResponse,
  ProgressSyncEvent 
} from '../../types/shared'
import { Todo } from '../../types/todo'

export class TodoVideoLinker {
  
  /**
   * Link a todo to a video with timestamp
   */
  async linkTodoToVideo(
    todoId: string,
    videoReference: UnifiedVideoReference,
    linkType: 'reference' | 'requirement' | 'output' = 'reference',
    notes?: string
  ): Promise<ServiceResponse<TodoVideoLink>> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // TODO: Implement when todo_video_links table is created
      throw new Error('TodoVideoLinker functionality not yet implemented - missing database tables')
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to link todo to video',
        timestamp: new Date().toISOString(),
        source: 'TodoVideoLinker'
      }
    }
  }

  /**
   * Get all video links for a todo
   */
  async getTodoVideoLinks(todoId: string): Promise<ServiceResponse<TodoVideoLink[]>> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // TODO: Implement when todo_video_links table is created
      throw new Error('TodoVideoLinker functionality not yet implemented - missing database tables')
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get todo video links',
        timestamp: new Date().toISOString(),
        source: 'TodoVideoLinker'
      }
    }
  }

  /**
   * Get all todos linked to a video
   */
  async getVideoTodoLinks(youtubeId: string): Promise<ServiceResponse<string[]>> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // TODO: Implement when todo_video_links table is created
      throw new Error('TodoVideoLinker functionality not yet implemented - missing database tables')
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get video todo links',
        timestamp: new Date().toISOString(),
        source: 'TodoVideoLinker'
      }
    }
  }

  /**
   * Update video watch progress and sync with todos
   */
  async syncVideoProgress(
    userId: string,
    youtubeId: string,
    watchProgress: number,
    currentPosition: number
  ): Promise<ServiceResponse<void>> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // TODO: Implement when video_progress and todo_video_links tables are created
      throw new Error('TodoVideoLinker functionality not yet implemented - missing database tables')
        .from('video_progress')
        .upsert({
          user_id: userId,
          youtube_id: youtubeId,
          watch_progress: watchProgress,
          last_position: currentPosition,
          completed: watchProgress >= 90, // 90% completion threshold
          completed_at: watchProgress >= 90 ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })

      if (progressError) throw progressError

      // If video is completed, check for linked todos to auto-update
      if (watchProgress >= 90) {
        const linkedTodosResult = await this.getVideoTodoLinks(youtubeId)
        if (linkedTodosResult.success && linkedTodosResult.data) {
          // Find todos that should be auto-completed
          const { data: syncStatuses, error: syncError } = await supabase
            .from('todo_video_sync_status')
            .select('*')
            .in('todo_id', linkedTodosResult.data)
            .eq('auto_complete', true)
            .lte('completion_threshold', watchProgress)

          if (!syncError && syncStatuses) {
            // Auto-complete eligible todos
            for (const syncStatus of syncStatuses) {
              await supabase
                .from('todos')
                .update({
                  status: 'completed',
                  completed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', syncStatus.todo_id)
                .eq('user_id', userId)
            }
          }
        }
      }

      return {
        success: true,
        timestamp: new Date().toISOString(),
        source: 'TodoVideoLinker'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync video progress',
        timestamp: new Date().toISOString(),
        source: 'TodoVideoLinker'
      }
    }
  }

  /**
   * Remove a todo-video link
   */
  async unlinkTodoFromVideo(linkId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('todo_video_links')
        .delete()
        .eq('id', linkId)

      if (error) throw error

      return {
        success: true,
        timestamp: new Date().toISOString(),
        source: 'TodoVideoLinker'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unlink todo from video',
        timestamp: new Date().toISOString(),
        source: 'TodoVideoLinker'
      }
    }
  }

  /**
   * Log progress sync events for analytics
   */
  private async logProgressSync(event: ProgressSyncEvent): Promise<void> {
    try {
      await supabase
        .from('progress_sync_log')
        .insert({
          event_type: event.type,
          user_id: event.userId || 'system',
          event_data: event.data,
          source_system: event.source,
          processed: false,
          created_at: event.timestamp
        })
    } catch (error) {
      console.warn('Failed to log progress sync event:', error)
    }
  }

  /**
   * Get sync statistics for analytics
   */
  async getSyncStats(userId: string): Promise<ServiceResponse<{
    totalLinks: number;
    autoCompletedTodos: number;
    averageWatchProgress: number;
    mostLinkedVideo: string;
  }>> {
    try {
      // Get total links for user's todos
      const { data: userTodos, error: todosError } = await supabase
        .from('todos')
        .select('id')
        .eq('user_id', userId)

      if (todosError) throw todosError

      const todoIds = userTodos.map(t => t.id)

      const { data: links, error: linksError } = await supabase
        .from('todo_video_links')
        .select('youtube_id')
        .in('todo_id', todoIds)

      if (linksError) throw linksError

      // Get video progress stats
      const { data: progress, error: progressError } = await supabase
        .from('video_progress')
        .select('watch_progress, completed')
        .eq('user_id', userId)

      if (progressError) throw progressError

      const stats = {
        totalLinks: links.length,
        autoCompletedTodos: progress.filter(p => p.completed).length,
        averageWatchProgress: progress.reduce((sum, p) => sum + p.watch_progress, 0) / (progress.length || 1),
        mostLinkedVideo: this.getMostLinkedVideo(links)
      }

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
        source: 'TodoVideoLinker'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get sync stats',
        timestamp: new Date().toISOString(),
        source: 'TodoVideoLinker'
      }
    }
  }

  private getMostLinkedVideo(links: { youtube_id: string }[]): string {
    const counts = links.reduce((acc, link) => {
      acc[link.youtube_id] = (acc[link.youtube_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || ''
  }
}