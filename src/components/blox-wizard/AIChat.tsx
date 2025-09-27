'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Bot, 
  User,
  Sparkles,
  Code,
  Image,
  Mic,
  Paperclip,
  Calendar,
  Target,
  HelpCircle,
  BookOpen,
  Zap,
  ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAIJourney } from '@/hooks/useAIJourney'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: {
    type: 'code' | 'image' | 'link'
    content: string
    language?: string
  }[]
  suggestions?: string[]
}

interface QuickAction {
  icon: React.ElementType
  label: string
  prompt: string
  color: string
}

interface AIChatProps {
  className?: string
  onMessageSend?: (message: string) => void
  videoContext?: {
    title: string
    youtubeId: string
    currentTime: number
  }
}

const quickActions: QuickAction[] = [
  {
    icon: Calendar,
    label: 'Build Schedule',
    prompt: 'Build me a personalized learning schedule for this week',
    color: 'text-blue-400'
  },
  {
    icon: Target,
    label: 'Create Todo',
    prompt: 'Create a todo for my next learning objective',
    color: 'text-green-400'
  },
  {
    icon: HelpCircle,
    label: 'Reschedule Tasks',
    prompt: 'I need to reschedule my overdue tasks to tomorrow',
    color: 'text-yellow-400'
  },
  {
    icon: Code,
    label: 'Show Progress',
    prompt: 'Show me my learning progress and what I have scheduled',
    color: 'text-purple-400'
  },
  {
    icon: BookOpen,
    label: 'Plan Study Time',
    prompt: 'Help me plan the best times to study this week',
    color: 'text-pink-400'
  },
  {
    icon: Zap,
    label: 'Quick Schedule',
    prompt: 'Schedule practice time for tomorrow at 3pm',
    color: 'text-orange-400'
  }
]

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser ? 'bg-blox-teal' : 'bg-gradient-to-br from-blox-purple to-blox-teal'}`}>
          {isUser ? (
            <User className="h-4 w-4 text-white" />
          ) : (
            <Bot className="h-4 w-4 text-white" />
          )}
        </div>
        
        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl ${
            isUser 
              ? 'bg-blox-teal text-white rounded-tr-sm' 
              : 'bg-blox-second-dark-blue text-blox-white rounded-tl-sm'
          }`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            
            {/* Attachments */}
            {message.attachments && (
              <div className="mt-3 space-y-2">
                {message.attachments.map((attachment, idx) => (
                  <div key={idx} className={`p-2 rounded-lg ${
                    isUser ? 'bg-black/20' : 'bg-blox-off-white/10'
                  }`}>
                    {attachment.type === 'code' && (
                      <pre className="text-xs overflow-x-auto">
                        <code>{attachment.content}</code>
                      </pre>
                    )}
                    {attachment.type === 'image' && (
                      <img 
                        src={attachment.content} 
                        alt="Attachment" 
                        className="max-w-full rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          <p className="text-xs text-blox-off-white/50 mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
          
          {/* Suggestions */}
          {message.suggestions && !isUser && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.suggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant="outline"
                  className="text-xs border-blox-teal/30 hover:border-blox-teal 
                    hover:bg-blox-teal/10"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function AIChat({ className = '', onMessageSend }: AIChatProps) {
  const { journey, getNextAction } = useAIJourney()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI learning companion. I'm here to help you master ${
        journey?.gameTitle || 'Roblox development'
      }. How can I assist you today?`,
      timestamp: new Date(),
      suggestions: ['Show my progress', 'What should I learn next?', 'I have a question']
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    
    // Call the actual API
    try {
      const messageToSend = input
      
      const response = await fetch('/api/chat/blox-wizard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          sessionId: `session_${Date.now()}`,
          userId: 'user',
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
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        suggestions: data.suggestedQuestions || ['Tell me more', 'Show examples', 'What\'s next?']
      }
      
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
      
      if (onMessageSend) {
        onMessageSend(messageToSend)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Fallback message on error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date(),
        suggestions: ['Try again', 'Ask something else']
      }
      
      setMessages(prev => [...prev, errorMessage])
      setIsTyping(false)
    }
  }
  
  const handleQuickAction = (action: QuickAction) => {
    setInput(action.prompt)
    setTimeout(() => handleSend(), 100)
  }
  
  return (
    <div className={`${className} flex flex-col h-full`}>
      <Card className="glass-card-teal flex-1 flex flex-col">
        <CardHeader className="border-b border-blox-off-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blox-purple/20 to-blox-teal/20 rounded-lg">
                <Bot className="h-5 w-5 text-blox-teal" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Learning Assistant</CardTitle>
                <p className="text-xs text-blox-off-white/60">
                  Always here to help • Powered by advanced AI
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                Online
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowQuickActions(!showQuickActions)}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${
                  showQuickActions ? '' : 'rotate-180'
                }`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Quick Actions */}
          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 border-b border-blox-off-white/10 bg-blox-second-dark-blue/20"
              >
                <p className="text-xs text-blox-off-white/60 mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {quickActions.map((action, idx) => {
                    const Icon = action.icon
                    return (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAction(action)}
                        className="flex items-center gap-2 p-2 rounded-lg bg-blox-off-white/5 
                          hover:bg-blox-off-white/10 border border-blox-off-white/10 
                          hover:border-blox-teal/30 transition-all text-left"
                      >
                        <Icon className={`h-4 w-4 ${action.color}`} />
                        <span className="text-xs text-blox-white">
                          {action.label}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence>
              {messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </AnimatePresence>
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blox-purple to-blox-teal 
                  flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="px-4 py-3 bg-blox-second-dark-blue rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-blox-teal rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-blox-teal rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-blox-teal rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-blox-off-white/10 bg-blox-second-dark-blue/20">
            <div className="flex gap-2">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 p-0 text-blox-off-white/60 hover:text-blox-white"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 p-0 text-blox-off-white/60 hover:text-blox-white"
                >
                  <Image className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 p-0 text-blox-off-white/60 hover:text-blox-white"
                >
                  <Code className="h-4 w-4" />
                </Button>
              </div>
              
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 bg-blox-off-white/5 border-blox-off-white/20 
                  focus:border-blox-teal text-blox-white"
              />
              
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-gradient-to-r from-blox-teal to-blox-teal-dark"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-xs text-blox-off-white/40 mt-2 text-center">
              AI responses are context-aware based on your learning progress
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}