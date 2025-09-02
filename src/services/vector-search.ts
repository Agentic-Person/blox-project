import { supabaseAdmin } from '@/lib/supabase/client'
import OpenAI from 'openai'
import type { 
  SearchResult, 
  SearchResponse, 
  SearchConfig,
  RawSearchResult 
} from '@/types/blox-wizard'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class VectorSearchService {
  private readonly defaultConfig: SearchConfig = {
    maxResults: 20,
    similarityThreshold: 0.7,
    multiVideoBoost: true,
    confidenceWeighting: true
  }

  /**
   * Search across all video transcripts using semantic similarity
   */
  async searchTranscripts(query: string, config?: Partial<SearchConfig>): Promise<SearchResponse> {
    const startTime = Date.now()
    const searchConfig = { ...this.defaultConfig, ...config }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateQueryEmbedding(query)
      
      // Perform vector search
      const rawResults = await this.performVectorSearch(queryEmbedding, searchConfig)
      
      // Transform and enhance results
      const results = this.transformResults(rawResults)
      
      // Apply post-processing filters and ranking
      const processedResults = this.postProcessResults(results, searchConfig)
      
      const searchTime = Date.now() - startTime

      return {
        results: processedResults,
        totalFound: rawResults.length,
        searchTime,
        cacheHit: false, // TODO: Implement caching in Phase 2
        query,
        queryEmbedding: config?.includeEmbedding ? queryEmbedding : undefined
      }

    } catch (error) {
      console.error('Vector search failed:', error)
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Search for similar questions to enable caching
   */
  async searchSimilarQuestions(query: string, threshold: number = 0.85): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.generateQueryEmbedding(query)
      
      const { data, error } = await supabaseAdmin
        .rpc('search_common_questions', {
          query_embedding: queryEmbedding,
          similarity_threshold: threshold,
          max_results: 5
        })

      if (error) {
        console.warn('Similar question search failed:', error.message)
        return []
      }

      return this.transformResults(data || [])
    } catch (error) {
      console.warn('Similar question search error:', error)
      return []
    }
  }

  /**
   * Get diverse results from multiple videos
   */
  async searchDiverseSources(
    query: string, 
    maxPerVideo: number = 3, 
    config?: Partial<SearchConfig>
  ): Promise<SearchResponse> {
    const searchConfig = { ...this.defaultConfig, ...config }
    const startTime = Date.now()

    try {
      const queryEmbedding = await this.generateQueryEmbedding(query)
      
      const { data, error } = await supabaseAdmin
        .rpc('search_diverse_sources', {
          query_embedding: queryEmbedding,
          similarity_threshold: searchConfig.similarityThreshold,
          max_results: searchConfig.maxResults,
          max_per_video: maxPerVideo
        })

      if (error) {
        throw new Error(`Diverse search failed: ${error.message}`)
      }

      const results = this.transformResults(data || [])
      const processedResults = this.postProcessResults(results, searchConfig)
      
      return {
        results: processedResults,
        totalFound: data?.length || 0,
        searchTime: Date.now() - startTime,
        cacheHit: false,
        query,
        queryEmbedding: config?.includeEmbedding ? queryEmbedding : undefined
      }

    } catch (error) {
      console.error('Diverse search failed:', error)
      throw new Error(`Diverse search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate embedding for search query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      input: query.trim()
    })
    return response.data[0].embedding
  }

  /**
   * Perform the core vector similarity search
   */
  private async performVectorSearch(
    queryEmbedding: number[], 
    config: SearchConfig
  ): Promise<RawSearchResult[]> {
    const { data, error } = await supabaseAdmin
      .rpc('search_transcript_chunks', {
        query_embedding: queryEmbedding,
        similarity_threshold: config.similarityThreshold,
        max_results: config.maxResults
      })

    if (error) {
      throw new Error(`Vector search failed: ${error.message}`)
    }

    return data || []
  }

  /**
   * Transform raw database results to structured SearchResult objects
   */
  private transformResults(rawResults: RawSearchResult[]): SearchResult[] {
    return rawResults.map(result => ({
      chunkId: result.chunk_id,
      transcriptId: result.transcript_id,
      videoId: result.video_id,
      youtubeId: result.youtube_id,
      title: result.title,
      creator: result.creator,
      chunkText: result.chunk_text,
      startTimestamp: result.start_timestamp,
      endTimestamp: result.end_timestamp,
      relevanceScore: result.similarity_score,
      confidence: this.calculateConfidence(result.similarity_score),
      videoUrl: `https://www.youtube.com/watch?v=${result.youtube_id}`,
      timestampUrl: `https://www.youtube.com/watch?v=${result.youtube_id}&t=${result.start_seconds}s`
    }))
  }

  /**
   * Apply post-processing filters and ranking
   */
  private postProcessResults(results: SearchResult[], config: SearchConfig): SearchResult[] {
    let processedResults = [...results]

    // Apply confidence weighting if enabled
    if (config.confidenceWeighting) {
      processedResults = this.applyConfidenceWeighting(processedResults)
    }

    // Boost diversity across videos if enabled
    if (config.multiVideoBoost) {
      processedResults = this.applyMultiVideoBoost(processedResults)
    }

    // Sort by final relevance score
    processedResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return processedResults.slice(0, config.maxResults)
  }

  /**
   * Apply confidence-based weighting to results
   */
  private applyConfidenceWeighting(results: SearchResult[]): SearchResult[] {
    return results.map(result => ({
      ...result,
      relevanceScore: result.relevanceScore * result.confidence
    }))
  }

  /**
   * Boost results from different videos for diversity
   */
  private applyMultiVideoBoost(results: SearchResult[]): SearchResult[] {
    const videoCount: { [videoId: string]: number } = {}
    
    return results.map(result => {
      const count = videoCount[result.videoId] || 0
      videoCount[result.videoId] = count + 1
      
      // Apply diminishing boost for multiple results from same video
      const diversityBoost = count === 0 ? 1.0 : (1.0 - (count * 0.1))
      
      return {
        ...result,
        relevanceScore: result.relevanceScore * Math.max(diversityBoost, 0.5)
      }
    })
  }

  /**
   * Calculate confidence score based on similarity
   */
  private calculateConfidence(similarityScore: number): number {
    // Map similarity score (0-1) to confidence (0-1)
    // Higher similarity = higher confidence
    if (similarityScore >= 0.9) return 1.0
    if (similarityScore >= 0.8) return 0.9
    if (similarityScore >= 0.7) return 0.8
    if (similarityScore >= 0.6) return 0.7
    return Math.max(similarityScore, 0.5)
  }

  /**
   * Get statistics about the search index
   */
  async getSearchStats(): Promise<{
    totalVideos: number
    totalChunks: number
    avgChunksPerVideo: number
    recentlyProcessed: number
  }> {
    try {
      const [videosResult, chunksResult] = await Promise.all([
        supabaseAdmin
          .from('video_transcripts')
          .select('id, processed_at'),
        supabaseAdmin
          .from('transcript_chunks')
          .select('id')
      ])

      const totalVideos = videosResult.data?.length || 0
      const totalChunks = chunksResult.data?.length || 0
      const avgChunksPerVideo = totalVideos > 0 ? Math.round(totalChunks / totalVideos) : 0
      
      // Count videos processed in last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const recentlyProcessed = videosResult.data?.filter(v => 
        v.processed_at && v.processed_at > yesterday
      ).length || 0

      return {
        totalVideos,
        totalChunks,
        avgChunksPerVideo,
        recentlyProcessed
      }
    } catch (error) {
      console.error('Failed to get search stats:', error)
      return {
        totalVideos: 0,
        totalChunks: 0,
        avgChunksPerVideo: 0,
        recentlyProcessed: 0
      }
    }
  }

  /**
   * Test vector search functionality with a sample query
   */
  async testSearch(sampleQuery: string = "how to build in Roblox Studio"): Promise<{
    success: boolean
    results: SearchResult[]
    stats: any
    error?: string
  }> {
    try {
      console.log('🧪 Testing vector search...')
      
      const stats = await this.getSearchStats()
      console.log('📊 Search Stats:', stats)
      
      if (stats.totalChunks === 0) {
        return {
          success: false,
          results: [],
          stats,
          error: 'No transcript chunks found in database. Process videos first.'
        }
      }

      const searchResponse = await this.searchTranscripts(sampleQuery, { maxResults: 5 })
      
      console.log('🔍 Sample search results:')
      searchResponse.results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title} (${result.relevanceScore.toFixed(3)})`)
        console.log(`   ${result.chunkText.substring(0, 100)}...`)
      })

      return {
        success: true,
        results: searchResponse.results,
        stats
      }
    } catch (error) {
      console.error('❌ Search test failed:', error)
      return {
        success: false,
        results: [],
        stats: await this.getSearchStats(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}