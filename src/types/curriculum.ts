// Shared curriculum data types

export interface VideoBase {
  id: string
  title: string
  youtubeId: string
  creator: string
  duration: string
  xpReward: number
}

export interface VideoWithThumbnail extends VideoBase {
  thumbnail: string
}

export interface VideoWithOriginalSearch extends VideoBase {
  originalSearch: {
    title: string
    creator: string
  }
}

export interface VideoWithSubstitute extends VideoBase {
  thumbnail?: string
  isSubstitute?: boolean
  substituteReason?: string
  originalRequest?: {
    title: string
    creator: string
  }
}

// Add isSubstitute to all video types for compatibility
export interface VideoWithThumbnailExtended extends VideoWithThumbnail {
  isSubstitute?: boolean
  substituteReason?: string
  originalRequest?: {
    title: string
    creator: string
  }
}

export interface VideoWithOriginalSearchExtended extends VideoWithOriginalSearch {
  isSubstitute?: boolean
  substituteReason?: string
  originalRequest?: {
    title: string
    creator: string
  }
}

// Union type for all video formats in the curriculum
export type CurriculumVideo = VideoWithThumbnailExtended | VideoWithOriginalSearchExtended | VideoWithSubstitute

// Helper function to check if video has thumbnail
export function hasVideoThumbnail(video: CurriculumVideo): video is VideoWithThumbnailExtended | VideoWithSubstitute {
  return 'thumbnail' in video && video.thumbnail !== undefined
}

// Helper function to get thumbnail URL for any video type
export function getVideoThumbnail(video: CurriculumVideo): string {
  if (hasVideoThumbnail(video) && video.thumbnail) {
    return video.thumbnail
  }
  // Fallback to YouTube thumbnail
  return `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`
}

// Helper function to check if video has original search data
export function hasOriginalSearch(video: CurriculumVideo): video is VideoWithOriginalSearchExtended {
  return 'originalSearch' in video
}

export interface Day {
  id: string
  title: string
  videos: CurriculumVideo[]
  practiceTask?: string
  estimatedTime?: string
}

export interface Week {
  id: string
  title: string
  description: string
  days: Day[]
}

export interface Module {
  id: string
  title: string
  description: string
  totalHours: number
  totalXP: number
  weeks: Week[]
}

export interface CurriculumData {
  modules: Module[]
}