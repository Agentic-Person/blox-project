'use client'

import { VideoPlayer } from '@/components/learning/VideoPlayer'
import { useLearningStore } from '@/store/learningStore'
import curriculumData from '@/data/curriculum.json'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

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

  // Find the current module, week, and day from curriculum data
  const currentModule = curriculumData.modules.find(m => m.id === params.moduleId)
  const currentWeek = currentModule?.weeks.find(w => w.id === params.weekId)
  const currentDay = currentWeek?.days.find(d => d.id === params.dayId)
  const currentVideo = currentDay?.videos.find(v => v.id === params.videoId)


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

  if (!currentVideo || !currentModule || !currentWeek || !currentDay) {
    return (
      <div className="h-full flex items-center justify-center bg-blox-very-dark-blue">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-blox-white">Video Not Found</h2>
          <p className="text-blox-off-white">The requested video could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <VideoPlayer
        video={{
          id: currentVideo.id,
          title: currentVideo.title,
          youtubeId: currentVideo.youtubeId,
          duration: currentVideo.duration,
          xpReward: currentVideo.xpReward,
          creator: (currentVideo as any).creator
        }}
        dayInfo={{
          id: currentDay.id,
          title: currentDay.title
        }}
        moduleInfo={{
          id: currentModule.id,
          title: currentModule.title
        }}
        practiceTask={currentDay?.practiceTask}
        estimatedTime={currentDay?.estimatedTime}
        onComplete={handleVideoComplete}
        onNext={handleNextVideo}
        onPrevious={handlePreviousVideo}
      />
    </motion.div>
  )
}