export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  discordId?: string
  createdAt: Date
  lastLoginAt: Date
  profile: UserProfile
}

export interface UserProfile {
  displayName: string
  bio?: string
  age?: number
  parentEmail?: string
  skills: Skill[]
  preferences: UserPreferences
  stats: UserStats
}

export interface Skill {
  name: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  category: string
}

export interface UserPreferences {
  theme: 'dark' | 'light'
  notifications: NotificationSettings
  privacy: PrivacySettings
}

export interface NotificationSettings {
  email: boolean
  discord: boolean
  achievements: boolean
  teamUpdates: boolean
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private'
  showProgress: boolean
  showTeams: boolean
}

export interface UserStats {
  totalVideosWatched: number
  totalTimeSpent: number // in minutes
  streakDays: number
  achievementsUnlocked: number
  teamsJoined: number
}