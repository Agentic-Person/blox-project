'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Pause, Volume2, SkipBack, SkipForward, CheckCircle, Clock, Zap, Book, Award } from 'lucide-react'
import * as Progress from '@radix-ui/react-progress'
import { useLearningStore } from '@/store/learningStore'
// import { toast } from 'sonner'

interface VideoPlayerProps {
  video: {
    id: string
    title: string
    description?: string
    youtubeId: string
    duration: string
    xpReward: number
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

  const {
    isVideoCompleted,
    markVideoComplete,
    updateVideoProgress,
    videoProgress,
    totalHoursWatched
  } = useLearningStore()

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

  const handleVideoProgress = (currentTime: number) => {
    const progressPercent = Math.round((currentTime / durationInSeconds) * 100)
    setWatchProgress(progressPercent)
    
    // Update video progress in store
    updateVideoProgress(video.id, currentTime, durationInSeconds)
    
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
  }

  // Helper function to convert duration string to seconds
  function convertDurationToSeconds(duration: string): number {
    const [minutes, seconds] = duration.split(':').map(Number)
    return minutes * 60 + seconds
  }

  const togglePlayPause = () => {
    setPlaying(!playing)
  }

  return (
    <div className="h-full flex flex-col bg-blox-very-dark-blue">
      {/* Header with breadcrumb */}
      <div className="p-6 border-b border-blox-medium-blue-gray">
        <div className="flex items-center space-x-2 text-sm text-blox-off-white mb-2">
          {moduleInfo && <span>{moduleInfo.title}</span>}
          {moduleInfo && dayInfo && <span>•</span>}
          {dayInfo && <span>{dayInfo.title}</span>}
        </div>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-blox-white mb-2">
              {video.title}
            </h1>
            
            <div className="flex items-center space-x-4 text-sm text-blox-off-white">
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
          {video.youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}?enablejsapi=1&origin=${window.location.origin}`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
              onLoad={() => {
                // You could add YouTube API integration here for progress tracking
                // For now, we'll simulate progress updates
                if (!isCompleted) {
                  const interval = setInterval(() => {
                    handleVideoProgress(Math.random() * durationInSeconds)
                  }, 1000)
                  
                  return () => clearInterval(interval)
                }
              }}
            />
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
                    onClick={() => handleVideoProgress(durationInSeconds * 0.95)} // Simulate completion
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

        {/* Suggested Questions */}
        <Card className="card-hover mt-6">
          <CardHeader>
            <CardTitle className="text-blox-white">Suggested Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-left h-auto p-3 hover:bg-blox-second-dark-blue/50">
                <span className="text-blox-off-white">How do I make epic lighting effects?</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-left h-auto p-3 hover:bg-blox-second-dark-blue/50">
                <span className="text-blox-off-white">What's the coolest hack you found?</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-left h-auto p-3 hover:bg-blox-second-dark-blue/50">
                <span className="text-blox-off-white">How can I make my builds go viral on Roblox?</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}