'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MAIN_NAV, SECONDARY_NAV } from '@/lib/config/navigation'
import { cn } from '@/lib/utils/cn'
import { APP_CONFIG } from '@/lib/config/constants'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-blox-very-dark-blue border-r border-blox-medium-blue-gray">
      {/* Logo */}
      <div className="p-6 border-b border-blox-medium-blue-gray">
        <h1 className="text-xl font-bold gradient-text">
          {APP_CONFIG.name}
        </h1>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {MAIN_NAV.map((item) => {
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

      {/* User Info */}
      <div className="p-4 border-t border-blox-medium-blue-gray">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blox-teal to-blox-teal-dark rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">AB</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blox-white truncate">
              BloxBuilder123
            </p>
            <p className="text-xs text-blox-off-white truncate">
              Level 2 Builder
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}