import { supabase } from '@/lib/supabase/client'

export interface VideoProgressData {
  videoId: string
  youtubeId: string
  watchProgress: number // 0-100
  lastPosition: number // seconds
  totalDuration: number // seconds
  completed: boolean
  completedAt?: Date
}

export interface VideoProgressRecord {
  id: string
  user_id: string | null
  video_id: string | null
  youtube_id: string
  watch_progress: number | null
  last_position: number | null
  total_duration: number | null
  completed: boolean | null
  completed_at: string | null
  updated_at: string | null
}

/**
 * Progress Service for syncing video progress with Supabase
 * Handles offline/online sync gracefully
 */
class ProgressService {
  private syncQueue: Map<string, VideoProgressData> = new Map()
  private isSyncing = false
  private syncInterval: NodeJS.Timeout | null = null

  constructor() {
    // Set up periodic sync every 30 seconds
    if (typeof window !== 'undefined') {
      this.syncInterval = setInterval(() => {
        this.processSyncQueue()
      }, 30000)

      // Sync on page visibility change (when user returns to tab)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.processSyncQueue()
        }
      })

      // Sync before page unload
      window.addEventListener('beforeunload', () => {
        this.processSyncQueue()
      })
    }
  }

  /**
   * Get current authenticated user ID
   */
  private async getUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user?.id || null
    } catch (error) {
      console.error('Error getting user ID:', error)
      return null
    }
  }

  /**
   * Load all video progress for the authenticated user
   */
  async loadUserProgress(): Promise<Record<string, VideoProgressData>> {
    const userId = await this.getUserId()
    if (!userId) {
      console.log('No authenticated user, skipping progress load')
      return {}
    }

    try {
      const { data, error } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('Error loading video progress:', error)
        return {}
      }

      // Convert database records to local format
      const progressMap: Record<string, VideoProgressData> = {}
      if (data) {
        data.forEach((record: VideoProgressRecord) => {
          // Use youtube_id as the key since that's what the store uses
          progressMap[record.youtube_id] = {
            videoId: record.youtube_id,
            youtubeId: record.youtube_id,
            watchProgress: Number(record.watch_progress),
            lastPosition: Number(record.last_position),
            totalDuration: Number(record.total_duration),
            completed: record.completed ?? false,
            completedAt: record.completed_at ? new Date(record.completed_at) : undefined
          }
        })
      }

      console.log(`Loaded progress for ${Object.keys(progressMap).length} videos`)
      return progressMap
    } catch (error) {
      console.error('Error loading video progress:', error)
      return {}
    }
  }

  /**
   * Update video progress (queued for sync)
   */
  async updateProgress(
    youtubeId: string,
    watchedDuration: number,
    totalDuration: number
  ): Promise<void> {
    const watchProgress = totalDuration > 0
      ? Math.min((watchedDuration / totalDuration) * 100, 100)
      : 0

    const progressData: VideoProgressData = {
      videoId: youtubeId,
      youtubeId,
      watchProgress,
      lastPosition: watchedDuration,
      totalDuration,
      completed: watchProgress >= 90,
      completedAt: watchProgress >= 90 ? new Date() : undefined
    }

    // Add to sync queue
    this.syncQueue.set(youtubeId, progressData)

    // Try to sync immediately if not already syncing
    if (!this.isSyncing) {
      this.processSyncQueue()
    }
  }

  /**
   * Mark video as complete
   */
  async markComplete(youtubeId: string, totalDuration: number = 0): Promise<void> {
    const progressData: VideoProgressData = {
      videoId: youtubeId,
      youtubeId,
      watchProgress: 100,
      lastPosition: totalDuration,
      totalDuration,
      completed: true,
      completedAt: new Date()
    }

    // Add to sync queue
    this.syncQueue.set(youtubeId, progressData)

    // Try to sync immediately
    if (!this.isSyncing) {
      this.processSyncQueue()
    }
  }

  /**
   * Process sync queue and update Supabase
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.size === 0) {
      return
    }

    const userId = await this.getUserId()
    if (!userId) {
      console.log('No authenticated user, queuing progress for later sync')
      return
    }

    this.isSyncing = true

    try {
      // Get all items from queue
      const items = Array.from(this.syncQueue.entries())

      for (const [youtubeId, progressData] of items) {
        try {
          // First, try to find the video_id from the videos table
          const { data: videoData, error: videoError } = await supabase
            .from('videos')
            .select('id')
            .eq('youtube_id', youtubeId)
            .single()

          let videoId: string | null = null
          if (videoData && !videoError) {
            videoId = videoData.id
          }

          // Upsert progress (insert or update)
          const { error } = await supabase
            .from('video_progress')
            .upsert({
              user_id: userId,
              video_id: videoId, // Can be null if video not in database yet
              youtube_id: youtubeId,
              watch_progress: progressData.watchProgress,
              last_position: progressData.lastPosition,
              total_duration: progressData.totalDuration,
              completed: progressData.completed,
              completed_at: progressData.completedAt?.toISOString() || null,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,video_id',
              ignoreDuplicates: false
            })

          if (error) {
            console.error(`Error syncing progress for ${youtubeId}:`, error)
            // Keep in queue if error occurs
            continue
          }

          // Remove from queue on success
          this.syncQueue.delete(youtubeId)
        } catch (error) {
          console.error(`Error processing progress for ${youtubeId}:`, error)
        }
      }

      console.log(`Synced progress for ${items.length - this.syncQueue.size} videos`)
    } catch (error) {
      console.error('Error processing sync queue:', error)
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Force sync all queued progress immediately
   */
  async forceSync(): Promise<void> {
    await this.processSyncQueue()
  }

  /**
   * Get sync queue size (for debugging)
   */
  getQueueSize(): number {
    return this.syncQueue.size
  }

  /**
   * Clear sync queue (useful for logout)
   */
  clearQueue(): void {
    this.syncQueue.clear()
  }

  /**
   * Cleanup on service destruction
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.processSyncQueue() // Final sync before destroy
  }
}

// Export singleton instance
export const progressService = new ProgressService()
