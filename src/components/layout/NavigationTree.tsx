'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight, Play, CheckCircle, Clock, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import * as Accordion from '@radix-ui/react-accordion'
import curriculumData from '@/data/curriculum.json'
import { useLearningStore } from '@/store/learningStore'

interface VideoItem {
  id: string
  title: string
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

interface ModuleItem {
  id: string
  title: string
  description: string
  weeks: WeekItem[]
  completed: boolean
  progress: number
  estimatedHours: number
}


export function NavigationTree() {
  const pathname = usePathname()
  const { isVideoCompleted } = useLearningStore()
  const [expandedModules, setExpandedModules] = useState<string[]>(['module-1'])
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>([])
  
  // Transform curriculum data to match the expected format
  const learningModules = curriculumData.modules.map(module => ({
    id: module.id,
    title: module.title,
    description: module.description,
    completed: false, // Would be calculated from store
    progress: 0, // Would be calculated from store
    estimatedHours: module.totalHours,
    weeks: module.weeks.map(week => ({
      id: week.id,
      title: week.title,
      completed: false,
      progress: 0,
      days: week.days.map(day => ({
        id: day.id,
        title: day.title,
        completed: false,
        estimatedTime: day.estimatedTime || '2.5h',
        videos: day.videos.map(video => ({
          id: video.id,
          title: video.title,
          duration: video.duration,
          completed: isVideoCompleted(video.id),
          xp: video.xpReward
        }))
      }))
    }))
  }))
  
  // Auto-expand based on current URL
  useEffect(() => {
    const pathParts = pathname.split('/')
    if (pathParts.includes('learning')) {
      const moduleId = pathParts[2] // e.g., module-1
      const weekId = pathParts[3] // e.g., week-1
      
      if (moduleId && !expandedModules.includes(moduleId)) {
        setExpandedModules(prev => [...prev, moduleId])
      }
      
      if (weekId && !expandedWeeks.includes(weekId)) {
        setExpandedWeeks(prev => [...prev, weekId])
      }
    }
  }, [pathname])

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks(prev => 
      prev.includes(weekId) 
        ? prev.filter(id => id !== weekId)
        : [...prev, weekId]
    )
  }

  return (
    <div className="space-y-1">
      {learningModules.map((module) => (
        <div key={module.id} className="space-y-1">
          {/* Module Level */}
          <button
            onClick={() => toggleModule(module.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
              module.completed
                ? "text-blox-success bg-blox-success/10"
                : module.progress > 0
                ? "text-blox-teal bg-blox-teal/10"
                : "text-blox-off-white hover:bg-blox-second-dark-blue hover:text-white"
            )}
          >
            <div className="flex items-center flex-1 text-left">
              <div className="mr-2 flex-shrink-0">
                {expandedModules.includes(module.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
              
              <div className="mr-2 flex-shrink-0">
                {module.completed ? (
                  <CheckCircle className="h-4 w-4 text-blox-success" />
                ) : module.progress > 0 ? (
                  <Play className="h-4 w-4 text-blox-teal" />
                ) : (
                  <Clock className="h-4 w-4 text-blox-off-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{module.title}</div>
                <div className="text-xs text-blox-off-white/70 truncate">
                  {module.estimatedHours}hrs • {module.progress}% complete
                </div>
              </div>
            </div>
            
            {module.completed && (
              <Trophy className="h-4 w-4 text-blox-success ml-2 flex-shrink-0" />
            )}
          </button>

          {/* Weeks Level */}
          {expandedModules.includes(module.id) && module.weeks.length > 0 && (
            <div className="ml-6 space-y-1">
              {module.weeks.map((week) => (
                <div key={week.id} className="space-y-1">
                  <button
                    onClick={() => toggleWeek(week.id)}
                    className={cn(
                      "w-full flex items-center px-3 py-1.5 rounded-md text-xs transition-all duration-200",
                      week.completed
                        ? "text-blox-success bg-blox-success/5"
                        : week.progress > 0
                        ? "text-blox-teal bg-blox-teal/5"
                        : "text-blox-off-white hover:bg-blox-second-dark-blue/50"
                    )}
                  >
                    <div className="mr-2">
                      {expandedWeeks.includes(week.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </div>
                    
                    <div className="mr-2">
                      {week.completed ? (
                        <CheckCircle className="h-3 w-3 text-blox-success" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                    </div>
                    
                    <span className="flex-1 text-left truncate">{week.title}</span>
                    <span className="text-xs text-blox-off-white/50 ml-2">
                      {week.progress}%
                    </span>
                  </button>

                  {/* Days Level */}
                  {expandedWeeks.includes(week.id) && (
                    <div className="ml-6 space-y-1">
                      {week.days.map((day) => (
                        <Link
                          key={day.id}
                          href={`/learning/${module.id}/${week.id}/${day.id}`}
                          className={cn(
                            "flex items-center px-3 py-1.5 rounded-md text-xs transition-all duration-200",
                            pathname.includes(day.id)
                              ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold shadow-lg shadow-yellow-500/30 border border-yellow-400/50"
                              : day.completed
                              ? "text-blox-success hover:bg-blox-success/5"
                              : "text-blox-off-white hover:bg-blox-second-dark-blue/30"
                          )}
                        >
                          <div className="mr-2">
                            {day.completed ? (
                              <CheckCircle className="h-3 w-3 text-blox-success" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{day.title}</div>
                            <div className="text-blox-off-white/50 text-xs">
                              {day.videos.length} videos • {day.estimatedTime}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}