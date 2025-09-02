import { YoutubeTranscript } from 'youtube-transcript'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase/client'
import type { 
  TranscriptSegment, 
  ChunkedSegment, 
  ProcessingResult,
  VideoFromCurriculum 
} from '@/types/blox-wizard'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface TranscriptItem {
  text: string
  duration: number
  offset: number
}

export class TranscriptProcessor {
  private readonly chunkSize: number = 500 // tokens
  private readonly chunkOverlap: number = 100 // tokens
  private readonly embeddingModel: string = 'text-embedding-3-small'
  private readonly maxRetries: number = 3

  /**
   * Process a single video: fetch transcript, chunk, embed, and store
   */
  async processVideo(video: VideoFromCurriculum): Promise<ProcessingResult> {
    console.log(`🎥 Processing video: ${video.title} (${video.youtubeId})`)
    
    try {
      // 1. Check if already processed
      const existing = await this.checkExistingTranscript(video.youtubeId)
      if (existing) {
        console.log(`✅ Video already processed: ${video.youtubeId}`)
        return {
          success: true,
          videoId: video.id,
          youtubeId: video.youtubeId,
          chunksCreated: 0
        }
      }

      // 2. Fetch transcript
      const transcript = await this.fetchTranscript(video.youtubeId)
      if (!transcript || transcript.length === 0) {
        throw new Error('No transcript available')
      }

      // 3. Convert to structured format
      const segments = this.convertToSegments(transcript)
      const fullTranscript = segments.map(s => s.text).join(' ')

      // 4. Create chunks
      const chunks = this.createChunks(segments)
      console.log(`📝 Created ${chunks.length} chunks for ${video.youtubeId}`)

      // 5. Store video transcript record
      const transcriptId = await this.storeVideoTranscript({
        videoId: video.id,
        youtubeId: video.youtubeId,
        title: video.title,
        creator: video.creator || 'Unknown',
        fullTranscript,
        transcriptJson: segments
      })

      // 6. Process chunks with embeddings
      let chunksCreated = 0
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        try {
          const embedding = await this.generateEmbedding(chunk.text)
          await this.storeTranscriptChunk({
            transcriptId,
            chunk,
            chunkIndex: i,
            embedding
          })
          chunksCreated++
          
          // Progress indicator
          if ((i + 1) % 5 === 0) {
            console.log(`📊 Processed ${i + 1}/${chunks.length} chunks`)
          }
        } catch (error) {
          console.warn(`⚠️  Failed to process chunk ${i}:`, error)
        }
      }

      console.log(`✅ Successfully processed ${video.youtubeId} with ${chunksCreated} chunks`)
      return {
        success: true,
        videoId: video.id,
        youtubeId: video.youtubeId,
        chunksCreated
      }

    } catch (error) {
      console.error(`❌ Failed to process video ${video.youtubeId}:`, error)
      return {
        success: false,
        videoId: video.id,
        youtubeId: video.youtubeId,
        chunksCreated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Fetch YouTube transcript with retries
   */
  private async fetchTranscript(youtubeId: string): Promise<TranscriptItem[]> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔍 Fetching transcript for ${youtubeId} (attempt ${attempt})`)
        const transcript = await YoutubeTranscript.fetchTranscript(youtubeId)
        return transcript.map(item => ({
          text: item.text,
          duration: item.duration || 0,
          offset: item.offset || 0
        }))
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.warn(`⚠️  Attempt ${attempt} failed for ${youtubeId}: ${lastError.message}`)
        
        if (attempt < this.maxRetries) {
          // Wait before retry
          await this.delay(2000 * attempt)
        }
      }
    }
    
    throw lastError!
  }

  /**
   * Convert raw transcript to structured segments with timestamps
   */
  private convertToSegments(transcript: TranscriptItem[]): TranscriptSegment[] {
    return transcript.map(item => ({
      text: item.text.trim(),
      startTime: item.offset,
      duration: item.duration,
      timestamp: this.secondsToTimestamp(item.offset)
    }))
  }

  /**
   * Create text chunks with overlap for better context
   */
  private createChunks(segments: TranscriptSegment[]): ChunkedSegment[] {
    const chunks: ChunkedSegment[] = []
    let currentText = ''
    let currentStartTime = 0
    let currentStartTimestamp = '0:00'
    let chunkIndex = 0

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const newText = currentText ? `${currentText} ${segment.text}` : segment.text
      
      // Estimate tokens (rough: 1 token ≈ 4 characters)
      const estimatedTokens = newText.length / 4

      if (estimatedTokens >= this.chunkSize && currentText) {
        // Create chunk
        chunks.push({
          text: currentText,
          chunkIndex,
          startTime: currentStartTime,
          endTime: segment.startTime,
          startTimestamp: currentStartTimestamp,
          endTimestamp: segment.timestamp
        })

        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentText, this.chunkOverlap * 4)
        currentText = overlapText + ' ' + segment.text
        currentStartTime = segment.startTime
        currentStartTimestamp = segment.timestamp
        chunkIndex++
      } else {
        if (!currentText) {
          currentStartTime = segment.startTime
          currentStartTimestamp = segment.timestamp
        }
        currentText = newText
      }
    }

    // Add final chunk
    if (currentText) {
      const lastSegment = segments[segments.length - 1]
      chunks.push({
        text: currentText,
        chunkIndex,
        startTime: currentStartTime,
        endTime: lastSegment.startTime + lastSegment.duration,
        startTimestamp: currentStartTimestamp,
        endTimestamp: this.secondsToTimestamp(lastSegment.startTime + lastSegment.duration)
      })
    }

    return chunks
  }

  /**
   * Get overlap text from end of previous chunk
   */
  private getOverlapText(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text
    
    // Try to break at word boundary
    const overlap = text.slice(-maxChars)
    const wordBoundary = overlap.indexOf(' ')
    return wordBoundary > 0 ? overlap.slice(wordBoundary + 1) : overlap
  }

  /**
   * Generate embedding for text chunk
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: this.embeddingModel,
      input: text.trim()
    })
    return response.data[0].embedding
  }

  /**
   * Store video transcript metadata in database
   */
  private async storeVideoTranscript(data: {
    videoId: string
    youtubeId: string
    title: string
    creator: string
    fullTranscript: string
    transcriptJson: TranscriptSegment[]
  }): Promise<string> {
    const { data: result, error } = await supabaseAdmin
      .from('video_transcripts')
      .insert({
        video_id: data.videoId,
        youtube_id: data.youtubeId,
        title: data.title,
        creator: data.creator,
        full_transcript: data.fullTranscript,
        transcript_json: data.transcriptJson,
        processed_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to store video transcript: ${error.message}`)
    }

