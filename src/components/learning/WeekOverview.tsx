'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Play, CheckCircle, Clock, ChevronLeft, ChevronRight, BookOpen, Calendar } from 'lucide-react'
import * as Select from '@radix-ui/react-select'
import Image from 'next/image'
import { useLearningStore } from '@/store/learningStore'
import { motion, AnimatePresence } from 'framer-motion'

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
  practiceTask?: string
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
  currentDay?: string
  onWeekChange: (weekId: string) => void
  onVideoSelect: (videoId: string, dayId: string) => void
}

export function WeekOverview({
  module,
  weeks = [],
  currentWeek,
  currentDay,
  onWeekChange,
  onVideoSelect
}: WeekOverviewProps) {
  const [selectedWeek, setSelectedWeek] = useState(currentWeek || weeks[0]?.id || '')
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null)
  const currentWeekData = weeks.find(w => w.id === selectedWeek) || weeks[0]
  const { getWeekProgress, isVideoCompleted } = useLearningStore()
  
  // Auto-expand the week containing the selected day
  useEffect(() => {
    if (currentDay) {
      const weekWithDay = weeks.find(w => w.days.some(d => d.id === currentDay))
      if (weekWithDay) {
        setExpandedWeek(weekWithDay.id)
        setSelectedWeek(weekWithDay.id)
      }
    }
  }, [currentDay, weeks])

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
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-6 w-6"
              onClick={() => {
                const currentIndex = weeks.findIndex(w => w.id === selectedWeek)
                if (currentIndex > 0) {
                  handleWeekChange(weeks[currentIndex - 1].id)
                }
              }}
              disabled={weeks.findIndex(w => w.id === selectedWeek) === 0}
            >
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
                            {getWeekProgress(week.id) === 100 && (
                              <CheckCircle className="h-3 w-3 text-blox-light-green" />
                            )}
                          </div>
                        </Select.ItemText>
                        {getWeekProgress(week.id) > 0 && getWeekProgress(week.id) < 100 && (
                          <span className="text-xs text-blox-light-green ml-4">
                            {getWeekProgress(week.id)}%
                          </span>
                        )}
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-6 w-6"
              onClick={() => {
                const currentIndex = weeks.findIndex(w => w.id === selectedWeek)
                if (currentIndex < weeks.length - 1) {
                  handleWeekChange(weeks[currentIndex + 1].id)
                }
              }}
              disabled={weeks.findIndex(w => w.id === selectedWeek) === weeks.length - 1}
            >
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
          const isExpanded = expandedWeek === week.id
          
          return (
            <div key={week.id}>
              <div
                className={`rounded-lg border p-2 cursor-pointer transition-all ${
                  selectedWeek === week.id 
                    ? 'bg-blox-dark-blue border-blox-teal/50' 
                    : 'bg-blox-dark-blue/50 border-blox-medium-blue-gray/30 hover:border-blox-teal/30'
                }`}
                onClick={() => {
                  handleWeekChange(week.id)
                  setExpandedWeek(isExpanded ? null : week.id)
                }}
              >
                <div className="flex items-center justify-between">
                  {/* Week Title and Number */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-blox-teal">{weekNum}</span>
                      <h3 className="text-xs font-semibold text-blox-white truncate">
                        {week.title}
                      </h3>
                      {/* Expand/Collapse Icon */}
                      <button 
                        className="p-0.5 hover:bg-blox-medium-blue-gray/30 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedWeek(isExpanded ? null : week.id)
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3 text-blox-teal" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-blox-off-white/60" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-blox-off-white/60">
                        {week.days.length} days • {week.days.reduce((acc, day) => acc + day.videos.length, 0)} videos
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
                  {(() => {
                    const progress = getWeekProgress(week.id)
                    return progress > 0 ? (
                      <div className="text-xs text-blox-light-green">
                        {progress}%
                      </div>
                    ) : null
                  })()}
                </div>
              </div>

              {/* Expandable Day List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-3 mt-1 space-y-1 border-l-2 border-blox-medium-blue-gray/30 pl-2">
                      {week.days.map((day, dayIndex) => {
                        const dayNum = dayIndex + 1
                        const completedCount = day.videos.filter(v => isVideoCompleted(v.id)).length
                        const totalCount = day.videos.length
                        const dayCompleted = completedCount === totalCount
                        const dayInProgress = completedCount > 0 && completedCount < totalCount
                        
                        const isSelectedDay = currentDay === day.id
                        
                        return (
                          <div
                            key={day.id}
                            className={`p-2 rounded-md transition-colors cursor-pointer ${
                              isSelectedDay 
                                ? 'bg-blox-teal/20 border border-blox-teal/50 shadow-md' 
                                : 'bg-blox-very-dark-blue/50 hover:bg-blox-very-dark-blue/70'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              onVideoSelect(day.videos[0]?.id || '', day.id)
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-4 h-4 rounded-sm flex items-center justify-center text-xs font-bold ${
                                    dayCompleted 
                                      ? 'bg-blox-light-green text-blox-very-dark-blue' 
                                      : dayInProgress
                                        ? 'bg-blox-warning text-blox-very-dark-blue'
                                        : 'bg-blox-medium-blue-gray/50 text-blox-off-white/60 border border-blox-medium-blue-gray/30'
                                  }`}>
                                    {dayNum}
                                  </div>
                                  <h4 className="text-xs font-medium text-blox-white">
                                    {day.title}
                                  </h4>
                                  {dayCompleted && (
                                    <CheckCircle className="h-3 w-3 text-blox-light-green" />
                                  )}
                                </div>
                                <div className="flex items-center space-x-3 mt-1 text-xs text-blox-off-white/60">
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="h-2.5 w-2.5" />
                                    {totalCount} videos
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    {day.estimatedTime || '2.5h'}
                                  </span>
                                  {completedCount > 0 && (
                                    <span className="text-blox-light-green">
                                      {completedCount}/{totalCount} complete
                                    </span>
                                  )}
                                </div>
                                {day.practiceTask && (
                                  <p className="text-xs text-blox-off-white/50 mt-1 italic">
                                    Task: {day.practiceTask}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}