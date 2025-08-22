'use client'

import { SplitView } from '@/components/learning/SplitView'
import { WeekOverview } from '@/components/learning/WeekOverview'
import { VideoPlayer } from '@/components/learning/VideoPlayer'
import { useState } from 'react'

interface PageProps {
  params: {
    moduleId: string
    weekId: string
    dayId: string
  }
}

export default function LearningVideoPage({ params }: PageProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  const handleVideoSelect = (videoId: string, dayId: string) => {
    setSelectedVideo(videoId)
  }

  const leftPanel = (
    <WeekOverview
      module={{
        id: params.moduleId,
        title: 'Modern Foundations & 3D Introduction',
        description: 'Master Roblox Studio 2024, Blender 4.1+, and AI tools for 3D creation',
        totalVideos: 20
      }}
      weeks={[]}
      currentWeek={params.weekId}
      onWeekChange={() => {}}
      onVideoSelect={handleVideoSelect}
    />
  )

  const rightPanel = selectedVideo ? (
    <VideoPlayer
      video={{
        id: selectedVideo,
        title: 'Blender 4.1 Introduction (Part 1)',
        description: 'Get familiar with the updated Roblox development environment and master the modern Studio interface. Learn about the new Creator Hub features and project management tools.',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '50:00',
        xp: 450,
        completed: false
      }}
      module={{
        id: params.moduleId,
        title: 'Modern Foundations & 3D Introduction',
        week: 10,
        day: 1
      }}
      onComplete={() => {}}
      onNext={() => {}}
      onPrevious={() => {}}
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