    return result.id
  }

  /**
   * Store individual transcript chunk with embedding
   */
  private async storeTranscriptChunk(data: {
    transcriptId: string
    chunk: ChunkedSegment
    chunkIndex: number
    embedding: number[]
  }): Promise<void> {
    const { error } = await supabaseAdmin
      .from('transcript_chunks')
      .insert({
        transcript_id: data.transcriptId,
        chunk_text: data.chunk.text,
        chunk_index: data.chunkIndex,
        start_timestamp: data.chunk.startTimestamp,
        end_timestamp: data.chunk.endTimestamp,
        start_seconds: Math.round(data.chunk.startTime),
        end_seconds: Math.round(data.chunk.endTime),
        embedding: data.embedding
      })

    if (error) {
      throw new Error(`Failed to store transcript chunk: ${error.message}`)
    }
  }

  /**
   * Check if video transcript already exists
   */
  private async checkExistingTranscript(youtubeId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('video_transcripts')
      .select('id')
      .eq('youtube_id', youtubeId)
      .single()

    return !error && data !== null
  }

  /**
   * Convert seconds to MM:SS format
   */
  private secondsToTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Batch process multiple videos
   */
  async processBatch(videos: VideoFromCurriculum[], batchSize: number = 5): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = []
    
    console.log(`🚀 Starting batch processing of ${videos.length} videos`)
    console.log(`📦 Batch size: ${batchSize}`)

    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize)
      console.log(`\n📋 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(videos.length / batchSize)}`)
      
      const batchPromises = batch.map(video => this.processVideo(video))
      const batchResults = await Promise.allSettled(batchPromises)
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error('❌ Batch processing error:', result.reason)
        }
      }

      // Brief pause between batches to avoid rate limiting
      if (i + batchSize < videos.length) {
        console.log('⏳ Pausing 3s between batches...')
        await this.delay(3000)
      }
    }

    const successful = results.filter(r => r.success).length
    const totalChunks = results.reduce((sum, r) => sum + r.chunksCreated, 0)
    
    console.log(`\n🎉 Batch processing complete!`)
    console.log(`✅ Successful: ${successful}/${videos.length}`)
    console.log(`📊 Total chunks created: ${totalChunks}`)

    return results
  }
}