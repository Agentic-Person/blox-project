'use client'

import { motion } from 'framer-motion'
import { Bell, Calendar, MessageCircle, ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import DiscordBetaBadge from './DiscordBetaBadge'
import Link from 'next/link'
import { useState } from 'react'

interface DiscordComingSoonProps {
  title: string
  subtitle: string
  description: string
  expectedLaunch?: string
  showNotification?: boolean
  variant?: 'channels' | 'events' | 'bot'
  children?: React.ReactNode
}

export default function DiscordComingSoon({
  title,
  subtitle,
  description,
  expectedLaunch = 'Q2 2024',
  showNotification = true,
  variant = 'channels',
  children
}: DiscordComingSoonProps) {
  const [email, setEmail] = useState('')
  const [discordTag, setDiscordTag] = useState('')
  const [notificationRequested, setNotificationRequested] = useState(false)

  const handleNotificationRequest = () => {
    if (email || discordTag) {
      setNotificationRequested(true)
      console.log('Notification requested:', { email, discordTag })
    }
  }

  const variantIcons = {
    channels: MessageCircle,
    events: Calendar,
    bot: Sparkles
  }

  const VariantIcon = variantIcons[variant]

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-4"
          >
            <DiscordBetaBadge size="lg" variant={variant === 'bot' ? 'boost' : 'default'} />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            {title}
          </h1>
          
          <p className="text-xl text-[#949BA4]">
            {subtitle}
          </p>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Channel List Preview */}
          <div className="lg:col-span-1">
            <Card className="bg-[#2B2D31] border-[#1E1F22] p-4">
              <h3 className="text-sm font-semibold text-[#949BA4] mb-3">SERVER PREVIEW</h3>
              <div className="space-y-2">
                {['welcome', 'general', 'learning', 'teams', 'events'].map((category) => (
                  <div key={category} className="text-sm text-[#949BA4] capitalize">
                    #{category}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Center/Right Panel - Main Content */}
          <div className="lg:col-span-2">
            <Card className="bg-[#36393F] border-[#1E1F22]">
              <div className="p-8">
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                    className="w-20 h-20 bg-gradient-to-r from-[#5865F2] to-[#7289DA] rounded-2xl flex items-center justify-center"
                  >
                    <VariantIcon className="h-10 w-10 text-white" />
                  </motion.div>
                </div>
                
                <h2 className="text-2xl font-bold text-white text-center mb-4">Feature Coming Soon</h2>
                <p className="text-[#B9BBBE] text-center mb-6">
                  {description}
                </p>

                {/* Expected Launch */}
                <div className="flex items-center justify-center gap-2 text-[#B9BBBE] mb-6">
                  <Calendar className="h-5 w-5 text-[#5865F2]" />
                  <span>Expected Launch: </span>
                  <span className="font-semibold text-[#5865F2]">{expectedLaunch}</span>
                </div>

                {/* Discord-style Notification Signup */}
                {showNotification && !notificationRequested && (
                  <div className="bg-[#2B2D31] rounded-lg p-6 border border-[#1E1F22]">
                    <div className="flex items-start gap-3 mb-4">
                      <Bell className="h-5 w-5 text-[#5865F2] mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-white mb-1">
                          Get Notified on Discord
                        </h3>
                        <p className="text-sm text-[#949BA4]">
                          Join our server or leave your email to be notified when this feature launches!
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={discordTag}
                        onChange={(e) => setDiscordTag(e.target.value)}
                        placeholder="Discord Username#0000"
                        className="w-full bg-[#1E1F22] border border-[#1E1F22] rounded px-4 py-2 text-white placeholder-[#72767D] focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2]"
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-[#404249]" />
                        <span className="text-xs text-[#949BA4]">OR</span>
                        <div className="flex-1 h-px bg-[#404249]" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full bg-[#1E1F22] border border-[#1E1F22] rounded px-4 py-2 text-white placeholder-[#72767D] focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2]"
                      />
                      <Button 
                        onClick={handleNotificationRequest}
                        className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
                      >
                        Join Waitlist
                      </Button>
                    </div>
                  </div>
                )}

                {notificationRequested && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center"
                  >
                    <p className="text-green-400 font-medium">
                      🎉 You're on the list! We'll notify you when this feature launches.
                    </p>
                  </motion.div>
                )}

                {/* Additional Content */}
                {children}
              </div>
            </Card>
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <Link href="/discord">
            <Button variant="secondary" className="flex items-center gap-2 bg-[#404249] hover:bg-[#35373C] text-white border-0">
              <ArrowLeft className="h-4 w-4" />
              Back to Discord Hub
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}