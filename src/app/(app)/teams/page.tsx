import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, Search, Filter, Crown, User } from 'lucide-react'
import Link from 'next/link'

export default function TeamsPage() {
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
      projects: 2
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
      projects: 1
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
      projects: 3
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
      projects: 0
    },
  ]

  const myTeams = teams.filter(team => team.id === 'team-1')
  const recruitingTeams = teams.filter(team => team.isRecruiting && team.id !== 'team-1')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blox-white mb-2">
            Teams
          </h1>
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

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blox-medium-blue-gray" />
                <input
                  type="text"
                  placeholder="Search teams by name, skills, or description..."
                  className="w-full bg-blox-black-blue border border-blox-medium-blue-gray rounded-lg pl-10 pr-4 py-2 text-blox-white placeholder-blox-medium-blue-gray focus:outline-none focus:border-blox-teal focus:ring-1 focus:ring-blox-teal"
                />
              </div>
            </div>
            <Button variant="secondary">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Teams */}
      {myTeams.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-blox-white mb-4">My Teams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {myTeams.map((team) => (
              <Card key={team.id} className="card-hover border-blox-teal">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blox-teal to-blox-teal-dark rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {team.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <div className="flex items-center text-sm text-blox-off-white">
                          <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                          {team.leader}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blox-off-white">
                        {team.memberCount}/{team.maxMembers}
                      </div>
                      <Users className="h-4 w-4 text-blox-medium-blue-gray" />
                    </div>
                  </div>
                  <CardDescription>{team.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
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
                    <div className="text-xs text-blox-off-white">
                      {team.projects} active project{team.projects !== 1 ? 's' : ''}
                    </div>
                    <Link href={`/teams/${team.id}`}>
                      <Button className="w-full">
                        View Team
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recruiting Teams */}
      <div>
        <h2 className="text-xl font-semibold text-blox-white mb-4">
          Teams Recruiting ({recruitingTeams.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recruitingTeams.map((team) => (
            <Card key={team.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blox-second-dark-blue rounded-lg flex items-center justify-center border border-blox-medium-blue-gray">
                      <span className="text-blox-teal font-bold text-lg">
                        {team.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <div className="flex items-center text-sm text-blox-off-white">
                        <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                        {team.leader}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blox-off-white">
                      {team.memberCount}/{team.maxMembers}
                    </div>
                    <Users className="h-4 w-4 text-blox-medium-blue-gray" />
                  </div>
                </div>
                <CardDescription>{team.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                  <div className="text-xs text-blox-off-white">
                    {team.projects} active project{team.projects !== 1 ? 's' : ''}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/teams/${team.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full">
                        View
                      </Button>
                    </Link>
                    <Button className="flex-1">
                      Join Team
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}