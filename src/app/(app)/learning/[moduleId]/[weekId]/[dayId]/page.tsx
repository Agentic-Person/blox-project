'use client'

import { DayView } from '@/components/learning/DayView'
import { Breadcrumb } from '@/components/learning/Breadcrumb'
import { useLearningStore } from '@/store/learningStore'
import curriculumData from '@/data/curriculum.json'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface PageProps {
  params: {
    moduleId: string
    weekId: string
    dayId: string
  }
}

export default function LearningDayPage({ params }: PageProps) {
  const router = useRouter()
  
  // Find the current module, week, and day from curriculum data
  const currentModule = curriculumData.modules.find(m => m.id === params.moduleId)
  const currentWeek = currentModule?.weeks.find(w => w.id === params.weekId)
  const currentDay = currentWeek?.days.find(d => d.id === params.dayId)
  
  const handleVideoPlay = (videoId: string) => {
    // Navigate to video player page
    router.push(`/learning/${params.moduleId}/${params.weekId}/${params.dayId}/${videoId}`)
  }
  
  const handleBack = () => {
    // Navigate back to week view
    router.push(`/learning/${params.moduleId}/${params.weekId}`)
  }


  if (!currentDay || !currentModule || !currentWeek) {
    return (
      <div className="h-full flex items-center justify-center bg-blox-very-dark-blue">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-blox-teal/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blox-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-blox-white">Day Not Found</h2>
          <p className="text-blox-off-white max-w-md">
            The requested day could not be found. Please select a day from the navigation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="h-full flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="px-4 py-2">
        <Breadcrumb />
      </div>
      <div className="flex-1">
        <DayView
          day={currentDay}
          moduleInfo={{
            id: currentModule.id,
            title: currentModule.title
          }}
          weekInfo={{
            id: currentWeek.id,
            title: currentWeek.title
          }}
          onVideoSelect={handleVideoPlay}
          onBack={handleBack}
        />
      </div>
    </motion.div>
  )
}