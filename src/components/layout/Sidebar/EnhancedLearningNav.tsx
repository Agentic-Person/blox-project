'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, CheckCircle, Clock, BookOpen, Trophy } from 'lucide-react'
import { useLearningStore } from '@/store/learningStore'
import curriculumData from '@/data/curriculum.json'
import { ModuleHeader } from './ModuleHeader'
import { WeekCard } from './WeekCard'
import { AllModulesNav } from './AllModulesNav'

interface EnhancedLearningNavProps {
  currentModuleId?: string
  currentWeekId?: string
  currentDayId?: string
  showAllModules?: boolean
}

export function EnhancedLearningNav({
  currentModuleId,
  currentWeekId,
  currentDayId,
  showAllModules = false
}: EnhancedLearningNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { getModuleProgress, getWeekProgress, getDayProgress, isVideoCompleted } = useLearningStore()
  
  // Always render the AllModulesNav component to show all modules
  if (showAllModules) {
    return (
      <AllModulesNav 
        currentModuleId={currentModuleId}
        currentWeekId={currentWeekId}
        currentDayId={currentDayId}
      />
    )
  }
  
  // Parse current path
  const pathSegments = pathname.split('/').filter(Boolean)
  const activeModuleId = currentModuleId || pathSegments[1] || 'module-1'
  const activeWeekId = currentWeekId || pathSegments[2]
  const activeDayId = currentDayId || pathSegments[3]
  
  // Get current module data
  const currentModule = curriculumData.modules.find(m => m.id === activeModuleId) || curriculumData.modules[0]
  
  // Calculate module index for color scheme
  const moduleNumber = parseInt(activeModuleId.split('-')[1], 10) || 1
  const moduleIndex = moduleNumber - 1 // Convert to 0-based index
  
  // State for expanded sections
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())
  const [selectedModule, setSelectedModule] = useState(activeModuleId)
  
  // Auto-expand active week
  useEffect(() => {
    if (activeWeekId) {
      setExpandedWeeks(prev => new Set(prev).add(activeWeekId))
    }
  }, [activeWeekId])
  
  // Save/load expanded state
  useEffect(() => {
    const saved = localStorage.getItem('enhanced-nav-expanded')
    if (saved) {
      try {
        setExpandedWeeks(new Set(JSON.parse(saved)))
      } catch (e) {}
    }
  }, [])
  
  useEffect(() => {
    localStorage.setItem('enhanced-nav-expanded', JSON.stringify(Array.from(expandedWeeks)))
  }, [expandedWeeks])
  
  const toggleWeek = (weekId: string) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(weekId)) {
        newSet.delete(weekId)
      } else {
        newSet.add(weekId)
      }
      return newSet
    })
  }
  
  const handleModuleClick = () => {
    // Navigate to module overview
    router.push(`/learning/${activeModuleId}`)
  }
  
  const handleWeekClick = (weekId: string) => {
    // Simple navigation - just like the old tree did
    router.push(`/learning/${activeModuleId}/${weekId}`)
  }
  
  const handleDayClick = (weekId: string, dayId: string) => {
    // Simple navigation - just like the old tree did
    router.push(`/learning/${activeModuleId}/${weekId}/${dayId}`)
  }
  
  if (!currentModule) {
    return null
  }
  
  // Calculate module stats
  const totalVideos = currentModule.weeks.reduce((acc, week) => 
    acc + week.days.reduce((dayAcc, day) => dayAcc + day.videos.length, 0), 0
  )
  const totalHours = Math.round(totalVideos * 2.5) // Estimate 2.5h per video
  const totalXP = totalVideos * 50 // 50 XP per video
  
  return (
    <div className="space-y-3">
      {/* Module Header - Clickable to navigate to module overview */}
      <div onClick={handleModuleClick} className="cursor-pointer">
        <ModuleHeader 
          module={currentModule}
          totalHours={totalHours}
          totalXP={totalXP}
          progress={getModuleProgress(currentModule.id)}
        />
      </div>
      
      {/* Week Cards */}
      <div className="space-y-2">
        {currentModule.weeks.map((week, weekIndex) => {
          const isExpanded = expandedWeeks.has(week.id)
          const isActiveWeek = week.id === activeWeekId
          const weekProgress = getWeekProgress(week.id)
          
          // Calculate day completion for indicators
          const dayCompletions = week.days.map(day => {
            const dayProgress = getDayProgress(day.id)
            return dayProgress.completionPercentage === 100
          })
          
          return (
            <WeekCard
              key={week.id}
              week={week}
              weekIndex={weekIndex}
              moduleIndex={moduleIndex}
              isExpanded={isExpanded}
              isActive={isActiveWeek}
              progress={weekProgress}
              dayCompletions={dayCompletions}
              activeDayId={activeDayId}
              onToggle={() => toggleWeek(week.id)}
              onWeekClick={() => handleWeekClick(week.id)}
              onDayClick={(dayId) => handleDayClick(week.id, dayId)}
              getDayProgress={getDayProgress}
              isVideoCompleted={isVideoCompleted}
            />
          )
        })}
      </div>
    </div>
  )
}