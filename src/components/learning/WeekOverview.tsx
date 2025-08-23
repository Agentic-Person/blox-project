'use client'

import { useState } from 'react'
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

export function WeekOverview({
  module,
  weeks = [],
  currentWeek,
  onWeekChange,
  onVideoSelect
}: WeekOverviewProps) {
  const [selectedWeek, setSelectedWeek] = useState(currentWeek || weeks[0]?.id || '')
  const currentWeekData = weeks.find(w => w.id === selectedWeek) || weeks[0]

  const handleWeekChange = (weekId: string) => {
    setSelectedWeek(weekId)
    onWeekChange(weekId)
  }

  if (!module || !currentWeekData) {
    return (
      <div className="h-full flex items-center justify-center bg-blox-very-dark-blue">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-blox-white">Loading...</h2>
        </div>
      </div>
    )
  }

  // Extract module and week numbers from IDs
  const moduleNumber = module.id ? module.id.split('-')[1] : '1'
  const weekNumber = currentWeekData.id ? currentWeekData.id.split('-')[1] : '1'

  return (
    <div className="h-full flex flex-col bg-blox-very-dark-blue">
      {/* Header with Module Info - Minimal Padding */}
      <div className="px-2 py-1 border-b border-blox-medium-blue-gray">
        <div className="flex items-center space-x-2 text-xs text-blox-off-white">
          <span>Module {moduleNumber}</span>
          <span>•</span>
          <span>Month {moduleNumber}</span>
        </div>
        <h1 className="text-lg font-bold text-blox-white">
          {module.title}
        </h1>
        <p className="text-xs text-blox-off-white/80 mt-0.5">
          {module.description}
        </p>
        
        {/* Stats Row - Compact */}
        <div className="grid grid-cols-4 gap-2 mt-2 text-center">
          <div className="bg-blox-second-dark-blue/30 rounded px-1 py-1 border border-blox-teal/10">
            <div className="text-sm font-bold text-blox-white">50h</div>
            <div className="text-xs text-blox-off-white/60">hours</div>
          </div>
          <div className="bg-blox-second-dark-blue/30 rounded px-1 py-1 border border-blox-teal/10">
            <div className="text-sm font-bold text-blox-white">750</div>
            <div className="text-xs text-blox-off-white/60">XP</div>
          </div>
          <div className="bg-blox-second-dark-blue/30 rounded px-1 py-1 border border-blox-purple/10">
            <div className="text-sm font-bold text-blox-white">4</div>
            <div className="text-xs text-blox-off-white/60">Weeks</div>
          </div>
          <div className="bg-blox-second-dark-blue/30 rounded px-1 py-1">
            <div className="text-xs font-bold text-blox-white leading-tight mt-0.5">Studio Master</div>
          </div>
        </div>
      </div>

      {/* Week Selector - Compact */}
      <div className="px-2 py-1.5 border-b border-blox-medium-blue-gray">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-blox-white">Week Overview</h2>
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            <Select.Root value={selectedWeek} onValueChange={handleWeekChange}>
              <Select.Trigger className="flex items-center space-x-2 px-2 py-1 bg-blox-dark-blue rounded-md hover:bg-blox-very-dark-blue transition-colors text-xs">
                <Select.Value>
                  {currentWeekData?.title || 'Select Week'}
                </Select.Value>
                <ChevronDown className="h-3 w-3" />
              </Select.Trigger>
              
              <Select.Portal>
                <Select.Content className="bg-blox-dark-blue rounded-md shadow-lg border border-blox-medium-blue-gray overflow-hidden">
                  <Select.Viewport className="p-1 max-h-[200px] overflow-y-auto">
                    {weeks.map((week) => (
                      <Select.Item
                        key={week.id}
                        value={week.id}
                        className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-blox-very-dark-blue cursor-pointer text-xs"
                      >
                        <Select.ItemText>
                          <div className="flex items-center space-x-2">
                            <span className="text-blox-white">
                              {week.title}
                            </span>
                            {week.completed && (
                              <CheckCircle className="h-3 w-3 text-blox-light-green" />
                            )}
                          </div>
                        </Select.ItemText>
                        {week.progress > 0 && !week.completed && (
                          <span className="text-xs text-blox-light-green ml-4">
                            {week.progress}%
                          </span>
                        )}
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            
            <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week List with Day Indicators - This is what we see in the screenshot */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {weeks.map((week, weekIndex) => {
          const weekNum = week.id.split('-')[1]
          const totalVideos = week.days.reduce((acc, day) => acc + day.videos.length, 0)
          const completedVideos = week.days.reduce((acc, day) => 
            acc + day.videos.filter(v => v.completed).length, 0)
          
          return (
            <div
              key={week.id}
              className={`rounded-lg border p-2 cursor-pointer transition-all ${
                selectedWeek === week.id 
                  ? 'bg-blox-dark-blue border-blox-teal/50' 
                  : 'bg-blox-dark-blue/50 border-blox-medium-blue-gray/30 hover:border-blox-teal/30'
              }`}
              onClick={() => handleWeekChange(week.id)}
            >
              <div className="flex items-center justify-between">
                {/* Week Title and Number */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-blox-teal">{weekNum}</span>
                    <h3 className="text-xs font-semibold text-blox-white truncate">
                      {week.title}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-blox-off-white/60">
                      Navigate the new Creator Hub and master...
                    </span>
                  </div>
                </div>

                {/* Day Number Boxes */}
                <div className="flex items-center space-x-1">
                  {week.days.slice(0, 4).map((day, index) => {
                    const dayCompleted = day.videos.every(v => v.completed)
                    return (
                      <div
                        key={day.id}
                        className={`w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold ${
                          dayCompleted 
                            ? 'bg-blox-light-green text-blox-very-dark-blue' 
                            : 'bg-blox-medium-blue-gray/50 text-blox-off-white/60 border border-blox-medium-blue-gray/30'
                        }`}
                      >
                        {index + 1}
                      </div>
                    )
                  })}
                  {week.days.length > 4 && (
                    <div className="w-5 h-5 rounded-sm bg-blox-medium-blue-gray/30 border border-blox-medium-blue-gray/30 flex items-center justify-center">
                      <span className="text-xs text-blox-off-white/60 font-bold">+{week.days.length - 4}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Info */}
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-blox-off-white/60">
                    <CheckCircle className="h-3 w-3 inline mr-1 text-blox-light-green/60" />
                    15.0h
                  </span>
                  <span className="text-blox-off-white/60">• {totalVideos} videos</span>
                </div>
                {week.progress > 0 && (
                  <div className="text-xs text-blox-light-green">
                    {week.progress}%
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}