'use client'

import { useState, useEffect } from 'react'
import { SplitView } from '@/components/learning/SplitView'
import { WeekOverview } from '@/components/learning/WeekOverview'
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
  
  // Transform module data for WeekOverview component
  const transformedWeeks = currentModule?.weeks.map(week => ({
    id: week.id,
    title: week.title,
    completed: false, // This would be calculated from store
    progress: 0, // This would be calculated from store
    days: week.days.map(day => ({
      id: day.id,
      title: day.title,
      videos: day.videos.map(video => ({
        id: video.id,
        title: video.title,
        thumbnail: `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`,
        duration: video.duration,
        completed: isVideoCompleted(video.id),
        xp: video.xpReward
      })),
      completed: false, // This would be calculated from store
      estimatedTime: day.estimatedTime || '2.5h'
    }))
  })) || []
  
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
  
  // Left panel - Week Overview (30%)
  const leftPanel = (
    <WeekOverview
      module={{
        id: currentModule.id,
        title: currentModule.title,
        description: currentModule.description,
        totalVideos: currentModule.weeks.reduce((acc, week) => 
          acc + week.days.reduce((dayAcc, day) => dayAcc + day.videos.length, 0), 0
        )
      }}
      weeks={transformedWeeks}
      currentWeek={selectedWeek}
      currentDay={selectedDay}
      onWeekChange={handleWeekChange}
      onVideoSelect={handleVideoSelect}
    />
  )
  
  // Find selected week data
  const selectedWeekData = selectedWeek ? currentModule.weeks.find(w => w.id === selectedWeek) : null
  
  // Right panel - Show WeekPreview if week selected, otherwise ModuleOverview (70%)
  const rightPanel = selectedWeekData ? (
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
      className="h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <SplitView
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        defaultLeftSize={30}
        minLeftSize={25}
        maxLeftSize={40}
      />
    </motion.div>
  )
}