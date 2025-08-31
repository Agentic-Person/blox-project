// YouTube IFrame API service for video tracking
interface YouTubePlayer {
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number): void
  setPlaybackRate(rate: number): void
}

interface YouTubePlayerOptions {
  height?: string
  width?: string
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
    playsinline?: 0 | 1
  }
  events?: {
    onReady?: (event: any) => void
    onStateChange?: (event: any) => void
    onPlaybackRateChange?: (event: any) => void
    onError?: (event: any) => void
  }
}

// YouTube Player States
export const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
}

// Load YouTube IFrame API
let apiLoaded = false
let apiLoadPromise: Promise<void> | null = null

export function loadYouTubeAPI(): Promise<void> {
  if (apiLoaded) {
    return Promise.resolve()
  }

  if (apiLoadPromise) {
    return apiLoadPromise
  }

  apiLoadPromise = new Promise((resolve) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && (window as any).YT?.Player) {
      apiLoaded = true
      resolve()
      return
    }

    // Create script tag
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    
    // Set up callback
    const windowWithYT = window as any
    windowWithYT.onYouTubeIframeAPIReady = () => {
      apiLoaded = true
      resolve()
    }

    // Add script to page
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
  })

  return apiLoadPromise
}

// Create YouTube player
export async function createYouTubePlayer(
  elementId: string,
  options: YouTubePlayerOptions
): Promise<YouTubePlayer> {
  await loadYouTubeAPI()

  return new Promise((resolve) => {
    const player = new (window as any).YT.Player(elementId, {
      ...options,
      events: {
        ...options.events,
        onReady: (event: any) => {
          options.events?.onReady?.(event)
          resolve(player)
        }
      }
    })
  })
}

// Video tracking class
export class VideoTracker {
  private player: YouTubePlayer | null = null
  private trackingInterval: NodeJS.Timeout | null = null
  private lastUpdateTime = 0
  private totalWatchTime = 0
  private videoDuration = 0
  private progressCallback?: (progress: number, totalTime: number) => void
  private completionCallback?: () => void
  private completionThreshold = 0.9 // 90% completion

  constructor(
    private videoId: string,
    private onProgress?: (progress: number, totalTime: number) => void,
    private onComplete?: () => void
  ) {
    this.progressCallback = onProgress
    this.completionCallback = onComplete
  }

  async initialize(elementId: string) {
    this.player = await createYouTubePlayer(elementId, {
      videoId: this.videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        enablejsapi: 1,
        origin: window.location.protocol === 'http:' ? window.location.origin : undefined
      },
      events: {
        onReady: this.handlePlayerReady.bind(this),
        onStateChange: this.handleStateChange.bind(this),
        onError: this.handleError.bind(this)
      }
    })
  }

  private handlePlayerReady() {
    if (!this.player) return
    this.videoDuration = this.player.getDuration()
  }

  private handleStateChange(event: any) {
    if (!this.player) return

    const state = event.data

    if (state === PlayerState.PLAYING) {
      this.startTracking()
    } else if (state === PlayerState.PAUSED || state === PlayerState.ENDED) {
      this.stopTracking()
      
      if (state === PlayerState.ENDED) {
        this.checkCompletion()
      }
    }
  }

  private handleError(event: any) {
    console.error('YouTube player error:', event.data)
    // Error codes:
    // 2: Invalid parameter
    // 5: HTML5 player error
    // 100: Video not found
    // 101, 150: Video not embeddable
  }

  private startTracking() {
    if (this.trackingInterval) return

    this.trackingInterval = setInterval(() => {
      if (!this.player) return

      const currentTime = this.player.getCurrentTime()
      const duration = this.player.getDuration()

      // Update total watch time
      if (currentTime > this.lastUpdateTime) {
        this.totalWatchTime += currentTime - this.lastUpdateTime
      }
      this.lastUpdateTime = currentTime

      // Report progress
      this.progressCallback?.(currentTime, duration)

      // Check for completion
      this.checkCompletion()
    }, 1000) // Update every second
  }

  private stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval)
      this.trackingInterval = null
    }
  }

  private checkCompletion() {
    if (!this.player) return

    const currentTime = this.player.getCurrentTime()
    const duration = this.player.getDuration()

    if (duration > 0 && currentTime >= duration * this.completionThreshold) {
      this.completionCallback?.()
    }
  }

  public getTotalWatchTime(): number {
    return this.totalWatchTime
  }

  public getProgress(): number {
    if (!this.player || this.videoDuration === 0) return 0
    return (this.player.getCurrentTime() / this.videoDuration) * 100
  }

  public destroy() {
    this.stopTracking()
    this.player = null
  }
}

// Helper to extract video ID from YouTube URL
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
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

// Helper to format duration
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}