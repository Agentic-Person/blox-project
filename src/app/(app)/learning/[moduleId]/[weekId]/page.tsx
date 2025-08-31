'use client'

import { useState, useEffect } from 'react'
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
  
  return (
    <motion.div 
      className="h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <WeekPreview
        week={currentWeek}
        moduleId={params.moduleId}
        onDaySelect={handleDaySelect}
        onVideoSelect={handleVideoSelect}
      />
    </motion.div>
  )
}