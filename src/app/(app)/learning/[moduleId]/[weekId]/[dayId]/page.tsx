'use client'

import { SplitView } from '@/components/learning/SplitView'
import { WeekOverview } from '@/components/learning/WeekOverview'
import { DayView } from '@/components/learning/DayView'
import { useState, useEffect } from 'react'
import { useLearningStore } from '@/store/learningStore'
import curriculumData from '@/data/curriculum.json'
import { useRouter } from 'next/navigation'

interface PageProps {
  params: {
    moduleId: string
    weekId: string
    dayId: string
  }
}

export default function LearningDayPage({ params }: PageProps) {
  const router = useRouter()
  const { isVideoCompleted } = useLearningStore()

  // Find the current module, week, and day from curriculum data
  const currentModule = curriculumData.modules.find(m => m.id === params.moduleId)
  const currentWeek = currentModule?.weeks.find(w => w.id === params.weekId)
  const currentDay = currentWeek?.days.find(d => d.id === params.dayId)

  const handleVideoSelect = (videoId: string, dayId: string) => {
    // Navigate to the day if different
    if (dayId !== params.dayId) {
      router.push(`/learning/${params.moduleId}/${params.weekId}/${dayId}`)
    }
  }
  
  const handleVideoPlay = (videoId: string) => {
    // Navigate to video player page
    router.push(`/learning/${params.moduleId}/${params.weekId}/${params.dayId}/${videoId}`)
  }
  
  const handleBack = () => {
    // Navigate back to module/week view
    router.push(`/learning/${params.moduleId}`)
  }


  // Transform curriculum data to match WeekOverview expected format
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
        thumbnail: '', // Placeholder - could be generated from YouTube ID
        duration: video.duration,
        completed: isVideoCompleted(video.id),
        xp: video.xpReward
      })),
      completed: false, // This would be calculated from store
      estimatedTime: day.estimatedTime || '2.5h'
    }))
  })) || []

  const leftPanel = currentModule ? (
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
      currentDay={params.dayId}
      onWeekChange={(weekId) => {
        const newWeek = currentModule.weeks.find(w => w.id === weekId)
        if (newWeek) {
          router.push(`/learning/${params.moduleId}/${weekId}/${newWeek.days[0].id}`)
        }
      }}
      onVideoSelect={handleVideoSelect}
    />
  ) : (
    <div className="h-full flex items-center justify-center bg-blox-very-dark-blue">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-blox-white">Module Not Found</h2>
        <p className="text-blox-off-white">The requested module could not be found.</p>
      </div>
    </div>
  )

  const rightPanel = currentDay ? (
    <DayView
      day={currentDay}
      moduleInfo={currentModule ? {
        id: currentModule.id,
        title: currentModule.title
      } : { id: '', title: '' }}
      weekInfo={currentWeek ? {
        id: currentWeek.id,
        title: currentWeek.title
      } : { id: '', title: '' }}
      onVideoSelect={handleVideoPlay}
      onBack={handleBack}
    />
  ) : (
    <div className="h-full flex items-center justify-center bg-blox-very-dark-blue">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-blox-teal/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blox-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-blox-white">Day Not Found</h2>
        <p className="text-blox-off-white max-w-md">
          The requested day could not be found. Please select a day from the week overview.
        </p>
      </div>
    </div>
  )

  return (
    <div className="h-full">
      <SplitView
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        defaultLeftSize={30}
        minLeftSize={25}
        maxLeftSize={45}
      />
    </div>
  )
}