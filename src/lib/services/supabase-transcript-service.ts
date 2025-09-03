/**
 * Supabase Transcript Service
 * Handles video and transcript data retrieval for Blox Wizard
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface VideoRecord {
  id: string
  youtube_id: string
  title: string
  creator: string
  description: string
  duration: string
  total_minutes: number
  thumbnail_url: string
  xp_reward: number
  module_id: string
  week_id: string
  day_id: string
  order_index: number
}

export interface TranscriptChunk {
  id: string
  video_id: string
  youtube_id: string
  chunk_index: number
  start_time: number
  end_time: number
  text: string
  video?: VideoRecord
}

export interface VideoReference {
  title: string
  youtubeId: string
  timestamp: string
  relevantSegment: string
  thumbnailUrl: string
  confidence: number
  startTime?: number
  endTime?: number
}

class SupabaseTranscriptService {
  
  /**
   * Search for video transcript chunks based on query
   */
  async searchTranscripts(
    query: string, 
    limit: number = 10
  ): Promise<TranscriptChunk[]> {
    try {
      const { data, error } = await supabase
        .rpc('search_video_transcripts', {
          search_query: query,
          limit_count: limit
        })

      if (error) {
        console.error('Error searching transcripts:', error)
        return []
      }

      // Transform the RPC results to TranscriptChunk format
      return (data || []).map((result: any) => ({
        id: result.video_id, // Using video_id as temporary chunk id
        video_id: result.video_id,
        youtube_id: result.youtube_id,
        chunk_index: 0, // RPC doesn't return chunk_index
        start_time: result.start_time,
        end_time: result.end_time,
        text: result.chunk_text,
        video: {
          id: result.video_id,
          youtube_id: result.youtube_id,
          title: result.video_title,
          creator: '', // RPC doesn't return creator
          description: '',
          duration: '',
          total_minutes: 0,
          thumbnail_url: `https://img.youtube.com/vi/${result.youtube_id}/maxresdefault.jpg`,
          xp_reward: 25,
          module_id: '',
          week_id: '',
          day_id: '',
          order_index: 0
        }
      }))
    } catch (error) {
      console.error('Search transcripts error:', error)
      return []
    }
  }

  /**
   * Get video details by YouTube ID
   */
  async getVideoByYouTubeId(youtubeId: string): Promise<VideoRecord | null> {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('youtube_id', youtubeId)
        .single()

      if (error) {
        console.error('Error fetching video:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Get video error:', error)
      return null
    }
  }

  /**
   * Get transcript chunks for a specific video
   */
  async getVideoTranscriptChunks(youtubeId: string): Promise<TranscriptChunk[]> {
    try {
      const { data, error } = await supabase
        .from('video_transcript_chunks')
        .select(`
          *,
          video:videos (*)
        `)
        .eq('youtube_id', youtubeId)
        .order('chunk_index')

      if (error) {
        console.error('Error fetching transcript chunks:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Get transcript chunks error:', error)
      return []
    }
  }

  /**
   * Find relevant video segments for a user query
   * Returns formatted video references for Blox Wizard
   */
  async findRelevantVideoSegments(
    query: string,
    limit: number = 5
  ): Promise<VideoReference[]> {
    try {
      const transcriptChunks = await this.searchTranscripts(query, limit)
      
      const videoReferences: VideoReference[] = transcriptChunks.map(chunk => {
        const startMinutes = Math.floor(chunk.start_time / 60)
        const startSeconds = Math.floor(chunk.start_time % 60)
        const timestamp = `${startMinutes}:${startSeconds.toString().padStart(2, '0')}`

        return {
          title: chunk.video?.title || 'Unknown Video',
          youtubeId: chunk.youtube_id,
          timestamp,
          relevantSegment: this.truncateText(chunk.text, 150),
          thumbnailUrl: chunk.video?.thumbnail_url || 
            `https://img.youtube.com/vi/${chunk.youtube_id}/maxresdefault.jpg`,
          confidence: 0.8, // TODO: Implement proper relevance scoring
          startTime: chunk.start_time,
          endTime: chunk.end_time
        }
      })

      return videoReferences
    } catch (error) {
      console.error('Find relevant segments error:', error)
      return []
    }
  }

  /**
   * Get videos by module and week for curriculum navigation
   */
  async getVideosByModuleAndWeek(
    moduleId: string,
    weekId?: string
  ): Promise<VideoRecord[]> {
    try {
      let query = supabase
        .from('videos')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index')

      if (weekId) {
        query = query.eq('week_id', weekId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching videos by module:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Get videos by module error:', error)
      return []
    }
  }

  /**
   * Get user's video progress
   */
  async getUserVideoProgress(
    userId: string,
    youtubeId?: string
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('video_progress')
        .select(`
          *,
          video:videos (*)
        `)
        .eq('user_id', userId)

      if (youtubeId) {
        query = query.eq('youtube_id', youtubeId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching video progress:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Get user video progress error:', error)
      return []
    }
  }

  /**
   * Update user's video progress
   */
  async updateVideoProgress(
    userId: string,
    youtubeId: string,
    progress: {
      watchProgress: number
      lastPosition: number
      totalDuration: number
    }
  ): Promise<boolean> {
    try {
      // Get video ID first
      const video = await this.getVideoByYouTubeId(youtubeId)
      if (!video) {
        console.error('Video not found for progress update:', youtubeId)
        return false
      }

      const { error } = await supabase
        .from('video_progress')
        .upsert({
          user_id: userId,
          video_id: video.id,
          youtube_id: youtubeId,
          watch_progress: progress.watchProgress,
          last_position: progress.lastPosition,
          total_duration: progress.totalDuration
        }, {
          onConflict: 'user_id,video_id'
        })

      if (error) {
        console.error('Error updating video progress:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Update video progress error:', error)
      return false
    }
  }

  /**
   * Get recommended videos for a user based on their progress
   */
  async getVideoRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<VideoRecord[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_video_recommendations', {
          p_user_id: userId,
          limit_count: limit
        })

      if (error) {
        console.error('Error getting recommendations:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Get recommendations error:', error)
      return []
    }
  }

  /**
   * Utility function to truncate text
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  /**
   * Format timestamp for YouTube URL
   */
  formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  /**
   * Get YouTube URL with timestamp
   */
  getYouTubeUrlWithTimestamp(youtubeId: string, startTime?: number): string {
    const baseUrl = `https://www.youtube.com/watch?v=${youtubeId}`
    if (startTime && startTime > 0) {
      return `${baseUrl}&t=${Math.floor(startTime)}s`
    }
    return baseUrl
  }
}

// Export singleton instance
export const supabaseTranscriptService = new SupabaseTranscriptService()
export default supabaseTranscriptService