'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, Play, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import * as Select from '@radix-ui/react-select'
import Image from 'next/image'

interface VideoItem {
  id: string
  title: string
  thumbnail: string
  duration: string
  completed: boolean
  xp: number
}

interface DayItem {
  id: string
  title: string
  videos: VideoItem[]
  completed: boolean
  estimatedTime: string
}

interface WeekItem {
  id: string
  title: string
  days: DayItem[]
  completed: boolean
  progress: number
}

interface WeekOverviewProps {
  module: {
    id: string
    title: string
    description: string
    totalVideos: number
  }
  weeks: WeekItem[]
  currentWeek: string
  onWeekChange: (weekId: string) => void
  onVideoSelect: (videoId: string, dayId: string) => void
}

// Mock data
const mockWeeks: WeekItem[] = [
  {
    id: 'week-10',
    title: 'Week 1: Roblox Studio 2024 Basics',
    completed: false,
    progress: 67,
    days: [
      {
        id: 'day-1',
        title: 'Day 1: New Creator Hub & Studio Interface Part 1',
        completed: false,
        estimatedTime: '3 hrs',
        videos: [
          {
            id: 'v1',
            title: 'Blender 4.1 Introduction (Part 1)',
            thumbnail: '/images/thumbnails/blender-intro.jpg',
            duration: '50h',
            completed: false,
            xp: 50
          },
          {
            id: 'v2',
            title: 'Blender & Game Assets Continued',
            thumbnail: '/images/thumbnails/blender-assets.jpg',
            duration: '13:26',
            completed: false,
            xp: 100
          },
          {
            id: 'v3',
            title: 'AI Tools for 3D Creation',
            thumbnail: '/images/thumbnails/ai-tools.jpg',
            duration: '25:30',
            completed: false,
            xp: 75
          },
          {
            id: 'v4',
            title: '+4',
            thumbnail: '',
            duration: '',
            completed: false,
            xp: 0
          }
        ]
      },
      {
        id: 'day-2',
        title: 'Day 2: New Creator Hub & Studio Interface Part 2',
        completed: false,
        estimatedTime: '2.5 hrs',
        videos: [
          {
            id: 'v5',
            title: 'New Creator Hub Tutorial 2024',
            thumbnail: '/images/thumbnails/creator-hub.jpg',
            duration: '23:00',
            completed: false,
            xp: 85
          },
          {
            id: 'v6',
            title: 'Modern Studio Interface 2024',
            thumbnail: '/images/thumbnails/studio-interface.jpg',
            duration: '18:45',
            completed: false,
            xp: 70
          }
        ]
      }
    ]
  }
]

