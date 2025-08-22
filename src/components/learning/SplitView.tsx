'use client'

import { ReactNode } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

interface SplitViewProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  defaultLeftSize?: number
  minLeftSize?: number
  maxLeftSize?: number
}

export function SplitView({
  leftPanel,
  rightPanel,
  defaultLeftSize = 30,
  minLeftSize = 25,
  maxLeftSize = 45
}: SplitViewProps) {
  return (
    <div className="h-full bg-blox-very-dark-blue">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - 30% */}
        <Panel
          defaultSize={defaultLeftSize}
          minSize={minLeftSize}
          maxSize={maxLeftSize}
          className="bg-blox-very-dark-blue border-r border-blox-medium-blue-gray"
        >
          <div className="h-full overflow-auto">
            {leftPanel}
          </div>
        </Panel>

        {/* Vertical Resize Handle */}
        <PanelResizeHandle className="group relative w-1 bg-blox-medium-blue-gray hover:bg-blox-teal transition-colors duration-200">
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

        {/* Right Panel - 70% */}
        <Panel
          defaultSize={100 - defaultLeftSize}
          minSize={50}
          className="bg-blox-very-dark-blue"
        >
          <div className="h-full overflow-auto">
            {rightPanel}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}