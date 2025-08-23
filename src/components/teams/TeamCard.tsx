'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, Crown, Trophy, Star, MessageSquare, 
  Calendar, Target, TrendingUp, Clock, Shield,
  CheckCircle, AlertCircle, XCircle
} from 'lucide-react'
import Link from 'next/link'

interface TeamMember {
  id: string
  name: string
  role: 'leader' | 'developer' | 'builder' | 'designer'
  joinedAt: string
  contributions: number
  online?: boolean
}

interface TeamProject {
  id: string
  name: string
  status: 'planning' | 'in-progress' | 'testing' | 'completed'
  progress: number
  deadline?: string
}

interface TeamCardProps {
  team: {
    id: string
    name: string
    description: string
    memberCount: number
    maxMembers: number
    isRecruiting: boolean
    skills: string[]
    leader: string
    avatar?: string
    projects: number
    activeProjects?: TeamProject[]
    members?: TeamMember[]
    founded?: string
    rank?: number
    points?: number
    badges?: string[]
    discordChannel?: string
    recruitmentStatus?: 'open' | 'selective' | 'closed'
    teamType?: 'casual' | 'competitive' | 'learning'
  }
  variant?: 'compact' | 'detailed' | 'preview'
  showActions?: boolean
  isOwned?: boolean
}

const roleColors = {
  leader: 'text-yellow-500',
  developer: 'text-blue-500',
  builder: 'text-green-500',
  designer: 'text-purple-500'
}

const statusColors = {
  planning: 'text-gray-400',
  'in-progress': 'text-blue-500',
  testing: 'text-yellow-500',
  completed: 'text-green-500'
}

const teamTypeStyles = {
  casual: {
    badge: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: Clock
  },
  competitive: {
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: Trophy
  },
  learning: {
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Target
  }
}

