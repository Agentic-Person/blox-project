export interface Module {
  id: string
  title: string
  description: string
  order: number
  weeks: Week[]
  thumbnail?: string
  estimatedHours: number
}

export interface Week {
  id: string
  moduleId: string
  title: string
  description: string
  order: number
  days: Day[]
}

export interface Day {
  id: string
  weekId: string
  title: string
  description: string
  order: number
  videos: Video[]
  practiceTask?: PracticeTask
}

export interface Video {
  id: string
  dayId: string
  title: string
  description: string
  youtubeId: string
  duration: number // in seconds
  order: number
  thumbnail: string
  channel: string
  tags: string[]
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