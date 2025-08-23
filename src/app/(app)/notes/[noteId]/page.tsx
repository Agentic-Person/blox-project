'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useWhiteboardStore } from '@/store/whiteboardStore'
import WhiteboardCanvas from '@/components/whiteboard/WhiteboardCanvas'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  Maximize2, 
  Minimize2,
  Save,
  Share2,
  Edit
} from 'lucide-react'
import { format } from 'date-fns'

export default function IndividualNotePage() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.noteId as string
  
  const { boards, renameBoard } = useWhiteboardStore()
  const board = boards[noteId]
  
  const [fullscreen, setFullscreen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [boardName, setBoardName] = useState(board?.name || '')
  const [showSaveNotification, setShowSaveNotification] = useState(false)

  useEffect(() => {
    if (!board) {
      // Board doesn't exist, redirect to notes page
      router.push('/notes')
    }
  }, [board, router])

  if (!board) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-blox-off-white">Loading board...</div>
      </div>
    )
  }

  const handleRename = () => {
    if (boardName.trim() && boardName !== board.name) {
      renameBoard(noteId, boardName)
    }
    setIsEditing(false)
  }

  const handleExport = () => {
    // Export functionality - to be implemented
    alert('Export feature coming soon!')
  }

  const handleShare = () => {
    // Share functionality - to be implemented
    const shareUrl = `${window.location.origin}/notes/${noteId}`
    navigator.clipboard.writeText(shareUrl)
    alert('Share link copied to clipboard!')
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-blox-very-dark-blue to-blox-second-dark-blue">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blox-glass-border bg-blox-glass-teal backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push('/notes')}
            className="text-blox-off-white hover:text-blox-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notes
          </Button>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename()
                  if (e.key === 'Escape') {
                    setBoardName(board.name)
                    setIsEditing(false)
                  }
                }}
                className="bg-transparent border-b border-blox-teal text-xl font-semibold text-blox-white outline-none"
                autoFocus
              />
            ) : (
              <>
                <h1 className="text-xl font-semibold text-blox-white">
                  {board.name}
                </h1>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(true)
                    setBoardName(board.name)
                  }}
                  className="text-blox-light-blue-gray hover:text-blox-white"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
          
          <span className="text-sm text-blox-light-blue-gray">
            Last updated: {format(new Date(board.updatedAt), 'MMM d, yyyy h:mm a')}
          </span>
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
            onClick={handleShare}
            className="text-blox-off-white hover:text-blox-white"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
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
        <WhiteboardCanvas 
          boardId={noteId}
          onSave={() => {
            setShowSaveNotification(true)
            setTimeout(() => setShowSaveNotification(false), 2000)
          }}
        />

        {/* Save Notification */}
        {showSaveNotification && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blox-success/90 backdrop-blur-sm px-4 py-2 rounded-lg text-white animate-fade-in">
            ✓ Board saved successfully
          </div>
        )}
      </div>
    </div>
  )
}