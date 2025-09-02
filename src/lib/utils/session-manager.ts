/**
 * Session Management for Blox Wizard Chat
 * Handles user sessions, conversation history, and context persistence
 */

import { createSessionId } from '@/lib/services/n8n-integration'

export interface ChatSession {
  id: string
  userId: string
  startedAt: Date
  lastActivity: Date
  conversationHistory: ConversationMessage[]
  videoContext?: VideoContext
  userPreferences?: UserPreferences
  metadata: SessionMetadata
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  videoContext?: VideoContext
  citations?: CitationReference[]
  satisfaction?: number // 1-5 rating
}

export interface VideoContext {
  videoId: string
  title: string
  youtubeId: string
  transcript?: string
  currentTime?: number
  duration?: string
  moduleId?: string
  weekId?: string
  dayId?: string
}

export interface UserPreferences {
  responseStyle: 'detailed' | 'concise' | 'beginner' | 'advanced'
  preferredTopics: string[]
  learningLevel: 'beginner' | 'intermediate' | 'advanced'
  timeZone: string
  language: string
}

export interface SessionMetadata {
  userAgent: string
  ipAddress?: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  referrer?: string
  createdAt: Date
  updatedAt: Date
}

export interface CitationReference {
  id: number
  videoTitle: string
  timestamp: string
  url: string
  relevanceScore: number
}

export class ChatSessionManager {
  private sessions: Map<string, ChatSession> = new Map()
  private readonly maxHistoryLength: number
  private readonly sessionTimeout: number

  constructor(
    maxHistoryLength = 50,
    sessionTimeout = 3600000 // 1 hour in milliseconds
  ) {
    this.maxHistoryLength = maxHistoryLength
    this.sessionTimeout = sessionTimeout
    
    // Clean up expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000)
  }

  /**
   * Create or retrieve a chat session
   */
  getOrCreateSession(
    userId: string,
    videoContext?: VideoContext,
    userAgent = 'unknown'
  ): ChatSession {
    // Try to find existing active session for user
    const existingSession = this.findActiveSession(userId)
    
    if (existingSession && !this.isSessionExpired(existingSession)) {
      // Update last activity and video context if provided
      existingSession.lastActivity = new Date()
      if (videoContext) {
        existingSession.videoContext = videoContext
      }
      return existingSession
    }

    // Create new session
    const sessionId = createSessionId(userId)
    const now = new Date()
    
    const newSession: ChatSession = {
      id: sessionId,
      userId,
      startedAt: now,
      lastActivity: now,
      conversationHistory: [],
      videoContext,
      userPreferences: this.getDefaultPreferences(),
      metadata: {
        userAgent,
        deviceType: this.detectDeviceType(userAgent),
        createdAt: now,
        updatedAt: now
      }
    }

    this.sessions.set(sessionId, newSession)
    return newSession
  }

