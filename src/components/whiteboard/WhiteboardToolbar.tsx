'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Save, 
  Download, 
  Upload, 
  FileText, 
  Image,
  Trash2,
  FolderOpen,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface WhiteboardToolbarProps {
  onSave: () => void
  onLoad: () => void
  onExport: () => void
  onImportMarkdown: () => void
  onImportImage: () => void
  onClear: () => void
  onNewBoard: () => void
  className?: string
}

export function WhiteboardToolbar({
  onSave,
  onLoad,
  onExport,
  onImportMarkdown,
  onImportImage,
  onClear,
  onNewBoard,
  className
}: WhiteboardToolbarProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 bg-blox-glass-teal backdrop-blur-md rounded-lg border border-blox-glass-border",
      className
    )}>
      <Button
        size="sm"
        variant="ghost"
        onClick={onNewBoard}
        className="text-blox-off-white hover:bg-blox-glass-teal"
        title="New Board"
      >
        <Plus className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onSave}
        className="text-blox-off-white hover:bg-blox-glass-teal"
        title="Save Board"
      >
        <Save className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onLoad}
        className="text-blox-off-white hover:bg-blox-glass-teal"
        title="Load Board"
      >
        <FolderOpen className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-blox-glass-border" />
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onImportMarkdown}
        className="text-blox-off-white hover:bg-blox-glass-teal"
        title="Import Markdown"
      >
        <FileText className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onImportImage}
        className="text-blox-off-white hover:bg-blox-glass-teal"
        title="Import Image"
      >
        <Image className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-blox-glass-border" />
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onExport}
        className="text-blox-off-white hover:bg-blox-glass-teal"
        title="Export as Image"
      >
        <Download className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onClear}
        className="text-red-400 hover:bg-red-500/20"
        title="Clear Board"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}