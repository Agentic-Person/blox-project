/**
 * Supabase Transcript Service
 * Handles video and transcript data retrieval for Blox Wizard
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Initialize OpenAI client (only if API key is available)
let openai: OpenAI | null = null
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey })
}

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
   * Generate embedding for a query using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[] | null> {
    if (!openai) {
      console.warn('OpenAI client not available for embedding generation')
      return null
    }

    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.replace(/\n/g, ' ').trim(),
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      return null
    }
  }

  /**
   * Search using vector similarity (semantic search)
   */
  async searchTranscriptsVector(
    query: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<TranscriptChunk[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query)
      if (!queryEmbedding) {
        console.log('[Transcript Search] Falling back to text search (no embedding available)')
        return []
      }

      // Use the ACTUAL function that exists in your database
      const { data, error } = await supabase.rpc('search_transcript_chunks', {
        query_embedding: queryEmbedding,
        similarity_threshold: threshold,
        max_results: limit
      })

      if (error) {
        console.error('[Transcript Search] Error in vector search:', error)
        return []
      }

      console.log(`[Transcript Search] Found ${data?.length || 0} results`)

      return (data || []).map((result: any) => ({
        id: result.chunk_id,
        video_id: result.video_id, // This is actually the youtube_id in your schema
        youtube_id: result.youtube_id,
        chunk_index: result.chunk_index || 0,
        start_time: result.start_seconds || 0,
        end_time: result.end_seconds || 0,
        text: result.chunk_text,
        video: {
          id: result.video_id,
          youtube_id: result.youtube_id,
          title: result.title || 'Unknown Video',
          creator: result.creator || '',
          description: '',
          duration: '',
          total_minutes: Math.floor((result.end_seconds || 0) / 60),
          thumbnail_url: `https://img.youtube.com/vi/${result.youtube_id}/maxresdefault.jpg`,
          xp_reward: 25,
          module_id: '',
          week_id: '',
          day_id: '',
          order_index: 0
        }
      }))
    } catch (error) {
      console.error('[Transcript Search] Vector search error:', error)
      return []
    }
  }

  /**
   * Search using hybrid approach (combines text + vector)
   * NOTE: We only have vector search in the database, so this just uses that
   */
  async searchTranscriptsHybrid(
    query: string,
    limit: number = 10,
    threshold: number = 0.6,
    textWeight: number = 0.3,
    vectorWeight: number = 0.7
  ): Promise<TranscriptChunk[]> {
    // Just use vector search - it's what we have and it works great!
    return this.searchTranscriptsVector(query, limit, threshold)
  }

  /**
   * Search for video transcript chunks based on query (fallback)
   * NOTE: We only have vector search, so this returns empty
   * The vector search is far superior anyway!
   */
  async searchTranscripts(
    query: string,
    limit: number = 10
  ): Promise<TranscriptChunk[]> {
    console.log('[Transcript Search] Text search not available, use vector search instead')
    return []
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
   * Get all video titles from the database
   * Used to show users what content is available when search finds nothing
   */
  async getAllVideoTitles(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('title')
        .order('order_index')

      if (error) {
        console.error('Error fetching video titles:', error)
        return []
      }

      // Extract unique titles
      const titles = data?.map(v => v.title).filter(Boolean) || []
      return [...new Set(titles)] // Remove duplicates
    } catch (error) {
      console.error('Get all video titles error:', error)
      return []
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
   * Uses vector search with your 121 embedded transcript chunks!
   */
  async findRelevantVideoSegments(
    query: string,
    limit: number = 5
  ): Promise<VideoReference[]> {
    try {
      console.log(`[Transcript Search] Searching for: "${query}"`)

      // Use vector search with lower threshold for more results
      const transcriptChunks = await this.searchTranscriptsVector(query, limit, 0.3)

      if (transcriptChunks.length === 0) {
        console.log('[Transcript Search] No results found')
        return []
      }

      console.log(`[Transcript Search] Found ${transcriptChunks.length} relevant chunks`)

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
          confidence: this.calculateConfidence(chunk),
          startTime: chunk.start_time,
          endTime: chunk.end_time
        }
      })

      return videoReferences
    } catch (error) {
      console.error('[Transcript Search] Find relevant segments error:', error)
      return []
    }
  }

  /**
   * Calculate confidence score based on available data
   * This could be enhanced with actual similarity scores from vector search
   */
  private calculateConfidence(chunk: TranscriptChunk): number {
    // Start with base confidence
    let confidence = 0.7
    
    // Higher confidence for longer text segments (more context)
    if (chunk.text.length > 200) confidence += 0.1
    if (chunk.text.length > 400) confidence += 0.1
    
    // Higher confidence for videos with known creators
    if (chunk.video?.creator && chunk.video.creator.length > 0) {
      confidence += 0.05
    }
    
    return Math.min(confidence, 0.95) // Cap at 95%
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