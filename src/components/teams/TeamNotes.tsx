'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  FileText, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Clock,
  User,
  FolderOpen,
  Star,
  Share2
} from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  author: string
  lastModified: Date
  category: string
  pinned?: boolean
}

interface TeamNotesProps {
  teamId: string
}

// Mock notes data - in production this would come from Supabase
const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Tower Defense Game - Design Document',
    content: `# Tower Defense Game Design

## Core Mechanics
- Players place towers on a grid-based map
- Enemies follow predefined paths
- Towers automatically attack enemies in range
- Currency earned from defeating enemies

## Tower Types
1. **Basic Tower** - Low cost, moderate damage
2. **Sniper Tower** - High range, slow attack speed
3. **Splash Tower** - Area damage, good for groups
4. **Slow Tower** - Reduces enemy movement speed
5. **Ultimate Tower** - High damage, expensive

## Wave System
- 20 waves total with increasing difficulty
- Boss enemies every 5 waves
- Special rewards for perfect waves (no enemies escape)

## Upgrade System
- Each tower has 3 upgrade tiers
- Upgrades increase damage, range, and special abilities
- Strategic choices between upgrading vs. building new towers`,
    author: 'ScriptMaster',
    lastModified: new Date(Date.now() - 86400000),
    category: 'Game Design',
    pinned: true
  },
  {
    id: '2',
    title: 'Bug Reports - Tower Placement',
    content: `## Known Issues

### High Priority
- Towers can overlap when placed quickly
- Tower range indicators not showing correctly on slopes

### Medium Priority
- UI flickers when selecting towers rapidly
- Sound effects sometimes don't play

### Low Priority
- Minor visual glitches in tower animations
- Tooltip text overflow on small screens

## Fixed Issues
- ✅ Game crashes when selling towers during wave
- ✅ Currency display not updating immediately
- ✅ Enemy pathfinding breaking on custom maps`,
    author: 'GameDev123',
    lastModified: new Date(Date.now() - 3600000),
    category: 'Bug Reports'
  },
  {
    id: '3',
    title: 'Meeting Notes - Sprint Planning',
    content: `## Sprint Planning - Week 3

### Attendees
- ScriptMaster (Lead)
- BuilderPro
- UIWizard
- GameDev123

### This Week's Goals
1. Complete tower placement system
2. Implement first 5 enemy types
3. Design main menu UI
4. Create 3 tower models

### Task Assignments
- **ScriptMaster**: Enemy AI and pathfinding
- **BuilderPro**: Tower models and map design
- **UIWizard**: Main menu and HUD
- **GameDev123**: Tower placement system and testing

### Next Meeting
Friday 3PM - Progress review`,
    author: 'ScriptMaster',
    lastModified: new Date(Date.now() - 7200000),
    category: 'Meetings'
  }
]

const categories = ['All', 'Game Design', 'Bug Reports', 'Meetings', 'Resources', 'Ideas']

export default function TeamNotes({ teamId }: TeamNotesProps) {
  const [notes, setNotes] = useState<Note[]>(mockNotes)
  const [selectedNote, setSelectedNote] = useState<Note | null>(notes[0])
  const [isEditing, setIsEditing] = useState(false)
  const [editingContent, setEditingContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || note.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleEdit = () => {
    if (selectedNote) {
      setEditingContent(selectedNote.content)
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    if (selectedNote) {
      const updatedNotes = notes.map(note => 
        note.id === selectedNote.id 
          ? { ...note, content: editingContent, lastModified: new Date() }
          : note
      )
      setNotes(updatedNotes)
      setSelectedNote({ ...selectedNote, content: editingContent, lastModified: new Date() })
      setIsEditing(false)
    }
  }

  const handleCreateNew = () => {
    if (newNoteTitle.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        title: newNoteTitle,
        content: '# ' + newNoteTitle + '\n\nStart writing your notes here...',
        author: 'You',
        lastModified: new Date(),
        category: 'Ideas'
      }
      setNotes([newNote, ...notes])
      setSelectedNote(newNote)
      setIsCreatingNew(false)
      setNewNoteTitle('')
      setIsEditing(true)
      setEditingContent(newNote.content)
    }
  }

  const togglePin = (noteId: string) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, pinned: !note.pinned } : note
    )
    setNotes(updatedNotes)
    if (selectedNote?.id === noteId) {
      setSelectedNote({ ...selectedNote, pinned: !selectedNote.pinned })
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="h-full flex gap-4">
      {/* Notes List Sidebar */}
      <Card className="glass-card w-80 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="text-lg">Team Notes</CardTitle>
            <Button 
              size="sm" 
              onClick={() => setIsCreatingNew(true)}
              className="bg-blox-teal hover:bg-blox-teal-dark"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blox-medium-blue-gray" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-10 bg-blox-second-dark-blue border-blox-glass-border text-blox-white placeholder:text-blox-medium-blue-gray"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1 mt-3">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  selectedCategory === category
                    ? 'bg-blox-teal text-white'
                    : 'bg-blox-black-blue text-blox-off-white hover:bg-blox-second-dark-blue'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-2">
          {/* New Note Input */}
          {isCreatingNew && (
            <div className="p-3 mb-2 bg-blox-black-blue rounded-lg border border-blox-teal">
              <Input
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateNew()}
                placeholder="Note title..."
                className="mb-2 bg-blox-second-dark-blue border-blox-glass-border"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateNew}>Create</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsCreatingNew(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-2">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNote(note)
                  setIsEditing(false)
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedNote?.id === note.id
                    ? 'bg-blox-teal/20 border-blox-teal'
                    : 'bg-blox-black-blue border-blox-glass-border hover:border-blox-medium-blue-gray'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-medium text-blox-white line-clamp-1">
                    {note.title}
                  </h4>
                  {note.pinned && <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-blox-off-white line-clamp-2 mb-2">
                  {note.content.replace(/^#.*$/m, '').trim()}
                </p>
                <div className="flex items-center justify-between text-xs text-blox-medium-blue-gray">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {note.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(note.lastModified)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Note Editor */}
      <Card className="glass-card flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl text-blox-white">
                    {selectedNote.title}
                  </CardTitle>
                  <div className="flex items-center gap-3 mt-1 text-sm text-blox-medium-blue-gray">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedNote.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last edited {formatDate(selectedNote.lastModified)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FolderOpen className="h-3 w-3" />
                      {selectedNote.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePin(selectedNote.id)}
                    className={selectedNote.pinned ? 'text-yellow-500' : ''}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {isEditing ? (
                <Textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full h-full min-h-[400px] bg-blox-second-dark-blue border-blox-glass-border text-blox-white font-mono text-sm resize-none"
                  placeholder="Write your notes here..."
                />
              ) : (
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-blox-off-white font-sans">
                    {selectedNote.content}
                  </pre>
                </div>
              )}
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-12 w-12 text-blox-medium-blue-gray mx-auto mb-4" />
              <p className="text-blox-off-white">Select a note to view or create a new one</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}