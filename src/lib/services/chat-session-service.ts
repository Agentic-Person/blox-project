/**
 * Chat Session Service
 * Handles persistent chat conversation storage for Blox Wizard
 * Stores messages in Supabase and maintains session state
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  videoContext?: {
    videoId?: string
    title?: string
    youtubeId?: string
    currentTime?: number
    transcript?: string
  }
  videoReferences?: Array<{
    title: string
    youtubeId: string
    timestamp: string
    relevantSegment: string
    thumbnailUrl: string
    confidence: number
  }>
  suggestedQuestions?: string[]
  metadata?: Record<string, any>
}

export interface Conversation {
  id: string
  sessionId: string
  title?: string
  lastMessageAt: Date
  createdAt: Date
  messageCount?: number
}

class ChatSessionService {
  private sessionIdKey = 'blox_wizard_session_id'
  private currentSessionId: string | null = null

  /**
   * Get or create a session ID
   * Persists in localStorage and creates DB record if needed
   */
  async getOrCreateSessionId(userId?: string): Promise<string> {
    // Return cached session ID if available
    if (this.currentSessionId) {
      return this.currentSessionId
    }

    // Check localStorage first
    if (typeof window !== 'undefined') {
      const storedSessionId = localStorage.getItem(this.sessionIdKey)
      if (storedSessionId) {
        this.currentSessionId = storedSessionId
        return storedSessionId
      }
    }

    // Generate new session ID
    const newSessionId = this.generateSessionId()
    this.currentSessionId = newSessionId

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.sessionIdKey, newSessionId)
    }

    // Create conversation record in database (if user authenticated)
    if (userId) {
      try {
        await this.createConversation(userId, newSessionId)
      } catch (error) {
        console.error('Failed to create conversation record:', error)
        // Continue anyway - we can still use the session ID
      }
    }

    return newSessionId
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 11)
    return `blox_session_${timestamp}_${random}`
  }

  /**
   * Create a new conversation in the database
   */
  private async createConversation(
    userId: string,
    sessionId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        session_id: sessionId,
        last_message_at: new Date().toISOString()
      })

    if (error) {
      // Ignore duplicate key errors (conversation already exists)
      if (!error.message.includes('duplicate')) {
        throw error
      }
    }
  }

  /**
   * Save a message to the database
   */
  async saveMessage(
    message: ChatMessage,
    userId?: string
  ): Promise<boolean> {
    try {
      const sessionId = await this.getOrCreateSessionId(userId)

      // Get or create conversation
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (convError && !convError.message.includes('No rows')) {
        console.error('Error fetching conversation:', convError)
        return false
      }

      let conversationId = conversation?.id

      // Create conversation if it doesn't exist
      if (!conversationId && userId) {
        const { data: newConv, error: createError } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: userId,
            session_id: sessionId,
            last_message_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (createError) {
          console.error('Error creating conversation:', createError)
          return false
        }

        conversationId = newConv.id
      }

      // If still no conversation ID, user might not be authenticated
      if (!conversationId) {
        console.warn('Cannot save message: No conversation ID and no user authenticated')
        return false
      }

      // Save message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          video_context: message.videoContext || null,
          video_references: message.videoReferences || null,
          suggested_questions: message.suggestedQuestions || null,
          metadata: message.metadata || null,
          created_at: message.timestamp.toISOString()
        })

      if (messageError) {
        console.error('Error saving message:', messageError)
        return false
      }

      return true
    } catch (error) {
      console.error('Unexpected error saving message:', error)
      return false
    }
  }

  /**
   * Load conversation history
   */
  async loadConversationHistory(
    sessionId?: string,
    userId?: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      const targetSessionId = sessionId || await this.getOrCreateSessionId(userId)

      const { data, error } = await supabase
        .rpc('get_conversation_with_messages', {
          p_session_id: targetSessionId,
          p_user_id: userId,
          message_limit: limit
        })

      if (error) {
        console.error('Error loading conversation history:', error)
        return []
      }

      if (!data || data.length === 0) {
        return []
      }

      // Group messages by conversation
      const messages: ChatMessage[] = data
        .filter((row: any) => row.message_id) // Only rows with messages
        .map((row: any) => ({
          id: row.message_id,
          role: row.message_role as 'user' | 'assistant' | 'system',
          content: row.message_content,
          timestamp: new Date(row.message_created_at),
          videoContext: row.message_video_context,
          videoReferences: row.message_video_references,
          suggestedQuestions: row.message_suggested_questions
        }))

      return messages
    } catch (error) {
      console.error('Unexpected error loading conversation:', error)
      return []
    }
  }

  /**
   * Start a new conversation (clear session)
   */
  async startNewConversation(userId?: string): Promise<string> {
    const newSessionId = this.generateSessionId()
    this.currentSessionId = newSessionId

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.sessionIdKey, newSessionId)
    }

    // Create conversation record if user authenticated
    if (userId) {
      try {
        await this.createConversation(userId, newSessionId)
      } catch (error) {
        console.error('Failed to create new conversation:', error)
      }
    }

    return newSessionId
  }

  /**
   * Get user's recent conversations (for history sidebar)
   */
  async getUserConversations(
    userId: string,
    limit: number = 20
  ): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_conversations', {
          p_user_id: userId,
          conversation_limit: limit
        })

      if (error) {
        console.error('Error fetching user conversations:', error)
        return []
      }

      return (data || []).map((row: any) => ({
        id: row.conversation_id,
        sessionId: row.session_id,
        title: row.title,
        lastMessageAt: new Date(row.last_message_at),
        createdAt: new Date(row.last_message_at), // Approximate
        messageCount: parseInt(row.message_count)
      }))
    } catch (error) {
      console.error('Unexpected error fetching conversations:', error)
      return []
    }
  }

  /**
   * Switch to a different conversation
   */
  async switchConversation(sessionId: string): Promise<void> {
    this.currentSessionId = sessionId

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.sessionIdKey, sessionId)
    }
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(
    sessionId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting conversation:', error)
        return false
      }

      // If deleted conversation was current, start new one
      if (this.currentSessionId === sessionId) {
        await this.startNewConversation(userId)
      }

      return true
    } catch (error) {
      console.error('Unexpected error deleting conversation:', error)
      return false
    }
  }

  /**
   * Get current session ID (without creating if doesn't exist)
   */
  getCurrentSessionId(): string | null {
    if (this.currentSessionId) {
      return this.currentSessionId
    }

    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.sessionIdKey)
    }

    return null
  }

  /**
   * Clear session (logout or reset)
   */
  clearSession(): void {
    this.currentSessionId = null

    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.sessionIdKey)
    }
  }
}

// Export singleton instance
export const chatSessionService = new ChatSessionService()
export default chatSessionService
