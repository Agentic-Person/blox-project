'use client'

import { ReactNode, useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ResizableSidebarProps {
  children: ReactNode
  mainContent: ReactNode
  defaultSize?: number
  minSize?: number
  maxSize?: number
  collapsed?: boolean
  collapsedSize?: number
  onCollapse?: (collapsed: boolean) => void
  showDragHandle?: boolean
}

export interface ResizableSidebarHandle {
  collapse: () => void
  expand: () => void
  toggle: () => void
}

export const ResizableSidebar = forwardRef<ResizableSidebarHandle, ResizableSidebarProps>(({
  children,
  mainContent,
  defaultSize = 20,
  minSize = 15,
  maxSize = 35,
  collapsed: controlledCollapsed,
  collapsedSize = 0,
  onCollapse,
  showDragHandle = false
}, ref) => {
  const [isCollapsed, setIsCollapsed] = useState(controlledCollapsed || false)
  const [sidebarSize, setSidebarSize] = useState(defaultSize)
  const [isClient, setIsClient] = useState(false)
  const [previousSize, setPreviousSize] = useState(defaultSize)
  const panelRef = useRef<any>(null)

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    collapse: () => {
      if (panelRef.current) {
        setPreviousSize(sidebarSize)
        panelRef.current.collapse()
        setIsCollapsed(true)
        onCollapse?.(true)
      }
    },
    expand: () => {
      if (panelRef.current) {
        panelRef.current.expand()
        setIsCollapsed(false)
        onCollapse?.(false)
      }
    },
    toggle: () => {
      if (isCollapsed) {
        if (panelRef.current) {
          panelRef.current.expand()
          setIsCollapsed(false)
          onCollapse?.(false)
        }
      } else {
        if (panelRef.current) {
          setPreviousSize(sidebarSize)
          panelRef.current.collapse()
          setIsCollapsed(true)
          onCollapse?.(true)
        }
      }
    }
  }), [isCollapsed, sidebarSize, onCollapse])

  // Ensure we only access localStorage on the client
  useEffect(() => {
    setIsClient(true)
    const savedSize = localStorage.getItem('sidebar-size')
    const savedCollapsed = localStorage.getItem('sidebar-collapsed')
    
    if (savedSize) {
      const size = parseFloat(savedSize)
      if (size >= minSize && size <= maxSize) {
        setSidebarSize(size)
        setPreviousSize(size)
      }
    }
    
    if (savedCollapsed && controlledCollapsed === undefined) {
      setIsCollapsed(savedCollapsed === 'true')
    }
  }, [minSize, maxSize, controlledCollapsed])

  // Sync controlled collapsed state
  useEffect(() => {
    if (controlledCollapsed !== undefined) {
      setIsCollapsed(controlledCollapsed)
      if (controlledCollapsed && panelRef.current) {
        panelRef.current.collapse()
      } else if (!controlledCollapsed && panelRef.current) {
        panelRef.current.expand()
      }
    }
  }, [controlledCollapsed])

  // Save sidebar size to localStorage
  const handleSizeChange = (sizes: number[]) => {
    const newSize = sizes[0]
    setSidebarSize(newSize)
    
    // Only save non-collapsed sizes
    if (newSize > collapsedSize + 1) {
      localStorage.setItem('sidebar-size', newSize.toString())
      setPreviousSize(newSize)
    }
    
    // Auto-collapse if size is very small
    const nowCollapsed = newSize <= collapsedSize + 1
    if (nowCollapsed !== isCollapsed) {
      setIsCollapsed(nowCollapsed)
      localStorage.setItem('sidebar-collapsed', nowCollapsed.toString())
      onCollapse?.(nowCollapsed)
    }
  }

  // Handle drag to reveal sidebar
  const handleDragReveal = () => {
    if (isCollapsed && panelRef.current) {
      panelRef.current.expand()
      setIsCollapsed(false)
      localStorage.setItem('sidebar-collapsed', 'false')
      onCollapse?.(false)
    }
  }

  return (
    <div className="h-full relative">
      <PanelGroup
        direction="horizontal"
        onLayout={handleSizeChange}
        className="h-full flex"
      >
        {/* Sidebar Panel */}
        <Panel
          ref={panelRef}
          defaultSize={isClient ? (isCollapsed ? collapsedSize : sidebarSize) : defaultSize}
          minSize={collapsedSize}
          maxSize={maxSize}
          collapsible={true}
          collapsedSize={collapsedSize}
          className={`transition-all duration-300 ${
            isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="h-full overflow-hidden">
            {children}
          </div>
        </Panel>

        {/* Resize Handle */}
        {!isCollapsed && (
          <PanelResizeHandle className="group relative w-1 bg-blox-medium-blue-gray hover:bg-blox-teal transition-colors duration-200 cursor-col-resize">
            <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
              <div className="h-8 w-1 bg-blox-medium-blue-gray group-hover:bg-blox-teal rounded-full transition-colors duration-200" />
            </div>
            
            {/* Hover indicator */}
            <div className="absolute inset-y-0 -left-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="h-full flex items-center justify-center">
                <div className="h-12 w-1 bg-blox-teal/30 rounded-full" />
              </div>
            </div>
          </PanelResizeHandle>
        )}

        {/* Main Content Panel */}
        <Panel defaultSize={100 - (isClient ? (isCollapsed ? collapsedSize : sidebarSize) : defaultSize)} minSize={50}>
          <div className="h-full overflow-hidden relative">
            {/* Drag Handle for Revealing Sidebar */}
            <AnimatePresence>
              {showDragHandle && isCollapsed && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-50"
                >
                  <button
                    onClick={handleDragReveal}
                    className="group flex items-center justify-center w-6 h-24 bg-blox-teal/10 hover:bg-blox-teal/20 border-r-2 border-blox-teal/50 rounded-r-lg transition-all duration-200 hover:w-8"
                    aria-label="Show sidebar"
                  >
                    <ChevronRight className="w-4 h-4 text-blox-teal group-hover:text-blox-white transition-colors" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {mainContent}
          </div>
        </Panel>
      </PanelGroup>

      {/* Floating Expand Button */}
      <AnimatePresence>
        {isCollapsed && !showDragHandle && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleDragReveal}
            className="absolute left-4 bottom-4 z-50 w-10 h-10 bg-blox-teal/20 hover:bg-blox-teal/30 backdrop-blur-md border border-blox-teal/50 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            aria-label="Show sidebar"
          >
            <ChevronRight className="w-5 h-5 text-blox-teal" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
})

ResizableSidebar.displayName = 'ResizableSidebar'