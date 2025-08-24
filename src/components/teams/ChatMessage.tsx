'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  images?: string[]
  timestamp: Date
  isCurrentUser?: boolean
}

interface ChatMessageProps {
  message: Message
}

const roleColors = {
  leader: 'bg-yellow-500',
  developer: 'bg-blue-500',
  builder: 'bg-green-500',
  designer: 'bg-purple-500',
  default: 'bg-blox-teal'
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <>
      <div className={`flex gap-3 ${message.isCurrentUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${message.isCurrentUser ? 'bg-blox-teal' : 'bg-blox-second-dark-blue border border-blox-glass-border'}
        `}>
          <span className="text-white text-sm font-medium">
            {message.userAvatar}
          </span>
        </div>

        {/* Message Content */}
        <div className={`flex-1 max-w-[70%] ${message.isCurrentUser ? 'items-end' : ''}`}>
          <div className={`flex items-baseline gap-2 mb-1 ${message.isCurrentUser ? 'flex-row-reverse' : ''}`}>
            <span className="text-sm font-medium text-blox-white">
              {message.userName}
            </span>
            <span className="text-xs text-blox-medium-blue-gray">
              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
            </span>
          </div>

          {/* Text Content */}
          {message.content && (
            <div className={`
              rounded-lg px-3 py-2 mb-2
              ${message.isCurrentUser 
                ? 'bg-blox-teal text-white ml-auto' 
                : 'bg-blox-second-dark-blue text-blox-off-white border border-blox-glass-border'
              }
            `}>
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          )}

          {/* Images */}
          {message.images && message.images.length > 0 && (
            <div className={`flex flex-wrap gap-2 ${message.isCurrentUser ? 'justify-end' : ''}`}>
              {message.images.map((image, index) => (
                <div 
                  key={index}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <img 
                    src={image} 
                    alt={`Message image ${index + 1}`}
                    className="rounded-lg max-w-[200px] max-h-[150px] object-cover border border-blox-glass-border hover:border-blox-teal transition-colors"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs">Click to view</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-0">
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Full size"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}