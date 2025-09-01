/**
 * N8n Integration Service for Blox Wizard
 * Handles communication with N8n workflow endpoints
 */

export interface N8nConfig {
  baseUrl: string
  apiKey?: string
  timeout?: number
}

export interface ChatQueryRequest {
  eventType: 'chat_query'
  userId: string
  sessionId: string
  data: {
    query: string
    responseStyle?: 'detailed' | 'concise' | 'beginner' | 'advanced'
    conversationHistory?: ConversationMessage[]
    videoContext?: VideoContext
  }
  timestamp: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface VideoContext {
  videoId: string
  title: string
  youtubeId: string
  transcript?: string
  currentTime?: number
  duration?: string
}

export interface N8nChatResponse {
  success: boolean
  data: {
    answer: string
    citations: Array<{
      id: number
      videoTitle: string
      timestamp: string
      url: string
      relevanceScore: number
    }>
    metrics: {
      qualityScore: number
      citationCount: number
      wordCount: number
      responseTimeMs: number
    }
    meta: {
      sessionId: string
      timestamp: string
      service: string
      version: string
    }
  }
}

export interface UserInteractionRequest {
  eventType: 'user_interaction'
  userId: string
  sessionId: string
  data: {
    interactionType: 'CHAT_QUERY' | 'VIDEO_WATCH' | 'TASK_COMPLETE'
    query?: string
    satisfaction?: number
    videoId?: string
    watchTime?: number
    completed?: boolean
  }
  timestamp: string
}

export class N8nIntegrationService {
  private config: N8nConfig

  constructor(config: N8nConfig) {
    this.config = {
      timeout: 30000, // 30 second default timeout
      ...config
    }
  }

  /**
   * Send chat query to N8n Knowledge Engine via Master Orchestrator
   */
  async sendChatQuery(request: ChatQueryRequest): Promise<N8nChatResponse> {
    try {
      const response = await this.sendToOrchestrator(request)
      
      if (!response.success) {
        throw new Error(`N8n orchestrator error: ${response.error || 'Unknown error'}`)
      }

      return response as N8nChatResponse
    } catch (error) {
      console.error('N8n chat query failed:', error)
      throw new Error(`Failed to process chat query: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Track user interaction via Analytics Engine
   */
  async trackInteraction(request: UserInteractionRequest): Promise<void> {
    try {
      await this.sendToOrchestrator(request)
    } catch (error) {
      // Don't throw on analytics errors - log only
      console.error('Failed to track interaction:', error)
    }
  }

  /**
   * Send event to N8n Master Orchestrator
   */
  private async sendToOrchestrator(payload: ChatQueryRequest | UserInteractionRequest): Promise<any> {
    const url = `${this.config.baseUrl}/webhook/orchestrator`
    
    const requestConfig: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.config.timeout!)
    }

    const response = await fetch(url, requestConfig)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`N8n API error (${response.status}): ${errorText}`)
    }

    return response.json()
  }

  /**
   * Health check for N8n system
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - just test if we can make a basic request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${this.config.baseUrl}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      console.error('N8n health check failed:', error)
      return false
    }
  }

  /**
   * Direct semantic search (bypassing orchestrator for speed)
   */
  async directSemanticSearch(query: string, userId: string): Promise<any> {
    try {
      const url = `${this.config.baseUrl}/webhook/semantic-search`
      
      const payload = {
        query,
        userId,
        sessionId: `search_${userId}_${Date.now()}`,
        maxResults: 5,
        minSimilarity: 0.7,
        timestamp: new Date().toISOString()
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeout!)
      })

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('Direct semantic search failed:', error)
      throw error
    }
  }

  /**
   * Direct answer generation (bypassing orchestrator for speed)
   */
  async directAnswerGeneration(query: string, searchResults: any[], userId: string, sessionId: string): Promise<N8nChatResponse> {
    try {
      const url = `${this.config.baseUrl}/webhook/answer-generator`
      
      const payload = {
        query,
        searchResults,
        userId,
        sessionId,
        conversationHistory: [], // TODO: Add conversation context
        responseStyle: 'detailed',
        maxTokens: 1000,
        timestamp: new Date().toISOString()
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeout!)
      })

      if (!response.ok) {
        throw new Error(`Answer generation API error: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('Direct answer generation failed:', error)
      throw error
    }
  }
}

/**
 * Factory function to create N8n service instance
 */
export function createN8nService(): N8nIntegrationService {
  const config: N8nConfig = {
    baseUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678',
    apiKey: process.env.N8N_API_KEY,
    timeout: parseInt(process.env.N8N_TIMEOUT || '30000')
  }

  if (!config.baseUrl) {
    throw new Error('N8N_WEBHOOK_URL environment variable is required')
  }

  return new N8nIntegrationService(config)
}

/**
 * Utility function to create user session ID
 */
export function createSessionId(userId: string): string {
  return `session_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Utility function to determine response style based on user context
 */
export function determineResponseStyle(
  userLevel?: string, 
  videoContext?: VideoContext
): 'detailed' | 'concise' | 'beginner' | 'advanced' {
  if (userLevel) {
    switch (userLevel.toLowerCase()) {
      case 'beginner': return 'beginner'
      case 'intermediate': return 'detailed'
      case 'advanced': return 'advanced'
      default: return 'detailed'
    }
  }

  // If watching a beginner video, use beginner style
  if (videoContext?.title.toLowerCase().includes('beginner')) {
    return 'beginner'
  }

  // Default to detailed explanations
  return 'detailed'
}