export function WeekOverview({
  module = {
    id: 'module-1',
    title: 'Modern Foundations & 3D Introduction',
    description: 'Master Roblox Studio 2024, Blender 4.1+, and AI tools for 3D creation',
    totalVideos: 20
  },
  weeks = mockWeeks,
  currentWeek = 'week-10',
  onWeekChange = () => {},
  onVideoSelect = () => {}
}: WeekOverviewProps) {
  const [selectedWeek, setSelectedWeek] = useState(currentWeek)
  const currentWeekData = weeks.find(w => w.id === selectedWeek) || weeks[0]

  const handleWeekChange = (weekId: string) => {
    setSelectedWeek(weekId)
    onWeekChange(weekId)
  }

  return (
    <div className="h-full flex flex-col bg-blox-very-dark-blue">
      {/* Header with Module Info */}
      <div className="p-6 border-b border-blox-medium-blue-gray">
        <div className="flex items-center space-x-2 text-sm text-blox-off-white mb-2">
          <span>Module 1</span>
          <span>•</span>
          <span>Week 1</span>
        </div>
        <h1 className="text-xl font-bold text-blox-white mb-2">
          {module.title}
        </h1>
        <p className="text-blox-off-white text-sm mb-4">
          {module.description}
        </p>
        
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-blox-second-dark-blue/50 rounded-lg p-3 border border-blox-teal/20">
            <div className="text-lg font-bold text-blox-white">50h</div>
            <div className="text-xs text-blox-off-white">Total Hours</div>
          </div>
          <div className="bg-blox-second-dark-blue/50 rounded-lg p-3 border border-blox-teal/20">
            <div className="text-lg font-bold text-blox-white">750</div>
            <div className="text-xs text-blox-off-white">Total XP</div>
          </div>
          <div className="bg-blox-second-dark-blue/50 rounded-lg p-3 border border-blox-purple/20">
            <div className="text-lg font-bold text-blox-white">4</div>
            <div className="text-xs text-blox-off-white">Weeks</div>
          </div>
          <div className="bg-blox-second-dark-blue/50 rounded-lg p-3">
            <div className="text-lg font-bold text-blox-white">Studio Master</div>
            <div className="text-xs text-blox-off-white">Certificate</div>
          </div>
        </div>
      </div>

      {/* Week Selector */}
      <div className="p-4 border-b border-blox-medium-blue-gray">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-blox-white">Week Overview</h2>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Select.Root value={selectedWeek} onValueChange={handleWeekChange}>
              <Select.Trigger className="flex items-center space-x-2 px-3 py-2 bg-blox-second-dark-blue rounded-lg border border-blox-medium-blue-gray text-blox-white">
                <Select.Value />
                <ChevronDown className="h-4 w-4" />
              </Select.Trigger>
              
              <Select.Portal>
                <Select.Content className="bg-blox-second-dark-blue border border-blox-medium-blue-gray rounded-lg shadow-xl z-50">
                  <Select.Viewport className="p-1">
                    {weeks.map((week) => (
                      <Select.Item
                        key={week.id}
                        value={week.id}
                        className="flex items-center px-3 py-2 text-sm text-blox-white hover:bg-blox-teal/20 rounded cursor-pointer"
                      >
                        <Select.ItemText>{week.title}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            
            <Button variant="ghost" size="sm" className="p-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Week Progress */}
        <div className="text-center text-sm text-blox-off-white">
          <span className="text-blox-teal font-medium">{currentWeekData.progress}%</span> complete
        </div>
      </div>

      {/* Days and Videos */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {currentWeekData.days.map((day) => (
          <Card key={day.id} className="card-hover border-blox-medium-blue-gray/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-blox-white">
                  {day.title}
                </CardTitle>
                <div className="text-xs text-blox-off-white">
                  {day.estimatedTime}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {day.videos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => onVideoSelect(video.id, day.id)}
                    className="group cursor-pointer"
                  >
                    {video.id === 'v4' ? (
                      // More videos indicator
                      <div className="aspect-video bg-blox-second-dark-blue rounded-lg border-2 border-dashed border-blox-medium-blue-gray flex items-center justify-center">
                        <span className="text-blox-off-white text-sm font-medium">+4</span>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Video Thumbnail */}
                        <div className="aspect-video bg-blox-second-dark-blue rounded-lg border border-blox-medium-blue-gray overflow-hidden group-hover:border-blox-teal transition-colors">
                          {video.thumbnail ? (
                            <Image
                              src={video.thumbnail}
                              alt={video.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="h-8 w-8 text-blox-teal" />
                            </div>
                          )}
                          
                          {/* Play Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                          
                          {/* Duration Badge */}
                          {video.duration && (
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                              {video.duration}
                            </div>
                          )}
                          
                          {/* Completion Badge */}
                          {video.completed && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="h-5 w-5 text-blox-success" />
                            </div>
                          )}
                        </div>
                        
                        {/* Video Info */}
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-blox-white line-clamp-2 group-hover:text-blox-teal transition-colors">
                            {video.title}
                          </h4>
                          
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-xs text-blox-off-white">
                              +{video.xp} XP
                            </div>
                            {!video.completed && (
                              <Clock className="h-3 w-3 text-blox-off-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}