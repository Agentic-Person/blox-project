'use client'

import DiscordComingSoon from '@/components/discord/DiscordComingSoon'
import DiscordFeatureCard from '@/components/discord/DiscordFeatureCard'
import { 
  Calendar,
  Trophy,
  Users,
  Gamepad2,
  BookOpen,
  Mic,
  Gift,
  Star,
  Clock
} from 'lucide-react'

export default function DiscordEventsPage() {
  const features = [
    {
      icon: Gamepad2,
      title: 'Monthly Game Jams',
      description: 'Compete in themed game development challenges with prizes and recognition.',
      status: 'coming-soon' as const,
      highlight: true
    },
    {
      icon: BookOpen,
      title: 'Weekly Workshops',
      description: 'Learn from experienced developers in live coding sessions.',
      status: 'coming-soon' as const
    },
    {
      icon: Mic,
      title: 'Developer Talks',
      description: 'Guest speakers share insights about game development and Roblox.',
      status: 'planned' as const
    },
    {
      icon: Trophy,
      title: 'Build Competitions',
      description: 'Show off your building skills in time-limited challenges.',
      status: 'coming-soon' as const,
      highlight: true
    },
    {
      icon: Users,
      title: 'Team Tournaments',
      description: 'Compete with your team in collaborative development challenges.',
      status: 'planned' as const
    },
    {
      icon: Gift,
      title: 'Giveaways',
      description: 'Win Robux, premium memberships, and exclusive items.',
      status: 'coming-soon' as const
    },
    {
      icon: Star,
      title: 'Showcase Nights',
      description: 'Present your projects and get feedback from the community.',
      status: 'coming-soon' as const
    },
    {
      icon: Clock,
      title: 'Speed Coding',
      description: 'Fast-paced coding challenges to test your skills.',
      status: 'planned' as const
    },
    {
      icon: Calendar,
      title: 'Seasonal Events',
      description: 'Special events for holidays and milestones.',
      status: 'planned' as const
    }
  ]

  return (
    <DiscordComingSoon
      title="Community Events"
      subtitle="Learn, compete, and grow together"
      description="Join exciting events designed to help you improve your skills, meet other developers, and have fun. From game jams to workshops, there's always something happening in our community."
      expectedLaunch="March 2024"
      variant="events"
    >
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-white mb-6 text-center">
          Upcoming Event Types
        </h3>
        <DiscordFeatureCard features={features} />
        
        {/* Event Schedule Preview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-[#2B2D31] rounded-lg border border-[#1E1F22]">
            <h4 className="text-sm font-semibold text-[#949BA4] mb-4">WEEKLY SCHEDULE</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#B9BBBE]">Monday</span>
                <span className="text-[#5865F2]">Beginner Workshop</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B9BBBE]">Wednesday</span>
                <span className="text-[#5865F2]">Code Review Session</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B9BBBE]">Friday</span>
                <span className="text-[#5865F2]">Showcase Night</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B9BBBE]">Saturday</span>
                <span className="text-[#5865F2]">Team Building</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B9BBBE]">Sunday</span>
                <span className="text-[#5865F2]">Community Game Day</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-[#2B2D31] rounded-lg border border-[#1E1F22]">
            <h4 className="text-sm font-semibold text-[#949BA4] mb-4">EVENT REWARDS</h4>
            <div className="space-y-2 text-sm text-[#B9BBBE]">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#FFD700]" />
                <span>XP Points & Levels</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-[#FF73FA]" />
                <span>Exclusive Badges</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[#5865F2]" />
                <span>Special Roles</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-400" />
                <span>Team Opportunities</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#E74C3C]" />
                <span>Priority Event Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DiscordComingSoon>
  )
}