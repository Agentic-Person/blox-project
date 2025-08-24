import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Type definitions
export interface TeamMember {
  userId: string
  username: string
  role: 'leader' | 'moderator' | 'member'
  joinedAt: string
  contributions: number
  permissions: string[]
  avatar?: string
  bio?: string
  online?: boolean
}

export interface TeamProject {
  id: string
  name: string
  description: string
  status: 'planning' | 'in-progress' | 'testing' | 'completed'
  progress: number
  deadline?: string
  assignedMembers: string[]
  tasks: ProjectTask[]
  createdAt: string
  completedAt?: string
}

export interface ProjectTask {
  id: string
  title: string
  completed: boolean
  assignedTo?: string
}

export interface TeamApplication {
  id: string
  teamId: string
  userId: string
  username: string
  message: string
  skills: string[]
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface TeamNotification {
  id: string
  teamId: string
  type: 'application' | 'invite' | 'message' | 'project' | 'achievement'
  title: string
  message: string
  read: boolean
  createdAt: string
  metadata?: Record<string, any>
}

export interface Team {
  id: string
  name: string
  description: string
  type: 'casual' | 'competitive' | 'learning'
  avatar?: string
  banner?: string
  leader: string
  members: TeamMember[]
  maxMembers: number
  skills: string[]
  projects: TeamProject[]
  achievements: string[]
  points: number
  rank?: number
  recruitmentStatus: 'open' | 'selective' | 'closed'
  createdAt: string
  settings: {
    isPublic: boolean
    requireApplication: boolean
    autoAcceptApplications: boolean
  }
}

interface TeamStore {
  // State
  teams: Team[]
  myTeams: string[] // Team IDs that current user belongs to
  applications: TeamApplication[]
  notifications: TeamNotification[]
  activeTeamId: string | null
  currentUserId: string

  // Actions - Team CRUD
  createTeam: (team: Omit<Team, 'id' | 'createdAt' | 'members' | 'projects' | 'achievements' | 'points'>) => string
  updateTeam: (teamId: string, updates: Partial<Team>) => void
  deleteTeam: (teamId: string) => void
  getTeamById: (teamId: string) => Team | undefined

  // Actions - Membership
  joinTeam: (teamId: string, userId: string, role?: 'member' | 'moderator') => boolean
  leaveTeam: (teamId: string, userId: string) => boolean
  kickMember: (teamId: string, userId: string, kickedBy: string) => boolean
  promoteMember: (teamId: string, userId: string, newRole: 'moderator' | 'leader') => boolean
  demoteMember: (teamId: string, userId: string) => boolean

  // Actions - Applications
  createApplication: (application: Omit<TeamApplication, 'id' | 'createdAt' | 'status'>) => void
  reviewApplication: (applicationId: string, status: 'accepted' | 'rejected', reviewerId: string) => void
  getTeamApplications: (teamId: string) => TeamApplication[]
  getUserApplications: (userId: string) => TeamApplication[]

