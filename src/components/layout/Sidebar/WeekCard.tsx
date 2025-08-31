'use client'

import { ChevronDown, ChevronUp, CheckCircle, Clock, BookOpen, Play } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { moduleColorScheme } from '@/lib/constants/moduleColors'

interface WeekCardProps {
  week: {
    id: string
    title: string
    days: Array<{
      id: string
      title: string
      videos: Array<{
        id: string
        title: string
        duration: string
        xpReward: number
      }>
      estimatedTime?: string
      practiceTask?: string
    }>
  }
  weekIndex: number
  moduleIndex: number
  isExpanded: boolean
  isActive: boolean
  progress: number
  dayCompletions: boolean[]
  activeDayId?: string
  onToggle: () => void
  onWeekClick: () => void
  onDayClick: (dayId: string) => void
  getDayProgress: (dayId: string) => { status: string; completionPercentage: number; xpEarned: number; bloxEarned: number; videosCompleted: string[]; practiceCompleted: boolean }
  isVideoCompleted: (videoId: string) => boolean
}

export function WeekCard({
  week,
  weekIndex,
  moduleIndex,
  isExpanded,
  isActive,
  progress,
  dayCompletions,
  activeDayId,
  onToggle,
  onWeekClick,
  onDayClick,
  getDayProgress,
  isVideoCompleted
}: WeekCardProps) {
  const weekNum = week.id.split('-')[1]
  const totalVideos = week.days.reduce((acc, day) => acc + day.videos.length, 0)
  const totalHours = week.days.reduce((acc, day) => {
    const time = day.estimatedTime || '2.5h'
    const hours = parseFloat(time.replace('h', ''))
    return acc + hours
  }, 0)
  
  // Calculate cumulative day numbers for continuous counting
  let cumulativeDayNumber = weekIndex * 7 + 1
  
  // Get module-specific color scheme
  const {
    weekBackgrounds,
    weekActiveBackgrounds,
    weekBorders,
    weekActiveBorders,
    dayBackgrounds,
    dayActiveBackgrounds,
    dayHoverBackgrounds,
    dayBorders,
    dayActiveBorders,
    textColors
  } = moduleColorScheme
  
  return (
    <div>
      <motion.div
        className={cn(
          "rounded-lg p-2.5 transition-all",
          isActive 
            ? `${weekActiveBackgrounds[moduleIndex]} ${weekActiveBorders[moduleIndex]}`
            : `${weekBackgrounds[moduleIndex]} ${weekBorders[moduleIndex]}`
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-between">
          {/* Week Title and Info */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onWeekClick}>
            <div className="flex items-center space-x-2">
              <span className={cn("text-xs font-bold", textColors[moduleIndex])}>W{weekNum}</span>
              <h3 className="text-xs font-semibold text-blox-white truncate flex-1">
                {week.title}
              </h3>
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-[10px] text-blox-off-white/60 flex items-center gap-1">
                <BookOpen className="h-2.5 w-2.5" />
                {week.days.length} days
              </span>
              <span className="text-[10px] text-blox-off-white/60">•</span>
              <span className="text-[10px] text-blox-off-white/60 flex items-center gap-1">
                <Play className="h-2.5 w-2.5" />
                {totalVideos} videos
              </span>
            </div>
          </div>
          
          {/* Expand/Collapse Icon - Separate from navigation */}
          <button 
            className="p-1 hover:bg-blox-medium-blue-gray/30 rounded transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
          >
            {isExpanded ? (
              <ChevronUp className={cn("h-3 w-3", textColors[moduleIndex])} />
            ) : (
              <ChevronDown className="h-3 w-3 text-blox-off-white/60" />
            )}
          </button>

          {/* Day Number Indicators */}
          <div className="flex items-center space-x-1">
            {week.days.slice(0, 4).map((day, index) => {
              const dayProgress = getDayProgress(day.id)
              const isCompleted = dayProgress.completionPercentage === 100
              const isInProgress = dayProgress.completionPercentage > 0 && !isCompleted
              
              return (
                <div
                  key={day.id}
                  className={cn(
                    "w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold transition-all",
                    isCompleted 
                      ? "bg-blox-light-green text-blox-very-dark-blue" 
                      : isInProgress
                        ? "bg-blox-warning text-blox-very-dark-blue"
                        : "bg-blox-medium-blue-gray/50 text-blox-off-white/60 border border-blox-medium-blue-gray/30"
                  )}
                >
                  {index + 1}
                </div>
              )
            })}
            {week.days.length > 4 && (
              <div className="w-5 h-5 rounded-sm bg-blox-medium-blue-gray/30 border border-blox-medium-blue-gray/30 flex items-center justify-center">
                <span className="text-[10px] text-blox-off-white/60 font-bold">+{week.days.length - 4}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Info */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2 text-[10px]">
            <span className="text-blox-off-white/60 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {totalHours.toFixed(1)}h
            </span>
            {progress === 100 && (
              <CheckCircle className="h-3 w-3 text-blox-light-green" />
            )}
          </div>
          {progress > 0 && (
            <div className="text-xs font-semibold text-blox-light-green">
              {progress}%
            </div>
          )}
        </div>
      </motion.div>

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
                const dayNum = cumulativeDayNumber + dayIndex
                const dayProgress = getDayProgress(day.id)
                const isCompleted = dayProgress.completionPercentage === 100
                const isInProgress = dayProgress.completionPercentage > 0 && !isCompleted
                const isSelectedDay = activeDayId === day.id
                
                return (
                  <motion.div
                    key={day.id}
                    className={cn(
                      "p-2 rounded-md transition-all cursor-pointer",
                      isSelectedDay 
                        ? `${dayActiveBackgrounds[moduleIndex]} ${dayActiveBorders[moduleIndex]}` 
                        : `${dayBackgrounds[moduleIndex]} ${dayHoverBackgrounds[moduleIndex]} ${dayBorders[moduleIndex]}`
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      onDayClick(day.id)
                    }}
                    whileHover={{ x: 2 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold",
                            isCompleted 
                              ? "bg-blox-light-green text-blox-very-dark-blue" 
                              : isInProgress
                                ? "bg-blox-warning text-blox-very-dark-blue"
                                : `bg-${textColors[moduleIndex].replace('text-', '')}/20 text-${textColors[moduleIndex].replace('text-', '')} border border-${textColors[moduleIndex].replace('text-', '')}/30`
                          )}>
                            D{dayNum}
                          </div>
                          <h4 className="text-xs font-medium text-blox-white flex-1">
                            {day.title}
                          </h4>
                          {isCompleted && (
                            <CheckCircle className="h-3 w-3 text-blox-light-green" />
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3 mt-1 text-[10px] text-blox-off-white/60">
                          <span className="flex items-center gap-0.5">
                            <BookOpen className="h-2 w-2" />
                            {day.videos.length} videos
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2 w-2" />
                            {day.estimatedTime || '2.5h'}
                          </span>
                          {dayProgress.videosCompleted.length > 0 && (
                            <span className="text-blox-light-green">
                              {dayProgress.videosCompleted.length}/{day.videos.length} done
                            </span>
                          )}
                        </div>
                        
                        {day.practiceTask && (
                          <p className="text-[10px] text-blox-off-white/50 mt-1 italic">
                            Task: {day.practiceTask}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}