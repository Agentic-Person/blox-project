/**
 * TypeScript type definitions for YouTube integration
 */

// YouTube IFrame API Types
export interface YouTubePlayer {
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number): void
  setPlaybackRate(rate: number): void
  setVolume(volume: number): void
  getVolume(): number
  mute(): void
  unMute(): void
  isMuted(): boolean
}

export interface YouTubePlayerOptions {
  height?: string | number
  width?: string | number
  videoId: string
  playerVars?: {
    autoplay?: 0 | 1
    controls?: 0 | 1
    rel?: 0 | 1
    showinfo?: 0 | 1
    modestbranding?: 0 | 1
    enablejsapi?: 0 | 1
    origin?: string
    start?: number
    end?: number
    fs?: 0 | 1
    cc_load_policy?: 0 | 1
    iv_load_policy?: 1 | 3
  }
  events?: {
    onReady?: (event: any) => void
    onStateChange?: (event: any) => void
    onPlaybackRateChange?: (event: any) => void
    onError?: (event: any) => void
  }
}

// YouTube Player States
export enum PlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5
}

// YouTube Data API Types
export interface YouTubeApiResponse<T> {
  kind: string
  etag: string
  nextPageToken?: string
  prevPageToken?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
  items: T[]
}

export interface YouTubeVideoResource {
  kind: 'youtube#video'
  etag: string
  id: string
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      default?: YouTubeThumbnail
      medium?: YouTubeThumbnail
      high?: YouTubeThumbnail
      standard?: YouTubeThumbnail
      maxres?: YouTubeThumbnail
    }
    channelTitle: string
    tags?: string[]
    categoryId: string
    liveBroadcastContent: string
    defaultLanguage?: string
    defaultAudioLanguage?: string
    videoOwnerChannelTitle?: string
    videoOwnerChannelId?: string
  }
  contentDetails: {
    duration: string
    dimension: string
    definition: string
    caption: string
    licensedContent: boolean
    regionRestriction?: {
      allowed?: string[]
      blocked?: string[]
    }
    projection: string
  }
  statistics?: {
    viewCount: string
    likeCount?: string
    dislikeCount?: string
    favoriteCount: string
    commentCount?: string
  }
}

export interface YouTubePlaylistItemResource {
  kind: 'youtube#playlistItem'
  etag: string
  id: string
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      default?: YouTubeThumbnail
      medium?: YouTubeThumbnail
      high?: YouTubeThumbnail
      standard?: YouTubeThumbnail
      maxres?: YouTubeThumbnail
    }
    channelTitle: string
    playlistId: string
    position: number
    resourceId: {
      kind: string
      videoId: string
    }
    videoOwnerChannelTitle?: string
    videoOwnerChannelId?: string
  }
  contentDetails: {
    videoId: string
    startAt?: string
    endAt?: string
    note?: string
    videoPublishedAt: string
  }
}

export interface YouTubeThumbnail {
  url: string
  width: number
  height: number
}

// Application Types
export interface VideoData {
  id: string
  title: string
  youtubeId: string
  creator: string
  duration: string
  xpReward: number
  thumbnail: string
  description?: string
  publishedAt?: string
  tags?: string[]
  isPlaceholder?: boolean
}

export interface CurriculumVideo extends VideoData {
  // Additional properties specific to curriculum videos
  practiceExercises?: string[]
  learningObjectives?: string[]
  prerequisites?: string[]
}

export interface PlaylistImportOptions {
  playlistId: string
  apiKey: string
  maxResults?: number
  includePrivate?: boolean
  targetWeek?: number
  targetModule?: number
}

export interface VideoReplacementOptions {
  youtubeUrl: string
  moduleIndex: number
  weekIndex: number
  dayIndex: number
  videoIndex: number
  apiKey: string
}

export interface VideoValidationResult {
  isValid: boolean
  exists: boolean
  isEmbeddable: boolean
  title?: string
  duration?: string
  error?: string
}

// Error Types
export interface YouTubeApiError {
  error: {
    code: number
    message: string
    errors: Array<{
      domain: string
      reason: string
      message: string
      locationType?: string
      location?: string
    }>
  }
}

// Video Tracking Types
export interface VideoProgress {
  videoId: string
  currentTime: number
  duration: number
  watchTime: number
  completed: boolean
  completionPercentage: number
}

export interface VideoTrackingOptions {
  videoId: string
  completionThreshold?: number // Default 0.9 (90%)
  trackingInterval?: number // Default 1000ms
  onProgress?: (progress: VideoProgress) => void
  onComplete?: (videoId: string) => void
}

// Curriculum Integration Types
export interface DayVideoDistribution {
  dayIndex: number
  title: string
  videos: VideoData[]
  totalMinutes: number
  estimatedTime: string
  practiceTask?: string
}

export interface WeekRestructureResult {
  weekNumber: number
  title: string
  description: string
  days: DayVideoDistribution[]
  totalVideos: number
  totalMinutes: number
}