  // Actions - Notifications
  addNotification: (notification: Omit<TeamNotification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (notificationId: string) => void
  clearNotifications: (teamId?: string) => void
  getTeamNotifications: (teamId: string) => TeamNotification[]

  // Actions - Projects
  addProject: (teamId: string, project: Omit<TeamProject, 'id' | 'createdAt' | 'tasks'>) => void
  updateProject: (teamId: string, projectId: string, updates: Partial<TeamProject>) => void
  deleteProject: (teamId: string, projectId: string) => void

  // Utility
  setActiveTeam: (teamId: string | null) => void
  getUserTeams: (userId?: string) => Team[]
  getRecruitingTeams: () => Team[]
}

// Initial mock data
const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'GameDev Squad',
    description: 'Building the next generation of Roblox experiences together',
    type: 'competitive',
    leader: 'user-1', // Current user for testing
    members: [
      {
        userId: 'user-1',
        username: 'ScriptMaster',
        role: 'leader',
        joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        contributions: 45,
        permissions: ['all'],
        avatar: 'SM',
        bio: 'Experienced Lua developer with 3+ years in Roblox development',
        online: true
      },
      {
        userId: 'user-2',
        username: 'BuilderPro',
        role: 'member',
        joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        contributions: 23,
        permissions: ['edit_projects', 'send_messages'],
        avatar: 'BP',
        bio: 'Expert in creating detailed environments',
        online: false
      },
      {
        userId: 'user-3',
        username: 'UIWizard',
        role: 'member',
        joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        contributions: 12,
        permissions: ['edit_projects', 'send_messages'],
        avatar: 'UW',
        bio: 'UI/UX specialist',
        online: true
      }
    ],
    maxMembers: 6,
    skills: ['Building', 'Scripting', 'UI Design'],
    projects: [
      {
        id: 'proj-1',
        name: 'Tower Defense Game',
        description: 'A strategic tower defense game with unique mechanics',
        status: 'in-progress',
        progress: 65,
        deadline: '2024-12-15',
        assignedMembers: ['user-1', 'user-2'],
        tasks: [],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    achievements: ['First Project', 'Team Player'],
    points: 2450,
    rank: 3,
    recruitmentStatus: 'open',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    settings: {
      isPublic: true,
      requireApplication: true,
      autoAcceptApplications: false
    }
  },
  {
    id: 'team-2',
    name: 'Creative Builders',
    description: 'Focus on stunning visuals and creative gameplay mechanics',
    type: 'casual',
    leader: 'user-4',
    members: [
      {
        userId: 'user-4',
        username: 'ArtMaster',
        role: 'leader',
        joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        contributions: 67,
        permissions: ['all'],
        avatar: 'AM'
      },
      {
        userId: 'user-5',
        username: 'PixelPro',
        role: 'member',
        joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        contributions: 34,
        permissions: ['edit_projects', 'send_messages'],
        avatar: 'PP'
      }
    ],
    maxMembers: 5,
    skills: ['Building', 'Art', 'Animation'],
    projects: [],
    achievements: [],
    points: 1850,
    rank: 7,
    recruitmentStatus: 'open',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    settings: {
      isPublic: true,
      requireApplication: false,
      autoAcceptApplications: true
    }
  },
  {
    id: 'team-3',
    name: 'Code Warriors',
    description: 'Advanced scripting team working on complex systems',
    type: 'competitive',
    leader: 'user-6',
    members: [
      {
        userId: 'user-6',
        username: 'LuaMaster',
        role: 'leader',
        joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        contributions: 156,
        permissions: ['all'],
        avatar: 'LM'
      },
      {
        userId: 'user-7',
        username: 'SystemsPro',
        role: 'moderator',
        joinedAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
        contributions: 134,
        permissions: ['manage_members', 'edit_projects', 'send_messages'],
        avatar: 'SP'
      },
      {
        userId: 'user-8',
        username: 'DataExpert',
        role: 'member',
        joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        contributions: 98,
        permissions: ['edit_projects', 'send_messages'],
        avatar: 'DE'
      },
      {
        userId: 'user-9',
        username: 'AIBuilder',
        role: 'member',
        joinedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        contributions: 76,
        permissions: ['edit_projects', 'send_messages'],
        avatar: 'AB'
      },
      {
        userId: 'user-10',
        username: 'NetworkNinja',
        role: 'member',
        joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        contributions: 54,
        permissions: ['edit_projects', 'send_messages'],
        avatar: 'NN'
      }
    ],
    maxMembers: 5,
    skills: ['Scripting', 'Game Design', 'Leadership'],
    projects: [],
    achievements: ['Elite Team', 'Project Master', 'Community Leader'],
    points: 4200,
    rank: 1,
    recruitmentStatus: 'closed',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    settings: {
      isPublic: true,
      requireApplication: true,
      autoAcceptApplications: false
    }
  }
]

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      // Initial state
      teams: mockTeams,
      myTeams: ['team-1'], // Current user is in team-1 by default
      applications: [],
      notifications: [],
      activeTeamId: null,
      currentUserId: 'user-1', // Mock current user

