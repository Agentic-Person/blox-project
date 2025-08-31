/**
 * YouTube metadata fetching utilities
 * Centralizes YouTube Data API v3 calls for video and playlist metadata
 */

import { formatDuration, durationToMinutes } from './duration-formatter'
import { extractYouTubeId, isValidYouTubeId } from './id-extractor'

export interface VideoMetadata {
  id: string
  title: string
  description: string
  creator: string
  channelTitle: string
  duration: string
  totalMinutes: number
  thumbnail: string
  publishedAt: string
  tags?: string[]
}

export interface PlaylistItem extends VideoMetadata {
  position: number
}

export interface ApiError extends Error {
  code?: string
  status?: number
}

/**
 * Fetch video metadata from YouTube Data API v3
 */
export async function fetchVideoMetadata(
  videoId: string,
  apiKey: string
): Promise<VideoMetadata> {
  if (!isValidYouTubeId(videoId)) {
    throw new Error(`Invalid YouTube video ID: ${videoId}`)
  }

  if (!apiKey) {
    throw new Error('YouTube API key not found. Please set NEXT_PUBLIC_YOUTUBE_API_KEY in your .env.local file.')
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.error) {
      const error = new Error(`YouTube API Error: ${data.error.message}`) as ApiError
      error.code = data.error.code
      error.status = data.error.status
      throw error
    }
    
    if (!data.items || data.items.length === 0) {
      throw new Error(`Video not found or is private: ${videoId}`)
    }
    
    const item = data.items[0]
    const duration = item.contentDetails.duration
    
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      creator: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle,
      channelTitle: item.snippet.channelTitle,
      duration: formatDuration(duration),
      totalMinutes: durationToMinutes(duration),
      thumbnail: item.snippet.thumbnails.maxres?.url || 
                item.snippet.thumbnails.high?.url || 
                item.snippet.thumbnails.medium?.url ||
                '/images/placeholder-thumbnail.jpg',
      publishedAt: item.snippet.publishedAt,
      tags: item.snippet.tags
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to fetch video metadata: ${String(error)}`)
  }
}

/**
 * Fetch playlist items from YouTube Data API v3
 */
export async function fetchPlaylistItems(
  playlistId: string,
  apiKey: string,
  maxResults: number = 50
): Promise<PlaylistItem[]> {
  if (!apiKey) {
    throw new Error('YouTube API key not found. Please set NEXT_PUBLIC_YOUTUBE_API_KEY in your .env.local file.')
  }

  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${apiKey}`
  
  try {
    // Fetch playlist items
    const playlistResponse = await fetch(playlistUrl)
    const playlistData = await playlistResponse.json()
    
    if (playlistData.error) {
      const error = new Error(`YouTube API Error: ${playlistData.error.message}`) as ApiError
      error.code = playlistData.error.code
      throw error
    }
    
    if (!playlistData.items || playlistData.items.length === 0) {
      throw new Error(`Playlist not found or is empty: ${playlistId}`)
    }
    
    // Get video IDs for detailed metadata
    const videoIds = playlistData.items
      .map((item: any) => item.snippet.resourceId.videoId)
      .join(',')
    
    // Fetch video details
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${apiKey}`
    const videosResponse = await fetch(videosUrl)
    const videosData = await videosResponse.json()
    
    if (videosData.error) {
      const error = new Error(`YouTube API Error: ${videosData.error.message}`) as ApiError
      error.code = videosData.error.code
      throw error
    }
    
    // Combine playlist order with video details
    return playlistData.items.map((playlistItem: any, index: number) => {
      const videoDetail = videosData.items.find(
        (v: any) => v.id === playlistItem.snippet.resourceId.videoId
      )
      
      if (!videoDetail) {
        throw new Error(`Video details not found for ID: ${playlistItem.snippet.resourceId.videoId}`)
      }
      
      const duration = videoDetail.contentDetails.duration
      
      return {
        position: index + 1,
        id: videoDetail.id,
        title: videoDetail.snippet.title,
        description: videoDetail.snippet.description?.substring(0, 200) + 
                    (videoDetail.snippet.description?.length > 200 ? '...' : ''),
        creator: videoDetail.snippet.videoOwnerChannelTitle || videoDetail.snippet.channelTitle,
        channelTitle: videoDetail.snippet.channelTitle,
        duration: formatDuration(duration),
        totalMinutes: durationToMinutes(duration),
        thumbnail: videoDetail.snippet.thumbnails.maxres?.url || 
                  videoDetail.snippet.thumbnails.high?.url ||
                  videoDetail.snippet.thumbnails.medium?.url ||
                  '/images/placeholder-thumbnail.jpg',
        publishedAt: videoDetail.snippet.publishedAt,
        tags: videoDetail.snippet.tags
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to fetch playlist items: ${String(error)}`)
  }
}

/**
 * Batch fetch metadata for multiple video IDs
 */
export async function fetchMultipleVideoMetadata(
  videoIds: string[],
  apiKey: string
): Promise<VideoMetadata[]> {
  if (videoIds.length === 0) {
    return []
  }
  
  // YouTube API allows up to 50 IDs per request
  const batchSize = 50
  const results: VideoMetadata[] = []
  
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize)
    const batchIds = batch.join(',')
    
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${batchIds}&key=${apiKey}`
    
    try {
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.error) {
        console.warn(`YouTube API Error for batch ${i}-${i + batchSize}: ${data.error.message}`)
        continue
      }
      
      if (data.items) {
        const batchResults = data.items.map((item: any) => {
          const duration = item.contentDetails.duration
          
          return {
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            creator: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle,
            channelTitle: item.snippet.channelTitle,
            duration: formatDuration(duration),
            totalMinutes: durationToMinutes(duration),
            thumbnail: item.snippet.thumbnails.maxres?.url || 
                      item.snippet.thumbnails.high?.url ||
                      item.snippet.thumbnails.medium?.url ||
                      '/images/placeholder-thumbnail.jpg',
            publishedAt: item.snippet.publishedAt,
            tags: item.snippet.tags
          }
        })
        
        results.push(...batchResults)
      }
    } catch (error) {
      console.warn(`Failed to fetch batch ${i}-${i + batchSize}:`, error)
    }
  }
  
  return results
}