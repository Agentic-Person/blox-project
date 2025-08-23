'use client'

import TeamComingSoon from '@/components/teams/TeamComingSoon'
import TeamFeaturePreview from '@/components/teams/TeamFeaturePreview'
import { 
  Activity,
  BarChart3,
  Calendar,
  FolderOpen,
  MessageCircle,
  Settings,
  Trophy,
  UserCheck,
  Clipboard
} from 'lucide-react'

export default function TeamDashboardPage({ params }: { params: { teamId: string } }) {
  const features = [
    {
      icon: Activity,
      title: 'Activity Feed',
      description: 'Real-time updates on team member contributions, milestones, and achievements.',
      comingSoon: 'Phase 1',
      highlight: true
    },
    {
      icon: FolderOpen,
      title: 'Project Management',
      description: 'Kanban boards, task assignments, and milestone tracking for your games.',
      comingSoon: 'Phase 1'
    },
    {
      icon: MessageCircle,
      title: 'Team Chat',
      description: 'Built-in messaging with Discord integration for seamless communication.',
      comingSoon: 'Phase 1'
    },
    {
      icon: BarChart3,
      title: 'Team Analytics',
      description: 'Track progress, contribution stats, and team performance metrics.',
      comingSoon: 'Phase 2'
    },
    {
      icon: UserCheck,
      title: 'Member Management',
      description: 'Invite new members, manage roles, and set permissions easily.',
      comingSoon: 'Phase 1',
      highlight: true
    },
    {
      icon: Calendar,
      title: 'Event Scheduler',
      description: 'Plan team meetings, development sprints, and release dates.',
      comingSoon: 'Phase 2'
    },
    {
      icon: Trophy,
      title: 'Team Rewards',
      description: 'Distribute BLOX tokens and achievements to team members.',
      comingSoon: 'Phase 2'
    },
    {
      icon: Clipboard,
      title: 'Shared Whiteboard',
      description: 'Collaborative planning space for brainstorming and design.',
      comingSoon: 'Phase 1'
    },
    {
      icon: Settings,
      title: 'Team Settings',
      description: 'Customize team profile, privacy settings, and notification preferences.',
      comingSoon: 'Phase 1'
    }
  ]

  return (
    <TeamComingSoon
      title="Team Dashboard"
      subtitle="Your team's command center"
      description="Access all your team's projects, communicate with members, track progress, and celebrate achievements together in one unified dashboard."
      expectedLaunch="March 2024"
    >
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-blox-white mb-6 text-center">
          Dashboard Features Coming Soon
        </h3>
        <TeamFeaturePreview features={features} />
        
        {/* Mock Dashboard Preview */}
        <div className="mt-8 p-6 bg-blox-black-blue/30 backdrop-blur-sm rounded-lg border border-blox-glass-border">
          <div className="text-center text-blox-off-white">
            <p className="text-sm mb-2">Team ID: {params.teamId}</p>
            <p className="text-xs opacity-70">
              This dashboard will display real-time team data once the feature launches.
            </p>
          </div>
        </div>
      </div>
    </TeamComingSoon>
  )
}