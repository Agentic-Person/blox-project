// YouTube API helpers
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: string
  channelTitle: string
}

export async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  if (!YOUTUBE_API_KEY) {
    // Return mock data in development
    return {
      id: videoId,
      title: 'Mock Video Title',
      description: 'This is a mock video for development',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: 'PT10M30S',
      channelTitle: 'Mock Channel',
    }
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    )
    const data = await response.json()
    
    if (data.items && data.items.length > 0) {
      const item = data.items[0]
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high.url,
        duration: item.contentDetails.duration,
        channelTitle: item.snippet.channelTitle,
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching YouTube video:', error)
    return null
  }
}

export function formatDuration(duration: string): string {
  // Convert ISO 8601 duration to readable format
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return '0:00'
  
  const hours = (match[1] || '').replace('H', '')
  const minutes = (match[2] || '').replace('M', '')
  const seconds = (match[3] || '').replace('S', '')
  
  const parts = []
  if (hours) parts.push(hours)
  parts.push(minutes || '0')
  parts.push(seconds.padStart(2, '0'))
  
  return parts.join(':')
}