      // Team CRUD
      createTeam: (teamData) => {
        const teamId = `team-${Date.now()}`
        const newTeam: Team = {
          ...teamData,
          id: teamId,
          createdAt: new Date().toISOString(),
          members: [
            {
              userId: get().currentUserId,
              username: 'CurrentUser', // In production, get from auth
              role: 'leader',
              joinedAt: new Date().toISOString(),
              contributions: 0,
              permissions: ['all'],
              avatar: 'CU'
            }
          ],
          projects: [],
          achievements: [],
          points: 0
        }

        set((state) => ({
          teams: [...state.teams, newTeam],
          myTeams: [...state.myTeams, teamId]
        }))

        // Add notification
        get().addNotification({
          teamId,
          type: 'achievement',
          title: 'Team Created!',
          message: `Welcome to ${newTeam.name}! Start inviting members and building amazing projects.`
        })

        return teamId
      },

      updateTeam: (teamId, updates) => {
        set((state) => ({
          teams: state.teams.map(team =>
            team.id === teamId ? { ...team, ...updates } : team
          )
        }))
      },

      deleteTeam: (teamId) => {
        set((state) => ({
          teams: state.teams.filter(team => team.id !== teamId),
          myTeams: state.myTeams.filter(id => id !== teamId),
          applications: state.applications.filter(app => app.teamId !== teamId),
          notifications: state.notifications.filter(notif => notif.teamId !== teamId)
        }))
      },

      getTeamById: (teamId) => {
        return get().teams.find(team => team.id === teamId)
      },

      // Membership
      joinTeam: (teamId, userId, role = 'member') => {
        const team = get().getTeamById(teamId)
        if (!team || team.members.length >= team.maxMembers) return false

        const newMember: TeamMember = {
          userId,
          username: `User${userId}`, // In production, get from user data
          role,
          joinedAt: new Date().toISOString(),
          contributions: 0,
          permissions: ['edit_projects', 'send_messages'],
          avatar: userId.substring(0, 2).toUpperCase()
        }

        set((state) => ({
          teams: state.teams.map(t =>
            t.id === teamId
              ? { ...t, members: [...t.members, newMember] }
              : t
          ),
          myTeams: userId === state.currentUserId
            ? [...state.myTeams, teamId]
            : state.myTeams
        }))

        // Add notification
        get().addNotification({
          teamId,
          type: 'message',
          title: 'New Member!',
          message: `${newMember.username} has joined the team!`
        })

        return true
      },

      leaveTeam: (teamId, userId) => {
        const team = get().getTeamById(teamId)
        if (!team) return false

        // Can't leave if you're the only leader
        const member = team.members.find(m => m.userId === userId)
        if (member?.role === 'leader' && team.members.filter(m => m.role === 'leader').length === 1) {
          return false
        }

        set((state) => ({
          teams: state.teams.map(t =>
            t.id === teamId
              ? { ...t, members: t.members.filter(m => m.userId !== userId) }
              : t
          ),
          myTeams: userId === state.currentUserId
            ? state.myTeams.filter(id => id !== teamId)
            : state.myTeams
        }))

        return true
      },

      kickMember: (teamId, userId, kickedBy) => {
        const team = get().getTeamById(teamId)
        if (!team) return false

        const kicker = team.members.find(m => m.userId === kickedBy)
        if (!kicker || (kicker.role !== 'leader' && kicker.role !== 'moderator')) return false

        return get().leaveTeam(teamId, userId)
      },

      promoteMember: (teamId, userId, newRole) => {
        set((state) => ({
          teams: state.teams.map(team =>
            team.id === teamId
              ? {
                  ...team,
                  members: team.members.map(member =>
                    member.userId === userId
                      ? {
                          ...member,
                          role: newRole,
                          permissions: newRole === 'leader'
                            ? ['all']
                            : ['manage_members', 'edit_projects', 'send_messages']
                        }
                      : member
                  )
                }
              : team
          )
        }))
        return true
      },

