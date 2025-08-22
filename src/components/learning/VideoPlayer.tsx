'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Pause, Volume2, SkipBack, SkipForward, CheckCircle, Clock, Zap, Book } from 'lucide-react'
import * as Progress from '@radix-ui/react-progress'

interface VideoPlayerProps {
  video: {
    id: string
    title: string
    description?: string
    url: string
    duration: string
    xp: number
    completed: boolean
  }
  module: {
    id: string
    title: string
    week: number
    day: number
  }
  practiceTask?: {
    title: string
    description: string
    estimatedTime: string
  }
  onComplete?: (videoId: string) => void
  onNext?: () => void
  onPrevious?: () => void
}

const mockVideo = {
  id: 'v1',
  title: 'Blender 4.1 Introduction (Part 1)',
  description: 'Get familiar with the updated Roblox development environment and master the modern Studio interface. Learn about the new Creator Hub features and project management tools.',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Mock URL
  duration: '50:00',
  xp: 450,
  completed: false
}

const mockModule = {
  id: 'module-1',
  title: 'Modern Foundations & 3D Introduction',
  week: 10,
  day: 1
}

const mockPracticeTask = {
  title: 'Practice Task',
  description: 'Navigate new Creator Hub and customize workspace (1.5 hours practice)',
  estimatedTime: '1.5 hours'
}

export function VideoPlayer({
  video = mockVideo,
  module = mockModule,
  practiceTask = mockPracticeTask,
  onComplete = () => {},
  onNext = () => {},
  onPrevious = () => {}
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const togglePlayPause = () => {
    setPlaying(!playing)
  }

  return (
    <div className="h-full flex flex-col bg-blox-very-dark-blue">
      {/* Header with breadcrumb */}
      <div className="p-6 border-b border-blox-medium-blue-gray">
        <div className="flex items-center space-x-2 text-sm text-blox-off-white mb-2">
          <span>{module.title}</span>
          <span>•</span>
          <span>Week {module.week}</span>
          <span>•</span>
          <span>Day {module.day}</span>
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
                <span>+{video.xp} XP</span>
              </div>
              {video.completed && (
                <div className="flex items-center space-x-1 text-blox-success">
                  <CheckCircle className="h-4 w-4" />
                  <span>Completed</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right text-sm text-blox-off-white">
            <div className="text-lg font-bold text-blox-white">12.5 hours</div>
            <div>Total time invested</div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 p-6">
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6 flex items-center justify-center">
          {/* Placeholder Video Player */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-blox-teal/20 rounded-full flex items-center justify-center">
              <Play className="w-10 h-10 text-blox-teal" />
            </div>
            <div className="text-white">
              <h3 className="text-lg font-semibold mb-2">{video.title}</h3>
              <p className="text-sm text-gray-300 mb-4">Duration: {video.duration}</p>
              <Button 
                onClick={togglePlayPause}
                className="bg-blox-teal hover:bg-blox-teal-light text-white"
              >
                {playing ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause Video
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Play Video
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <Progress.Root 
              className="relative overflow-hidden bg-white/20 rounded-full w-full h-2"
              value={progress}
            >
              <Progress.Indicator
                className="bg-blox-teal h-full w-full flex-1 transition-transform duration-150 ease-out"
                style={{ transform: `translateX(-${100 - progress}%)` }}
              />
            </Progress.Root>
          </div>
        </div>

        {/* Video Description */}
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
                <h3 className="font-semibold text-blox-white mb-2">{practiceTask.title}</h3>
                <p className="text-blox-off-white text-sm mb-3">{practiceTask.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blox-off-white">
                    Estimated time: {practiceTask.estimatedTime}
                  </div>
                  <Button size="sm" className="bg-blox-teal hover:bg-blox-teal-light">
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