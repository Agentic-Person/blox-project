'use client'

import { motion } from 'framer-motion'
import { Hash, Volume2, ChevronDown, ChevronRight, Lock, Users } from 'lucide-react'
import { useState } from 'react'

interface Channel {
  id: string
  name: string
  type: 'text' | 'voice'
  locked?: boolean
  userCount?: number
}

interface Category {
  id: string
  name: string
  channels: Channel[]
}

const mockCategories: Category[] = [
  {
    id: 'welcome',
    name: 'WELCOME',
    channels: [
      { id: '1', name: 'rules', type: 'text', locked: true },
      { id: '2', name: 'announcements', type: 'text', locked: true },
      { id: '3', name: 'introductions', type: 'text' },
    ]
  },
  {
    id: 'general',
    name: 'GENERAL',
    channels: [
      { id: '4', name: 'general', type: 'text' },
      { id: '5', name: 'help', type: 'text' },
      { id: '6', name: 'showcase', type: 'text' },
      { id: '7', name: 'resources', type: 'text' },
    ]
  },
  {
    id: 'learning',
    name: 'LEARNING PATHS',
    channels: [
      { id: '8', name: 'beginner-help', type: 'text' },
      { id: '9', name: 'intermediate', type: 'text' },
      { id: '10', name: 'advanced', type: 'text' },
      { id: '11', name: 'study-room-1', type: 'voice', userCount: 3 },
      { id: '12', name: 'study-room-2', type: 'voice', userCount: 0 },
    ]
  },
  {
    id: 'teams',
    name: 'TEAM CHANNELS',
    channels: [
      { id: '13', name: 'team-recruitment', type: 'text' },
      { id: '14', name: 'team-chat', type: 'text' },
      { id: '15', name: 'Team Voice 1', type: 'voice', userCount: 5 },
      { id: '16', name: 'Team Voice 2', type: 'voice', userCount: 2 },
    ]
  },
  {
    id: 'events',
    name: 'EVENTS',
    channels: [
      { id: '17', name: 'game-jams', type: 'text' },
      { id: '18', name: 'workshops', type: 'text' },
      { id: '19', name: 'Event Voice', type: 'voice', userCount: 12 },
    ]
  },
]

export default function DiscordChannelList() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(mockCategories.map(c => c.id))
  )
  const [selectedChannel, setSelectedChannel] = useState<string>('4')

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  return (
    <div className="w-full max-w-xs bg-[#2B2D31] rounded-lg overflow-hidden">
      {/* Server Header */}
      <div className="px-4 py-3 bg-[#1E1F22] border-b border-black/20">
        <h3 className="text-white font-semibold flex items-center justify-between">
          Blox Buddy Community
          <ChevronDown className="h-4 w-4" />
        </h3>
      </div>

      {/* Channel List */}
      <div className="p-2 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        {mockCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.05 }}
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#949BA4] hover:text-[#DBDEE1] transition-colors"
            >
              {expandedCategories.has(category.id) ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {category.name}
            </button>

            {/* Channels */}
            {expandedCategories.has(category.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-0.5 mt-1"
              >
                {category.channels.map((channel) => (
                  <motion.button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel.id)}
                    whileHover={{ x: 2 }}
                    className={`
                      w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm
                      ${selectedChannel === channel.id 
                        ? 'bg-[#404249] text-white' 
                        : 'text-[#949BA4] hover:text-[#DBDEE1] hover:bg-[#35373C]'
                      }
                      transition-all duration-200
                    `}
                  >
                    {/* Channel Icon */}
                    <div className="flex items-center gap-1.5">
                      {channel.type === 'text' ? (
                        <Hash className="h-4 w-4 opacity-60" />
                      ) : (
                        <Volume2 className="h-4 w-4 opacity-60" />
                      )}
                      
                      {/* Channel Name */}
                      <span className="flex-1 text-left">{channel.name}</span>
                    </div>

                    {/* Additional Icons */}
                    <div className="flex items-center gap-1 ml-auto">
                      {channel.locked && (
                        <Lock className="h-3 w-3 opacity-50" />
                      )}
                      {channel.type === 'voice' && channel.userCount !== undefined && (
                        <div className="flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3" />
                          <span>{channel.userCount}</span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* User Panel (Mock) */}
      <div className="px-2 py-2 bg-[#1E1F22] border-t border-black/20">
        <div className="flex items-center gap-2 p-2 rounded hover:bg-[#35373C] transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blox-teal to-blox-purple" />
          <div className="flex-1">
            <div className="text-sm text-white font-medium">Your Username</div>
            <div className="text-xs text-[#949BA4]">#0000</div>
          </div>
        </div>
      </div>
    </div>
  )
}