'use client'

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Tldraw, TLUiOverrides, createTLStore, defaultShapeUtils, TLStoreSnapshot, Editor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useWhiteboardStore } from '@/store/whiteboardStore'
import { bloxBuddyTheme, customStyles } from './theme'

interface WhiteboardCanvasProps {
  boardId: string
  onSave?: (data: any) => void
  readOnly?: boolean
}

export interface WhiteboardCanvasRef {
  exportAsImage: () => Promise<Blob | null>
  exportAsJSON: () => any
  importFromJSON: (data: any) => void
  clearCanvas: () => void
  addMarkdownText: (text: string) => void
  getEditor: () => Editor | null
}

const WhiteboardCanvas = forwardRef<WhiteboardCanvasRef, WhiteboardCanvasProps>(
  ({ boardId, onSave, readOnly = false }, ref) => {
    const { saveBoard, loadBoard } = useWhiteboardStore()
    const editorRef = useRef<Editor | null>(null)
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
              const editor = editorRef.current
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

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      exportAsImage: async () => {
        if (!editorRef.current) return null
        try {
          // Get all shape IDs for export
          const shapeIds = editorRef.current.getCurrentPageShapeIds()
          const result = await editorRef.current.getSvgElement([...shapeIds])
          if (!result) return null
          
          // Convert SVG to blob
          const svgString = new XMLSerializer().serializeToString(result.svg)
          const blob = new Blob([svgString], { type: 'image/svg+xml' })
          return blob
        } catch (error) {
          console.error('Export error:', error)
          return null
        }
      },
      
      exportAsJSON: () => {
        if (!editorRef.current) return null
        return editorRef.current.store.getSnapshot()
      },
      
      importFromJSON: (data: any) => {
        if (!editorRef.current) return
        editorRef.current.store.loadSnapshot(data)
      },
      
      clearCanvas: () => {
        if (!editorRef.current) return
        editorRef.current.selectAll()
        editorRef.current.deleteShapes(editorRef.current.getSelectedShapeIds())
      },
      
      addMarkdownText: (text: string) => {
        if (!editorRef.current) return
        const viewportCenter = editorRef.current.getViewportScreenCenter()
        
        // Parse markdown and create text shapes
        const lines = text.split('\n')
        let yOffset = 0
        
        lines.forEach((line) => {
          if (line.trim()) {
            editorRef.current!.createShape({
              type: 'text',
              x: viewportCenter.x - 200,
              y: viewportCenter.y + yOffset,
              props: {
                text: line,
                size: 'm',
                align: 'start',
                color: 'white',
              },
            })
            yOffset += 30
          }
        })
      },
      
      getEditor: () => editorRef.current,
    }))

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
})

WhiteboardCanvas.displayName = 'WhiteboardCanvas'

export default WhiteboardCanvas