'use client'

import { useState, useEffect } from 'react'
import { useWhiteboardStore } from '@/store/whiteboardStore'
import WhiteboardCanvas from './WhiteboardCanvas'
import BoardManager from './BoardManager'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Upload, 
  Maximize2, 
  Minimize2,
  Save,
  Menu
} from 'lucide-react'

export default function WhiteboardPage() {
  const { activeBoard, createBoard, setActiveBoard } = useWhiteboardStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [showSaveNotification, setShowSaveNotification] = useState(false)

  // Create initial board if none exists
  useEffect(() => {
    if (!activeBoard) {
      const boards = useWhiteboardStore.getState().listBoards()
      if (boards.length === 0) {
        const newBoardId = createBoard('My First Mind Map')
        setActiveBoard(newBoardId)
      } else {
        setActiveBoard(boards[0].id)
      }
    }
  }, [activeBoard, createBoard, setActiveBoard])

  const handleExport = () => {
    // Export functionality - to be implemented
    alert('Export feature coming soon!')
  }

  const handleImport = () => {
    // Import functionality - to be implemented
    alert('Import feature coming soon!')
  }

  const handleManualSave = () => {
    setShowSaveNotification(true)
    setTimeout(() => setShowSaveNotification(false), 2000)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blox-very-dark-blue to-blox-second-dark-blue">
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'w-80' : 'w-0'
      } transition-all duration-300 overflow-hidden border-r border-blox-glass-border bg-blox-black-blue/50 backdrop-blur-sm`}>
        {sidebarOpen && (
          <BoardManager 
            onBoardSelect={(boardId) => setActiveBoard(boardId)}
            className="h-full"
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-blox-glass-border bg-blox-glass-teal backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-blox-off-white hover:text-blox-white"
            >
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            <h1 className="text-xl font-semibold text-blox-white">
              Visual Mind Mapping
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleManualSave}
              className="text-blox-off-white hover:text-blox-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleExport}
              className="text-blox-off-white hover:text-blox-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleImport}
              className="text-blox-off-white hover:text-blox-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-blox-off-white hover:text-blox-white"
            >
              {fullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          {activeBoard ? (
            <WhiteboardCanvas 
              boardId={activeBoard}
              onSave={() => {
                setShowSaveNotification(true)
                setTimeout(() => setShowSaveNotification(false), 2000)
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-blox-white mb-4">
                  No Board Selected
                </h2>
                <p className="text-blox-off-white mb-6">
                  Create or select a board to start mind mapping
                </p>
                <Button
                  onClick={() => {
                    const newBoardId = createBoard('New Mind Map')
                    setActiveBoard(newBoardId)
                  }}
                  className="bg-blox-teal hover:bg-blox-teal-dark"
                >
                  Create New Board
                </Button>
              </div>
            </div>
          )}

          {/* Save Notification */}
          {showSaveNotification && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blox-success/90 backdrop-blur-sm px-4 py-2 rounded-lg text-white animate-fade-in">
              ✓ Board saved successfully
            </div>
          )}
        </div>
      </div>
    </div>
  )
}