      demoteMember: (teamId, userId) => {
        set((state) => ({
          teams: state.teams.map(team =>
            team.id === teamId
              ? {
                  ...team,
                  members: team.members.map(member =>
                    member.userId === userId
                      ? {
                          ...member,
                          role: 'member',
                          permissions: ['edit_projects', 'send_messages']
                        }
                      : member
                  )
                }
              : team
          )
        }))
        return true
      },

      // Applications
      createApplication: (applicationData) => {
        const application: TeamApplication = {
          ...applicationData,
          id: `app-${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: 'pending'
        }

        set((state) => ({
          applications: [...state.applications, application]
        }))

        // Notify team leader
        const team = get().getTeamById(applicationData.teamId)
        if (team) {
          get().addNotification({
            teamId: applicationData.teamId,
            type: 'application',
            title: 'New Application',
            message: `${applicationData.username} wants to join your team!`,
            metadata: { applicationId: application.id }
          })
        }
      },

      reviewApplication: (applicationId, status, reviewerId) => {
        const application = get().applications.find(app => app.id === applicationId)
        if (!application) return

        set((state) => ({
          applications: state.applications.map(app =>
            app.id === applicationId
              ? {
                  ...app,
                  status,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: reviewerId
                }
              : app
          )
        }))

        // If accepted, add member to team
        if (status === 'accepted') {
          get().joinTeam(application.teamId, application.userId)
        }
      },

      getTeamApplications: (teamId) => {
        return get().applications.filter(app => app.teamId === teamId && app.status === 'pending')
      },

      getUserApplications: (userId) => {
        return get().applications.filter(app => app.userId === userId)
      },

      // Notifications
      addNotification: (notificationData) => {
        const notification: TeamNotification = {
          ...notificationData,
          id: `notif-${Date.now()}`,
          createdAt: new Date().toISOString(),
          read: false
        }

        set((state) => ({
          notifications: [notification, ...state.notifications]
        }))
      },

      markNotificationRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        }))
      },

      clearNotifications: (teamId) => {
        set((state) => ({
          notifications: teamId
            ? state.notifications.filter(notif => notif.teamId !== teamId)
            : []
        }))
      },

      getTeamNotifications: (teamId) => {
        return get().notifications.filter(notif => notif.teamId === teamId)
      },

      // Projects
      addProject: (teamId, projectData) => {
        const project: TeamProject = {
          ...projectData,
          id: `proj-${Date.now()}`,
          createdAt: new Date().toISOString(),
          tasks: []
        }

        set((state) => ({
          teams: state.teams.map(team =>
            team.id === teamId
              ? { ...team, projects: [...team.projects, project] }
              : team
          )
        }))

        get().addNotification({
          teamId,
          type: 'project',
          title: 'New Project Created',
          message: `"${project.name}" has been added to your team projects!`
        })
      },

      updateProject: (teamId, projectId, updates) => {
        set((state) => ({
          teams: state.teams.map(team =>
            team.id === teamId
              ? {
                  ...team,
                  projects: team.projects.map(proj =>
                    proj.id === projectId ? { ...proj, ...updates } : proj
                  )
                }
              : team
          )
        }))
      },

      deleteProject: (teamId, projectId) => {
        set((state) => ({
          teams: state.teams.map(team =>
            team.id === teamId
              ? {
                  ...team,
                  projects: team.projects.filter(proj => proj.id !== projectId)
                }
              : team
          )
        }))
      },

      // Utility
      setActiveTeam: (teamId) => {
        set({ activeTeamId: teamId })
      },

      getUserTeams: (userId) => {
        const id = userId || get().currentUserId
        return get().teams.filter(team =>
          team.members.some(member => member.userId === id)
        )
      },

      getRecruitingTeams: () => {
        return get().teams.filter(team => 
          team.recruitmentStatus === 'open' || team.recruitmentStatus === 'selective'
        )
      }
    }),
    {
      name: 'team-storage',
      version: 1
    }
  )
)