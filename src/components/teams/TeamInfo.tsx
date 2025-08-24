'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  Crown, 
  Trophy, 
  Star, 
  Target, 
  Calendar,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Settings,
  UserPlus,
  Edit,
  ExternalLink
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  role: 'leader' | 'developer' | 'builder' | 'designer'
  joinedAt: string
  contributions: number
  online?: boolean
  avatar: string
  bio?: string
}

interface TeamProject {
  id: string
  name: string
  status: 'planning' | 'in-progress' | 'testing' | 'completed'
  progress: number
  deadline?: string
}

interface Team {
  id: string
  name: string
  description: string
  memberCount: number
  maxMembers: number
  isRecruiting: boolean
  skills: string[]
  leader: string
  projects: number
  activeProjects?: TeamProject[]
  members: TeamMember[]
  founded?: string
  rank?: number
  points?: number
  badges?: string[]
  recruitmentStatus?: 'open' | 'selective' | 'closed'
  teamType?: 'casual' | 'competitive' | 'learning'
}

interface TeamInfoProps {
  team: Team
}

const roleColors = {
  leader: 'text-yellow-500',
  developer: 'text-blue-500',
  builder: 'text-green-500',
  designer: 'text-purple-500'
}

const statusColors = {
  planning: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  'in-progress': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  testing: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  completed: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' }
}

export default function TeamInfo({ team }: TeamInfoProps) {
  const memberCapacity = (team.memberCount / team.maxMembers) * 100

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Team Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <div className="text-xl font-bold text-blox-white">#{team.rank || 'N/A'}</div>
              <div className="text-xs text-blox-medium-blue-gray">Rank</div>
            </div>
            <div className="text-center p-3 bg-blox-black-blue rounded-lg border border-blox-glass-border">
              <Users className="h-6 w-6 text-blox-purple mx-auto mb-1" />
              <div className="text-xl font-bold text-blox-white">{memberCapacity.toFixed(0)}%</div>
              <div className="text-xs text-blox-medium-blue-gray">Capacity</div>
            </div>
          </div>

          {/* Team Type and Status */}
          <div className="flex flex-wrap gap-2">
            {team.teamType && (
              <Badge className="bg-blox-glass-teal text-blox-teal border-blox-teal/30" variant="outline">
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
                Recruitment: {team.recruitmentStatus}
              </Badge>
            )}
            {team.founded && (
              <Badge className="bg-blox-second-dark-blue text-blox-off-white border-blox-glass-border" variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                Founded {team.founded}
              </Badge>
            )}
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-sm font-medium text-blox-white mb-2">Team Skills</h4>
            <div className="flex flex-wrap gap-2">
              {team.skills.map((skill) => (
                <span 
                  key={skill}
                  className="px-3 py-1 bg-blox-black-blue text-blox-teal text-sm rounded-md border border-blox-glass-border"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-blox-purple" />
              Team Members ({team.memberCount}/{team.maxMembers})
            </CardTitle>
            {team.isRecruiting && (
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team.members.map((member) => (
              <div 
                key={member.id} 
                className="p-4 bg-blox-black-blue rounded-lg border border-blox-glass-border hover:border-blox-teal transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-blox-second-dark-blue flex items-center justify-center border-2 border-blox-glass-border">
                      <span className="text-sm text-blox-white font-medium">
                        {member.avatar}
                      </span>
                    </div>
                    {member.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-blox-black-blue" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-blox-white">{member.name}</span>
                      {member.role === 'leader' && <Crown className="h-4 w-4 text-yellow-500" />}
                      <Badge 
                        className={`text-xs ${roleColors[member.role]} bg-opacity-20`}
                        variant="outline"
                      >
                        {member.role}
                      </Badge>
                    </div>
                    
                    {member.bio && (
                      <p className="text-sm text-blox-off-white mb-2">{member.bio}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-blox-medium-blue-gray">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Joined {member.joinedAt}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {member.contributions} contributions
                      </span>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-blox-medium-blue-gray">Team Capacity</span>
              <span className="text-blox-off-white">{team.memberCount}/{team.maxMembers} members</span>
            </div>
            <Progress value={memberCapacity} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Active Projects */}
      {team.activeProjects && team.activeProjects.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Target className="h-5 w-5 text-blox-teal" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {team.activeProjects.map((project) => (
                <div 
                  key={project.id} 
                  className="p-4 bg-blox-black-blue rounded-lg border border-blox-glass-border hover:border-blox-teal transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blox-white">{project.name}</span>
                      <Badge 
                        className={`text-xs ${statusColors[project.status].bg} ${statusColors[project.status].text} ${statusColors[project.status].border}`}
                        variant="outline"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blox-medium-blue-gray">Progress</span>
                      <span className="text-blox-off-white">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    
                    {project.deadline && (
                      <div className="flex items-center gap-1 text-xs text-blox-medium-blue-gray">
                        <Clock className="h-3 w-3" />
                        Deadline: {project.deadline}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {team.badges && team.badges.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-500" />
              Team Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {team.badges.map((badge) => (
                <div 
                  key={badge} 
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30"
                >
                  <Shield className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400">{badge}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Settings className="h-5 w-5 text-blox-medium-blue-gray" />
            Team Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Edit className="h-4 w-4 mr-2" />
              Edit Team Profile
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <UserPlus className="h-4 w-4 mr-2" />
              Manage Members
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="h-4 w-4 mr-2" />
              Discord Integration
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-400 hover:text-red-300">
              <Settings className="h-4 w-4 mr-2" />
              Leave Team
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}