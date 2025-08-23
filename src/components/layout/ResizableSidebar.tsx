'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

interface ResizableSidebarProps {
  children: ReactNode
  mainContent: ReactNode
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

export function ResizableSidebar({
  children,
  mainContent,
  defaultSize = 20,
  minSize = 15,
  maxSize = 35
}: ResizableSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sidebarSize, setSidebarSize] = useState(defaultSize)
  const [isClient, setIsClient] = useState(false)

  // Ensure we only access localStorage on the client
  useEffect(() => {
    setIsClient(true)
    const savedSize = localStorage.getItem('sidebar-size')
    if (savedSize) {
      const size = parseFloat(savedSize)
      if (size >= minSize && size <= maxSize) {
        setSidebarSize(size)
      }
    }
  }, [minSize, maxSize])

  // Save sidebar size to localStorage
  const handleSizeChange = (sizes: number[]) => {
    const newSize = sizes[0]
    setSidebarSize(newSize)
    localStorage.setItem('sidebar-size', newSize.toString())
    
    // Auto-collapse if size is very small
    setIsCollapsed(newSize < minSize + 2)
  }

  return (
    <PanelGroup
      direction="horizontal"
      onLayout={handleSizeChange}
      className="h-full flex"
    >
      {/* Sidebar Panel */}
      <Panel
        defaultSize={isClient ? sidebarSize : defaultSize}
        minSize={minSize}
        maxSize={maxSize}
        collapsible={true}
        className={`transition-all duration-200 ${
          isCollapsed ? 'opacity-90' : 'opacity-100'
        }`}
      >
        <div className="h-full overflow-hidden">
          {children}
        </div>
      </Panel>

      {/* Resize Handle */}
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

      {/* Main Content Panel */}
      <Panel defaultSize={100 - (isClient ? sidebarSize : defaultSize)} minSize={50}>
        <div className="h-full overflow-hidden">
          {mainContent}
        </div>
      </Panel>
    </PanelGroup>
  )
}