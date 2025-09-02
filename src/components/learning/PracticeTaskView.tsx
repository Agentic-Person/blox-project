'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  BookOpen, 
  Download, 
  Save, 
  Clock,
  CheckCircle,
  Target,
  Lightbulb
} from 'lucide-react'
import { motion } from 'framer-motion'
import WhiteboardCanvas, { WhiteboardCanvasRef } from '@/components/whiteboard/WhiteboardCanvas'
import { Day } from '@/types/learning'
import { cn } from '@/lib/utils/cn'
import { moduleColorScheme } from '@/lib/constants/moduleColors'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/providers/auth-provider'

interface PracticeTaskViewProps {
  day: Day
  moduleInfo: {
    id: string
    title: string
  }
  weekInfo: {
    id: string
    title: string
  }
}

export function PracticeTaskView({ day, moduleInfo, weekInfo }: PracticeTaskViewProps) {
  const router = useRouter()
  const { user } = useAuth()
  const whiteboardRef = useRef<WhiteboardCanvasRef>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Handle hydration
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Extract day number from ID (e.g., "day-1" -> "1")
  const dayNumber = day.id.split('-').pop() || '1'
  
  // Extract module index for color coding
  const moduleNumber = moduleInfo.id.split('-')[1]
  const moduleIndex = parseInt(moduleNumber, 10) - 1
  
  // Get module-specific colors
  const { textColors, progressBarColors, buttonBackgrounds } = moduleColorScheme
  
  const handleBack = () => {
    router.back()
  }
  
  const handleSave = async () => {
    if (!isClient || !whiteboardRef.current || !user) return
    
    setIsSaving(true)
    try {
      // Export whiteboard as image
      const imageBlob = await whiteboardRef.current.exportAsImage()
      if (imageBlob) {
        console.log('Saving whiteboard image...', imageBlob)
        
        try {
          // Dynamically import the storage function to avoid SSR issues
          const { uploadWhiteboardImage } = await import('@/lib/supabase/storage')
          
          // Upload to Supabase storage
          const { url, error } = await uploadWhiteboardImage(
            imageBlob,
            user.id,
            moduleInfo.id,
            weekInfo.id,
            day.id
          )
          
          if (error) {
            throw error // This will be caught by the outer catch block
          } else if (url) {
            console.log('Whiteboard saved successfully:', url)
          }
        } catch (uploadError) {
          console.error('Upload failed, falling back to local download:', uploadError)
          // Fallback to local download
          const localUrl = URL.createObjectURL(imageBlob)
          const link = document.createElement('a')
          link.href = localUrl
          link.download = `practice-${moduleInfo.id}-${weekInfo.id}-${day.id}-${Date.now()}.svg`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(localUrl)
        }
      }
    } catch (error) {
      console.error('Failed to save whiteboard:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleExport = async () => {
    if (!whiteboardRef.current) return
    
    const imageBlob = await whiteboardRef.current.exportAsImage()
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `practice-notes-${day.id}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="h-full flex flex-col bg-blox-very-dark-blue">
      {/* Header */}
      <div className="p-6 border-b border-blox-medium-blue-gray bg-gradient-to-r from-blox-very-dark-blue to-blox-dark-blue">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-4 text-blox-off-white hover:text-blox-teal"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Day Overview
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-blox-teal to-blox-teal-dark text-white px-3 py-1 text-lg font-bold shadow-md">
                Day {dayNumber} Practice
              </Badge>
              <h1 className="text-2xl font-bold text-blox-white">
                {day.title} - Notes & Practice
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="border-blox-teal text-blox-teal hover:bg-blox-teal hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {isClient && user && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={cn(
                    "text-blox-very-dark-blue font-semibold",
                    buttonBackgrounds[moduleIndex]
                  )}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Notes'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar - Video Summary */}
        <div className="w-80 border-r border-blox-medium-blue-gray bg-blox-dark-blue/30 overflow-y-auto">
          <div className="p-4">
            <Card className="bg-blox-very-dark-blue/60 border-blox-medium-blue-gray">
              <CardHeader className="pb-3">
                <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", textColors[moduleIndex])}>
                  <Lightbulb className="h-5 w-5" />
                  Today's Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-blox-off-white mb-3">
                    <BookOpen className="h-4 w-4 text-blox-teal" />
                    <span>{day.videos.length} videos</span>
                    <Clock className="h-4 w-4 text-blox-purple ml-2" />
                    <span>{day.estimatedTime || '2.5h'}</span>
                  </div>
                  
                  {day.videos.map((video, index) => (
                    <div key={video.id} className="p-3 rounded-lg bg-blox-very-dark-blue/60 border border-blox-medium-blue-gray/30">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs text-blox-teal border-blox-teal/30">
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-blox-white leading-tight">
                            {video.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-2 text-xs text-blox-off-white/60">
                            <span>{video.duration}</span>
                            {video.creator && <span>by {video.creator}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Practice Task Description */}
                {day.practiceTask && (
                  <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blox-purple/20 to-blox-teal/10 border border-blox-purple/30">
                    <div className="flex items-start gap-2 mb-2">
                      <Target className="h-4 w-4 text-blox-purple mt-0.5" />
                      <h4 className="text-sm font-semibold text-blox-white">Practice Goal</h4>
                    </div>
                    <p className="text-xs text-blox-off-white/80 leading-relaxed">
                      {typeof day.practiceTask === 'string' 
                        ? day.practiceTask 
                        : day.practiceTask?.description || 'Practice what you learned today'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Side - Whiteboard */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-blox-medium-blue-gray bg-blox-dark-blue/20">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-blox-white flex items-center gap-2">
                <Target className="h-5 w-5 text-blox-teal" />
                Your Practice Notes
              </h2>
              <div className="flex items-center gap-2 text-sm text-blox-off-white/60">
                <CheckCircle className="h-4 w-4" />
                <span>Auto-saving enabled</span>
              </div>
            </div>
            <p className="text-sm text-blox-off-white/60 mt-1">
              Take notes, paste screenshots, and document your learning progress
            </p>
          </div>
          
          <div className="flex-1 relative">
            <WhiteboardCanvas
              ref={whiteboardRef}
              boardId={`practice-${moduleInfo.id}-${weekInfo.id}-${day.id}`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}