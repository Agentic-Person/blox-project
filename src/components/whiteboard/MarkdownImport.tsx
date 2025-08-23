'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface MarkdownImportProps {
  isOpen: boolean
  onClose: () => void
  onImport: (content: string, format: 'markdown' | 'html') => void
}

export function MarkdownImport({ isOpen, onClose, onImport }: MarkdownImportProps) {
  const [markdown, setMarkdown] = useState('')
  const [preview, setPreview] = useState(false)

  const handleImport = () => {
    if (markdown.trim()) {
      onImport(markdown, 'markdown')
      setMarkdown('')
      onClose()
    }
  }

  const handlePasteAsText = () => {
    // Convert markdown to plain text and import
    const plainText = markdown.replace(/[#*`\[\]()]/g, '')
    onImport(plainText, 'html')
    setMarkdown('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-blox-very-dark-blue border-blox-glass-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-blox-white">Import Markdown</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!preview ? (
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Paste your markdown here..."
              className="min-h-[300px] bg-blox-second-dark-blue text-blox-off-white border-blox-glass-border"
            />
          ) : (
            <div className="min-h-[300px] bg-blox-second-dark-blue p-4 rounded-lg border border-blox-glass-border">
              <ReactMarkdown className="prose prose-invert prose-teal max-w-none">
                {markdown}
              </ReactMarkdown>
            </div>
          )}
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setPreview(!preview)}
              className="bg-blox-glass-teal border-blox-glass-border text-blox-off-white"
            >
              {preview ? 'Edit' : 'Preview'}
            </Button>
            
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={handlePasteAsText}
                className="bg-blox-glass-teal border-blox-glass-border text-blox-off-white"
              >
                Import as Text
              </Button>
              <Button
                onClick={handleImport}
                className="bg-blox-teal hover:bg-blox-teal-dark text-white"
              >
                Import as Markdown
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}