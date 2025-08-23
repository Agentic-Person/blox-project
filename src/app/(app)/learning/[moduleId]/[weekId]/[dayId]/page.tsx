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
  }
}

export default function LearningVideoPage({ params }: PageProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const router = useRouter()
  const { isVideoCompleted, markVideoComplete } = useLearningStore()

  // Find the current module, week, and day from curriculum data
  const currentModule = curriculumData.modules.find(m => m.id === params.moduleId)
  const currentWeek = currentModule?.weeks.find(w => w.id === params.weekId)
  const currentDay = currentWeek?.days.find(d => d.id === params.dayId)

  // Auto-select first video if coming to a day
  useEffect(() => {
    if (currentDay?.videos && currentDay.videos.length > 0 && !selectedVideo) {
      setSelectedVideo(currentDay.videos[0].id)
    }
  }, [currentDay, selectedVideo])

  const handleVideoSelect = (videoId: string, dayId: string) => {
    setSelectedVideo(videoId)
    // Navigate to the day if different
    if (dayId !== params.dayId) {
      router.push(`/learning/${params.moduleId}/${params.weekId}/${dayId}`)
    }
  }

  const handleVideoComplete = (videoId: string) => {
    // Video completion is handled by the VideoPlayer component
    // but we could add additional logic here if needed
  }

  const handleNextVideo = () => {
    if (!currentDay) return
    
    const currentVideoIndex = currentDay.videos.findIndex(v => v.id === selectedVideo)
    if (currentVideoIndex < currentDay.videos.length - 1) {
      setSelectedVideo(currentDay.videos[currentVideoIndex + 1].id)
    } else {
      // Move to next day or week
      navigateToNext()
    }
  }

  const handlePreviousVideo = () => {
    if (!currentDay) return
    
    const currentVideoIndex = currentDay.videos.findIndex(v => v.id === selectedVideo)
    if (currentVideoIndex > 0) {
      setSelectedVideo(currentDay.videos[currentVideoIndex - 1].id)
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
      router.push(`/learning/${params.moduleId}/${params.weekId}/${nextDay.id}`)
    } else if (weekIndex < currentModule.weeks.length - 1) {
      // First day of next week
      const nextWeek = currentModule.weeks[weekIndex + 1]
      router.push(`/learning/${params.moduleId}/${nextWeek.id}/${nextWeek.days[0].id}`)
    }
  }

  const navigateToPrevious = () => {
    if (!currentModule || !currentWeek) return
    
    const dayIndex = currentWeek.days.findIndex(d => d.id === params.dayId)
    const weekIndex = currentModule.weeks.findIndex(w => w.id === params.weekId)
    
    if (dayIndex > 0) {
      // Previous day in same week
      const prevDay = currentWeek.days[dayIndex - 1]
      router.push(`/learning/${params.moduleId}/${params.weekId}/${prevDay.id}`)
    } else if (weekIndex > 0) {
      // Last day of previous week
      const prevWeek = currentModule.weeks[weekIndex - 1]
      const lastDay = prevWeek.days[prevWeek.days.length - 1]
      router.push(`/learning/${params.moduleId}/${prevWeek.id}/${lastDay.id}`)
    }
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

  const selectedVideoData = selectedVideo && currentDay ? 
    currentDay.videos.find(v => v.id === selectedVideo) : null

  const rightPanel = selectedVideoData ? (
    <VideoPlayer
      video={{
        id: selectedVideoData.id,
        title: selectedVideoData.title,
        youtubeId: selectedVideoData.youtubeId,
        duration: selectedVideoData.duration,
        xpReward: selectedVideoData.xpReward
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
        <div className="w-16 h-16 mx-auto bg-blox-teal/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blox-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-blox-white">Select a Video</h2>
        <p className="text-blox-off-white max-w-md">
          Choose a video from the week overview to start learning. Track your progress and earn XP as you complete each lesson.
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