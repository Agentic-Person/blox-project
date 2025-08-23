'use client'

import { useState, useEffect } from 'react'
import { SplitView } from '@/components/learning/SplitView'
import { WeekOverview } from '@/components/learning/WeekOverview'
import { WeekPreview } from '@/components/learning/WeekPreview'
import { useLearningStore } from '@/store/learningStore'
import curriculumData from '@/data/curriculum.json'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface PageProps {
  params: {
    moduleId: string
    weekId: string
  }
}

export default function WeekLearningPage({ params }: PageProps) {
  const router = useRouter()
  const { isVideoCompleted } = useLearningStore()
  
  // Find the current module and week from curriculum data
  const currentModule = curriculumData.modules.find(m => m.id === params.moduleId)
  const currentWeek = currentModule?.weeks.find(w => w.id === params.weekId)
  
  // Handle video selection - navigate to video player
  const handleVideoSelect = (videoId: string, dayId: string) => {
    router.push(`/learning/${params.moduleId}/${params.weekId}/${dayId}`)
  }
  
  // Handle day navigation
  const handleDaySelect = (dayId: string) => {
    router.push(`/learning/${params.moduleId}/${params.weekId}/${dayId}`)
  }
  
  // Handle week change
  const handleWeekChange = (weekId: string) => {
    router.push(`/learning/${params.moduleId}/${weekId}`)
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
  
  if (!currentModule || !currentWeek) {
    return (
      <div className="h-full flex items-center justify-center bg-blox-very-dark-blue">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-blox-white">Week Not Found</h2>
          <p className="text-blox-off-white">The requested week could not be found.</p>
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
      currentWeek={params.weekId}
      onWeekChange={handleWeekChange}
      onVideoSelect={handleVideoSelect}
    />
  )
  
  // Right panel - Week Preview (70%)
  const rightPanel = (
    <WeekPreview
      week={currentWeek}
      onDaySelect={handleDaySelect}
      onVideoSelect={handleVideoSelect}
    />
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