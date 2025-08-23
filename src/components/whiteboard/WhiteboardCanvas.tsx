'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Tldraw, TLUiOverrides, createTLStore, defaultShapeUtils, TLStoreSnapshot } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useWhiteboardStore } from '@/store/whiteboardStore'
import { bloxBuddyTheme, customStyles } from './theme'

interface WhiteboardCanvasProps {
  boardId: string
  onSave?: (data: any) => void
  readOnly?: boolean
}

export default function WhiteboardCanvas({ boardId, onSave, readOnly = false }: WhiteboardCanvasProps) {
  const { saveBoard, loadBoard } = useWhiteboardStore()
  const editorRef = useRef<any>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>()

  // Custom UI overrides - keep only essential tools
  const uiOverrides: TLUiOverrides = {
    tools(editor, tools) {
      return {
        select: tools.select,
        draw: tools.draw,
        arrow: tools.arrow,
        text: tools.text,
        note: tools.note,
        frame: tools.frame,
        rectangle: tools.rectangle,
        ellipse: tools.ellipse,
        line: tools.line,
        eraser: tools.eraser,
      }
    },
  }

  // Handle paste for images/screenshots
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!editorRef.current) return
      
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const blob = item.getAsFile()
          if (blob) {
            const reader = new FileReader()
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string
              // Create image shape at current viewport center
              const viewportCenter = editorRef.current.getViewportPageCenter()
              editorRef.current.createShape({
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
            reader.readAsDataURL(blob)
          }
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  // Auto-save functionality
  const handlePersist = useCallback(() => {
    if (!editorRef.current) return
    const snapshot = editorRef.current.store.getSnapshot()
    saveBoard(boardId, snapshot)
    onSave?.(snapshot)
  }, [boardId, saveBoard, onSave])

  // Set up auto-save
  useEffect(() => {
    autoSaveIntervalRef.current = setInterval(handlePersist, 30000) // Every 30 seconds
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [handlePersist])

  return (
    <>
      <style>{customStyles}</style>
      <div className="h-full w-full relative">
        <Tldraw
          onMount={(editor) => {
            editorRef.current = editor
            
            // Load saved state if exists
            const savedData = loadBoard(boardId)
            if (savedData) {
              editor.store.loadSnapshot(savedData as TLStoreSnapshot)
            }

            // Add keyboard shortcut for manual save
            editor.addListener('change', () => {
              // Debounced auto-save on changes
            })
          }}
          overrides={uiOverrides}
          hideUi={readOnly}
          className="h-full w-full"
        />
        
        {/* Save indicator */}
        <div className="absolute top-4 right-4 pointer-events-none">
          <div className="bg-blox-glass-teal backdrop-blur-sm px-3 py-1 rounded-lg text-blox-off-white text-sm">
            Auto-saving enabled
          </div>
        </div>
      </div>
    </>
  )
}