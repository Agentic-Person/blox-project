export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  requirements: AchievementRequirement[]
  reward?: AchievementReward
}

export interface AchievementRequirement {
  type: 'videos_watched' | 'days_streak' | 'team_joined' | 'project_completed' | 'skill_learned'
  target: number
  description: string
}

export interface AchievementReward {
  type: 'badge' | 'title' | 'avatar_frame'
  value: string
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  unlockedAt: Date
  progress: number
  isCompleted: boolean
}

export interface ProgressStats {
  totalVideosWatched: number
  totalMinutesWatched: number
  currentStreak: number
  longestStreak: number
  completedModules: number
  completedWeeks: number
  achievementsUnlocked: number
  teamContributions: number
}

export interface ActivityLog {
  id: string
  userId: string
  type: 'video_completed' | 'module_completed' | 'team_joined' | 'achievement_unlocked' | 'note_created'
  title: string
  description: string
  metadata?: Record<string, any>
  createdAt: Date
}