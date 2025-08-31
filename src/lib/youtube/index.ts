/**
 * YouTube Integration Library
 * Centralized exports for all YouTube-related functionality
 */

// YouTube Data API (primary exports)
export * from './api/youtube-data-api'

// Types (re-export to avoid conflicts)
export type {
  YouTubePlayer,
  YouTubePlayerOptions,
  VideoData,
  VideoProgress,
  VideoTrackingOptions,
  VideoReplacementOptions,
  PlaylistImportOptions,
  VideoValidationResult,
  YouTubePlaylistItemResource
} from './api/types'

// YouTube IFrame API (specific exports to avoid conflicts)
export {
  loadYouTubeAPI,
  createYouTubePlayer,
  VideoTracker
} from './api/youtube-iframe-api'

// Re-export PlayerState enum specifically
export { PlayerState } from './api/types'

// Utilities (specific exports to avoid conflicts)
export {
  formatDuration,
  parseIsoDuration,
  formatSecondsAsDuration,
  durationToMinutes,
  formatMinutesAsTime
} from './utils/duration-formatter'

export {
  extractYouTubeId,
  extractPlaylistId,
  isValidYouTubeId,
  buildYouTubeUrl,
  buildYouTubeEmbedUrl,
  getYouTubeThumbnail,
  isPlaceholderYouTubeId,
  getThumbnailAltText
} from './utils/id-extractor'

export {
  fetchVideoMetadata,
  fetchPlaylistItems,
  fetchMultipleVideoMetadata
} from './utils/metadata-fetcher'