'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, Lock, Zap, Brain, Code, HelpCircle, X, Minimize2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UpgradePrompt } from './UpgradePrompt'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface VideoContext {
  videoId: string
  title: string
  youtubeId: string
  transcript?: string
  currentTime?: number
  duration?: string
}

interface BloxChatInterfaceProps {
  videoContext?: VideoContext
  mode?: 'embedded' | 'standalone' | 'widget'
  showUpgrade?: boolean
  className?: string
}

export function BloxChatInterface({ 
  videoContext,
  mode = 'embedded',
  showUpgrade = true,
  className = ''
}: BloxChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: videoContext 
        ? `Hello! I'm here to help you with "${videoContext.title}". Feel free to ask me anything about this video or Roblox development!`
        : "Hello! I'm Blox Chat Wizard, your AI learning companion. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [usageRemaining, setUsageRemaining] = useState(3)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    setIsMounted(true)
    // Initialize session ID on component mount
    if (!currentSessionId) {
      setCurrentSessionId(`blox_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [])
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    if (!isPremium && usageRemaining <= 0) {
      const limitMessage: Message = {
        id: messages.length + 1,
        role: 'assistant',
        content: "You've reached your free question limit. Upgrade to Premium for unlimited AI assistance!",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, limitMessage])
      return
    }

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      // Use the persistent session ID from component state
      const sessionId = currentSessionId || `blox_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const response = await fetch('/api/chat/blox-wizard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          sessionId,
          userId: 'user_123', // TODO: Get from auth context
          videoContext: videoContext ? {
            videoId: videoContext.videoId,
            title: videoContext.title,
            youtubeId: videoContext.youtubeId,
            transcript: videoContext.transcript,
            currentTime: videoContext.currentTime,
            duration: videoContext.duration
          } : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      const aiMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: data.answer || "I understand your question. Let me help you with that...",
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, aiMessage])
      
      // Update usage remaining
      if (!isPremium && data.usageRemaining !== undefined) {
        setUsageRemaining(data.usageRemaining)
      }

      // Log successful interaction for analytics
      console.log('Chat interaction successful:', {
        sessionId,
        responseTime: data.responseTime,
        citationCount: data.citations?.length || 0,
        hasVideoContext: !!videoContext
      })

    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: error instanceof Error 
          ? `Sorry, there was an error: ${error.message}. Please try again.`
          : "Sorry, I couldn't process your request. Please try again.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const features = [
    { icon: Brain, title: 'Smart Learning', description: 'Personalized guidance based on your progress' },
    { icon: Code, title: 'Code Help', description: 'Debug and optimize your Roblox scripts' },
    { icon: Zap, title: 'Instant Answers', description: '24/7 support for all your questions' },
    { icon: HelpCircle, title: 'Project Ideas', description: 'Get creative suggestions for your games' },
  ]

  const quickActions = videoContext ? [
    `Explain this part of ${videoContext.title}`,
    'What are the key concepts here?',
    'Show me similar tutorials',
    'Help me practice this'
  ] : [
    'Explain current lesson',
    'Debug my code',
    'Suggest next steps',
    'Review my progress'
  ]

  if (mode === 'widget' && isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 w-96 bg-blox-black-blue border border-blox-teal/20 rounded-lg shadow-xl z-50">
        <div className="flex items-center justify-between p-3 border-b border-blox-teal/20">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blox-teal" />
            <span className="font-semibold">Blox Chat Wizard</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <Button
            onClick={() => setIsMinimized(false)}
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 ${showUpgrade ? 'lg:grid-cols-3' : ''} gap-6 ${className}`}>
      <div className={showUpgrade ? 'lg:col-span-2' : ''}>
        <Card className="bg-blox-black-blue/50 border-blox-teal/20 h-[600px] flex flex-col">
          <CardHeader className="border-b border-blox-teal/20">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blox-teal" />
                <span>Blox Chat Wizard</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </span>
              {!isPremium && (
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-500">
                    {usageRemaining} questions left
                  </span>
                  <Lock className="h-4 w-4 text-yellow-500" />
                </span>
              )}
            </CardTitle>
            {videoContext && (
              <CardDescription className="text-blox-off-white text-xs">
                Currently watching: {videoContext.title}
              </CardDescription>
            )}
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
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {isMounted && (
                      <p className="text-xs opacity-50 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
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
            <div className="flex gap-2 mb-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={videoContext 
                  ? "Ask about this video or Roblox development..." 
                  : "Ask me anything about Roblox development..."}
                className="flex-1 px-4 py-2 bg-blox-second-dark-blue rounded-lg text-blox-white placeholder-blox-off-white/50 focus:outline-none focus:ring-2 focus:ring-blox-teal"
                disabled={!isPremium && usageRemaining <= 0}
              />
              <Button
                onClick={handleSend}
                className="bg-gradient-to-r from-blox-teal to-blox-teal-dark"
                disabled={!isPremium && usageRemaining <= 0}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            {mode === 'embedded' && (
              <div className="flex gap-2 flex-wrap">
                {quickActions.slice(0, 2).map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(action)}
                    className="text-xs"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {showUpgrade && (
        <div className="space-y-6">
          {!isPremium && (
            <UpgradePrompt 
              onUpgrade={() => setIsPremium(true)}
            />
          )}

          <Card className="bg-blox-black-blue/50 border-blox-teal/20">
            <CardHeader>
              <CardTitle>AI Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div key={index} className="flex gap-3">
                      <div className="p-2 bg-blox-teal/10 rounded-lg h-fit">
                        <Icon className="h-5 w-5 text-blox-teal" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{feature.title}</p>
                        <p className="text-xs text-blox-off-white">{feature.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {mode === 'standalone' && (
            <Card className="bg-blox-black-blue/50 border-blox-teal/20">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, index) => (
                  <Button 
                    key={index}
                    variant="outline" 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setInput(action)}
                  >
                    {action}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}