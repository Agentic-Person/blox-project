export interface Team {
  id: string
  name: string
  description: string
  avatar?: string
  maxMembers: number
  isRecruiting: boolean
  requiredSkills: string[]
  preferredSkills: string[]
  discordChannelId?: string
  createdAt: Date
  leader: TeamMember
  members: TeamMember[]
  projects: TeamProject[]
}

export interface TeamMember {
  id: string
  userId: string
  username: string
  avatar?: string
  role: 'leader' | 'member'
  skills: string[]
  joinedAt: Date
  contribution?: string
}

export interface TeamProject {
  id: string
  teamId: string
  title: string
  description: string
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold'
  startDate?: Date
  endDate?: Date
  github?: string
  demo?: string
  screenshots: string[]
  tags: string[]
}

export interface JoinRequest {
  id: string
  teamId: string
  userId: string
  username: string
  message: string
  skills: string[]
  createdAt: Date
  status: 'pending' | 'accepted' | 'rejected'
}