'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, CheckCircle, PlayCircle, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLearningStore } from '@/store/learningStore'
import { toggleExpanded, getCompletionIcon } from '@/lib/utils/learningUtils'
import curriculumData from '@/data/curriculum.json'
import { useRouter } from 'next/navigation'

export function LearningPathTree() {
  const router = useRouter()
  const { 
    completedDays, 
    completedVideos, 
    isDayCompleted, 
    getDayProgress,
    getWeekProgress,
    getModuleProgress 
  } = useLearningStore()
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>([])

  const navigateToLesson = (moduleId: string, weekId: string, dayId: string) => {
    router.push(`/learning/${moduleId}/${weekId}/${dayId}`)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'text-blox-success'
    if (percentage > 0) return 'text-blox-warning'
    return 'text-blox-off-white'
  }

  return (
    <div className="space-y-1">
      {curriculumData.modules.map((module) => {
        const moduleProgress = getModuleProgress(module.id)
        const moduleProgressColor = getProgressColor(moduleProgress)

        return (
          <div key={module.id}>
            {/* Module Level */}
            <button
              onClick={() => toggleExpanded(module.id, expandedModules, setExpandedModules)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-blox-second-dark-blue rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                {expandedModules.includes(module.id) ? (
                  <ChevronDown className="h-4 w-4 text-blox-off-white flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-blox-off-white flex-shrink-0" />
                )}
                <span className="text-sm text-blox-white font-medium">{module.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${moduleProgressColor}`}>
                  {moduleProgress}%
                </span>
                {moduleProgress === 100 && (
                  <CheckCircle className="h-3 w-3 text-blox-success" />
                )}
              </div>
            </button>

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

                    return (
                      <div key={week.id}>
                        {/* Week Level */}
                        <button
                          onClick={() => toggleExpanded(week.id, expandedWeeks, setExpandedWeeks)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-blox-second-dark-blue/50 rounded-lg transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            {expandedWeeks.includes(week.id) ? (
                              <ChevronDown className="h-3 w-3 text-blox-off-white flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-blox-off-white flex-shrink-0" />
                            )}
                            <span className="text-xs text-blox-off-white">{week.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${weekProgressColor}`}>
                              {weekProgress}%
                            </span>
                            {weekProgress === 100 && (
                              <CheckCircle className="h-3 w-3 text-blox-success" />
                            )}
                          </div>
                        </button>

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
                                
                                // Get completion icon based on progress
                                const CompletionIcon = isCompleted ? CheckCircle : 
                                                    dayProgress.completionPercentage > 0 ? PlayCircle : 
                                                    Lock
                                
                                return (
                                  <button
                                    key={day.id}
                                    onClick={() => navigateToLesson(module.id, week.id, day.id)}
                                    className="w-full flex items-center justify-between gap-2 px-3 py-1 hover:bg-blox-second-dark-blue/30 rounded-lg text-xs transition-colors text-left group"
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