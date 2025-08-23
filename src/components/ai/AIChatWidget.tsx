'use client'

import { useState } from 'react'
import { Bot, X, Minimize2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMessage } from './ChatMessage'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: "Hi! I'm here to help with your Roblox development journey. What would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: `I understand you're asking about "${input}". Let me help you with that...`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMessage])
    }, 1000)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blox-teal to-blox-teal-dark rounded-full shadow-lg hover:scale-110 transition-transform z-50"
      >
        <Bot className="h-6 w-6 text-white" />
      </button>
    )
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 w-96 bg-blox-black-blue border border-blox-teal/20 rounded-lg shadow-xl z-50 transition-all ${
        isMinimized ? 'h-14' : 'h-[500px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-blox-teal/20">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blox-teal" />
          <span className="font-semibold">Blox Chat Wizard</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="flex gap-1">
          <Button
            onClick={() => setIsMinimized(!isMinimized)}
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 h-[380px]">
            <div className="space-y-3">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-blox-teal/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 bg-blox-second-dark-blue rounded-lg text-sm placeholder-blox-off-white/50 focus:outline-none focus:ring-1 focus:ring-blox-teal"
              />
              <Button
                onClick={handleSend}
                size="sm"
                className="bg-gradient-to-r from-blox-teal to-blox-teal-dark"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}