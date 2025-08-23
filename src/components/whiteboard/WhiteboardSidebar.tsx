'use client'

import { useState } from 'react'
import { useWhiteboardStore } from '@/store/whiteboardStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { format } from 'date-fns'

export function WhiteboardSidebar() {
  const { 
    boards, 
    activeBoard, 
    createBoard, 
    deleteBoard, 
    setActiveBoard,
    renameBoard,
    listBoards 
  } = useWhiteboardStore()
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newBoardName, setNewBoardName] = useState('')
  const [showNewBoard, setShowNewBoard] = useState(false)

  const boardList = listBoards().sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      createBoard(newBoardName)
      setNewBoardName('')
      setShowNewBoard(false)
    }
  }

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id)
    setEditName(currentName)
  }

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      renameBoard(editingId, editName)
      setEditingId(null)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this board?')) {
      deleteBoard(id)
    }
  }

  return (
    <div className="w-64 h-full bg-blox-second-dark-blue border-r border-blox-glass-border flex flex-col">
      <div className="p-4 border-b border-blox-glass-border">
        <h2 className="text-blox-white font-semibold mb-3">My Boards</h2>
        
        {!showNewBoard ? (
          <Button
            onClick={() => setShowNewBoard(true)}
            className="w-full bg-blox-teal hover:bg-blox-teal-dark text-white"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Board
          </Button>
        ) : (
          <div className="flex gap-1">
            <Input
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Board name..."
              className="flex-1 bg-blox-very-dark-blue text-blox-off-white border-blox-glass-border"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateBoard()
                if (e.key === 'Escape') setShowNewBoard(false)
              }}
            />
            <Button
              size="sm"
              onClick={handleCreateBoard}
              className="bg-blox-teal hover:bg-blox-teal-dark"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNewBoard(false)}
              className="text-blox-off-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {boardList.length === 0 ? (
          <div className="text-blox-medium-blue-gray text-center py-8">
            No boards yet. Create your first board!
          </div>
        ) : (
          <div className="space-y-1">
            {boardList.map((board) => (
              <div
                key={board.id}
                className={cn(
                  "group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                  activeBoard === board.id
                    ? "bg-blox-glass-teal border border-blox-teal"
                    : "hover:bg-blox-glass-teal"
                )}
                onClick={() => setActiveBoard(board.id)}
              >
                {editingId === board.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-blox-very-dark-blue text-blox-off-white border-blox-glass-border h-7 text-sm"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation()
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSaveEdit()
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="text-blox-off-white text-sm font-medium">
                        {board.name}
                      </div>
                      <div className="text-blox-medium-blue-gray text-xs">
                        {format(new Date(board.updatedAt), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEdit(board.id, board.name)
                        }}
                        className="h-7 w-7 p-0 text-blox-off-white"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(board.id)
                        }}
                        className="h-7 w-7 p-0 text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}