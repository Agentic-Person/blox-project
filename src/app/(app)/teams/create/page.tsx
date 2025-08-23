'use client'

import TeamComingSoon from '@/components/teams/TeamComingSoon'
import TeamFeaturePreview from '@/components/teams/TeamFeaturePreview'
import { 
  Users, 
  MessageSquare, 
  Trophy, 
  Target, 
  Palette, 
  GitBranch,
  Shield,
  Zap,
  Globe
} from 'lucide-react'

export default function CreateTeamPage() {
  const features = [
    {
      icon: Users,
      title: 'Smart Team Matching',
      description: 'Find the perfect team members based on skills, experience, and project goals.',
      comingSoon: 'Phase 1'
    },
    {
      icon: MessageSquare,
      title: 'Discord Integration',
      description: 'Automatic Discord channel creation for your team with custom roles and permissions.',
      comingSoon: 'Phase 1',
      highlight: true
    },
    {
      icon: Trophy,
      title: 'Team Achievements',
      description: 'Earn badges and rewards as a team. Climb the leaderboards together!',
      comingSoon: 'Phase 2'
    },
    {
      icon: Target,
      title: 'Project Templates',
      description: 'Start with proven project structures for games, tools, or experiences.',
      comingSoon: 'Phase 1'
    },
    {
      icon: GitBranch,
      title: 'Version Control',
      description: 'Built-in Git integration for seamless collaboration on code and assets.',
      comingSoon: 'Phase 2'
    },
    {
      icon: Shield,
      title: 'Role Management',
      description: 'Define clear roles and permissions for team members.',
      comingSoon: 'Phase 1'
    },
    {
      icon: Palette,
      title: 'Team Branding',
      description: 'Custom team avatars, banners, and color schemes to stand out.',
      comingSoon: 'Phase 2'
    },
    {
      icon: Zap,
      title: 'Quick Setup',
      description: 'Get your team up and running in minutes with our guided wizard.',
      comingSoon: 'Phase 1',
      highlight: true
    },
    {
      icon: Globe,
      title: 'Public Showcase',
      description: 'Share your team\'s projects and achievements with the community.',
      comingSoon: 'Phase 2'
    }
  ]

  return (
    <TeamComingSoon
      title="Create Your Dream Team"
      subtitle="Build amazing Roblox experiences together"
      description="Our team creation wizard will guide you through setting up your team, defining roles, and finding the perfect collaborators for your project."
      expectedLaunch="February 2024"
    >
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-blox-white mb-6 text-center">
          Upcoming Team Features
        </h3>
        <TeamFeaturePreview features={features} />
      </div>
    </TeamComingSoon>
  )
}