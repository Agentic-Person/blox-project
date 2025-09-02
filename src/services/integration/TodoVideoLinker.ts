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
      // Create the link record
      const linkData = {
        todo_id: todoId,
        video_id: videoReference.videoId,
        youtube_id: videoReference.youtubeId,
        timestamp_start: videoReference.timestamp,
        timestamp_end: null, // Could be extended for ranges
        relevance_score: videoReference.confidence || 0.8,
        link_type: linkType,
        created_by: 'ai' as const,
        notes: notes
      }

      const { data: linkRecord, error: linkError } = await supabase
        .from('todo_video_links')
        .insert(linkData)
        .select()
        .single()

      if (linkError) throw linkError

      // Update the todo's videoReferences array
      const { data: todo, error: todoError } = await supabase
        .from('todos')
        .select('video_references')
        .eq('id', todoId)
        .single()

      if (todoError) throw todoError

      const currentReferences = todo.video_references || []
      const updatedReferences = [...currentReferences, videoReference]

      const { error: updateError } = await supabase
        .from('todos')
        .update({ 
          video_references: updatedReferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', todoId)

      if (updateError) throw updateError

      // Create the TodoVideoLink object
      const todoVideoLink: TodoVideoLink = {
        id: linkRecord.id,
        todoId: todoId,
        videoReference: videoReference,
        linkType: linkType,
        addedAt: linkRecord.created_at,
        addedBy: 'ai',
        notes: notes
      }

      // Log the progress sync event
      await this.logProgressSync({
        type: 'video_watched',
        userId: '', // Will be set by calling service
        timestamp: new Date().toISOString(),
        source: 'todo_system',
        data: {
          todoId,
          videoId: videoReference.videoId,
          youtubeId: videoReference.youtubeId,
          linkType
        },
        relatedEntities: {
          todoIds: [todoId],
          videoIds: [videoReference.videoId]
        }
      })

      return {
        success: true,
        data: todoVideoLink,
        timestamp: new Date().toISOString(),
        source: 'TodoVideoLinker'
      }
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
      const { data: links, error } = await supabase
        .from('todo_video_links')
        .select('*')
        .eq('todo_id', todoId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const todoVideoLinks: TodoVideoLink[] = links.map(link => ({
        id: link.id,
        todoId: link.todo_id,
        videoReference: {
          videoId: link.video_id,
          youtubeId: link.youtube_id,
          title: '', // Would be populated from video metadata
          thumbnailUrl: `https://img.youtube.com/vi/${link.youtube_id}/maxresdefault.jpg`,
          timestamp: link.timestamp_start,
          confidence: link.relevance_score
        },
        linkType: link.link_type,
        addedAt: link.created_at,
        addedBy: link.created_by,
        notes: link.notes
      }))

      return {
        success: true,
        data: todoVideoLinks,
        timestamp: new Date().toISOString(),
        source: 'TodoVideoLinker'
      }
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
      const { data: links, error } = await supabase
        .from('todo_video_links')
        .select('todo_id')
        .eq('youtube_id', youtubeId)

      if (error) throw error

      const todoIds = links.map(link => link.todo_id)

      return {
        success: true,
        data: todoIds,
        timestamp: new Date().toISOString(),
        source: 'TodoVideoLinker'
      }
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
      // Update video progress
      const { error: progressError } = await supabase
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