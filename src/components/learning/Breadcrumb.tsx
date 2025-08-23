'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import curriculumData from '@/data/curriculum.json'

export function Breadcrumb() {
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(Boolean)
  
  // Extract IDs from path
  const moduleId = pathSegments[1] // After 'learning'
  const weekId = pathSegments[2]
  const dayId = pathSegments[3]
  
  // Find the actual data
  const module = curriculumData.modules.find(m => m.id === moduleId)
  const week = module?.weeks.find(w => w.id === weekId)
  const day = week?.days.find(d => d.id === dayId)
  
  // Build breadcrumb items
  const items = [
    {
      label: 'Learning Path',
      href: '/learning',
      icon: Home
    }
  ]
  
  if (module) {
    const moduleNumber = module.id.split('-')[1]
    items.push({
      label: `Module ${moduleNumber}`,
      href: `/learning/${module.id}`,
      icon: null
    })
  }
  
  if (week) {
    const weekNumber = week.id.split('-')[1]
    items.push({
      label: `Week ${weekNumber}`,
      href: `/learning/${moduleId}/${week.id}`,
      icon: null
    })
  }
  
  if (day) {
    const dayNumber = day.id.split('-')[1]
    items.push({
      label: `Day ${dayNumber}`,
      href: `/learning/${moduleId}/${weekId}/${day.id}`,
      icon: null
    })
  }
  
  return (
    <div className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => {
        const Icon = item.icon
        const isLast = index === items.length - 1
        
        return (
          <div key={item.href} className="flex items-center space-x-2">
            {index > 0 && (
              <ChevronRight className="h-3 w-3 text-blox-medium-blue-gray" />
            )}
            
            {isLast ? (
              <span className="text-blox-white font-medium flex items-center gap-1">
                {Icon && <Icon className="h-3 w-3" />}
                {item.label}
              </span>
            ) : (
              <Link 
                href={item.href}
                className="text-blox-off-white hover:text-blox-teal transition-colors flex items-center gap-1"
              >
                {Icon && <Icon className="h-3 w-3" />}
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}