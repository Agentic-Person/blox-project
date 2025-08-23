'use client'

import { useState, useEffect, useRef } from 'react'
import { useWhiteboardStore } from '@/store/whiteboardStore'
import WhiteboardCanvas, { WhiteboardCanvasRef } from './WhiteboardCanvas'
import { WhiteboardSidebar } from './WhiteboardSidebar'
import { WhiteboardToolbar } from './WhiteboardToolbar'
import { MarkdownImport } from './MarkdownImport'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  Maximize2, 
  Minimize2,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react'

export default function WhiteboardPage() {
  const { activeBoard, createBoard, setActiveBoard } = useWhiteboardStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [showSaveNotification, setShowSaveNotification] = useState(false)
  const [showMarkdownImport, setShowMarkdownImport] = useState(false)
  const canvasRef = useRef<WhiteboardCanvasRef>(null)

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

  const handleExport = async () => {
    if (!canvasRef.current) return
    
    const blob = await canvasRef.current.exportAsImage()
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mindmap-${Date.now()}.svg`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleExportJSON = () => {
    if (!canvasRef.current) return
    
    const data = canvasRef.current.exportAsJSON()
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `board-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImportJSON = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && canvasRef.current) {
        const text = await file.text()
        const data = JSON.parse(text)
        canvasRef.current.importFromJSON(data)
      }
    }
    input.click()
  }

  const handleImportImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && canvasRef.current) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string
          const editor = canvasRef.current?.getEditor()
          if (editor) {
            const viewportCenter = editor.getViewportScreenCenter()
            editor.createShape({
              type: 'image',
              x: viewportCenter.x - 200,
              y: viewportCenter.y - 150,
              props: {
                url: dataUrl,
                w: 400,
                h: 300,
              },
            })
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleImportMarkdown = (content: string, format: 'markdown' | 'html') => {
    if (canvasRef.current) {
      canvasRef.current.addMarkdownText(content)
    }
  }

  const handleClearBoard = () => {
    if (confirm('Are you sure you want to clear the board? This cannot be undone.')) {
      canvasRef.current?.clearCanvas()
    }
  }

  const handleManualSave = () => {
    setShowSaveNotification(true)
    setTimeout(() => setShowSaveNotification(false), 2000)
  }

  const handleNewBoard = () => {
    const name = prompt('Enter board name:')
    if (name) {
      const newBoardId = createBoard(name)
      setActiveBoard(newBoardId)
    }
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
    <div className="flex h-full bg-gradient-to-br from-blox-very-dark-blue to-blox-second-dark-blue">
      {/* Sidebar */}
      {sidebarOpen && <WhiteboardSidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-blox-glass-border bg-blox-glass-teal/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-blox-off-white hover:text-blox-white"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
            
            <h1 className="text-xl font-semibold text-blox-white">
              Visual Mind Mapping
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <WhiteboardToolbar
              onNewBoard={handleNewBoard}
              onSave={handleManualSave}
              onLoad={handleImportJSON}
              onExport={handleExport}
              onImportMarkdown={() => setShowMarkdownImport(true)}
              onImportImage={handleImportImage}
              onClear={handleClearBoard}
            />

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
              ref={canvasRef}
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

      {/* Markdown Import Dialog */}
      <MarkdownImport
        isOpen={showMarkdownImport}
        onClose={() => setShowMarkdownImport(false)}
        onImport={handleImportMarkdown}
      />
    </div>
  )
}