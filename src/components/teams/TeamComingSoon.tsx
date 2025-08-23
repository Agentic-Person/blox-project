'use client'

import { motion } from 'framer-motion'
import { Bell, Calendar, Rocket, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import TeamBetaBadge from './TeamBetaBadge'
import Link from 'next/link'
import { useState } from 'react'

interface TeamComingSoonProps {
  title: string
  subtitle: string
  description: string
  expectedLaunch?: string
  showNotification?: boolean
  children?: React.ReactNode
}

export default function TeamComingSoon({
  title,
  subtitle,
  description,
  expectedLaunch = 'Q2 2024',
  showNotification = true,
  children
}: TeamComingSoonProps) {
  const [email, setEmail] = useState('')
  const [notificationRequested, setNotificationRequested] = useState(false)

  const handleNotificationRequest = () => {
    if (email) {
      setNotificationRequested(true)
      // In production, this would send to a backend
      console.log('Notification requested for:', email)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-4"
          >
            <TeamBetaBadge size="lg" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold heading-primary">
            {title}
          </h1>
          
          <p className="text-xl text-blox-off-white">
            {subtitle}
          </p>
        </div>

        {/* Main Card */}
        <Card className="glass-card border-blox-glass-border">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
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
                className="w-20 h-20 bg-gradient-to-r from-blox-teal to-blox-purple rounded-2xl flex items-center justify-center"
              >
                <Rocket className="h-10 w-10 text-white" />
              </motion.div>
            </div>
            
            <CardTitle className="text-2xl">Feature Coming Soon</CardTitle>
            <CardDescription className="text-base mt-2">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Expected Launch */}
            <div className="flex items-center justify-center gap-2 text-blox-off-white">
              <Calendar className="h-5 w-5 text-blox-teal" />
              <span>Expected Launch: </span>
              <span className="font-semibold text-blox-teal">{expectedLaunch}</span>
            </div>

            {/* Notification Signup */}
            {showNotification && !notificationRequested && (
              <div className="bg-blox-black-blue/50 backdrop-blur-sm rounded-lg p-6 border border-blox-glass-border">
                <div className="flex items-start gap-3 mb-4">
                  <Bell className="h-5 w-5 text-blox-purple mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blox-white mb-1">
                      Get Notified When We Launch
                    </h3>
                    <p className="text-sm text-blox-off-white">
                      Be the first to know when this feature goes live!
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 bg-blox-very-dark-blue border border-blox-medium-blue-gray rounded-lg px-4 py-2 text-blox-white placeholder-blox-medium-blue-gray focus:outline-none focus:border-blox-teal focus:ring-1 focus:ring-blox-teal"
                  />
                  <Button 
                    onClick={handleNotificationRequest}
                    className="bg-gradient-to-r from-blox-purple to-blox-purple-dark hover:from-blox-purple-dark hover:to-blox-purple"
                  >
                    Notify Me
                  </Button>
                </div>
              </div>
            )}

            {notificationRequested && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blox-success/10 border border-blox-success/30 rounded-lg p-4 text-center"
              >
                <p className="text-blox-success font-medium">
                  🎉 You're on the list! We'll notify you when this feature launches.
                </p>
              </motion.div>
            )}

            {/* Additional Content */}
            {children}
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-center">
          <Link href="/teams">
            <Button variant="secondary" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Teams
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}