export default function TeamCard({ team, variant = 'compact', showActions = true, isOwned = false }: TeamCardProps) {
  const memberCapacity = (team.memberCount / team.maxMembers) * 100
  const TypeIcon = team.teamType ? teamTypeStyles[team.teamType].icon : Users

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Card className={`
          glass-card h-full
          ${isOwned ? 'border-blox-teal shadow-teal-glow' : ''}
          ${team.isRecruiting ? 'hover:border-blox-purple' : 'hover:border-blox-medium-blue-gray'}
          transition-all duration-300
        `}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center
                  ${isOwned 
                    ? 'bg-gradient-to-r from-blox-teal to-blox-teal-dark' 
                    : 'bg-blox-second-dark-blue border border-blox-medium-blue-gray'
                  }
                `}>
                  <span className="text-white font-bold text-lg">
                    {team.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {team.name}
                    {team.rank && team.rank <= 10 && (
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-blox-off-white">
                    <Crown className="h-3 w-3 text-yellow-500" />
                    <span>{team.leader}</span>
                    {team.teamType && (
                      <>
                        <span className="text-blox-medium-blue-gray">•</span>
                        <Badge className={teamTypeStyles[team.teamType].badge} variant="outline">
                          {team.teamType}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-blox-off-white">
                  <Users className="h-4 w-4" />
                  <span>{team.memberCount}/{team.maxMembers}</span>
                </div>
                {team.isRecruiting && (
                  <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/30" variant="outline">
                    Recruiting
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="mt-3">{team.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Skills */}
              <div className="flex flex-wrap gap-1">
                {team.skills.map((skill) => (
                  <span 
                    key={skill}
                    className="px-2 py-1 bg-blox-black-blue text-blox-teal text-xs rounded-md border border-blox-glass-border"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-blox-off-white">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {team.projects} project{team.projects !== 1 ? 's' : ''}
                  </span>
                  {team.points && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      {team.points} pts
                    </span>
                  )}
                </div>
                {team.founded && (
                  <span className="text-blox-medium-blue-gray">
                    Founded {team.founded}
                  </span>
                )}
              </div>

              {/* Member Capacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blox-medium-blue-gray">Team Capacity</span>
                  <span className="text-blox-off-white">{memberCapacity.toFixed(0)}%</span>
                </div>
                <Progress value={memberCapacity} className="h-1" />
              </div>

              {/* Actions */}
              {showActions && (
                <div className="flex gap-2">
                  <Link href={`/teams/${team.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  {!isOwned && team.isRecruiting && (
                    <Button className="flex-1" disabled>
                      Apply to Join
                    </Button>
                  )}
                  {isOwned && (
                    <Button className="flex-1">
                      Manage Team
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Detailed variant for team detail pages
  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-blox-teal to-blox-teal-dark flex items-center justify-center">
              <TypeIcon className="h-10 w-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                {team.name}
                {team.rank && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30" variant="outline">
                    Rank #{team.rank}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {team.description}
              </CardDescription>
              <div className="flex items-center gap-4 mt-2 text-sm text-blox-off-white">
                <span className="flex items-center gap-1">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  {team.leader}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {team.memberCount}/{team.maxMembers} members
                </span>
                {team.founded && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Since {team.founded}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {team.teamType && (
              <Badge className={teamTypeStyles[team.teamType].badge} variant="outline">
                {team.teamType} Team
              </Badge>
            )}
            {team.recruitmentStatus && (
              <Badge 
                className={
                  team.recruitmentStatus === 'open' 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : team.recruitmentStatus === 'selective'
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }
                variant="outline"
              >
                {team.recruitmentStatus === 'open' && <CheckCircle className="h-3 w-3 mr-1" />}
                {team.recruitmentStatus === 'selective' && <AlertCircle className="h-3 w-3 mr-1" />}
                {team.recruitmentStatus === 'closed' && <XCircle className="h-3 w-3 mr-1" />}
                {team.recruitmentStatus}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blox-black-blue rounded-lg border border-blox-glass-border">
            <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-blox-white">{team.points || 0}</div>
            <div className="text-xs text-blox-medium-blue-gray">Team Points</div>
          </div>
          <div className="text-center p-3 bg-blox-black-blue rounded-lg border border-blox-glass-border">
            <Target className="h-6 w-6 text-blox-teal mx-auto mb-1" />
            <div className="text-xl font-bold text-blox-white">{team.projects}</div>
            <div className="text-xs text-blox-medium-blue-gray">Projects</div>
          </div>
          <div className="text-center p-3 bg-blox-black-blue rounded-lg border border-blox-glass-border">
            <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-blox-white">{memberCapacity.toFixed(0)}%</div>
            <div className="text-xs text-blox-medium-blue-gray">Capacity</div>
          </div>
          <div className="text-center p-3 bg-blox-black-blue rounded-lg border border-blox-glass-border">
            <MessageSquare className="h-6 w-6 text-blox-purple mx-auto mb-1" />
            <div className="text-xl font-bold text-blox-white">
              {team.discordChannel ? '✓' : '—'}
            </div>
            <div className="text-xs text-blox-medium-blue-gray">Discord</div>
          </div>
        </div>

        {/* Skills */}
        <div>
          <h3 className="text-sm font-medium text-blox-white mb-2">Team Skills</h3>
          <div className="flex flex-wrap gap-2">
            {team.skills.map((skill) => (
              <Badge 
                key={skill}
                className="bg-blox-glass-teal backdrop-blur-sm text-blox-teal border-blox-teal/30"
                variant="outline"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Active Projects */}
        {team.activeProjects && team.activeProjects.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-blox-white mb-2">Active Projects</h3>
            <div className="space-y-2">
              {team.activeProjects.map((project) => (
                <div key={project.id} className="p-3 bg-blox-black-blue rounded-lg border border-blox-glass-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blox-white">{project.name}</span>
                    <Badge 
                      className={`text-xs ${
                        project.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : project.status === 'in-progress'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : project.status === 'testing'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}
                      variant="outline"
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <Progress value={project.progress} className="h-1" />
                  {project.deadline && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-blox-medium-blue-gray">
                      <Clock className="h-3 w-3" />
                      Due {project.deadline}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Members */}
        {team.members && team.members.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-blox-white mb-2">Team Members</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {team.members.map((member) => (
                <div key={member.id} className="p-2 bg-blox-black-blue rounded-lg border border-blox-glass-border">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-blox-second-dark-blue flex items-center justify-center">
                        <span className="text-xs text-blox-white font-medium">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      {member.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-blox-black-blue" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-blox-white truncate">
                        {member.name}
                      </div>
                      <div className={`text-xs ${roleColors[member.role]}`}>
                        {member.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {team.badges && team.badges.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-blox-white mb-2">Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {team.badges.map((badge) => (
                <div key={badge} className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-md border border-yellow-500/30">
                  <Shield className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}