'use client'

import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="h-16 bg-blox-second-dark-blue border-b border-blox-medium-blue-gray flex items-center justify-between px-6">
      {/* Search Bar */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blox-medium-blue-gray" />
          <input
            type="text"
            placeholder="Search courses, teams, or help..."
            className="w-full bg-blox-black-blue border border-blox-medium-blue-gray rounded-lg pl-10 pr-4 py-2 text-blox-white placeholder-blox-medium-blue-gray focus:outline-none focus:border-blox-teal focus:ring-1 focus:ring-blox-teal"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-blox-teal rounded-full text-xs flex items-center justify-center text-white">
            3
          </span>
        </Button>

        {/* User Menu */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-blox-white">BloxBuilder123</p>
            <p className="text-xs text-blox-off-white">12 day streak 🔥</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-r from-blox-teal to-blox-teal-dark rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">AB</span>
          </div>
        </div>
      </div>
    </header>
  )
}