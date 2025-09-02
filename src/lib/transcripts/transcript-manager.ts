/**
 * Transcript Management System
 * Handles storage, retrieval, and searching of video transcripts
 */

export interface TranscriptSegment {
  text: string
  start: number  // seconds
  duration: number  // seconds
  end: number    // calculated: start + duration
}

export interface VideoTranscript {
  videoId: string
  youtubeId: string
  title: string
  creator?: string
  segments: TranscriptSegment[]
  totalDuration: number
  wordCount: number
  language: string
  extractedAt: string
  lastUpdated: string
}

export interface TranscriptSearchResult {
  videoId: string
  youtubeId: string
  title: string
  relevantSegments: {
    segment: TranscriptSegment
    relevanceScore: number
    context: string // surrounding text for context
  }[]
  overallRelevance: number
}

export class TranscriptManager {
  private transcripts: Map<string, VideoTranscript> = new Map()
  private initialized = false

  /**
   * Initialize the transcript manager with stored data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Load transcripts from storage
      await this.loadTranscriptsFromStorage()
      this.initialized = true
      console.log(`TranscriptManager initialized with ${this.transcripts.size} transcripts`)
    } catch (error) {
      console.error('Failed to initialize TranscriptManager:', error)
      this.initialized = true // Continue without transcripts
    }
  }

  /**
   * Load transcripts from JSON files in the data/transcripts directory
   */
  private async loadTranscriptsFromStorage(): Promise<void> {
    try {
      // In a real implementation, this would load from the file system or database
      // For now, we'll check if there are any transcript files
      
      // This would be dynamic in a real implementation
      const transcriptFiles = [
        '/data/transcripts/playlist-PLZ1b66Z1KFKhO7R6Q588cdWxdnVxpPmA8-transcripts-2025-09-02T23-30-41-422Z.json'
      ]

      for (const file of transcriptFiles) {
        try {
          const response = await fetch(file)
          if (response.ok) {
            const data = await response.json()
            this.loadTranscriptData(data)
          }
        } catch (error) {
          // File doesn't exist or can't be loaded, continue
          console.log(`Transcript file ${file} not available`)
        }
      }
    } catch (error) {
      console.warn('Could not load transcript data:', error)
    }
  }

  /**
   * Load transcript data from a JSON object
   */
  private loadTranscriptData(data: Record<string, any>): void {
    Object.values(data).forEach((transcriptData: any) => {
      if (transcriptData.videoId && transcriptData.transcript) {
        const videoTranscript: VideoTranscript = {
          videoId: transcriptData.videoId,
          youtubeId: transcriptData.videoId,
          title: transcriptData.title || 'Unknown Title',
          segments: transcriptData.transcript.map((segment: any) => ({
            text: segment.text || '',
            start: segment.offset || 0,
            duration: segment.duration || 0,
            end: (segment.offset || 0) + (segment.duration || 0)
          })),
          totalDuration: 0, // Will be calculated
          wordCount: 0,     // Will be calculated
          language: 'en',
          extractedAt: transcriptData.extractedAt || new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }

        // Calculate derived fields
        this.calculateTranscriptMetadata(videoTranscript)
        this.transcripts.set(videoTranscript.youtubeId, videoTranscript)
      }
    })
  }

  /**
   * Calculate metadata for a transcript
   */
  private calculateTranscriptMetadata(transcript: VideoTranscript): void {
    if (transcript.segments.length > 0) {
      const lastSegment = transcript.segments[transcript.segments.length - 1]
      transcript.totalDuration = lastSegment.end
      transcript.wordCount = transcript.segments.reduce(
        (count, segment) => count + segment.text.split(' ').length, 
        0
      )
    }
  }

  /**
   * Add a new transcript
   */
  addTranscript(transcript: VideoTranscript): void {
    this.calculateTranscriptMetadata(transcript)
    this.transcripts.set(transcript.youtubeId, transcript)
  }

