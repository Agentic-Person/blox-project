'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Image as ImageIcon, X, Download, ZoomIn } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'

interface Message {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  images?: string[]
  timestamp: Date
  isCurrentUser: boolean
}

interface TeamChatProps {
  team: {
    id: string
    name: string
  }
}

// Mock messages for demonstration - in production, these would come from the store
const mockMessages: Message[] = [
  {
    id: '1',
    userId: 'm1',
    userName: 'Alex',
    userAvatar: 'AR',
    content: "Hey team! I've been working on the tower defense mechanics. Check out my progress so far!",
    timestamp: new Date(Date.now() - 3600000),
    isCurrentUser: false
  },
  {
    id: '2',
    userId: 'm2',
    userName: 'BuilderPro',
    userAvatar: 'BP',
    content: "Looking great! I think we should add more particle effects to the towers when they shoot. What do you all think?",
    timestamp: new Date(Date.now() - 3000000),
    isCurrentUser: false
  },
  {
    id: '3',
    userId: 'm3',
    userName: 'UIWizard',
    userAvatar: 'UW',
    content: "Agree! Also, we need to finalize the UI design for the shop menu. Should we go with a sidebar or a popup modal?",
    timestamp: new Date(Date.now() - 2400000),
    isCurrentUser: false
  },
  {
    id: '4',
    userId: 'current',
    userName: 'You',
    userAvatar: 'ME',
    content: 'I think a radial menu would look more modern! Also, here are my notes on the tower design.',
    images: ['placeholder-image-1'],
    timestamp: new Date(Date.now() - 1800000),
    isCurrentUser: true
  },
  {
    id: '5',
    userId: 'm3',
    userName: 'UIWizard',
    userAvatar: 'UW',
    content: "Perfect! I'll prototype that today 🎨",
    timestamp: new Date(Date.now() - 1200000),
    isCurrentUser: false
  },
  {
    id: '6',
    userId: 'm4',
    userName: 'GameDev123',
    userAvatar: 'GD',
    content: "Just tested the tower placement - works great! Found a small bug where towers can overlap. I'll document it in the notes section.",
    timestamp: new Date(Date.now() - 600000),
    isCurrentUser: false
  }
]

export default function TeamChat({ team }: TeamChatProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const imageUrls: string[] = []
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            const result = e.target.result as string
            imageUrls.push(result)
            setSelectedImages(prev => [...prev, result])
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'))
    
    imageItems.forEach(item => {
      const file = item.getAsFile()
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            const result = e.target.result as string
            setSelectedImages(prev => [...prev, result])
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const sendMessage = () => {
    if (!newMessage.trim() && selectedImages.length === 0) return

    const message: Message = {
      id: Date.now().toString(),
      userId: 'current',
      userName: 'You',
      userAvatar: 'ME',
      content: newMessage,
      images: selectedImages.length > 0 ? selectedImages : undefined,
      timestamp: new Date(),
      isCurrentUser: true
    }

    setMessages([...messages, message])
    setNewMessage('')
    setSelectedImages([])

    // Simulate typing indicator for response
    setTimeout(() => {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          userId: 'm1',
          userName: 'Alex',
          userAvatar: 'AR',
          content: 'Great idea! Let me work on that.',
          timestamp: new Date(),
          isCurrentUser: false
        }
        setMessages(prev => [...prev, responseMessage])
      }, 2000)
    }, 500)
  }

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Card className="glass-card h-full flex flex-col">
      <div className="p-4 border-b border-blox-purple/20">
        <h3 className="text-lg font-semibold text-blox-white">Team Chat</h3>
        <p className="text-sm text-blox-off-white">#{team.name.toLowerCase().replace(/\s+/g, '-')}</p>
      </div>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.isCurrentUser ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
              message.isCurrentUser 
                ? 'bg-gradient-to-r from-blox-purple to-blox-teal' 
                : 'bg-blox-medium-blue-gray'
            }`}>
              {message.userAvatar}
            </div>
            <div className={`flex-1 max-w-[70%] ${message.isCurrentUser ? 'items-end' : ''}`}>
              <div className={`flex items-baseline gap-2 mb-1 ${message.isCurrentUser ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm font-medium text-blox-white">{message.userName}</span>
                <span className="text-xs text-blox-medium-blue-gray">
                  {format(message.timestamp, 'HH:mm')}
                </span>
              </div>
              <div className={`rounded-lg p-3 ${
                message.isCurrentUser 
                  ? 'bg-gradient-to-r from-blox-purple/20 to-blox-teal/20 border border-blox-purple/30' 
                  : 'bg-blox-dark-blue/50 border border-blox-purple/10'
              }`}>
                <p className="text-sm text-blox-white">{message.content}</p>
                {message.images && message.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {message.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <div className="bg-blox-medium-blue-gray/20 rounded-lg h-32 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-blox-medium-blue-gray" />
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <Button size="sm" variant="ghost" className="text-white">
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-white">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-blox-medium-blue-gray flex items-center justify-center text-xs font-bold">
              AR
            </div>
            <div className="flex-1 max-w-[70%]">
              <div className="rounded-lg p-3 bg-blox-dark-blue/50 border border-blox-purple/10">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blox-medium-blue-gray rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-blox-medium-blue-gray rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-blox-medium-blue-gray rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>

      {selectedImages.length > 0 && (
        <div className="px-4 py-2 border-t border-blox-purple/20">
          <div className="flex gap-2 overflow-x-auto">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative group flex-shrink-0">
                <div className="w-20 h-20 bg-blox-medium-blue-gray/20 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-blox-medium-blue-gray" />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 rounded-full"
                  onClick={() => removeSelectedImage(idx)}
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-blox-purple/20">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
          <Button
            size="sm"
            variant="ghost"
            className="text-blox-medium-blue-gray hover:text-blox-white"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            onPaste={handlePaste}
            placeholder="Type a message..."
            className="flex-1 bg-blox-dark-blue/50 border-blox-purple/30 text-blox-white placeholder:text-blox-medium-blue-gray"
          />
          <Button
            size="sm"
            onClick={sendMessage}
            disabled={!newMessage.trim() && selectedImages.length === 0}
            className="bg-gradient-to-r from-blox-purple to-blox-teal hover:opacity-80"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}