  /**
   * Add a message to the conversation history
   */
  addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    citations?: CitationReference[],
    videoContext?: VideoContext
  ): ConversationMessage | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const message: ConversationMessage = {
      id: messageId,
      role,
      content,
      timestamp: new Date(),
      videoContext,
      citations
    }

    session.conversationHistory.push(message)
    session.lastActivity = new Date()
    session.metadata.updatedAt = new Date()

    // Trim history if it exceeds max length
    if (session.conversationHistory.length > this.maxHistoryLength) {
      session.conversationHistory = session.conversationHistory.slice(-this.maxHistoryLength)
    }

    return message
  }

  /**
   * Get conversation history for a session
   */
  getConversationHistory(sessionId: string, limit?: number): ConversationMessage[] {
    const session = this.sessions.get(sessionId)
    if (!session) return []

    const history = session.conversationHistory
    return limit ? history.slice(-limit) : history
  }

  /**
   * Update user satisfaction for a message
   */
  updateMessageSatisfaction(sessionId: string, messageId: string, satisfaction: number): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const message = session.conversationHistory.find(msg => msg.id === messageId)
    if (!message) return false

    message.satisfaction = Math.max(1, Math.min(5, satisfaction)) // Clamp between 1-5
    session.metadata.updatedAt = new Date()
    
    return true
  }

  /**
   * Update video context for a session
   */
  updateVideoContext(sessionId: string, videoContext: VideoContext): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.videoContext = videoContext
    session.lastActivity = new Date()
    session.metadata.updatedAt = new Date()
    
    return true
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(sessionId: string, preferences: Partial<UserPreferences>): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.userPreferences = {
      ...session.userPreferences!,
      ...preferences
    }
    session.metadata.updatedAt = new Date()
    
    return true
  }

  /**
   * Get session information
   */
  getSession(sessionId: string): ChatSession | null {
    const session = this.sessions.get(sessionId)
    if (!session || this.isSessionExpired(session)) {
      return null
    }
    return session
  }

  /**
   * End a session
   */
  endSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): ChatSession[] {
    return Array.from(this.sessions.values())
      .filter(session => 
        session.userId === userId && 
        !this.isSessionExpired(session)
      )
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    totalMessages: number
    userMessages: number
    assistantMessages: number
    averageSatisfaction: number
    sessionDuration: number
    lastActivity: Date
  } | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const { conversationHistory, startedAt, lastActivity } = session
    const userMessages = conversationHistory.filter(msg => msg.role === 'user').length
    const assistantMessages = conversationHistory.filter(msg => msg.role === 'assistant').length
    
    const satisfactionRatings = conversationHistory
      .map(msg => msg.satisfaction)
      .filter(rating => rating !== undefined) as number[]
    
    const averageSatisfaction = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
      : 0

    return {
      totalMessages: conversationHistory.length,
      userMessages,
      assistantMessages,
      averageSatisfaction,
      sessionDuration: lastActivity.getTime() - startedAt.getTime(),
      lastActivity
    }
  }

  /**
   * Export session data (for analytics or backup)
   */
  exportSession(sessionId: string): ChatSession | null {
    const session = this.sessions.get(sessionId)
    return session ? JSON.parse(JSON.stringify(session)) : null
  }

  // Private helper methods

  private findActiveSession(userId: string): ChatSession | undefined {
    return Array.from(this.sessions.values())
      .find(session => 
        session.userId === userId && 
        !this.isSessionExpired(session)
      )
  }

  private isSessionExpired(session: ChatSession): boolean {
    return Date.now() - session.lastActivity.getTime() > this.sessionTimeout
  }

  private cleanupExpiredSessions(): void {
    const expiredSessionIds: string[] = []
    
    for (const [sessionId, session] of this.sessions) {
      if (this.isSessionExpired(session)) {
        expiredSessionIds.push(sessionId)
      }
    }
    
    expiredSessionIds.forEach(sessionId => {
      this.sessions.delete(sessionId)
    })

    if (expiredSessionIds.length > 0) {
      console.log(`Cleaned up ${expiredSessionIds.length} expired chat sessions`)
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      responseStyle: (process.env.DEFAULT_RESPONSE_STYLE as any) || 'detailed',
      preferredTopics: [],
      learningLevel: 'beginner',
      timeZone: 'UTC',
      language: 'en'
    }
  }

  private detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
    const ua = userAgent.toLowerCase()
    
    if (ua.includes('mobile') && !ua.includes('tablet')) {
      return 'mobile'
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet'
    } else {
      return 'desktop'
    }
  }
}

// Singleton instance for application use
export const chatSessionManager = new ChatSessionManager(
  parseInt(process.env.MAX_CONVERSATION_HISTORY || '50'),
  parseInt(process.env.CACHE_SESSION_TTL || '3600') * 1000
)

/**
 * Helper function to create a user-friendly session summary
 */
export function createSessionSummary(session: ChatSession): string {
  const stats = new ChatSessionManager().getSessionStats(session.id)
  if (!stats) return 'Session summary unavailable'

  const duration = Math.round(stats.sessionDuration / (1000 * 60)) // minutes
  const satisfactionText = stats.averageSatisfaction > 0 
    ? `Average satisfaction: ${stats.averageSatisfaction.toFixed(1)}/5`
    : 'No satisfaction ratings yet'

  return `Session with ${stats.totalMessages} messages (${stats.userMessages} questions, ${stats.assistantMessages} responses) over ${duration} minutes. ${satisfactionText}.`
}