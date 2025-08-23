'use client'

import { useState } from 'react'
import { useWhiteboardStore } from '@/store/whiteboardStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, MoreVertical, Trash2, Edit, FileText, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface BoardManagerProps {
  onBoardSelect?: (boardId: string) => void
  className?: string
}

export default function BoardManager({ onBoardSelect, className = '' }: BoardManagerProps) {
  const { 
    boards, 
    activeBoard, 
    createBoard, 
    deleteBoard, 
    renameBoard, 
    setActiveBoard,
    listBoards 
  } = useWhiteboardStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [editingBoard, setEditingBoard] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')

  const boardList = listBoards()
  const filteredBoards = boardList.filter(board =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateBoard = () => {
    const name = newBoardName || `Board ${new Date().toLocaleDateString()}`
    const boardId = createBoard(name)
    setNewBoardName('')
    setShowCreateModal(false)
    if (onBoardSelect) {
      onBoardSelect(boardId)
    }
  }

  const handleSelectBoard = (boardId: string) => {
    setActiveBoard(boardId)
    if (onBoardSelect) {
      onBoardSelect(boardId)
    }
  }

  const handleRenameBoard = (boardId: string) => {
    if (editingName.trim()) {
      renameBoard(boardId, editingName)
      setEditingBoard(null)
      setEditingName('')
    }
  }

  const handleDeleteBoard = (boardId: string) => {
    if (confirm('Are you sure you want to delete this board?')) {
      deleteBoard(boardId)
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-blox-glass-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-blox-white">My Boards</h2>
          <Button 
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="bg-blox-teal hover:bg-blox-teal-dark"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Board
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blox-light-blue-gray" />
          <input
            type="text"
            placeholder="Search boards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-blox-glass-teal border border-blox-glass-border rounded-lg text-blox-white placeholder-blox-light-blue-gray focus:outline-none focus:border-blox-teal"
          />
        </div>
      </div>

      {/* Board List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredBoards.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-blox-medium-blue-gray mx-auto mb-3" />
            <p className="text-blox-off-white">
              {searchQuery ? 'No boards found' : 'No boards yet'}
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                size="sm"
                variant="ghost"
                className="mt-2"
              >
                Create your first board
              </Button>
            )}
          </div>
        ) : (
          filteredBoards.map((board) => (
            <Card
              key={board.id}
              className={`cursor-pointer transition-all hover:shadow-card-hover ${
                activeBoard === board.id ? 'ring-2 ring-blox-teal' : ''
              }`}
              onClick={() => handleSelectBoard(board.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {editingBoard === board.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleRenameBoard(board.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameBoard(board.id)
                          if (e.key === 'Escape') {
                            setEditingBoard(null)
                            setEditingName('')
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent border-b border-blox-teal text-blox-white outline-none"
                        autoFocus
                      />
                    ) : (
                      <h3 className="font-medium text-blox-white">{board.name}</h3>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-blox-light-blue-gray">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(board.updatedAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingBoard(board.id)
                        setEditingName(board.name)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteBoard(board.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Board Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-blox-second-dark-blue border border-blox-glass-border rounded-lg p-6 w-96">
            <h3 className="text-xl font-semibold text-blox-white mb-4">Create New Board</h3>
            <input
              type="text"
              placeholder="Board name..."
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateBoard()
                if (e.key === 'Escape') setShowCreateModal(false)
              }}
              className="w-full px-4 py-2 bg-blox-glass-teal border border-blox-glass-border rounded-lg text-blox-white placeholder-blox-light-blue-gray focus:outline-none focus:border-blox-teal mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBoard}
                className="bg-blox-teal hover:bg-blox-teal-dark"
              >
                Create Board
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}