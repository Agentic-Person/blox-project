'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Download, Maximize2, Info } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ProfileImage } from '@/store/profileStore'

interface ImageLightboxProps {
  images: ProfileImage[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const currentImage = images[currentIndex]
  
  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious()
          break
        case 'ArrowRight':
          handleNext()
          break
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
        case '0':
          handleResetZoom()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex])
  
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
    resetView()
  }
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    resetView()
  }
  
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }
  
  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }
  
  const handleResetZoom = () => {
    resetView()
  }
  
  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }
  
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }
  
  const handleDownload = () => {
    if (!currentImage) return
    
    const link = document.createElement('a')
    link.href = currentImage.url
    link.download = currentImage.title || `image-${currentIndex + 1}`
    link.click()
  }
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }
  
  if (!currentImage) return null
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-full h-full p-0 bg-black/95">
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-white text-sm">
                  {currentIndex + 1} / {images.length}
                </span>
                {currentImage.title && (
                  <h3 className="text-white font-medium">{currentImage.title}</h3>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowInfo(!showInfo)}
                  className="text-white hover:text-blox-teal"
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownload}
                  className="text-white hover:text-blox-teal"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleFullscreen}
                  className="text-white hover:text-blox-teal"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="text-white hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main image container */}
          <div
            className="flex-1 flex items-center justify-center relative overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <img
              src={currentImage.url}
              alt={currentImage.title || 'Image'}
              className="max-w-full max-h-full object-contain select-none"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s'
              }}
              draggable={false}
            />
            
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
          
          {/* Image info panel */}
          {showInfo && currentImage && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="space-y-2 text-white">
                {currentImage.title && (
                  <h4 className="font-medium">{currentImage.title}</h4>
                )}
                {currentImage.description && (
                  <p className="text-sm text-gray-300">{currentImage.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  Uploaded: {new Date(currentImage.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          
          {/* Zoom controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-lg px-3 py-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomOut}
              className="text-white hover:text-blox-teal h-8 w-8 p-0"
            >
              -
            </Button>
            <span className="text-white text-sm min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomIn}
              className="text-white hover:text-blox-teal h-8 w-8 p-0"
            >
              +
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetZoom}
              className="text-white hover:text-blox-teal text-xs px-2"
            >
              Reset
            </Button>
          </div>
          
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/70 rounded-lg max-w-[80%] overflow-x-auto">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setCurrentIndex(index)
                    resetView()
                  }}
                  className={`
                    w-16 h-16 rounded overflow-hidden border-2 transition-all
                    ${index === currentIndex ? 'border-blox-teal' : 'border-transparent opacity-60 hover:opacity-100'}
                  `}
                >
                  <img
                    src={img.thumbnailUrl || img.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}