'use client'

import { Clock, Zap, User, LogOut, Gamepad2, Coins, Settings, UserCheck, Video, Flame, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/providers'
import { useLearningStore } from '@/store/learningStore'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export function Header() {
  const { user, signOut } = useAuth()
  const { totalHoursWatched, totalXP } = useLearningStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  
  // Mock BLOX token balance for now (will be fetched from blockchain later)
  const bloxBalance = 450
  // Mock stats for videos watched and day streak
  const videosWatched = 39
  const dayStreak = 7

  useEffect(() => {
    setIsMounted(true)
  }, [])

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

  const handleProfileClick = () => {
    router.push('/profile')
    setShowDropdown(false)
  }

  const handleEditProfileClick = () => {
    router.push('/profile')
    setShowDropdown(false)
    // You could add a query parameter to auto-open the edit modal
    // router.push('/profile?edit=true')
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-blox-second-dark-blue border-b border-blox-glass-border">
      <div className="flex items-center gap-3 transition-all duration-300 ease-in-out relative">
        <Gamepad2 className={`w-6 h-6 text-blox-teal ${isMounted ? 'animate-float-left' : ''}`} />
        <h1 className="text-xl font-bold text-blox-white flex items-center gap-2">
          <span>Welcome back, Game Developer!</span>
        </h1>
        <Gamepad2 className={`w-6 h-6 text-blox-purple ${isMounted ? 'animate-float-right' : ''}`} />
        
        {/* Sparkle effects */}
        {isMounted && (
          <div className="absolute inset-0 pointer-events-none">
            <Sparkles className="w-3 h-3 text-blox-teal absolute top-0 left-8 animate-sparkle-1" />
            <Sparkles className="w-2 h-2 text-blox-purple absolute bottom-0 right-8 animate-sparkle-2" />
            <Sparkles className="w-2 h-2 text-blox-xp absolute top-1 right-16 animate-sparkle-3" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blox-very-dark-blue/80 backdrop-blur-md border border-blox-teal/30 hover:bg-blox-teal/10 hover:border-blox-teal/50 transition-all duration-200">
            <Video className="w-4 h-4 text-blox-teal" />
            <span className="text-sm text-blox-off-white font-medium">{videosWatched}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blox-very-dark-blue/80 backdrop-blur-md border border-blox-streak/30 hover:bg-blox-streak/10 hover:border-blox-streak/50 transition-all duration-200">
            <Flame className="w-4 h-4 text-blox-streak" />
            <span className="text-sm text-blox-off-white font-medium">{dayStreak} day</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blox-very-dark-blue/80 backdrop-blur-md border border-blox-xp/30 hover:bg-blox-xp/10 hover:border-blox-xp/50 transition-all duration-200">
            <Zap className="w-4 h-4 text-blox-xp" />
            <span className="text-sm text-blox-xp font-medium">{totalXP} XP</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blox-very-dark-blue/80 backdrop-blur-md border border-blox-success/30 hover:bg-blox-success/10 hover:border-blox-success/50 transition-all duration-200">
            <Coins className="w-4 h-4 text-blox-success" />
            <span className="text-sm text-blox-success font-bold">{bloxBalance} BLOX</span>
          </div>
        </div>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative group"
          >
            {/* Animated gradient border ring */}
            <div className={`absolute -inset-1 bg-gradient-to-r from-blox-teal via-blox-purple to-blox-success rounded-full ${isMounted ? 'animate-gradient-rotate' : ''} opacity-75 group-hover:opacity-100 blur-sm transition-opacity duration-300`} />
            
            {/* Avatar container */}
            <div className="relative flex items-center gap-2 p-1 rounded-full bg-blox-second-dark-blue transition-transform duration-300 group-hover:scale-105">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username || 'User'} 
                  className="w-10 h-10 rounded-full border-2 border-blox-glass-border"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blox-teal to-blox-purple rounded-full flex items-center justify-center shadow-teal-glow">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              
              {/* Online status indicator */}
              <div className="absolute -bottom-0 -right-0 w-3 h-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-blox-success opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blox-success border-2 border-blox-second-dark-blue" />
              </div>
            </div>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-blox-second-dark-blue border border-blox-glass-border rounded-lg shadow-xl z-50">
              {/* User Info */}
              <div className="p-3 border-b border-blox-glass-border">
                <p className="text-sm font-medium text-blox-white">{user?.username || 'User'}</p>
                <p className="text-xs text-blox-medium-blue-gray">{user?.email}</p>
              </div>
              
              {/* Profile Actions */}
              <div className="p-1">
                <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blox-off-white hover:bg-blox-glass-bg transition-colors rounded-md"
                >
                  <UserCheck className="h-4 w-4" />
                  View Profile
                </button>
                <button
                  onClick={handleEditProfileClick}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blox-off-white hover:bg-blox-glass-bg transition-colors rounded-md"
                >
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </button>
              </div>
              
              {/* Sign Out */}
              <div className="p-1 border-t border-blox-glass-border">
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blox-off-white hover:bg-blox-glass-bg transition-colors rounded-md"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}