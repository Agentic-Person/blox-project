'use client'

import { Clock, Zap, User, LogOut, Gamepad2, Coins } from 'lucide-react'
import { useAuth } from '@/lib/providers'
import { useLearningStore } from '@/store/learningStore'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function Header() {
  const { user, signOut } = useAuth()
  const { totalHoursWatched, totalXP } = useLearningStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  
  // Mock BLOX token balance for now (will be fetched from blockchain later)
  const [bloxBalance] = useState(450)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-blox-second-dark-blue border-b border-blox-glass-border">
      <div className="flex items-center gap-3 transition-all duration-300 ease-in-out">
        <Gamepad2 className="w-6 h-6 text-blox-teal" />
        <h1 className="text-xl font-bold text-blox-white">
          Welcome back, game developer!
        </h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Stats */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-lg">
            <Clock className="w-4 h-4 text-blox-teal" />
            <span className="text-sm text-blox-off-white font-medium">{totalHoursWatched}h</span>
          </div>
          <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-lg">
            <Zap className="w-4 h-4 text-blox-success" />
            <span className="text-sm text-blox-off-white font-medium">{totalXP} XP</span>
          </div>
          <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-lg border border-blox-teal/30">
            <Coins className="w-4 h-4 text-blox-teal" />
            <span className="text-sm text-blox-teal font-bold">{bloxBalance} BLOX</span>
          </div>
        </div>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-blox-glass-bg transition-colors"
          >
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.username || 'User'} 
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-blox-teal rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-blox-second-dark-blue border border-blox-glass-border rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-blox-glass-border">
                <p className="text-sm font-medium text-blox-white">{user?.username || 'User'}</p>
                <p className="text-xs text-blox-medium-blue-gray">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blox-off-white hover:bg-blox-glass-bg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}