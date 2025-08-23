'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, Lock, Zap, Brain, Code, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm Blox Chat Wizard, your AI learning companion. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
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
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: isPremium 
          ? `I understand you're asking about "${input}". Let me provide you with a detailed explanation...`
          : "This feature requires a premium subscription. Upgrade to get unlimited AI assistance!",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const features = [
    { icon: Brain, title: 'Smart Learning', description: 'Personalized guidance based on your progress' },
    { icon: Code, title: 'Code Help', description: 'Debug and optimize your Roblox scripts' },
    { icon: Zap, title: 'Instant Answers', description: '24/7 support for all your questions' },
    { icon: HelpCircle, title: 'Project Ideas', description: 'Get creative suggestions for your games' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
          <Bot className="h-8 w-8" />
          Blox Chat Wizard
        </h1>
        <p className="text-blox-off-white mt-2">
          Your AI-powered learning companion for Roblox development
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="bg-blox-black-blue/50 border-blox-teal/20 h-[600px] flex flex-col">
            <CardHeader className="border-b border-blox-teal/20">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  AI Assistant
                </span>
                {!isPremium && (
                  <span className="flex items-center gap-1 text-sm text-yellow-500">
                    <Lock className="h-4 w-4" />
                    Limited Mode
                  </span>
                )}
              </CardTitle>
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
                      <p className="text-xs opacity-50 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
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
        </div>

        {/* Premium Features */}
        <div className="space-y-6">
          {!isPremium && (
            <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Upgrade to Premium
                </CardTitle>
                <CardDescription className="text-blox-off-white">
                  Unlock unlimited AI assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span> Unlimited questions
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span> Code debugging help
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span> Project guidance
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span> Priority support
                  </li>
                </ul>
                <Button
                  onClick={() => setIsPremium(true)}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500"
                >
                  Upgrade Now - 500 BLOX
                </Button>
              </CardContent>
            </Card>
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

          <Card className="bg-blox-black-blue/50 border-blox-teal/20">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                Explain current lesson
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                Debug my code
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                Suggest next steps
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                Review my progress
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}