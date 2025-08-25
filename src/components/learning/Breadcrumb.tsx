'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import curriculumData from '@/data/curriculum.json'
import { useLearningStore } from '@/store/learningStore'
import { cn } from '@/lib/utils/cn'

export function Breadcrumb() {
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(Boolean)
  const { getModuleProgress, getWeekProgress, getDayProgress } = useLearningStore()
  
  // Extract IDs from path
  const moduleId = pathSegments[1] // After 'learning'
  const weekId = pathSegments[2]
  const dayId = pathSegments[3]
  
  // Find the actual data
  const module = curriculumData.modules.find(m => m.id === moduleId)
  const week = module?.weeks.find(w => w.id === weekId)
  const day = week?.days.find(d => d.id === dayId)
  
  // Get progress for each level
  const moduleProgress = module ? getModuleProgress(module.id) : 0
  const weekProgress = week ? getWeekProgress(week.id) : 0
  const dayProgress = day ? getDayProgress(day.id) : { completionPercentage: 0 }
  
  // Build breadcrumb items with progress
  const items: Array<{
    label: string
    fullTitle?: string
    href: string
    icon: React.ElementType | null
    progress?: number
  }> = [
    {
      label: 'Learning Path',
      fullTitle: 'Back to Learning Overview',
      href: '/learning',
      icon: Home
    }
  ]
  
  if (module) {
    const moduleNumber = module.id.split('-')[1]
    items.push({
      label: `Module ${moduleNumber}`,
      fullTitle: module.title,
      href: `/learning/${module.id}`,
      icon: null,
      progress: moduleProgress
    })
  }
  
  if (week) {
    const weekNumber = week.id.split('-')[1]
    items.push({
      label: `Week ${weekNumber}`,
      fullTitle: week.title,
      href: `/learning/${moduleId}/${week.id}`,
      icon: null,
      progress: weekProgress
    })
  }
  
  if (day) {
    const dayNumber = day.id.split('-')[1]
    items.push({
      label: `Day ${dayNumber}`,
      fullTitle: day.title,
      href: `/learning/${moduleId}/${weekId}/${day.id}`,
      icon: null,
      progress: dayProgress.completionPercentage
    })
  }
  
  // Helper function to get progress color
  const getProgressColor = (progress?: number) => {
    if (!progress && progress !== 0) return ''
    if (progress === 100) return 'text-blox-success bg-blox-success/20'
    if (progress > 0) return 'text-blox-warning bg-blox-warning/20'
    return 'text-blox-off-white bg-blox-glass-bg'
  }

  return (
    <div className="flex items-center space-x-2 text-sm bg-blox-very-dark-blue/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-blox-glass-border">
      {items.map((item, index) => {
        const Icon = item.icon
        const isLast = index === items.length - 1
        
        return (
          <div key={item.href} className="flex items-center space-x-2">
            {index > 0 && (
              <ChevronRight className="h-3 w-3 text-blox-medium-blue-gray" />
            )}
            
            {isLast ? (
              <div className="flex items-center gap-2" title={item.fullTitle}>
                <span className="text-blox-white font-medium flex items-center gap-1">
                  {Icon && <Icon className="h-3 w-3" />}
                  {item.label}
                </span>
                {item.progress !== undefined && (
                  <span className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded-full",
                    getProgressColor(item.progress)
                  )}>
                    {item.progress}%
                  </span>
                )}
              </div>
            ) : (
              <Link 
                href={item.href}
                className="group flex items-center gap-2"
                title={item.fullTitle}
              >
                <span className="text-blox-off-white hover:text-blox-teal transition-colors flex items-center gap-1">
                  {Icon && <Icon className="h-3 w-3" />}
                  {item.label}
                </span>
                {item.progress !== undefined && (
                  <span className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded-full transition-all duration-200 group-hover:scale-110",
                    getProgressColor(item.progress)
                  )}>
                    {item.progress}%
                  </span>
                )}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}