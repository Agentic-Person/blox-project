'use client'

import { useState } from 'react'
import { Menu, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { APP_CONFIG } from '@/lib/config/constants'
import { UserProgress } from './UserProgress'
import { SidebarNav } from './SidebarNav'
import { UpgradeCard } from './UpgradeCard'
import { UserInfo } from './UserInfo'

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass-card rounded-lg shadow-teal-glow"
      >
        {isMobileOpen ? <X className="h-6 w-6 text-blox-teal" /> : <Menu className="h-6 w-6 text-blox-teal" />}
      </button>

      {/* Sidebar Container */}
      <div className={cn(
        "flex flex-col h-full bg-blox-very-dark-blue/95 glass-blur border-r border-blox-glass-border transition-transform duration-300 overflow-hidden",
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

        {/* Navigation */}
        <SidebarNav />

        {/* Upgrade to Pro */}
        <div className="p-4">
          <UpgradeCard />
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-blox-glass-border">
          <UserInfo />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}