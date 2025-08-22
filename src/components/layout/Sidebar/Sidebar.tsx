'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MAIN_NAV, SECONDARY_NAV } from '@/lib/config/navigation'
import { NavigationTree } from '@/components/layout/NavigationTree'
import { cn } from '@/lib/utils/cn'
import { APP_CONFIG } from '@/lib/config/constants'
import { Trophy } from 'lucide-react'
import * as Progress from '@radix-ui/react-progress'

export function Sidebar() {
  const pathname = usePathname()
  const isLearningPath = pathname.includes('/learning')

  return (
    <div className="flex flex-col h-full bg-blox-very-dark-blue border-r border-blox-medium-blue-gray">
      {/* Logo */}
      <div className="p-6 border-b border-blox-medium-blue-gray">
        <h1 className="text-xl font-bold gradient-text">
          {APP_CONFIG.name}
        </h1>
        <p className="text-xs text-blox-off-white mt-1">Learning Hub</p>
      </div>

      {/* Level Progress */}
      <div className="p-4 border-b border-blox-medium-blue-gray">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blox-white">Level Progress</span>
          <Trophy className="h-4 w-4 text-blox-teal" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blox-white">Level 3</span>
            <span className="text-xs text-blox-off-white">325 / 500 XP</span>
          </div>
          
          <Progress.Root 
            className="relative overflow-hidden bg-blox-second-dark-blue rounded-full w-full h-2"
            value={65}
          >
            <Progress.Indicator
              className="bg-gradient-to-r from-blox-teal to-blox-teal-light h-full w-full flex-1 transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${100 - 65}%)` }}
            />
          </Progress.Root>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-auto p-4 space-y-2">
        <div className="space-y-1">
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
                      "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blox-teal text-white shadow-lg shadow-blox-teal/20"
                        : "text-blox-off-white hover:bg-blox-second-dark-blue hover:text-white"
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    Learning Path
                    {item.badge && (
                      <span className="ml-auto bg-blox-teal text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  
                  {/* Navigation Tree for Learning Path */}
                  {isLearningPath && (
                    <div className="mt-3 ml-2">
                      <NavigationTree />
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
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blox-teal text-white shadow-lg shadow-blox-teal/20"
                    : "text-blox-off-white hover:bg-blox-second-dark-blue hover:text-white"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.title}
                {item.badge && (
                  <span className="ml-auto bg-blox-teal text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Secondary Navigation */}
        <div className="pt-6 mt-6 border-t border-blox-medium-blue-gray space-y-1">
          {SECONDARY_NAV.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blox-teal text-white shadow-lg shadow-blox-teal/20"
                    : "text-blox-off-white hover:bg-blox-second-dark-blue hover:text-white"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Upgrade to Pro */}
      <div className="p-4 border-t border-blox-medium-blue-gray">
        <div className="bg-gradient-to-r from-blox-teal/10 to-blox-purple/10 border border-blox-teal/20 rounded-lg p-4 text-center">
          <div className="text-sm font-semibold text-blox-white mb-1">
            Upgrade to Pro
          </div>
          <div className="text-xs text-blox-off-white mb-3">
            Unlock Blox Chat Buddy - Your AI Learning Assistant
          </div>
          <button className="w-full bg-gradient-to-r from-blox-teal to-blox-purple text-white text-xs font-medium py-2 px-3 rounded-lg hover:opacity-90 transition-opacity">
            Learn More →
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-blox-medium-blue-gray">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blox-teal to-blox-teal-dark rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">BB</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blox-white truncate">
              BloxBuilder123
            </p>
            <p className="text-xs text-blox-off-white truncate">
              Level 3 Builder
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}