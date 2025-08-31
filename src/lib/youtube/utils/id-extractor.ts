/**
 * YouTube video ID extraction utilities
 * Handles various YouTube URL formats and extracts video IDs
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - VIDEO_ID (direct ID)
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    // Standard watch URL
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    // Direct video ID (11 characters, alphanumeric + _ and -)
    /^([a-zA-Z0-9_-]{11})$/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * Validate if a string is a valid YouTube video ID format
 * YouTube video IDs are exactly 11 characters: letters, numbers, underscore, hyphen
 */
export function isValidYouTubeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id)
}

/**
 * Extract playlist ID from YouTube playlist URL
 * Supports: https://www.youtube.com/playlist?list=PLAYLIST_ID
 */
export function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&]+)/)
  return match ? match[1] : null
}

/**
 * Build YouTube video URL from video ID
 */
export function buildYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

/**
 * Build YouTube embed URL from video ID with optional parameters
 */
export function buildYouTubeEmbedUrl(
  videoId: string, 
  options: {
    autoplay?: boolean
    controls?: boolean
    start?: number
    end?: number
  } = {}
): string {
  const params = new URLSearchParams()
  
  if (options.autoplay) params.set('autoplay', '1')
  if (options.controls === false) params.set('controls', '0')
  if (options.start) params.set('start', options.start.toString())
  if (options.end) params.set('end', options.end.toString())
  
  const queryString = params.toString()
  return `https://www.youtube.com/embed/${videoId}${queryString ? '?' + queryString : ''}`
}

/**
 * Get thumbnail URL for YouTube video with placeholder fallback
 */
export function getYouTubeThumbnail(
  videoId: string | undefined | null, 
  quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high',
  options: { fallbackToPlaceholder?: boolean } = {}
): string {
  const { fallbackToPlaceholder = true } = options
  
  // Check for placeholder YouTube IDs
  if (!videoId || 
      videoId === 'YOUTUBE_ID_PLACEHOLDER' || 
      videoId.trim() === '' ||
      videoId.includes('PLACEHOLDER')) {
    if (fallbackToPlaceholder) {
      return '/images/placeholder-thumbnail.svg'
    }
  }
  
  // Return YouTube thumbnail URL if we have a valid ID
  // Use 'hqdefault' for medium quality as it's more reliable than 'mediumdefault'
  const qualityParam = quality === 'standard' ? 'sddefault' : 
                      quality === 'maxres' ? 'maxresdefault' : 
                      quality === 'medium' ? 'hqdefault' :
                      quality === 'high' ? 'hqdefault' :
                      'default'
  
  return `https://img.youtube.com/vi/${videoId}/${qualityParam}.jpg`
}

/**
 * Check if a YouTube ID is a placeholder
 */
export function isPlaceholderYouTubeId(youtubeId: string | undefined | null): boolean {
  return !youtubeId || 
         youtubeId === 'YOUTUBE_ID_PLACEHOLDER' || 
         youtubeId.trim() === '' ||
         youtubeId.includes('PLACEHOLDER')
}

/**
 * Get appropriate alt text for thumbnail
 */
export function getThumbnailAltText(
  videoTitle: string,
  youtubeId: string | undefined | null
): string {
  if (isPlaceholderYouTubeId(youtubeId)) {
    return `${videoTitle} - Video coming soon`
  }
  return `${videoTitle} - Video thumbnail`
}