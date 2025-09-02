import { notFound } from 'next/navigation'
import curriculumData from '@/data/curriculum.json'
import { PracticeTaskView } from '@/components/learning/PracticeTaskView'
import type { Module, Week, Day } from '@/types/learning'

interface PracticePageProps {
  params: {
    moduleId: string
    weekId: string
    dayId: string
  }
}

export default async function PracticePage({ params }: PracticePageProps) {
  // Find the specific day data from curriculum
  const module = curriculumData.modules.find((m: Module) => m.id === params.moduleId)
  if (!module) return notFound()
  
  const week = module.weeks.find((w: Week) => w.id === params.weekId)
  if (!week) return notFound()
  
  const day = week.days.find((d: Day) => d.id === params.dayId)
  if (!day) return notFound()

  return (
    <PracticeTaskView
      day={day}
      moduleInfo={{
        id: module.id,
        title: module.title
      }}
      weekInfo={{
        id: week.id,
        title: week.title
      }}
    />
  )
}

export function generateMetadata({ params }: PracticePageProps) {
  const module = curriculumData.modules.find((m: Module) => m.id === params.moduleId)
  const week = module?.weeks.find((w: Week) => w.id === params.weekId)
  const day = week?.days.find((d: Day) => d.id === params.dayId)
  
  return {
    title: day ? `Practice: ${day.title} | Blox Buddy` : 'Practice | Blox Buddy',
    description: day?.description || 'Practice your skills with hands-on exercises'
  }
}