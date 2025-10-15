/**
 * useChatSession Hook
 * React hook for managing persistent chat sessions in Blox Wizard
 */

import { useState, useEffect, useCallback } from 'react'
import { chatSessionService, type ChatMessage, type Conversation } from '@/lib/services/chat-session-service'
import { useUser } from '@clerk/nextjs'

interface UseChatSessionReturn {
  sessionId: string | null
  messages: ChatMessage[]
  isLoading: boolean
  isLoadingHistory: boolean

  // Message operations
  saveMessage: (message: ChatMessage) => Promise<boolean>
  loadHistory: () => Promise<void>

  // Session operations
  startNewConversation: () => Promise<string>
  switchConversation: (sessionId: string) => Promise<void>

  // Conversation management
  recentConversations: Conversation[]
  loadRecentConversations: () => Promise<void>
  deleteConversation: (sessionId: string) => Promise<boolean>

  // State
  clearSession: () => void
}

export function useChatSession(): UseChatSessionReturn {
  const { user, isLoaded } = useUser()
  const userId = user?.id

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  /**
   * Initialize session on mount
   */
  useEffect(() => {
    // Only initialize if user data is loaded (avoid SSR issues)
    if (!isLoaded) return

    const initSession = async () => {
      try {
        const id = await chatSessionService.getOrCreateSessionId(userId)
        setSessionId(id)
      } catch (error) {
        console.error('Failed to initialize session:', error)
      }
    }

    initSession()
  }, [userId, isLoaded])

  /**
   * Load conversation history when session ID changes
   */
  useEffect(() => {
    if (sessionId) {
      loadHistory()
    }
  }, [sessionId])

  /**
   * Load conversation history
   */
  const loadHistory = useCallback(async () => {
    if (!sessionId) return

    setIsLoadingHistory(true)
    try {
      const history = await chatSessionService.loadConversationHistory(
        sessionId,
        userId,
        50 // Load last 50 messages
      )
      setMessages(history)
    } catch (error) {
      console.error('Failed to load conversation history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [sessionId, userId])

  /**
   * Save a message to the database and update local state
   */
  const saveMessage = useCallback(async (message: ChatMessage): Promise<boolean> => {
    setIsLoading(true)
    try {
      const success = await chatSessionService.saveMessage(message, userId)

      if (success) {
        // Add to local state
        setMessages(prev => [...prev, message])
      }

      return success
    } catch (error) {
      console.error('Failed to save message:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  /**
   * Start a new conversation
   */
  const startNewConversation = useCallback(async (): Promise<string> => {
    setIsLoading(true)
    try {
      const newSessionId = await chatSessionService.startNewConversation(userId)
      setSessionId(newSessionId)
      setMessages([]) // Clear messages
      return newSessionId
    } catch (error) {
      console.error('Failed to start new conversation:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  /**
   * Switch to a different conversation
   */
  const switchConversation = useCallback(async (targetSessionId: string): Promise<void> => {
    setIsLoading(true)
    try {
      await chatSessionService.switchConversation(targetSessionId)
      setSessionId(targetSessionId)
      // History will be loaded by useEffect
    } catch (error) {
      console.error('Failed to switch conversation:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Load recent conversations for history sidebar
   */
  const loadRecentConversations = useCallback(async (): Promise<void> => {
    if (!userId) return

    try {
      const conversations = await chatSessionService.getUserConversations(userId, 20)
      setRecentConversations(conversations)
    } catch (error) {
      console.error('Failed to load recent conversations:', error)
    }
  }, [userId])

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(async (targetSessionId: string): Promise<boolean> => {
    if (!userId) return false

    try {
      const success = await chatSessionService.deleteConversation(targetSessionId, userId)

      if (success) {
        // Remove from recent conversations list
        setRecentConversations(prev =>
          prev.filter(conv => conv.sessionId !== targetSessionId)
        )

        // If deleted conversation was current, start new one
        if (targetSessionId === sessionId) {
          await startNewConversation()
        }
      }

      return success
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      return false
    }
  }, [userId, sessionId, startNewConversation])

  /**
   * Clear session (for logout)
   */
  const clearSession = useCallback(() => {
    chatSessionService.clearSession()
    setSessionId(null)
    setMessages([])
    setRecentConversations([])
  }, [])

  return {
    sessionId,
    messages,
    isLoading,
    isLoadingHistory,

    // Operations
    saveMessage,
    loadHistory,
    startNewConversation,
    switchConversation,

    // Conversation management
    recentConversations,
    loadRecentConversations,
    deleteConversation,

    // State
    clearSession
  }
}
