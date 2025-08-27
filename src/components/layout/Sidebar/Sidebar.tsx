'use client'

import { useState, useEffect } from 'react'
import { Menu, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { APP_CONFIG } from '@/lib/config/constants'
import { UserProgress } from './UserProgress'
import { SidebarNav } from './SidebarNav'

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before showing client-specific content
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-collapse on mobile when clicking outside or navigating
  useEffect(() => {
    if (!mounted) return
    
    const handleEvent = (e: Event) => {
      if (e.type === 'resize' && window.innerWidth >= 1024 && isMobileOpen) {
        setIsMobileOpen(false)
      } else if (e.type === 'keydown') {
        const keyEvent = e as KeyboardEvent
        if (keyEvent.key === 'Escape' && isMobileOpen) {
          setIsMobileOpen(false)
        }
      }
    }

    if (isMobileOpen) {
      window.addEventListener('resize', handleEvent)
      document.addEventListener('keydown', handleEvent)
      
      return () => {
        window.removeEventListener('resize', handleEvent)
        document.removeEventListener('keydown', handleEvent)
      }
    }
  }, [isMobileOpen, mounted])

  // Touch gesture support for mobile
  useEffect(() => {
    if (!mounted) return
    let startX: number
    let startY: number

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return

      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const diffX = startX - endX
      const diffY = startY - endY

      // Only handle horizontal swipes (ignore vertical)
      if (Math.abs(diffX) > Math.abs(diffY)) {
        const threshold = 100
        
        // Swipe right to open sidebar (from left edge)
        if (diffX < -threshold && startX < 50 && !isMobileOpen && window.innerWidth < 1024) {
          setIsMobileOpen(true)
        }
        // Swipe left to close sidebar
        else if (diffX > threshold && isMobileOpen && window.innerWidth < 1024) {
          setIsMobileOpen(false)
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobileOpen, mounted])

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass-card rounded-lg shadow-teal-glow transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
      >
        {isMobileOpen ? <X className="h-6 w-6 text-blox-teal" /> : <Menu className="h-6 w-6 text-blox-teal" />}
      </button>

      {/* Sidebar Container - Removed glass-blur for better viewport clarity */}
      <div className={cn(
        "flex flex-col h-full bg-blox-very-dark-blue border-r border-blox-glass-border transition-all duration-500 ease-in-out overflow-hidden",
        "lg:static lg:translate-x-0",
        "fixed lg:relative inset-y-0 left-0 z-40 w-64 lg:w-full",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Brand Section */}
        <div className="p-4 border-b border-blox-glass-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-teal-gradient rounded-lg shadow-teal-glow flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blox-success rounded-full border-2 border-blox-very-dark-blue animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-blox-white">
                {APP_CONFIG.name}
              </h1>
              <p className="text-xs text-blox-light-blue-gray">Learning Hub</p>
            </div>
          </div>
        </div>

        {/* User Progress Section */}
        <div className="p-4 border-b border-blox-glass-border">
          <UserProgress />
        </div>

        {/* Main scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Navigation */}
          <SidebarNav />
        </div>
      </div>

      {/* Mobile Overlay */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ease-in-out",
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileOpen(false)}
      />
    </>
  )
}