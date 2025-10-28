'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Volume2, SkipBack, SkipForward, CheckCircle, Clock, Zap, Book, Award, Bot } from 'lucide-react'
import * as Progress from '@radix-ui/react-progress'
import { useLearningStore } from '@/store/learningStore'
import { useTimeManagementStore } from '@/store/timeManagementStore'
import { Breadcrumb } from './Breadcrumb'
import { loadYouTubeAPI, createYouTubePlayer, PlayerState } from '@/lib/youtube/youtube-api'
import { AIChat } from '@/components/blox-wizard/AIChat'
// import { toast } from 'sonner'

interface VideoPlayerProps {
  video: {
    id: string
    title: string
    description?: string
    youtubeId: string
    duration: string
    xpReward: number
    creator?: string
  }
  dayInfo?: {
    id: string
    title: string
  }
  moduleInfo?: {
    id: string
    title: string
  }
  practiceTask?: string
  estimatedTime?: string
  onComplete?: (videoId: string) => void
  onNext?: () => void
  onPrevious?: () => void
}

export function VideoPlayer({
  video,
  dayInfo,
  moduleInfo,
  practiceTask,
  estimatedTime,
  onComplete = () => {},
  onNext = () => {},
  onPrevious = () => {}
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [watchProgress, setWatchProgress] = useState(0)
  const [hasEarnedXP, setHasEarnedXP] = useState(false)
  const [player, setPlayer] = useState<any>(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoError, setVideoError] = useState<string | null>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const {
    isVideoCompleted,
    markVideoComplete,
    updateVideoProgress,
    videoProgress,
    totalHoursWatched
  } = useLearningStore()

  const {
    currentSessionStart,
    startSession,
    updateSessionTime,
    isOverDailyLimit,
    shouldShowBreakReminder
  } = useTimeManagementStore()

  const isCompleted = isVideoCompleted(video.id)
  const currentVideoProgress = videoProgress[video.id]

  // Initialize progress from store
  useEffect(() => {
    if (currentVideoProgress?.watchedDuration && currentVideoProgress?.totalDuration) {
      const progressPercent = Math.round((currentVideoProgress.watchedDuration / currentVideoProgress.totalDuration) * 100)
      setWatchProgress(progressPercent)
    }
  }, [currentVideoProgress])

  const durationInSeconds = convertDurationToSeconds(video.duration)

  // Initialize YouTube player
  useEffect(() => {
    if (!video.youtubeId || !playerRef.current) return

    const initPlayer = async () => {
      try {
        await loadYouTubeAPI()
        
        // Create a unique ID for the player div
        const playerId = `youtube-player-${video.id}`
        if (playerRef.current) {
          playerRef.current.id = playerId
        }
        
        const ytPlayer = await createYouTubePlayer(playerId, {
          videoId: video.youtubeId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.protocol === 'http:' ? window.location.origin : undefined
          },
          events: {
            onReady: (event: any) => {
              setPlayer(event.target)
              const duration = event.target.getDuration()
              setVideoDuration(duration)
            },
            onStateChange: (event: any) => {
              if (event.data === PlayerState.PLAYING) {
                setPlaying(true)
                startVideoTracking()
                if (!currentSessionStart) {
                  startSession()
                }
              } else if (event.data === PlayerState.PAUSED || event.data === PlayerState.ENDED) {
                setPlaying(false)
                stopVideoTracking()
              }
            },
            onError: (event: any) => {
              console.error('YouTube Player Error:', event.data)
              // Error codes:
              // 2: Invalid video ID
              // 5: HTML5 player error
              // 100: Video not found
              // 101, 150: Video not embeddable
              if (event.data === 2) {
                setVideoError('Invalid video ID. This video may have been removed.')
              } else if (event.data === 100) {
                setVideoError('Video not found. It may have been deleted or made private.')
              } else if (event.data === 101 || event.data === 150) {
                setVideoError('This video cannot be embedded due to creator restrictions.')
              } else {
                setVideoError('Unable to load video. Please try again later.')
              }
            }
          }
        })
      } catch (error) {
        console.error('Failed to initialize YouTube player:', error)
      }
    }

    initPlayer()

    return () => {
      stopVideoTracking()
      if (player) {
        player.destroy?.()
      }
    }
  }, [video.youtubeId, video.id])

  const startVideoTracking = useCallback(() => {
    if (trackingIntervalRef.current) return
    
    trackingIntervalRef.current = setInterval(() => {
      if (player) {
        const currentTime = player.getCurrentTime()
        const duration = player.getDuration()
        handleVideoProgress(currentTime, duration)
      }
    }, 1000) // Update every second
  }, [player])

  const stopVideoTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current)
      trackingIntervalRef.current = null
    }
  }, [])

  const handleVideoProgress = useCallback((currentTime: number, duration: number) => {
    if (!duration || duration === 0) return
    
    const progressPercent = Math.round((currentTime / duration) * 100)
    setWatchProgress(progressPercent)
    
    // Update video progress in store
    updateVideoProgress(video.id, currentTime, duration)
    
    // Update session time (convert seconds to minutes)
    const minutesWatched = Math.floor(currentTime / 60)
    updateSessionTime(minutesWatched)
    
    // Check for break reminder
    if (shouldShowBreakReminder()) {
      console.log('Time for a break! You\'ve been learning for a while.')
      // toast.info('Time for a break! You\'ve been learning for a while.')
    }
    
    // Check daily limit
    if (isOverDailyLimit()) {
      console.log('Daily learning limit reached. Great job today!')
      // toast.warning('Daily learning limit reached. Great job today!')
      player?.pauseVideo()
    }
    
    // Mark as complete and award XP when 90% watched
    if (progressPercent >= 90 && !isCompleted && !hasEarnedXP) {
      markVideoComplete(video.id, video.xpReward)
      setHasEarnedXP(true)
      onComplete(video.id)
      
      // toast.success(`Video completed! +${video.xpReward} XP earned`, {
      //   icon: <Award className="h-4 w-4" />
      // })
      console.log(`Video completed! +${video.xpReward} XP earned`)
    }
  }, [video.id, video.xpReward, isCompleted, hasEarnedXP, updateVideoProgress, updateSessionTime, shouldShowBreakReminder, isOverDailyLimit, markVideoComplete, onComplete])

  // Helper function to convert duration string to seconds
  function convertDurationToSeconds(duration: string): number {
    const [minutes, seconds] = duration.split(':').map(Number)
    return minutes * 60 + seconds
  }

  const togglePlayPause = () => {
    if (player) {
      if (playing) {
        player.pauseVideo()
      } else {
        player.playVideo()
      }
    }
    setPlaying(!playing)
  }

  return (
    <div className="h-full flex flex-col bg-blox-very-dark-blue">
      {/* Header with breadcrumb */}
      <div className="p-6 border-b border-blox-medium-blue-gray">
        <div className="mb-3">
          <Breadcrumb />
        </div>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-blox-white mb-2">
              {video.title}
            </h1>
            
            <div className="flex items-center space-x-4 text-sm text-blox-off-white">
              {video.creator && (
                <div className="flex items-center space-x-1">
                  <span className="text-blox-teal">by {video.creator}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{video.duration}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="h-4 w-4 text-blox-teal" />
                <span>+{video.xpReward} XP</span>
              </div>
              {isCompleted && (
                <div className="flex items-center space-x-1 text-blox-success">
                  <CheckCircle className="h-4 w-4" />
                  <span>Completed</span>
                </div>
              )}
              <div className="flex items-center space-x-1 text-blox-warning">
                <span>{watchProgress}% watched</span>
              </div>
            </div>
          </div>
          
          <div className="text-right text-sm text-blox-off-white">
            <div className="text-lg font-bold text-blox-white">{totalHoursWatched.toFixed(1)} hours</div>
            <div>Total time invested</div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 p-6">
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6 relative">
          {video.youtubeId && !videoError ? (
            <div ref={playerRef} className="w-full h-full" />
          ) : videoError ? (
            /* Error state with direct YouTube link */
            <div className="flex items-center justify-center h-full bg-blox-very-dark-blue">
              <div className="text-center space-y-4 p-8">
                <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="text-white">
                  <h3 className="text-lg font-semibold mb-2">Video Unavailable</h3>
                  <p className="text-sm text-gray-300 mb-4">{videoError}</p>
                  <div className="space-y-2">
                    <a 
                      href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      Watch on YouTube
                    </a>
                    <Button 
                      onClick={() => handleVideoProgress(durationInSeconds * 0.95, durationInSeconds)}
                      className="bg-blox-teal hover:bg-blox-teal-light text-white ml-2"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Watched
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Placeholder for videos without YouTube ID */
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-blox-teal/20 rounded-full flex items-center justify-center">
                  <Play className="w-10 h-10 text-blox-teal" />
                </div>
                <div className="text-white">
                  <h3 className="text-lg font-semibold mb-2">{video.title}</h3>
                  <p className="text-sm text-gray-300 mb-4">Duration: {video.duration}</p>
                  <Button 
                    onClick={() => handleVideoProgress(durationInSeconds * 0.95, durationInSeconds)} // Simulate completion
                    className="bg-blox-teal hover:bg-blox-teal-light text-white"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Watched
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Progress Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between text-white text-sm mb-2">
              <span>Progress: {watchProgress}%</span>
              {isCompleted && (
                <div className="flex items-center space-x-1 text-blox-success">
                  <CheckCircle className="h-4 w-4" />
                  <span>Completed</span>
                </div>
              )}
            </div>
            <Progress.Root 
              className="relative overflow-hidden bg-white/20 rounded-full w-full h-2"
              value={watchProgress}
            >
              <Progress.Indicator
                className={`h-full w-full flex-1 transition-transform duration-150 ease-out ${
                  isCompleted ? 'bg-blox-success' : 'bg-blox-teal'
                }`}
                style={{ transform: `translateX(-${100 - watchProgress}%)` }}
              />
            </Progress.Root>
          </div>
        </div>

        {/* Video Description */}
        {video.description && (
          <Card className="card-hover mb-6">
            <CardHeader>
              <CardTitle className="text-blox-white">About this video</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blox-off-white leading-relaxed">
                {video.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Blox Wizard AI Chat Assistant */}
        <Card className="card-hover mb-6 border-blox-teal/20">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-blox-teal" />
              <CardTitle className="text-blox-white">Blox Wizard - AI Learning Assistant</CardTitle>
              <Badge className="bg-blox-teal/20 text-blox-teal border-blox-teal/30">
                <div className="w-2 h-2 bg-blox-teal rounded-full mr-2 animate-pulse" />
                AI Active
              </Badge>
            </div>
            <p className="text-sm text-blox-off-white/60 mt-1">
              Ask questions about this video or get help with your practice tasks
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              <AIChat 
                videoContext={{
                  title: video.title,
                  youtubeId: video.youtubeId,
                  currentTime: watchProgress
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Practice Task */}
        {practiceTask && (
          <Card className="card-hover border-blox-teal/20">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Book className="h-5 w-5 text-blox-teal" />
                <CardTitle className="text-blox-white">Practice Task</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-blox-off-white text-sm mb-3">{practiceTask}</p>

                <div className="flex items-center justify-between">
                  {estimatedTime && (
                    <div className="text-sm text-blox-off-white">
                      Estimated time: {estimatedTime}
                    </div>
                  )}
                  <Button size="sm" className="bg-blox-teal hover:bg-blox-teal-light ml-auto">
                    Start Practice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}