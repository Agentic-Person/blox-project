'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, Crown, MessageSquare, Zap, Brain, Code, HelpCircle, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useChatSession } from '@/hooks/useChatSession'
import { useUser } from '@/lib/providers'
import toast from 'react-hot-toast'

interface VideoReference {
  title: string
  youtubeId: string
  timestamp: string
  relevantSegment: string
  thumbnailUrl: string
  confidence: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  videoReferences?: VideoReference[]
  suggestedQuestions?: string[]
  isLoading?: boolean
}

export function BloxWizardDashboard() {
  // Get authenticated user
  const { user, isLoaded } = useUser()

  // Use persistent chat session
  const {
    sessionId,
    messages: persistedMessages,
    isLoadingHistory,
    saveMessage,
    startNewConversation
  } = useChatSession()

  // Transform persisted messages to component format
  const messages: Message[] = persistedMessages
    .filter(msg => msg.role !== 'system') // Filter out system messages
    .map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.timestamp,
      videoReferences: msg.videoReferences,
      suggestedQuestions: msg.suggestedQuestions
    }))

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPremium] = useState(true) // No premium restrictions
  const [remainingQuestions] = useState(999) // Unlimited questions
  const [isMounted, setIsMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Add initial welcome message if empty and not loading
  useEffect(() => {
    if (messages.length === 0 && !isLoadingHistory) {
      const welcomeMessage = {
        id: 'welcome-dashboard-' + Date.now(),
        role: 'assistant' as const,
        content: "Hello! I'm Blox Chat Wizard, your AI learning companion. How can I help you today?",
        timestamp: new Date(),
      }
      saveMessage(welcomeMessage)
    }
  }, [messages.length, isLoadingHistory, saveMessage])

  // Sample questions like ChatGPT - 6 questions for 2x3 grid
  const sampleQuestions = [
    "How do I create a teleport script?",
    "What's new in Roblox Studio 2024?",
    "How do I make a GUI that follows the player?",
    "Show me how to use TweenService",
    "How do I create a basic game loop?",
    "What are the best practices for Roblox scripting?"
  ]

  // Removed automatic scroll for dashboard version to prevent page jumping
  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  // }

  // useEffect(() => {
  //   scrollToBottom()
  // }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    // Check if user is authenticated
    if (!user?.id) {
      toast.error('Please log in to use the AI Chat', {
        icon: '🔒',
        duration: 4000
      })
      return
    }

    // Check usage limits for free users
    if (!isPremium && remainingQuestions <= 0) {
      toast.error('You\'ve reached your question limit. Upgrade to Premium!', {
        icon: '⭐',
        duration: 5000
      })
      return
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: input,
      timestamp: new Date(),
    }

    setInput('')

    // Save user message to database
    const userSaved = await saveMessage(userMessage)

    if (!userSaved) {
      toast.error('Failed to save your message. Please check your connection.', {
        icon: '⚠️',
        duration: 4000
      })
      console.error('[Dashboard] User message failed to save')
      return
    }

    setIsLoading(true)

    // Call the actual API
    try {
      const messageToSend = userMessage.content

      const response = await fetch('/api/chat/blox-wizard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          sessionId: sessionId || `dashboard_session_${Date.now()}`,
          userId: user.id,
          conversationHistory: messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          responseStyle: 'beginner'
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      const aiMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: data.answer,
        timestamp: new Date(),
        videoReferences: data.videoReferences,
        suggestedQuestions: data.suggestedQuestions
      }

      // Save AI message to database
      const aiSaved = await saveMessage(aiMessage)

      if (!aiSaved) {
        toast.error('AI response received but failed to save', {
          icon: '⚠️',
          duration: 4000
        })
        console.error('[Dashboard] AI message failed to save')
      }

      setIsLoading(false)
    } catch (error) {
      console.error('[Dashboard] Failed to send message:', error)

      toast.error('Failed to get AI response. Please try again.', {
        icon: '❌',
        duration: 5000
      })

      // Fallback message on error
      const errorMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date(),
      }

      await saveMessage(errorMessage)
      setIsLoading(false)
    }
  }

  const handleQuestionSelect = (question: string) => {
    setInput(question)
    setTimeout(() => handleSend(), 100)
  }

  const features = [
    { icon: Brain, title: 'Smart Learning', description: 'Personalized guidance based on your progress' },
    { icon: Code, title: 'Code Help', description: 'Debug and optimize your Roblox scripts' },
    { icon: Zap, title: 'Instant Answers', description: '24/7 support for all your questions' },
    { icon: HelpCircle, title: 'Project Ideas', description: 'Get creative suggestions for your games' },
  ]

  // Show loading indicator while history loads
  if (isLoadingHistory) {
    return (
      <div className="space-y-4">
        <Card className="bg-blox-black-blue/50 border-blox-teal/20 h-[500px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blox-teal mx-auto mb-4"></div>
            <p className="text-blox-off-white">Loading conversation...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface - Center (Match full page) */}
        <div className="lg:col-span-2">
          <Card className="bg-blox-black-blue/50 border-blox-teal/20 h-[500px] flex flex-col">
            <CardHeader className="border-b border-blox-teal/20">
              <div className="space-y-2">
                {/* Main Title and Description */}
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blox-teal" />
                  <div>
                    <h2 className="text-lg font-semibold text-blox-white">Blox Chat Wizard</h2>
                    <p className="text-xs text-blox-off-white">Your AI-powered learning companion for Roblox development</p>
                  </div>
                </div>
                
                {/* AI Assistant Status */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-blox-light-blue-gray">AI Assistant</span>
                  </span>
                  {!isPremium && (
                    <span className="flex items-center gap-1 text-xs text-yellow-500">
                      <Lock className="h-3 w-3" />
                      Limited Mode
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blox-teal text-white'
                          : 'bg-blox-second-dark-blue text-blox-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {isMounted && (
                        <p className="text-xs opacity-50 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-blox-second-dark-blue p-3 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blox-teal rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blox-teal rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-blox-teal rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            <div className="p-4 border-t border-blox-teal/20">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about Roblox development..."
                  className="flex-1 px-4 py-2 bg-blox-second-dark-blue rounded-lg text-blox-white placeholder-blox-off-white/50 focus:outline-none focus:ring-2 focus:ring-blox-teal"
                />
                <Button
                  onClick={handleSend}
                  className="bg-gradient-to-r from-blox-teal to-blox-teal-dark"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Sample Questions - Underneath Chat Interface */}
          <div className="lg:col-span-2 mt-4">
            <Card className="bg-blox-black-blue/50 border-blox-teal/20">
              <CardHeader>
                <CardTitle className="text-sm">Try asking me about:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {sampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      onClick={() => handleQuestionSelect(question)}
                      variant="outline"
                      className="justify-start text-left h-auto py-3 px-3 text-xs border-blox-glass-border hover:border-blox-teal text-blox-off-white hover:text-blox-white hover:bg-blox-second-dark-blue/30"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Sidebar - Right Side (Match full page) */}
        <div className="space-y-4">
          {/* Premium Upgrade */}
          {!isPremium && (
            <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Upgrade to Pro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-blox-off-white/90 leading-relaxed">
                  Unlock Blox Chat Wizard - your personal AI learning assistant
                </p>
                <Button
                  onClick={() => window.location.href = '/blox-wizard'}
                  className="group flex items-center justify-center gap-2 w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-xs"
                >
                  <span>Learn more</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* AI Capabilities */}
          <Card className="bg-blox-black-blue/50 border-blox-teal/20">
            <CardHeader>
              <CardTitle className="text-sm">AI Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {features.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div key={index} className="flex gap-2">
                      <div className="p-1.5 bg-blox-teal/10 rounded-lg h-fit">
                        <Icon className="h-3 w-3 text-blox-teal" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs">{feature.title}</p>
                        <p className="text-xs text-blox-off-white opacity-75">{feature.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Full View Link */}
          <div className="text-center">
            <Link href="/blox-wizard">
              <Button variant="outline" size="sm" className="text-blox-teal border-blox-teal hover:bg-blox-teal hover:text-white">
                Open Full Chat View
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
