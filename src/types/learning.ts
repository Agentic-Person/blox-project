export interface Module {
  id: string
  title: string
  description: string
  order?: number
  weeks: Week[]
  thumbnail?: string
  totalHours: number
  totalXP: number
}

export interface Week {
  id: string
  moduleId?: string
  title: string
  description: string
  order?: number
  days: Day[]
}

export interface Day {
  id: string
  weekId?: string
  title: string
  description?: string
  order?: number
  videos: Video[]
  practiceTask?: string | PracticeTask
  estimatedTime?: string
}

export interface Video {
  id: string
  dayId?: string
  title: string
  description?: string
  youtubeId?: string
  duration: string // duration as string (e.g., "25:00")
  order?: number
  thumbnail?: string
  channel?: string
  creator?: string
  tags?: string[]
  xpReward: number
}

export interface PracticeTask {
  id: string
  title: string
  description: string
  instructions: string[]
  estimatedTime: number // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard'
  resources?: string[]
}

export interface VideoProgress {
  id: string
  userId: string
  videoId: string
  watchedDuration: number // in seconds
  isCompleted: boolean
  lastWatchedAt: Date
  notes?: string
}

export interface LearningProgress {
  id: string
  userId: string
  moduleId: string
  weekId?: string
  dayId?: string
  completedVideos: string[]
  currentVideoId?: string
  progressPercentage: number
  lastAccessedAt: Date
}