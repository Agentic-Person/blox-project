'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { MAIN_NAV, SECONDARY_NAV } from '@/lib/config/navigation'
import { LearningPathTree } from '@/components/learning/LearningPathTree'
import { cn } from '@/lib/utils/cn'
import { ChevronDown, ChevronRight } from 'lucide-react'

export function SidebarNav() {
  const pathname = usePathname()
  const isLearningPath = pathname.includes('/learning')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']))
  
  // Parse learning path segments
  const pathSegments = pathname.split('/').filter(Boolean)
  const currentModuleId = isLearningPath ? pathSegments[1] : undefined
  const currentWeekId = isLearningPath ? pathSegments[2] : undefined  
  const currentDayId = isLearningPath ? pathSegments[3] : undefined

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  return (
    <nav className="p-4 space-y-4">
      {/* Main Section */}
      <div>
        <button
          onClick={() => toggleSection('main')}
          className="flex items-center justify-between w-full px-2 py-1 mb-2 text-xs font-semibold text-blox-off-white uppercase tracking-wider hover:text-blox-white transition-all duration-200 ease-in-out"
        >
          <span>Main Menu</span>
          {expandedSections.has('main') ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        
        <div className={cn(
          "space-y-1 transition-all duration-400 ease-in-out",
          expandedSections.has('main') ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
        )}>
          {MAIN_NAV.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            // Special handling for Learning Path
            if (item.href === '/learning') {
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "nav-item w-full text-left flex items-center",
                      isActive && "nav-item-active"
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Learning Path
                    {item.badge && (
                      <span className="ml-auto xp-badge">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  
                  {/* Navigation Tree for Learning Path */}
                  {isLearningPath && (
                    <div className="mt-3 ml-2 pl-4 border-l-2 border-blox-medium-blue-gray">
                      <LearningPathTree 
                        currentModuleId={currentModuleId}
                        currentWeekId={currentWeekId}
                        currentDayId={currentDayId}
                      />
                    </div>
                  )}
                </div>
              )
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-item w-full text-left flex items-center",
                  isActive && "nav-item-active"
                )}
              >
                <Icon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                {item.title}
                {item.badge && (
                  <span className="ml-auto xp-badge">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Secondary Navigation */}
      <div className="pt-4 border-t border-blox-glass-border">
        <button
          onClick={() => toggleSection('secondary')}
          className="flex items-center justify-between w-full px-2 py-1 mb-2 text-xs font-semibold text-blox-off-white uppercase tracking-wider hover:text-blox-white transition-all duration-200 ease-in-out"
        >
          <span>Resources</span>
          {expandedSections.has('secondary') ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        
        <div className={cn(
          "space-y-1 transition-all duration-400 ease-in-out",
          expandedSections.has('secondary') ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
        )}>
          {SECONDARY_NAV.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-item w-full text-left flex items-center",
                  isActive && "nav-item-active"
                )}
              >
                <Icon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                {item.title}
              </Link>
            )
          })}
        </div>
      </div>

    </nav>
  )
}