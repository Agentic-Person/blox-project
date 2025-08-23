'use client'

import DiscordComingSoon from '@/components/discord/DiscordComingSoon'
import DiscordFeatureCard from '@/components/discord/DiscordFeatureCard'
import { 
  Bot,
  TrendingUp,
  Users,
  HelpCircle,
  Award,
  Search,
  Gamepad2,
  Bell,
  Settings
} from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function DiscordBotPage() {
  const features = [
    {
      icon: TrendingUp,
      title: 'XP Tracking',
      description: 'Track your learning progress and XP directly from Discord.',
      status: 'coming-soon' as const,
      highlight: true
    },
    {
      icon: Award,
      title: 'Achievements',
      description: 'View and share your badges and accomplishments.',
      status: 'coming-soon' as const
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Create teams, find members, and manage projects.',
      status: 'planned' as const
    },
    {
      icon: HelpCircle,
      title: 'Learning Assistant',
      description: 'Get instant help with coding questions and tutorials.',
      status: 'planned' as const,
      highlight: true
    },
    {
      icon: Search,
      title: 'Resource Finder',
      description: 'Search for tutorials, documentation, and examples.',
      status: 'coming-soon' as const
    },
    {
      icon: Gamepad2,
      title: 'Mini Games',
      description: 'Play coding challenges and trivia games.',
      status: 'planned' as const
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Get alerts for events, updates, and team activities.',
      status: 'coming-soon' as const
    },
    {
      icon: Settings,
      title: 'Profile Settings',
      description: 'Manage your preferences and linked accounts.',
      status: 'coming-soon' as const
    },
    {
      icon: Bot,
      title: 'Custom Commands',
      description: 'Community-requested features and fun interactions.',
      status: 'planned' as const
    }
  ]

  const commands = [
    { command: '/xp', description: 'Check your current XP and level', category: 'Progress' },
    { command: '/progress', description: 'View detailed learning progress', category: 'Progress' },
    { command: '/leaderboard', description: 'See top learners this month', category: 'Progress' },
    { command: '/team create', description: 'Create a new team', category: 'Teams' },
    { command: '/team join [code]', description: 'Join a team with invite code', category: 'Teams' },
    { command: '/team info', description: 'View your team details', category: 'Teams' },
    { command: '/help [topic]', description: 'Get help with specific topics', category: 'Learning' },
    { command: '/tutorial [skill]', description: 'Find tutorials for a skill', category: 'Learning' },
    { command: '/challenge', description: 'Get a daily coding challenge', category: 'Learning' },
    { command: '/event next', description: 'See upcoming events', category: 'Events' },
    { command: '/event register', description: 'Register for an event', category: 'Events' },
    { command: '/profile', description: 'View your profile', category: 'Account' },
    { command: '/link', description: 'Link your Blox Buddy account', category: 'Account' },
  ]

  return (
    <DiscordComingSoon
      title="Blox Bot Commands"
      subtitle="Your AI-powered Discord assistant"
      description="Blox Bot brings the full Blox Buddy experience to Discord. Track progress, manage teams, get help, and participate in events - all through simple commands."
      expectedLaunch="April 2024"
      variant="bot"
    >
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-white mb-6 text-center">
          Bot Features
        </h3>
        <DiscordFeatureCard features={features} />
        
        {/* Command List */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-white mb-6 text-center">
            Command Preview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Progress', 'Teams', 'Learning', 'Events', 'Account'].map((category) => (
              <Card key={category} className="bg-[#2B2D31] border-[#1E1F22] p-4">
                <h4 className="text-sm font-semibold text-[#5865F2] mb-3">{category.toUpperCase()}</h4>
                <div className="space-y-2">
                  {commands
                    .filter(cmd => cmd.category === category)
                    .map((cmd) => (
                      <div key={cmd.command} className="text-sm">
                        <code className="text-[#5865F2] bg-[#1E1F22] px-2 py-0.5 rounded">
                          {cmd.command}
                        </code>
                        <p className="text-[#949BA4] mt-1 ml-2">{cmd.description}</p>
                      </div>
                    ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Bot Personality */}
        <div className="mt-8 p-6 bg-[#2B2D31] rounded-lg border border-[#1E1F22]">
          <h4 className="text-sm font-semibold text-[#949BA4] mb-4">BOT PERSONALITY</h4>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#5865F2] to-[#FF73FA] flex items-center justify-center">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h5 className="text-white font-semibold mb-2">Blox Bot</h5>
              <p className="text-[#B9BBBE] text-sm">
                Friendly, helpful, and always ready to assist! Blox Bot uses AI to understand natural language, 
                provide contextual help, and make your Discord experience more engaging. With personality traits 
                inspired by the Roblox community, it speaks your language and understands your goals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DiscordComingSoon>
  )
}