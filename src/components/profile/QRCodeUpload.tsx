'use client'

import { useState, useEffect } from 'react'
import { QrCode, Smartphone, Upload, RefreshCw, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useProfileStore } from '@/store/profileStore'

interface QRCodeUploadProps {
  isOpen: boolean
  onClose: () => void
}

export function QRCodeUpload({ isOpen, onClose }: QRCodeUploadProps) {
  const { generateQRToken, profile } = useProfileStore()
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [uploadUrl, setUploadUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)
  
  const generateQR = () => {
    setIsGenerating(true)
    const token = generateQRToken()
    setQrToken(token)
    
    // Generate upload URL
    const baseUrl = window.location.origin
    const url = `${baseUrl}/upload/${token}`
    setUploadUrl(url)
    
    setTimeout(() => setIsGenerating(false), 500)
  }
  
  // Generate QR on mount
  useEffect(() => {
    if (isOpen && !qrToken) {
      generateQR()
    }
  }, [isOpen])
  
  // Check for new uploads periodically
  useEffect(() => {
    if (!isOpen || !qrToken) return
    
    const interval = setInterval(() => {
      // In production, check for new uploads via WebSocket or polling
      const currentCount = profile?.recentWork.length || 0
      if (currentCount > uploadCount) {
        setUploadCount(currentCount)
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [isOpen, qrToken, profile?.recentWork.length, uploadCount])
  
  // Generate QR code SVG
  const generateQRCodeSVG = (text: string) => {
    // Simple QR code placeholder - in production, use a proper QR library
    const modules = 25
    const size = 200
    const moduleSize = size / modules
    
    // Create a simple pattern based on the text
    const pattern: boolean[][] = []
    for (let i = 0; i < modules; i++) {
      pattern[i] = []
      for (let j = 0; j < modules; j++) {
        // Create a deterministic pattern from the text
        const charCode = text.charCodeAt((i * modules + j) % text.length)
        pattern[i][j] = (charCode * (i + 1) * (j + 1)) % 3 === 0
      }
    }
    
    // Add corner markers
    const addCornerMarker = (row: number, col: number) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
            if (row + i < modules && col + j < modules) {
              pattern[row + i][col + j] = true
            }
          } else {
            if (row + i < modules && col + j < modules) {
              pattern[row + i][col + j] = false
            }
          }
        }
      }
    }
    
    addCornerMarker(0, 0)
    addCornerMarker(0, modules - 7)
    addCornerMarker(modules - 7, 0)
    
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
        <rect width={size} height={size} fill="white" />
        {pattern.map((row, i) =>
          row.map((cell, j) =>
            cell ? (
              <rect
                key={`${i}-${j}`}
                x={j * moduleSize}
                y={i * moduleSize}
                width={moduleSize}
                height={moduleSize}
                fill="black"
              />
            ) : null
          )
        )}
      </svg>
    )
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blox-teal" />
            Upload from Phone
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="relative p-4 bg-white rounded-lg">
              {uploadUrl && generateQRCodeSVG(uploadUrl)}
              
              {/* Success indicator */}
              {uploadCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>
          
          {/* Instructions */}
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2 text-blox-teal">
              <Smartphone className="h-5 w-5" />
              <span className="font-medium">Scan with your phone</span>
            </div>
            
            <ol className="text-sm text-blox-off-white space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blox-teal font-medium">1.</span>
                <span>Open your phone's camera app</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blox-teal font-medium">2.</span>
                <span>Point it at the QR code above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blox-teal font-medium">3.</span>
                <span>Tap the notification to open the upload page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blox-teal font-medium">4.</span>
                <span>Select and upload your images</span>
              </li>
            </ol>
          </div>
          
          {/* Upload status */}
          {uploadCount > 0 && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-green-500">
                <Upload className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {uploadCount} {uploadCount === 1 ? 'image' : 'images'} uploaded successfully!
                </span>
              </div>
            </div>
          )}
          
          {/* URL Display */}
          <div className="p-3 rounded-lg bg-blox-second-dark-blue/30 border border-blox-glass-border">
            <p className="text-xs text-blox-medium-blue-gray mb-1">Or visit this URL:</p>
            <p className="text-xs text-blox-off-white break-all font-mono">
              {uploadUrl}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={generateQR}
              disabled={isGenerating}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              New Code
            </Button>
            <Button
              variant="default"
              onClick={onClose}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}