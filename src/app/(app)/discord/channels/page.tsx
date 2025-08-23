'use client'

import DiscordComingSoon from '@/components/discord/DiscordComingSoon'
import DiscordFeatureCard from '@/components/discord/DiscordFeatureCard'
import { 
  Hash,
  Volume2,
  Lock,
  Users,
  MessageSquare,
  Mic,
  Headphones,
  Monitor,
  FileText
} from 'lucide-react'

export default function DiscordChannelsPage() {
  const features = [
    {
      icon: Hash,
      title: 'General Chat',
      description: 'Main community hub for casual conversations and making friends.',
      status: 'coming-soon' as const
    },
    {
      icon: MessageSquare,
      title: 'Help & Support',
      description: 'Get help with coding problems from experienced developers.',
      status: 'coming-soon' as const,
      highlight: true
    },
    {
      icon: FileText,
      title: 'Learning Resources',
      description: 'Curated tutorials, guides, and educational content.',
      status: 'coming-soon' as const
    },
    {
      icon: Users,
      title: 'Team Recruitment',
      description: 'Find team members or join existing teams for projects.',
      status: 'coming-soon' as const
    },
    {
      icon: Monitor,
      title: 'Showcase',
      description: 'Share your creations and get feedback from the community.',
      status: 'coming-soon' as const,
      highlight: true
    },
    {
      icon: Lock,
      title: 'VIP Channels',
      description: 'Exclusive channels for active members and supporters.',
      status: 'planned' as const
    },
    {
      icon: Volume2,
      title: 'Study Rooms',
      description: 'Voice channels for focused learning and collaboration.',
      status: 'coming-soon' as const
    },
    {
      icon: Mic,
      title: 'Team Voice',
      description: 'Private voice channels for team meetings and development.',
      status: 'coming-soon' as const
    },
    {
      icon: Headphones,
      title: 'Chill Zone',
      description: 'Relaxed voice channels for casual conversations and music.',
      status: 'planned' as const
    }
  ]

  return (
    <DiscordComingSoon
      title="Discord Channels"
      subtitle="Organized spaces for every conversation"
      description="Our Discord server features carefully organized channels for learning, collaboration, and community building. From help channels to voice study rooms, there's a space for everyone."
      expectedLaunch="February 2024"
      variant="channels"
    >
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-white mb-6 text-center">
          Channel Categories
        </h3>
        <DiscordFeatureCard features={features} />
        
        {/* Channel Structure Preview */}
        <div className="mt-8 p-6 bg-[#2B2D31] rounded-lg border border-[#1E1F22]">
          <h4 className="text-sm font-semibold text-[#949BA4] mb-4">CHANNEL STRUCTURE</h4>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-[#949BA4] font-semibold mb-1">📋 INFORMATION</div>
              <div className="ml-4 space-y-1 text-[#B9BBBE]">
                <div># rules</div>
                <div># announcements</div>
                <div># server-guide</div>
              </div>
            </div>
            <div>
              <div className="text-[#949BA4] font-semibold mb-1">💬 COMMUNITY</div>
              <div className="ml-4 space-y-1 text-[#B9BBBE]">
                <div># general</div>
                <div># introductions</div>
                <div># off-topic</div>
              </div>
            </div>
            <div>
              <div className="text-[#949BA4] font-semibold mb-1">🎓 LEARNING</div>
              <div className="ml-4 space-y-1 text-[#B9BBBE]">
                <div># beginner-help</div>
                <div># intermediate</div>
                <div># advanced</div>
                <div>🔊 Study Room 1-3</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DiscordComingSoon>
  )
}