  /**
   * Get a transcript by YouTube ID
   */
  getTranscript(youtubeId: string): VideoTranscript | null {
    return this.transcripts.get(youtubeId) || null
  }

  /**
   * Check if a video has a transcript
   */
  hasTranscript(youtubeId: string): boolean {
    return this.transcripts.has(youtubeId)
  }

  /**
   * Search transcripts for specific text
   */
  searchTranscripts(query: string, options: {
    maxResults?: number
    minRelevance?: number
    includeContext?: boolean
    contextWords?: number
  } = {}): TranscriptSearchResult[] {
    const {
      maxResults = 10,
      minRelevance = 0.1,
      includeContext = true,
      contextWords = 20
    } = options

    const results: TranscriptSearchResult[] = []
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2)

    if (searchTerms.length === 0) {
      return results
    }

    this.transcripts.forEach(transcript => {
      const relevantSegments: TranscriptSearchResult['relevantSegments'] = []

      transcript.segments.forEach((segment, index) => {
        const text = segment.text.toLowerCase()
        let relevanceScore = 0

        // Calculate relevance based on term matches
        searchTerms.forEach(term => {
          const matches = (text.match(new RegExp(term, 'g')) || []).length
          relevanceScore += matches * (1 / searchTerms.length)
        })

        if (relevanceScore > 0) {
          let context = segment.text
          
          if (includeContext) {
            // Add context from surrounding segments
            const contextSegments = transcript.segments.slice(
              Math.max(0, index - 1),
              Math.min(transcript.segments.length, index + 2)
            )
            context = contextSegments.map(s => s.text).join(' ')
          }

          relevantSegments.push({
            segment,
            relevanceScore,
            context: context.substring(0, contextWords * 10) // Rough word limit
          })
        }
      })

      if (relevantSegments.length > 0) {
        const overallRelevance = relevantSegments.reduce(
          (sum, item) => sum + item.relevanceScore, 0
        ) / relevantSegments.length

        if (overallRelevance >= minRelevance) {
          results.push({
            videoId: transcript.videoId,
            youtubeId: transcript.youtubeId,
            title: transcript.title,
            relevantSegments: relevantSegments
              .sort((a, b) => b.relevanceScore - a.relevanceScore)
              .slice(0, 3), // Top 3 segments per video
            overallRelevance
          })
        }
      }
    })

    return results
      .sort((a, b) => b.overallRelevance - a.overallRelevance)
      .slice(0, maxResults)
  }

  /**
   * Get transcript segment at a specific timestamp
   */
  getSegmentAtTime(youtubeId: string, timeSeconds: number): TranscriptSegment | null {
    const transcript = this.getTranscript(youtubeId)
    if (!transcript) return null

    return transcript.segments.find(segment => 
      timeSeconds >= segment.start && timeSeconds < segment.end
    ) || null
  }

  /**
   * Get all transcripts
   */
  getAllTranscripts(): VideoTranscript[] {
    return Array.from(this.transcripts.values())
  }

  /**
   * Get transcript statistics
   */
  getStats(): {
    totalTranscripts: number
    totalSegments: number
    totalWords: number
    averageSegmentLength: number
  } {
    const transcripts = this.getAllTranscripts()
    const totalSegments = transcripts.reduce((sum, t) => sum + t.segments.length, 0)
    const totalWords = transcripts.reduce((sum, t) => sum + t.wordCount, 0)

    return {
      totalTranscripts: transcripts.length,
      totalSegments,
      totalWords,
      averageSegmentLength: totalSegments > 0 ? totalWords / totalSegments : 0
    }
  }
}

// Global instance
export const transcriptManager = new TranscriptManager()

// Helper function to format timestamp for YouTube URLs
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Helper function to create YouTube URL with timestamp
export function createTimestampUrl(youtubeId: string, seconds: number): string {
  return `https://www.youtube.com/watch?v=${youtubeId}&t=${Math.floor(seconds)}s`
}