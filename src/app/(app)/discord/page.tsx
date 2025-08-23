'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Users, Volume2, Hash, Calendar, Bot, Shield, Zap, Info } from 'lucide-react'
import Link from 'next/link'
import DiscordBetaBadge from '@/components/discord/DiscordBetaBadge'
import DiscordChannelList from '@/components/discord/DiscordChannelList'
import DiscordMemberList from '@/components/discord/DiscordMemberList'
import DiscordFeatureCard from '@/components/discord/DiscordFeatureCard'
import { motion } from 'framer-motion'

export default function DiscordPage() {
  const features = [
    {
      icon: Hash,
      title: 'Text Channels',
      description: 'Organized channels for every topic - general chat, help, showcases, and more.',
      status: 'coming-soon' as const,
      highlight: true
    },
    {
      icon: Volume2,
      title: 'Voice Channels',
      description: 'Study rooms, team meetings, and casual hangouts with screen sharing.',
      status: 'coming-soon' as const
    },
    {
      icon: Bot,
      title: 'Blox Bot',
      description: 'Custom bot for XP tracking, team management, and learning assistance.',
      status: 'planned' as const
    },
    {
      icon: Calendar,
      title: 'Community Events',
      description: 'Weekly workshops, monthly game jams, and special competitions.',
      status: 'coming-soon' as const,
      highlight: true
    },
    {
      icon: Shield,
      title: 'Role System',
      description: 'Earn roles based on your progress, skills, and contributions.',
      status: 'planned' as const
    },
    {
      icon: Zap,
      title: 'Server Boosts',
      description: 'Support the community and unlock exclusive perks and channels.',
      status: 'planned' as const
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-blox-white">Discord Community</h1>
            <DiscordBetaBadge size="md" />
          </div>
          <p className="text-blox-off-white">Connect with thousands of Roblox developers</p>
        </div>
      </div>

      {/* Beta Notice */}
      <Card className="bg-[#36393F] border-[#5865F2]/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-[#5865F2] mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-white font-medium mb-1">
                Discord Integration Preview
              </p>
              <p className="text-xs text-[#B9BBBE]">
                You're viewing a preview of our upcoming Discord integration. Full server access, 
                custom bot commands, and voice channels will be available soon. Join the waitlist to be notified!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discord-style Layout Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server Preview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-sm font-semibold text-[#949BA4] mb-3 uppercase">Channel Preview</h3>
          <DiscordChannelList />
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <Card className="bg-[#36393F] border-[#1E1F22]">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <MessageCircle className="mr-2 h-5 w-5 text-[#5865F2]" />
                Join Our Discord Server
              </CardTitle>
              <CardDescription className="text-[#B9BBBE]">
                Connect with thousands of Roblox developers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">2,547</div>
                  <div className="text-sm text-[#B9BBBE]">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">892</div>
                  <div className="text-sm text-[#B9BBBE]">Online</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#5865F2]">24/7</div>
                  <div className="text-sm text-[#B9BBBE]">Support</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Link href="/discord/channels" className="block">
                  <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white">
                    Explore Channels
                  </Button>
                </Link>
                <Link href="/discord/events" className="block">
                  <Button variant="secondary" className="w-full bg-[#404249] hover:bg-[#35373C] text-white border-0">
                    View Events
                  </Button>
                </Link>
                <Link href="/discord/bot" className="block">
                  <Button variant="secondary" className="w-full bg-[#404249] hover:bg-[#35373C] text-white border-0">
                    Bot Commands
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Member List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-[#949BA4] mb-3 uppercase">Active Members</h3>
          <DiscordMemberList />
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-6">Community Features</h2>
        <DiscordFeatureCard features={features} />
      </div>
    </div>
  )
}