'use client'

import { useState, useEffect } from 'react'
import { ModuleOverview } from '@/components/learning/ModuleOverview'
import { WeekPreview } from '@/components/learning/WeekPreview'
import { useLearningStore } from '@/store/learningStore'
import curriculumData from '@/data/curriculum.json'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface PageProps {
  params: {
    moduleId: string
  }
}

export default function ModuleLearningPage({ params }: PageProps) {
  const router = useRouter()
  const { isVideoCompleted } = useLearningStore()
  
  // Default to module-1 if no moduleId provided
  const moduleId = params.moduleId || 'module-1'
  
  // Find the current module from curriculum data
  const currentModule = curriculumData.modules.find(m => m.id === moduleId)
  
  // State for selected week and day
  const [selectedWeek, setSelectedWeek] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<string>('')
  
  // Set default week on module load
  useEffect(() => {
    if (currentModule && currentModule.weeks.length > 0) {
      setSelectedWeek(currentModule.weeks[0].id)
    }
  }, [currentModule])
  
  // Handle week change - update selected week to show in right panel
  const handleWeekChange = (weekId: string) => {
    setSelectedWeek(weekId)
    setSelectedDay('') // Clear day selection when changing week
  }
  
  // Handle video selection - navigate to video player
  const handleVideoSelect = (videoId: string, dayId: string) => {
    const week = currentModule?.weeks.find(w => 
      w.days.some(d => d.id === dayId)
    )
    if (week) {
      setSelectedDay(dayId)
      setSelectedWeek(week.id)
      router.push(`/learning/${moduleId}/${week.id}/${dayId}`)
    }
  }
  
  // Handle day navigation from WeekPreview
  const handleDaySelect = (dayId: string) => {
    if (selectedWeek) {
      setSelectedDay(dayId)
      router.push(`/learning/${moduleId}/${selectedWeek}/${dayId}`)
    }
  }
  
  if (!currentModule) {
    return (
      <div className="h-full flex items-center justify-center bg-blox-very-dark-blue">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-blox-white">Module Not Found</h2>
          <p className="text-blox-off-white">The requested module could not be found.</p>
        </div>
      </div>
    )
  }
  
  // Find selected week data
  const selectedWeekData = selectedWeek ? currentModule.weeks.find(w => w.id === selectedWeek) : null
  
  // Show WeekPreview if week selected, otherwise ModuleOverview
  const content = selectedWeekData ? (
    <WeekPreview
      week={selectedWeekData}
      onDaySelect={handleDaySelect}
      onVideoSelect={handleVideoSelect}
    />
  ) : (
    <ModuleOverview module={currentModule} />
  )
  
  return (
    <motion.div 
      className="h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {content}
    </motion.div>
  )
}