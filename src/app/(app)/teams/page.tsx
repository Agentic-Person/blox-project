'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Info, Users, Trophy, Target, Sparkles } from 'lucide-react'
import Link from 'next/link'
import TeamBetaBadge from '@/components/teams/TeamBetaBadge'
import TeamCard from '@/components/teams/TeamCard'
import TeamFilters, { TeamFilterState } from '@/components/teams/TeamFilters'
import { motion } from 'framer-motion'

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<TeamFilterState>({
    recruitmentStatus: [],
    teamType: [],
    skills: [],
    teamSize: 'all',
    sortBy: 'newest'
  })

  const teams = [
    {
      id: 'team-1',
      name: 'GameDev Squad',
      description: 'Building the next generation of Roblox experiences together',
      memberCount: 4,
      maxMembers: 6,
      isRecruiting: true,
      skills: ['Building', 'Scripting', 'UI Design'],
      leader: 'ScriptMaster',
      avatar: '/images/team-logos/gamedev-squad.png',
      projects: 2,
      founded: '2 weeks ago',
      rank: 3,
      points: 2450,
      badges: ['First Project', 'Team Player'],
      recruitmentStatus: 'open' as const,
      teamType: 'competitive' as const,
      activeProjects: [
        { id: 'p1', name: 'Tower Defense Game', status: 'in-progress' as const, progress: 65, deadline: 'Dec 15' },
        { id: 'p2', name: 'UI Overhaul', status: 'testing' as const, progress: 85 }
      ],
      members: [
        { id: 'm1', name: 'ScriptMaster', role: 'leader' as const, joinedAt: '2 weeks ago', contributions: 45, online: true },
        { id: 'm2', name: 'BuilderPro', role: 'builder' as const, joinedAt: '1 week ago', contributions: 23, online: false },
        { id: 'm3', name: 'UIWizard', role: 'designer' as const, joinedAt: '3 days ago', contributions: 12, online: true },
        { id: 'm4', name: 'GameDev123', role: 'developer' as const, joinedAt: '5 days ago', contributions: 18 }
      ]
    },
    {
      id: 'team-2',
      name: 'Creative Builders',
      description: 'Focus on stunning visuals and creative gameplay mechanics',
      memberCount: 3,
      maxMembers: 5,
      isRecruiting: true,
      skills: ['Building', 'Art', 'Animation'],
      leader: 'BuilderPro',
      avatar: '/images/team-logos/creative-builders.png',
      projects: 1,
      founded: '1 month ago',
      rank: 7,
      points: 1850,
      recruitmentStatus: 'open' as const,
      teamType: 'casual' as const
    },
    {
      id: 'team-3',
      name: 'Code Warriors',
      description: 'Advanced scripting team working on complex systems',
      memberCount: 5,
      maxMembers: 5,
      isRecruiting: false,
      skills: ['Scripting', 'Game Design', 'Leadership'],
      leader: 'LuaMaster',
      avatar: '/images/team-logos/code-warriors.png',
      projects: 3,
      founded: '3 months ago',
      rank: 1,
      points: 4200,
      badges: ['Elite Team', 'Project Master', 'Community Leader'],
      recruitmentStatus: 'closed' as const,
      teamType: 'competitive' as const
    },
    {
      id: 'team-4',
      name: 'Pixel Pioneers',
      description: 'New team looking for motivated beginners to grow together',
      memberCount: 2,
      maxMembers: 6,
      isRecruiting: true,
      skills: ['Building', 'UI Design'],
      leader: 'PixelArt123',
      avatar: '/images/team-logos/pixel-pioneers.png',
      projects: 0,
      founded: '3 days ago',
      points: 150,
      recruitmentStatus: 'open' as const,
      teamType: 'learning' as const
    },
    {
      id: 'team-5',
      name: 'Neon Scripters',
      description: 'Specializing in advanced lighting and particle effects',
      memberCount: 4,
      maxMembers: 5,
      isRecruiting: true,
      skills: ['Scripting', 'Animation', 'Art'],
      leader: 'NeonMaster',
      projects: 2,
      founded: '2 weeks ago',
      rank: 5,
      points: 2100,
      recruitmentStatus: 'selective' as const,
      teamType: 'competitive' as const
    },
  ]

  // Filter teams based on search and filters
  const filteredTeams = teams.filter(team => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!(
        team.name.toLowerCase().includes(query) ||
        team.description.toLowerCase().includes(query) ||
        team.skills.some(skill => skill.toLowerCase().includes(query)) ||
        team.leader.toLowerCase().includes(query)
      )) {
        return false
      }
    }

    // Recruitment status filter
    if (filters.recruitmentStatus.length > 0) {
      if (!filters.recruitmentStatus.includes(team.recruitmentStatus || 'open')) {
        return false
      }
    }

    // Team type filter
    if (filters.teamType.length > 0) {
      if (!filters.teamType.includes(team.teamType || 'casual')) {
        return false
      }
    }

    // Skills filter
    if (filters.skills.length > 0) {
      if (!filters.skills.some(skill => team.skills.includes(skill))) {
        return false
      }
    }

    // Team size filter
    if (filters.teamSize !== 'all') {
      if (filters.teamSize === 'small' && team.maxMembers > 3) return false
      if (filters.teamSize === 'medium' && (team.maxMembers < 4 || team.maxMembers > 6)) return false
      if (filters.teamSize === 'large' && team.maxMembers < 7) return false
    }

    return true
  })

  // Sort teams
  const sortedTeams = [...filteredTeams].sort((a, b) => {
    switch (filters.sortBy) {
      case 'oldest':
        return 0 // Would normally sort by creation date
      case 'members':
        return b.memberCount - a.memberCount
      case 'projects':
        return b.projects - a.projects
      case 'points':
        return (b.points || 0) - (a.points || 0)
      case 'name':
        return a.name.localeCompare(b.name)
      case 'newest':
      default:
        return 0 // Would normally sort by creation date
    }
  })

  const myTeams = sortedTeams.filter(team => team.id === 'team-1')
  const recruitingTeams = sortedTeams.filter(team => team.isRecruiting && team.id !== 'team-1')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-blox-white">
              Teams
            </h1>
            <TeamBetaBadge size="md" />
          </div>
          <p className="text-blox-off-white">
            Collaborate with other developers and build amazing games together
          </p>
        </div>
        <Link href="/teams/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </Link>
      </div>

      {/* Beta Notice */}
      <Card className="glass-card border-blox-purple/30 bg-blox-purple/5 mb-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blox-purple mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blox-white font-medium mb-1">
                Teams Feature Preview
              </p>
              <p className="text-xs text-blox-off-white">
                You're viewing a preview of the upcoming Teams feature. Full functionality including team creation, 
                Discord integration, and project management will be available soon. Join the waitlist to be notified when we launch!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <TeamFilters 
        onSearchChange={setSearchQuery}
        onFilterChange={setFilters}
      />

      {/* My Teams */}
      {myTeams.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-blox-white">My Teams</h2>
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {myTeams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TeamCard 
                  team={team} 
                  variant="compact" 
                  isOwned={true}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Teams Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-blox-teal mx-auto mb-2" />
            <div className="text-2xl font-bold text-blox-white">{sortedTeams.length}</div>
            <div className="text-xs text-blox-medium-blue-gray">Active Teams</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blox-white">
              {sortedTeams.filter(t => t.rank && t.rank <= 10).length}
            </div>
            <div className="text-xs text-blox-medium-blue-gray">Top Teams</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-blox-purple mx-auto mb-2" />
            <div className="text-2xl font-bold text-blox-white">
              {sortedTeams.reduce((sum, t) => sum + t.projects, 0)}
            </div>
            <div className="text-xs text-blox-medium-blue-gray">Active Projects</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Sparkles className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blox-white">
              {sortedTeams.filter(t => t.isRecruiting).length}
            </div>
            <div className="text-xs text-blox-medium-blue-gray">Recruiting Now</div>
          </CardContent>
        </Card>
      </div>

      {/* All Teams */}
      <div>
        <h2 className="text-xl font-semibold text-blox-white mb-4">
          {searchQuery || filters.recruitmentStatus.length > 0 || filters.teamType.length > 0 || filters.skills.length > 0
            ? `Search Results (${sortedTeams.length})`
            : `All Teams (${sortedTeams.length})`}
        </h2>
        {sortedTeams.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-blox-medium-blue-gray mx-auto mb-4" />
              <p className="text-blox-white font-medium mb-2">No teams found</p>
              <p className="text-blox-off-white text-sm">
                Try adjusting your filters or search terms
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTeams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
              >
                <TeamCard 
                  team={team} 
                  variant="compact"
                  isOwned={team.id === 'team-1'}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}