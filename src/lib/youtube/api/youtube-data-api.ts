/**
 * YouTube Data API v3 integration
 * Provides high-level functions for video and playlist operations
 */

import { 
  VideoMetadata, 
  PlaylistItem, 
  fetchVideoMetadata, 
  fetchPlaylistItems,
  fetchMultipleVideoMetadata 
} from '../utils/metadata-fetcher'
import { extractYouTubeId, extractPlaylistId, isValidYouTubeId } from '../utils/id-extractor'
import { 
  VideoReplacementOptions, 
  PlaylistImportOptions, 
  VideoValidationResult,
  YouTubeApiError 
} from './types'

/**
 * Get API key from environment variables
 */
function getApiKey(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_YOUTUBE_API_KEY) {
    return process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
  }
  
  // Fallback for client-side
  if (typeof window !== 'undefined' && (window as any).__YOUTUBE_API_KEY__) {
    return (window as any).__YOUTUBE_API_KEY__
  }
  
  throw new Error('YouTube API key not found. Please set NEXT_PUBLIC_YOUTUBE_API_KEY in your environment.')
}

/**
 * Validate a YouTube video by checking if it exists and is embeddable
 */
export async function validateYouTubeVideo(videoId: string): Promise<VideoValidationResult> {
  try {
    if (!isValidYouTubeId(videoId)) {
      return {
        isValid: false,
        exists: false,
        isEmbeddable: false,
        error: 'Invalid YouTube video ID format'
      }
    }

    const apiKey = getApiKey()
    const metadata = await fetchVideoMetadata(videoId, apiKey)
    
    return {
      isValid: true,
      exists: true,
      isEmbeddable: true, // If we can fetch it, it's likely embeddable
      title: metadata.title,
      duration: metadata.duration
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return {
      isValid: false,
      exists: !errorMessage.includes('not found'),
      isEmbeddable: false,
      error: errorMessage
    }
  }
}

/**
 * Get video metadata from YouTube URL or ID
 */
export async function getVideoMetadata(urlOrId: string): Promise<VideoMetadata> {
  const videoId = extractYouTubeId(urlOrId)
  
  if (!videoId) {
    throw new Error(`Invalid YouTube URL or ID: ${urlOrId}`)
  }
  
  const apiKey = getApiKey()
  return fetchVideoMetadata(videoId, apiKey)
}

/**
 * Get playlist items with metadata
 */
export async function getPlaylistItems(playlistUrl: string, maxResults = 50): Promise<PlaylistItem[]> {
  const playlistId = extractPlaylistId(playlistUrl)
  
  if (!playlistId) {
    throw new Error(`Invalid YouTube playlist URL: ${playlistUrl}`)
  }
  
  const apiKey = getApiKey()
  return fetchPlaylistItems(playlistId, apiKey, maxResults)
}

/**
 * Batch validate multiple YouTube video IDs
 */
export async function validateMultipleVideos(videoIds: string[]): Promise<Map<string, VideoValidationResult>> {
  const results = new Map<string, VideoValidationResult>()
  
  if (videoIds.length === 0) {
    return results
  }
  
  try {
    const apiKey = getApiKey()
    const metadata = await fetchMultipleVideoMetadata(videoIds, apiKey)
    const metadataMap = new Map(metadata.map(m => [m.id, m]))
    
    for (const videoId of videoIds) {
      if (!isValidYouTubeId(videoId)) {
        results.set(videoId, {
          isValid: false,
          exists: false,
          isEmbeddable: false,
          error: 'Invalid YouTube video ID format'
        })
        continue
      }
      
      const meta = metadataMap.get(videoId)
      if (meta) {
        results.set(videoId, {
          isValid: true,
          exists: true,
          isEmbeddable: true,
          title: meta.title,
          duration: meta.duration
        })
      } else {
        results.set(videoId, {
          isValid: false,
          exists: false,
          isEmbeddable: false,
          error: 'Video not found or is private'
        })
      }
    }
  } catch (error) {
    // If batch fails, mark all as invalid
    for (const videoId of videoIds) {
      results.set(videoId, {
        isValid: false,
        exists: false,
        isEmbeddable: false,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
  
  return results
}

/**
 * Search for videos by keyword
 */
export async function searchVideos(
  query: string,
  maxResults = 10,
  order: 'relevance' | 'date' | 'rating' | 'viewCount' | 'title' = 'relevance'
): Promise<VideoMetadata[]> {
  const apiKey = getApiKey()
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&order=${order}&q=${encodeURIComponent(query)}&key=${apiKey}`
  
  try {
    const response = await fetch(searchUrl)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(`YouTube API Error: ${data.error.message}`)
    }
    
    if (!data.items || data.items.length === 0) {
      return []
    }
    
    // Get detailed metadata for search results
    const videoIds = data.items.map((item: any) => item.id.videoId)
    return fetchMultipleVideoMetadata(videoIds, apiKey)
  } catch (error) {
    throw new Error(`Failed to search videos: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Get channel information
 */
export async function getChannelInfo(channelId: string): Promise<{
  id: string
  title: string
  description: string
  subscriberCount?: string
  videoCount?: string
  viewCount?: string
  thumbnail: string
}> {
  const apiKey = getApiKey()
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(`YouTube API Error: ${data.error.message}`)
    }
    
    if (!data.items || data.items.length === 0) {
      throw new Error(`Channel not found: ${channelId}`)
    }
    
    const channel = data.items[0]
    
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      subscriberCount: channel.statistics?.subscriberCount,
      videoCount: channel.statistics?.videoCount,
      viewCount: channel.statistics?.viewCount,
      thumbnail: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url || ''
    }
  } catch (error) {
    throw new Error(`Failed to fetch channel info: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Check YouTube API quota usage and limits
 */
export async function checkApiQuota(): Promise<{
  quotaUsed: boolean
  dailyLimit: number
  remainingQuota?: number
}> {
  try {
    const apiKey = getApiKey()
    // Make a minimal API call to test quota
    const testUrl = `https://www.googleapis.com/youtube/v3/videos?part=id&id=dQw4w9WgXcQ&key=${apiKey}`
    
    const response = await fetch(testUrl)
    const data = await response.json()
    
    if (data.error) {
      if (data.error.code === 403 && data.error.message.includes('quota')) {
        return {
          quotaUsed: true,
          dailyLimit: 10000, // Standard free tier limit
          remainingQuota: 0
        }
      }
      throw new Error(`API Error: ${data.error.message}`)
    }
    
    return {
      quotaUsed: false,
      dailyLimit: 10000,
      remainingQuota: undefined // YouTube doesn't provide remaining quota in responses
    }
  } catch (error) {
    return {
      quotaUsed: true,
      dailyLimit: 10000,
      remainingQuota: 0
    }
  }
}

// Export utility functions for backwards compatibility
export {
  extractYouTubeId,
  extractPlaylistId,
  isValidYouTubeId
} from '../utils/id-extractor'

export {
  formatDuration,
  parseIsoDuration,
  formatSecondsAsDuration,
  durationToMinutes,
  formatMinutesAsTime
} from '../utils/duration-formatter'