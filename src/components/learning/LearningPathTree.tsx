'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, CheckCircle, PlayCircle, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLearningStore } from '@/store/learningStore'
import { toggleExpanded, getCompletionIcon } from '@/lib/utils/learningUtils'
import curriculumData from '@/data/curriculum.json'
import { useRouter, usePathname } from 'next/navigation'

interface LearningPathTreeProps {
  currentModuleId?: string
  currentWeekId?: string
  currentDayId?: string
}

export function LearningPathTree({ 
  currentModuleId,
  currentWeekId,
  currentDayId
}: LearningPathTreeProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const { 
    completedDays, 
    completedVideos, 
    isDayCompleted, 
    getDayProgress,
    getWeekProgress,
    getModuleProgress 
  } = useLearningStore()
  // Initialize with current path expanded
  const pathSegments = pathname.split('/').filter(Boolean)
  const initialModuleId = pathSegments[1]
  const initialWeekId = pathSegments[2]
  
  const [expandedModules, setExpandedModules] = useState<string[]>(() => {
    return initialModuleId ? [initialModuleId] : []
  })
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>(() => {
    return initialWeekId ? [initialWeekId] : []
  })

  // Auto-expand based on current path
  useEffect(() => {
    // Parse the pathname to get current location
    const segments = pathname.split('/').filter(Boolean)
    const moduleIdFromPath = segments[1] // After 'learning'
    const weekIdFromPath = segments[2]
    const dayIdFromPath = segments[3]
    
    // Use props if provided, otherwise use path
    const activeModuleId = currentModuleId || moduleIdFromPath
    const activeWeekId = currentWeekId || weekIdFromPath
    
    // Auto-expand module if we're viewing it or any of its weeks
    if (activeModuleId) {
      setExpandedModules(prev => {
        if (!prev.includes(activeModuleId)) {
          return [...prev, activeModuleId]
        }
        return prev
      })
    }
    
    // Auto-expand week if we're viewing it - also ensure parent module is expanded
    if (activeWeekId && activeModuleId) {
      // First ensure module is expanded
      setExpandedModules(prev => {
        if (!prev.includes(activeModuleId)) {
          return [...prev, activeModuleId]
        }
        return prev
      })
      
      // Then expand the week
      setExpandedWeeks(prev => {
        if (!prev.includes(activeWeekId)) {
          return [...prev, activeWeekId]
        }
        return prev
      })
    }
  }, [pathname, currentModuleId, currentWeekId])

  const navigateToModule = (moduleId: string) => {
    router.push(`/learning/${moduleId}`)
  }

  const navigateToWeek = (moduleId: string, weekId: string) => {
    // Navigate to week with first day selected
    const module = curriculumData.modules.find(m => m.id === moduleId)
    const week = module?.weeks.find(w => w.id === weekId)
    if (week && week.days.length > 0) {
      router.push(`/learning/${moduleId}/${weekId}/${week.days[0].id}`)
    }
  }

  const navigateToLesson = (moduleId: string, weekId: string, dayId: string) => {
    router.push(`/learning/${moduleId}/${weekId}/${dayId}`)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'text-blox-success'
    if (percentage > 0) return 'text-blox-warning'
    return 'text-blox-off-white'
  }

  // Determine current location from pathname
  const currentPathSegments = pathname.split('/').filter(Boolean)
  const activeModuleId = currentModuleId || currentPathSegments[1]
  const activeWeekId = currentWeekId || currentPathSegments[2]
  const activeDayId = currentDayId || currentPathSegments[3]

  return (
    <div className="space-y-1">
      {curriculumData.modules.map((module) => {
        const moduleProgress = getModuleProgress(module.id)
        const moduleProgressColor = getProgressColor(moduleProgress)
        const isActiveModule = module.id === activeModuleId

        return (
          <div key={module.id}>
            {/* Module Level */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleExpanded(module.id, expandedModules, setExpandedModules)}
                className="p-1 hover:bg-blox-second-dark-blue rounded transition-colors"
              >
                {expandedModules.includes(module.id) ? (
                  <ChevronDown className="h-4 w-4 text-blox-off-white" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-blox-off-white" />
                )}
              </button>
              <button
                onClick={() => navigateToModule(module.id)}
                className={`flex-1 flex items-center justify-between gap-2 px-2 py-2 rounded-lg transition-colors text-left ${
                  isActiveModule 
                    ? 'bg-blox-teal/20 border-l-2 border-blox-teal' 
                    : 'hover:bg-blox-second-dark-blue'
                }`}
              >
                <span className={`text-sm font-medium ${
                  isActiveModule ? 'text-blox-teal' : 'text-blox-white'
                }`}>{module.title}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${moduleProgressColor}`}>
                    {moduleProgress}%
                  </span>
                  {moduleProgress === 100 && (
                    <CheckCircle className="h-3 w-3 text-blox-success" />
                  )}
                </div>
              </button>
            </div>

            {/* Weeks - Animated Collapse */}
            <AnimatePresence>
              {expandedModules.includes(module.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-4 overflow-hidden"
                >
                  {module.weeks.map((week) => {
                    const weekProgress = getWeekProgress(week.id)
                    const weekProgressColor = getProgressColor(weekProgress)
                    const isActiveWeek = week.id === activeWeekId

                    return (
                      <div key={week.id}>
                        {/* Week Level */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleExpanded(week.id, expandedWeeks, setExpandedWeeks)}
                            className="p-0.5 hover:bg-blox-second-dark-blue/50 rounded transition-colors ml-2"
                          >
                            {expandedWeeks.includes(week.id) ? (
                              <ChevronDown className="h-3 w-3 text-blox-off-white" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-blox-off-white" />
                            )}
                          </button>
                          <button
                            onClick={() => navigateToWeek(module.id, week.id)}
                            className={`flex-1 flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg transition-colors text-left ${
                              isActiveWeek 
                                ? 'bg-blox-purple/20 border-l-2 border-blox-purple' 
                                : 'hover:bg-blox-second-dark-blue/50'
                            }`}
                          >
                            <span className={`text-xs ${
                              isActiveWeek ? 'text-blox-purple font-medium' : 'text-blox-off-white'
                            }`}>{week.title}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${weekProgressColor}`}>
                                {weekProgress}%
                              </span>
                              {weekProgress === 100 && (
                                <CheckCircle className="h-3 w-3 text-blox-success" />
                              )}
                            </div>
                          </button>
                        </div>

                        {/* Days */}
                        <AnimatePresence>
                          {expandedWeeks.includes(week.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="ml-4 overflow-hidden"
                            >
                              {week.days.map((day) => {
                                const dayProgress = getDayProgress(day.id)
                                const isCompleted = isDayCompleted(day.id)
                                const dayProgressColor = getProgressColor(dayProgress.completionPercentage)
                                const isActiveDay = day.id === activeDayId
                                
                                // Get completion icon based on progress
                                const CompletionIcon = isCompleted ? CheckCircle : 
                                                    dayProgress.completionPercentage > 0 ? PlayCircle : 
                                                    Lock
                                
                                return (
                                  <button
                                    key={day.id}
                                    onClick={() => navigateToLesson(module.id, week.id, day.id)}
                                    className={`w-full flex items-center justify-between gap-2 px-3 py-1 rounded-lg text-xs transition-colors text-left group ${
                                      isActiveDay 
                                        ? 'bg-blox-warning/20 border-l-2 border-blox-warning' 
                                        : 'hover:bg-blox-second-dark-blue/30'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <CompletionIcon 
                                        className={`h-3 w-3 flex-shrink-0 transition-colors ${
                                          isCompleted 
                                            ? 'text-blox-success' 
                                            : dayProgress.completionPercentage > 0 
                                              ? 'text-blox-warning group-hover:text-blox-teal' 
                                              : 'text-blox-off-white group-hover:text-blox-teal'
                                        }`} 
                                      />
                                      <span className={`transition-colors ${
                                        isCompleted 
                                          ? 'text-blox-success' 
                                          : dayProgress.completionPercentage > 0 
                                            ? 'text-blox-warning group-hover:text-blox-white'
                                            : 'text-blox-off-white group-hover:text-blox-white'
                                      }`}>
                                        {day.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className={`text-xs ${dayProgressColor}`}>
                                        {dayProgress.completionPercentage}%
                                      </span>
                                      {day.videos.length > 0 && (
                                        <span className="text-xs text-blox-off-white/60">
                                          ({day.videos.length})
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                )
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}