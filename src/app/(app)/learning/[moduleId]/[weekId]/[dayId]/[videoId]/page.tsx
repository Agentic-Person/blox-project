'use client'

import { SplitView } from '@/components/learning/SplitView'
import { WeekOverview } from '@/components/learning/WeekOverview'
import { VideoPlayer } from '@/components/learning/VideoPlayer'
import { useState, useEffect } from 'react'
import { useLearningStore } from '@/store/learningStore'
import curriculumData from '@/data/curriculum.json'
import { useRouter } from 'next/navigation'

interface PageProps {
  params: {
    moduleId: string
    weekId: string
    dayId: string
    videoId: string
  }
}

export default function LearningVideoPage({ params }: PageProps) {
  const router = useRouter()
  const { isVideoCompleted } = useLearningStore()

  // Find the current module, week, and day from curriculum data
  const currentModule = curriculumData.modules.find(m => m.id === params.moduleId)
  const currentWeek = currentModule?.weeks.find(w => w.id === params.weekId)
  const currentDay = currentWeek?.days.find(d => d.id === params.dayId)
  const currentVideo = currentDay?.videos.find(v => v.id === params.videoId)

  const handleVideoSelect = (videoId: string, dayId: string) => {
    // Navigate to the video
    if (dayId !== params.dayId) {
      // If different day, get the first video of that day
      const targetDay = currentWeek?.days.find(d => d.id === dayId)
      const firstVideo = targetDay?.videos[0]
      if (firstVideo) {
        router.push(`/learning/${params.moduleId}/${params.weekId}/${dayId}/${firstVideo.id}`)
      }
    } else {
      router.push(`/learning/${params.moduleId}/${params.weekId}/${params.dayId}/${videoId}`)
    }
  }

  const handleVideoComplete = (videoId: string) => {
    // Video completion is handled by the VideoPlayer component
  }

  const handleNextVideo = () => {
    if (!currentDay) return
    
    const currentVideoIndex = currentDay.videos.findIndex(v => v.id === params.videoId)
    if (currentVideoIndex < currentDay.videos.length - 1) {
      const nextVideo = currentDay.videos[currentVideoIndex + 1]
      router.push(`/learning/${params.moduleId}/${params.weekId}/${params.dayId}/${nextVideo.id}`)
    } else {
      // Move to next day or week
      navigateToNext()
    }
  }

  const handlePreviousVideo = () => {
    if (!currentDay) return
    
    const currentVideoIndex = currentDay.videos.findIndex(v => v.id === params.videoId)
    if (currentVideoIndex > 0) {
      const prevVideo = currentDay.videos[currentVideoIndex - 1]
      router.push(`/learning/${params.moduleId}/${params.weekId}/${params.dayId}/${prevVideo.id}`)
    } else {
      // Move to previous day or week
      navigateToPrevious()
    }
  }

  const navigateToNext = () => {
    if (!currentModule || !currentWeek) return
    
    const dayIndex = currentWeek.days.findIndex(d => d.id === params.dayId)
    const weekIndex = currentModule.weeks.findIndex(w => w.id === params.weekId)
    
    if (dayIndex < currentWeek.days.length - 1) {
      // Next day in same week
      const nextDay = currentWeek.days[dayIndex + 1]
      const firstVideo = nextDay.videos[0]
      if (firstVideo) {
        router.push(`/learning/${params.moduleId}/${params.weekId}/${nextDay.id}/${firstVideo.id}`)
      }
    } else if (weekIndex < currentModule.weeks.length - 1) {
      // First day of next week
      const nextWeek = currentModule.weeks[weekIndex + 1]
      const firstDay = nextWeek.days[0]
      const firstVideo = firstDay?.videos[0]
      if (firstVideo) {
        router.push(`/learning/${params.moduleId}/${nextWeek.id}/${firstDay.id}/${firstVideo.id}`)
      }
    }
  }

  const navigateToPrevious = () => {
    if (!currentModule || !currentWeek) return
    
    const dayIndex = currentWeek.days.findIndex(d => d.id === params.dayId)
    const weekIndex = currentModule.weeks.findIndex(w => w.id === params.weekId)
    
    if (dayIndex > 0) {
      // Previous day in same week
      const prevDay = currentWeek.days[dayIndex - 1]
      const lastVideo = prevDay.videos[prevDay.videos.length - 1]
      if (lastVideo) {
        router.push(`/learning/${params.moduleId}/${params.weekId}/${prevDay.id}/${lastVideo.id}`)
      }
    } else if (weekIndex > 0) {
      // Last day of previous week
      const prevWeek = currentModule.weeks[weekIndex - 1]
      const lastDay = prevWeek.days[prevWeek.days.length - 1]
      const lastVideo = lastDay?.videos[lastDay.videos.length - 1]
      if (lastVideo) {
        router.push(`/learning/${params.moduleId}/${prevWeek.id}/${lastDay.id}/${lastVideo.id}`)
      }
    }
  }

  // Transform curriculum data to match WeekOverview expected format
  const transformedWeeks = currentModule?.weeks.map(week => ({
    id: week.id,
    title: week.title,
    completed: false,
    progress: 0,
    days: week.days.map(day => ({
      id: day.id,
      title: day.title,
      videos: day.videos.map(video => ({
        id: video.id,
        title: video.title,
        thumbnail: '',
        duration: video.duration,
        completed: isVideoCompleted(video.id),
        xp: video.xpReward
      })),
      completed: false,
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
        if (newWeek && newWeek.days[0]) {
          const firstVideo = newWeek.days[0].videos[0]
          if (firstVideo) {
            router.push(`/learning/${params.moduleId}/${weekId}/${newWeek.days[0].id}/${firstVideo.id}`)
          }
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

  const rightPanel = currentVideo ? (
    <VideoPlayer
      video={{
        id: currentVideo.id,
        title: currentVideo.title,
        youtubeId: currentVideo.youtubeId,
        duration: currentVideo.duration,
        xpReward: currentVideo.xpReward,
        creator: (currentVideo as any).creator
      }}
      dayInfo={currentDay ? {
        id: currentDay.id,
        title: currentDay.title
      } : undefined}
      moduleInfo={currentModule ? {
        id: currentModule.id,
        title: currentModule.title
      } : undefined}
      practiceTask={currentDay?.practiceTask}
      estimatedTime={currentDay?.estimatedTime}
      onComplete={handleVideoComplete}
      onNext={handleNextVideo}
      onPrevious={handlePreviousVideo}
    />
  ) : (
    <div className="h-full flex items-center justify-center bg-blox-very-dark-blue">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-blox-white">Video Not Found</h2>
        <p className="text-blox-off-white">The requested video could not be found.</p>
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