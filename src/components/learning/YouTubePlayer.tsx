'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Maximize,
  Settings,
  CheckCircle,
  Clock,
  Trophy,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import * as Progress from '@radix-ui/react-progress'
import * as Slider from '@radix-ui/react-slider'

interface YouTubePlayerProps {
  videoId: string
  title: string
  onComplete?: () => void
  onProgress?: (progress: number) => void
  xpReward?: number
  nextVideo?: {
    id: string
    title: string
  }
}

export function YouTubePlayer({ 
  videoId, 
  title, 
  onComplete, 
  onProgress,
  xpReward = 50,
  nextVideo
}: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [watchProgress, setWatchProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [quality, setQuality] = useState('720p')
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressInterval = useRef<NodeJS.Timeout>()

  // Mock YouTube iframe API (in real app, use actual YouTube API)
  useEffect(() => {
    // Simulate video loading
    setTimeout(() => {
      setDuration(600) // 10 minutes
    }, 1000)
  }, [videoId])

  // Track progress
  useEffect(() => {
    if (isPlaying && !isCompleted) {
      progressInterval.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = Math.min(prev + 1, duration)
          const progress = (newTime / duration) * 100
          setWatchProgress(progress)
          
          if (progress >= 90 && !isCompleted) {
            handleVideoComplete()
          }
          
          if (onProgress) {
            onProgress(progress)
          }
          
          return newTime
        })
      }, 1000)
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [isPlaying, duration, isCompleted])

  const handleVideoComplete = () => {
    setIsCompleted(true)
    setShowCompletionModal(true)
    if (onComplete) {
      onComplete()
    }
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * duration
    setCurrentTime(newTime)
    setWatchProgress((newTime / duration) * 100)
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setIsMuted(value[0] === 0)
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(1)
      setIsMuted(false)
    } else {
      setVolume(0)
      setIsMuted(true)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const skipBack = () => {
    setCurrentTime(Math.max(0, currentTime - 10))
  }

  const skipForward = () => {
    setCurrentTime(Math.min(duration, currentTime + 10))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative">
      {/* Video Container */}
      <div 
        ref={containerRef}
        className={cn(
          "relative bg-black rounded-lg overflow-hidden",
          isFullscreen ? "fixed inset-0 z-50" : "aspect-video"
        )}
      >
        {/* Mock Video Display */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blox-very-dark-blue to-black">
          <div className="text-center">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-blox-white text-lg font-medium mb-2">{title}</p>
            <p className="text-blox-off-white text-sm">Video ID: {videoId}</p>
            {isPlaying && (
              <div className="mt-4 text-blox-teal animate-pulse">
                ▶ Playing...
              </div>
            )}
          </div>
        </div>

        {/* Video Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-2"
              value={[currentTime / duration * 100]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
            >
              <Slider.Track className="bg-blox-medium-blue-gray relative grow rounded-full h-1">
                <Slider.Range className="absolute bg-blox-teal rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-3 h-3 bg-blox-teal rounded-full hover:scale-125 transition-transform cursor-grab active:cursor-grabbing" />
            </Slider.Root>
            
            <div className="flex justify-between text-xs text-blox-off-white mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-2 bg-blox-teal rounded-lg hover:bg-blox-teal-dark transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white" />
                )}
              </button>

              {/* Skip Back/Forward */}
              <button
                onClick={skipBack}
                className="p-2 bg-blox-second-dark-blue rounded-lg hover:bg-blox-medium-blue-gray transition-colors"
              >
                <SkipBack className="h-4 w-4 text-blox-white" />
              </button>
              <button
                onClick={skipForward}
                className="p-2 bg-blox-second-dark-blue rounded-lg hover:bg-blox-medium-blue-gray transition-colors"
              >
                <SkipForward className="h-4 w-4 text-blox-white" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 bg-blox-second-dark-blue rounded-lg hover:bg-blox-medium-blue-gray transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4 text-blox-white" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-blox-white" />
                  )}
                </button>
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-20 h-1"
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                >
                  <Slider.Track className="bg-blox-medium-blue-gray relative grow rounded-full h-1">
                    <Slider.Range className="absolute bg-blox-white rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-2 h-2 bg-white rounded-full hover:scale-125 transition-transform" />
                </Slider.Root>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Speed Control */}
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="px-2 py-1 bg-blox-second-dark-blue text-blox-white text-sm rounded-lg border border-blox-medium-blue-gray"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              {/* Quality */}
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="px-2 py-1 bg-blox-second-dark-blue text-blox-white text-sm rounded-lg border border-blox-medium-blue-gray"
              >
                <option value="360p">360p</option>
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
              </select>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-blox-second-dark-blue rounded-lg hover:bg-blox-medium-blue-gray transition-colors"
              >
                <Maximize className="h-4 w-4 text-blox-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Info */}
      <div className="mt-4 bg-blox-second-dark-blue rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-blox-white">Watch Progress</h3>
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-blox-success" />
          ) : (
            <Clock className="h-5 w-5 text-blox-off-white" />
          )}
        </div>
        
        <Progress.Root 
          className="relative overflow-hidden bg-blox-very-dark-blue rounded-full w-full h-3"
          value={watchProgress}
        >
          <Progress.Indicator
            className="bg-gradient-to-r from-blox-teal to-blox-purple h-full transition-transform duration-300"
            style={{ transform: `translateX(-${100 - watchProgress}%)` }}
          />
        </Progress.Root>
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-blox-off-white">
            {isCompleted ? 'Completed!' : `${Math.round(watchProgress)}% watched`}
          </span>
          {!isCompleted && watchProgress >= 90 && (
            <span className="text-xs text-blox-teal animate-pulse">
              Almost done! +{xpReward} XP
            </span>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-blox-very-dark-blue border border-blox-teal rounded-xl p-8 max-w-md w-full text-center">
            <div className="mb-4">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-blox-white mb-2">
                Video Completed!
              </h2>
              <p className="text-blox-off-white">
                Great job finishing "{title}"
              </p>
            </div>

            <div className="bg-blox-second-dark-blue rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <Zap className="h-8 w-8 text-blox-teal mx-auto mb-1" />
                  <div className="text-lg font-bold text-blox-white">+{xpReward}</div>
                  <div className="text-xs text-blox-off-white">XP Earned</div>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-blox-success mx-auto mb-1" />
                  <div className="text-lg font-bold text-blox-white">100%</div>
                  <div className="text-xs text-blox-off-white">Complete</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="flex-1 px-4 py-2 bg-blox-second-dark-blue text-blox-white rounded-lg hover:bg-blox-medium-blue-gray transition-colors"
              >
                Review Video
              </button>
              {nextVideo && (
                <button
                  onClick={() => {
                    setShowCompletionModal(false)
                    // Navigate to next video
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blox-teal to-blox-purple text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Next Video →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}