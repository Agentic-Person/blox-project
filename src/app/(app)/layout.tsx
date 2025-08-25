'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar/Sidebar'
import { Header } from '@/components/layout/Header/Header'
import { ResizableSidebar, ResizableSidebarHandle } from '@/components/layout/ResizableSidebar'
import { cn } from '@/lib/utils/cn'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [viewportHeight, setViewportHeight] = useState('100vh')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Always start expanded
  const sidebarRef = useRef<ResizableSidebarHandle>(null)
  
  // Check if we're on a learning page
  const isLearningPage = pathname?.includes('/learning')

  useEffect(() => {
    // Handle viewport resize
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1200) // Enhanced tablet range
      
      // Enhanced responsive breakpoints
      document.documentElement.style.setProperty('--screen-width', `${width}px`)
      
      // Handle mobile viewport height (accounts for browser chrome)
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
      setViewportHeight(`${window.innerHeight}px`)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  // Removed auto-collapse on learning pages - sidebar stays open for navigation
  // User can manually collapse with Cmd/Ctrl+B if needed

  // Keyboard shortcut for toggling sidebar
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        if (sidebarRef.current) {
          sidebarRef.current.toggle()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Mobile layout (no resizable sidebar)
  if (isMobile) {
    return (
      <div 
        className="flex flex-col bg-blox-black-blue"
        style={{ height: viewportHeight }}
      >
        <Sidebar />
        <div className="flex flex-col flex-1 w-full">
          <Header isLearningPage={isLearningPage} onBackToDashboard={() => {}} />
          <main className={cn(
            "flex-1 overflow-auto",
            !isLearningPage && "px-4 py-4"
          )}>
            <div className="max-w-full mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Tablet layout (fixed sidebar)
  if (isTablet) {
    return (
      <div 
        className="flex bg-blox-black-blue"
        style={{ height: viewportHeight }}
      >
        <div className="w-64 flex-shrink-0 transition-all duration-300 ease-in-out">
          <Sidebar />
        </div>
        <div className="flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out">
          <Header isLearningPage={isLearningPage} onBackToDashboard={() => {}} />
          <main className={cn(
            "flex-1 overflow-auto",
            !isLearningPage && "px-4 xl:px-6 py-4 xl:py-6"
          )}>
            <div className={cn(
              !isLearningPage && "max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto"
            )}>
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Desktop layout (resizable sidebar)
  return (
    <div 
      className="h-screen bg-blox-black-blue"
      style={{ height: viewportHeight }}
    >
      <ResizableSidebar
        ref={sidebarRef}
        children={<Sidebar />}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        showDragHandle={isLearningPage}
        mainContent={
          <div className="flex flex-col h-full">
            <Header 
              isLearningPage={isLearningPage} 
              onBackToDashboard={() => {
                setSidebarCollapsed(false)
                if (sidebarRef.current) {
                  sidebarRef.current.expand()
                }
              }} 
            />
            <main className="flex-1 overflow-hidden">
              <div className={cn(
                "h-full overflow-y-auto transition-all duration-300 ease-in-out",
                !isLearningPage && "px-6 xl:px-8 py-4 xl:py-6",
                !isLearningPage && "max-w-6xl xl:max-w-7xl 2xl:max-w-[1920px] mx-auto"
              )}>
                {children}
              </div>
            </main>
          </div>
        }
      />
    </div>
  )
}