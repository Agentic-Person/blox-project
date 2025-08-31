'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, CheckCircle, Clock, BookOpen, Trophy, Zap, Calendar, Play } from 'lucide-react'
import { useLearningStore } from '@/store/learningStore'
import curriculumData from '@/data/curriculum.json'
import { cn } from '@/lib/utils/cn'
import { moduleColorScheme } from '@/lib/constants/moduleColors'

interface AllModulesNavProps {
  currentModuleId?: string
  currentWeekId?: string
  currentDayId?: string
}

export function AllModulesNav({
  currentModuleId,
  currentWeekId,
  currentDayId
}: AllModulesNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { getModuleProgress, getWeekProgress, getDayProgress, isVideoCompleted } = useLearningStore()
  
  // Parse current path - ensure we detect from URL changes
  const pathSegments = pathname.split('/').filter(Boolean)
  const activeModuleId = currentModuleId || pathSegments[1]
  const activeWeekId = currentWeekId || pathSegments[2]
  const activeDayId = currentDayId || pathSegments[3]
  
  
  // State for expanded sections - all modules, weeks, and days
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())
  
  // Auto-expand active sections
  useEffect(() => {
    if (activeModuleId) {
      setExpandedModules(prev => new Set(prev).add(activeModuleId))
    }
    if (activeWeekId && activeModuleId) {
      setExpandedWeeks(prev => new Set(prev).add(`${activeModuleId}-${activeWeekId}`))
    }
  }, [activeModuleId, activeWeekId])
  
  // Save/load expanded state
  useEffect(() => {
    const savedModules = localStorage.getItem('all-modules-expanded')
    const savedWeeks = localStorage.getItem('all-weeks-expanded')
    if (savedModules) {
      try {
        setExpandedModules(new Set(JSON.parse(savedModules)))
      } catch (e) {}
    }
    if (savedWeeks) {
      try {
        setExpandedWeeks(new Set(JSON.parse(savedWeeks)))
      } catch (e) {}
    }
  }, [])
  
  useEffect(() => {
    localStorage.setItem('all-modules-expanded', JSON.stringify(Array.from(expandedModules)))
    localStorage.setItem('all-weeks-expanded', JSON.stringify(Array.from(expandedWeeks)))
  }, [expandedModules, expandedWeeks])
  
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }
  
  const toggleWeek = (moduleId: string, weekId: string) => {
    const key = `${moduleId}-${weekId}`
    setExpandedWeeks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }
  
  const handleModuleClick = (moduleId: string) => {
    router.push(`/learning/${moduleId}`)
  }
  
  const handleWeekClick = (moduleId: string, weekId: string) => {
    router.push(`/learning/${moduleId}/${weekId}`)
  }
  
  const handleDayClick = (moduleId: string, weekId: string, dayId: string) => {
    router.push(`/learning/${moduleId}/${weekId}/${dayId}`)
  }
  
  // Use consistent color scheme from moduleColors.ts
  const {
    moduleGradients,
    moduleBorders,
    textColors,
    progressBarColors,
    selectionRings,
    badgeBackgrounds,
    dayBackgrounds,
    dayActiveBackgrounds,
    dayHoverBackgrounds,
    dayActiveBorders,
    weekBackgrounds,
    weekActiveBackgrounds,
    weekBorders,
    weekActiveBorders
  } = moduleColorScheme
  
  return (
    <div className="space-y-2">
      {curriculumData.modules.map((module, moduleIndex) => {
        const isExpanded = expandedModules.has(module.id)
        const isActiveModule = module.id === activeModuleId
        const moduleProgress = getModuleProgress(module.id)
        
        // Calculate module stats
        const totalVideos = module.weeks.reduce((acc, week) => 
          acc + week.days.reduce((dayAcc, day) => dayAcc + day.videos.length, 0), 0
        )
        const totalHours = Math.round(totalVideos * 2.5)
        const totalXP = totalVideos * 50
        
        return (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: moduleIndex * 0.1 }}
            className="relative"
          >
            {/* Module Card */}
            <motion.div
              className={cn(
                "rounded-lg p-3 transition-all cursor-pointer bg-gradient-to-br",
                moduleGradients[moduleIndex],
                moduleBorders[moduleIndex],
                isActiveModule && selectionRings[moduleIndex]
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between">
                {/* Module Info */}
                <div 
                  className="flex-1 min-w-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleModuleClick(module.id)
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "text-xs font-bold px-1.5 py-0.5 rounded",
                      badgeBackgrounds[moduleIndex],
                      textColors[moduleIndex]
                    )}>
                      Module {moduleIndex + 1}
                    </span>
                    <span className="text-[10px] text-blox-off-white/60">
                      Month {moduleIndex + 1}
                    </span>
                    {moduleProgress === 100 && (
                      <Trophy className="h-3 w-3 text-blox-golden-yellow" />
                    )}
                  </div>
                  
                  <h3 className="text-sm font-bold text-blox-white mt-1 leading-tight">
                    {module.title}
                  </h3>
                  
                  <p className="text-xs text-blox-off-white/70 mt-1 line-clamp-2">
                    {module.description}
                  </p>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-1 mt-2">
                    <div className="bg-blox-very-dark-blue/50 rounded px-1 py-0.5 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <Clock className="h-2 w-2 text-blox-off-white/50" />
                        <span className="text-[10px] font-semibold text-blox-white">{totalHours}h</span>
                      </div>
                    </div>
                    <div className="bg-blox-very-dark-blue/50 rounded px-1 py-0.5 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <Zap className="h-2 w-2 text-blox-xp/50" />
                        <span className="text-[10px] font-semibold text-blox-white">{totalXP}</span>
                      </div>
                    </div>
                    <div className="bg-blox-very-dark-blue/50 rounded px-1 py-0.5 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <Calendar className="h-2 w-2 text-blox-purple/50" />
                        <span className="text-[10px] font-semibold text-blox-white">{module.weeks.length}w</span>
                      </div>
                    </div>
                    <div className="bg-blox-very-dark-blue/50 rounded px-1 py-0.5 text-center">
                      <span className="text-[10px] font-semibold text-blox-light-green">{moduleProgress}%</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-1 bg-blox-medium-blue-gray/30 rounded-full overflow-hidden mt-2">
                    <motion.div 
                      className={cn(
                        "h-full rounded-full",
                        progressBarColors[moduleIndex]
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${moduleProgress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
                
                {/* Expand/Collapse Button */}
                <button 
                  className="p-1.5 hover:bg-blox-very-dark-blue/50 rounded transition-colors ml-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleModule(module.id)
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-blox-white" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-blox-off-white/60" />
                  )}
                </button>
              </div>
            </motion.div>
            
            {/* Expandable Weeks */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-blox-medium-blue-gray/20 pl-2">
                    {module.weeks.map((week, weekIndex) => {
                      const weekKey = `${module.id}-${week.id}`
                      const isWeekExpanded = expandedWeeks.has(weekKey)
                      const isActiveWeek = week.id === activeWeekId && module.id === activeModuleId
                      const weekProgress = getWeekProgress(week.id)
                      
                      return (
                        <div key={week.id}>
                          {/* Week Card */}
                          <motion.div
                            className={cn(
                              "rounded-md border p-2 transition-all cursor-pointer",
                              isActiveWeek 
                                ? `${weekActiveBackgrounds[moduleIndex]} ${weekActiveBorders[moduleIndex]}` 
                                : `${weekBackgrounds[moduleIndex]} ${weekBorders[moduleIndex]}`
                            )}
                            whileHover={{ x: 2 }}
                          >
                            <div className="flex items-center justify-between">
                              <div 
                                className="flex-1"
                                onClick={() => handleWeekClick(module.id, week.id)}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className={cn("text-[10px] font-bold", textColors[moduleIndex])}>W{weekIndex + 1}</span>
                                  <h4 className="text-xs font-semibold text-blox-white">
                                    {week.title}
                                  </h4>
                                  {weekProgress === 100 && (
                                    <CheckCircle className="h-3 w-3 text-blox-light-green" />
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-blox-off-white/60">
                                  <span>{week.days.length} days</span>
                                  <span>•</span>
                                  <span>{weekProgress}% complete</span>
                                </div>
                              </div>
                              
                              <button 
                                className="p-1 hover:bg-blox-very-dark-blue/50 rounded transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleWeek(module.id, week.id)
                                }}
                              >
                                {isWeekExpanded ? (
                                  <ChevronUp className="h-3 w-3 text-blox-teal" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 text-blox-off-white/60" />
                                )}
                              </button>
                            </div>
                          </motion.div>
                          
                          {/* Expandable Days */}
                          <AnimatePresence>
                            {isWeekExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-blox-medium-blue-gray/10 pl-2">
                                  {week.days.map((day, dayIndex) => {
                                    const dayProgress = getDayProgress(day.id)
                                    const isActiveDay = day.id === activeDayId && week.id === activeWeekId && module.id === activeModuleId
                                    
                                    // Calculate cumulative day number properly
                                    let dayNum = 1
                                    // Count all days in previous modules
                                    for (let m = 0; m < moduleIndex; m++) {
                                      for (let week of curriculumData.modules[m].weeks) {
                                        dayNum += week.days.length
                                      }
                                    }
                                    // Add days from previous weeks in current module
                                    for (let w = 0; w < weekIndex; w++) {
                                      dayNum += module.weeks[w].days.length
                                    }
                                    // Add current day index
                                    dayNum += dayIndex
                                    
                                    return (
                                      <motion.div
                                        key={day.id}
                                        className={cn(
                                          "p-1.5 rounded text-xs cursor-pointer transition-all",
                                          isActiveDay 
                                            ? `${dayActiveBackgrounds[moduleIndex]} ${dayActiveBorders[moduleIndex]}` 
                                            : `${dayBackgrounds[moduleIndex]} ${dayHoverBackgrounds[moduleIndex]}`
                                        )}
                                        onClick={() => handleDayClick(module.id, week.id, day.id)}
                                        whileHover={{ x: 2 }}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <span className={cn(
                                              "text-[10px] font-bold px-1 rounded",
                                              dayProgress.completionPercentage === 100
                                                ? "bg-blox-light-green/20 text-blox-light-green"
                                                : dayProgress.completionPercentage > 0
                                                  ? "bg-blox-warning/20 text-blox-warning"
                                                  : `${badgeBackgrounds[moduleIndex]} ${textColors[moduleIndex]}`
                                            )}>
                                              D{dayNum}
                                            </span>
                                            <span className="text-blox-white/90">{day.title}</span>
                                          </div>
                                          <div className="flex items-center space-x-1 text-[10px] text-blox-off-white/50">
                                            <Play className="h-2 w-2" />
                                            <span>{day.videos.length}</span>
                                            {dayProgress.completionPercentage === 100 && (
                                              <CheckCircle className="h-2.5 w-2.5 text-blox-light-green ml-1" />
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
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}