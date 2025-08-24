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
import { useTeamStore } from '@/store/teamStore'

export default function TeamsPage() {
  const { teams: allTeams, getUserTeams, currentUserId } = useTeamStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<TeamFilterState>({
    recruitmentStatus: [],
    teamType: [],
    skills: [],
    teamSize: 'all',
    sortBy: 'newest'
  })

  // Transform teams to match the expected format
  const teams = allTeams.map(team => ({
    id: team.id,
    name: team.name,
    description: team.description,
    memberCount: team.members.length,
    maxMembers: team.maxMembers,
    isRecruiting: team.recruitmentStatus !== 'closed',
    skills: team.skills,
    leader: team.members.find(m => m.role === 'leader')?.username || 'Unknown',
    avatar: team.avatar,
    projects: team.projects.length,
    founded: new Date(team.createdAt).toLocaleDateString(),
    rank: team.rank,
    points: team.points,
    badges: team.achievements,
    recruitmentStatus: team.recruitmentStatus,
    teamType: team.type,
    activeProjects: team.projects.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress,
      deadline: p.deadline
    })),
    members: team.members.map(m => ({
      id: m.userId,
      name: m.username,
      role: m.role === 'leader' ? 'leader' : m.role === 'moderator' ? 'developer' : m.role as any,
      joinedAt: m.joinedAt,
      contributions: m.contributions,
      online: m.online
    }))
  }))

  /* Old mock data - commented out
  const teams = [
    {
      id: 'team-1',
      name: 'GameDev Squad',
  */

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

  // Get user's teams
  const userTeams = getUserTeams(currentUserId)
  const myTeamIds = userTeams.map(t => t.id)
  const myTeams = sortedTeams.filter(team => myTeamIds.includes(team.id))
  const recruitingTeams = sortedTeams.filter(team => team.isRecruiting && !myTeamIds.includes(team.id))

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