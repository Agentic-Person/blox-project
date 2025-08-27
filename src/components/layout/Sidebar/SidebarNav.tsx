'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { MAIN_NAV, SECONDARY_NAV } from '@/lib/config/navigation'
import { EnhancedLearningNav } from './EnhancedLearningNav'
import { UpgradeCard } from './UpgradeCard'
import { cn } from '@/lib/utils/cn'
import { ChevronDown, ChevronRight, Star } from 'lucide-react'

export function SidebarNav() {
  const pathname = usePathname()
  const isLearningPath = pathname.includes('/learning')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']))
  const [showLearningNav, setShowLearningNav] = useState(isLearningPath)
  
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

  const toggleLearningNav = () => {
    setShowLearningNav(prev => !prev)
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
            
            // Special handling for Learning Path - both toggle and navigation
            if (item.href === '/learning') {
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={toggleLearningNav}
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
                    <ChevronDown className={cn(
                      "ml-2 h-3 w-3 transition-transform",
                      showLearningNav ? "rotate-180" : ""
                    )} />
                  </Link>
                  
                  {/* Enhanced Navigation for Learning Path - Shows when clicked */}
                  {showLearningNav && (
                    <div className="mt-3">
                      <EnhancedLearningNav 
                        currentModuleId={currentModuleId}
                        currentWeekId={currentWeekId}
                        currentDayId={currentDayId}
                        showAllModules={true}
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
                  "nav-item w-full text-left flex items-center relative",
                  isActive && "nav-item-active"
                )}
              >
                <Icon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                {item.title}
                {/* Pro Feature Badge for Blox Wizard */}
                {item.href === '/ai-assistant' && (
                  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-blox-golden-yellow text-blox-black-blue rounded">
                    <Star className="h-2.5 w-2.5" />
                    Pro
                  </span>
                )}
                {item.badge && item.href !== '/ai-assistant' && (
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

      {/* Upgrade Card - Integrated into navigation flow */}
      <div className="pt-4">
        <UpgradeCard />
      </div>

    </nav>
  )
}