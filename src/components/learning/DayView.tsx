'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Clock, 
  BookOpen, 
  CheckCircle,
  Target,
  ChevronRight,
  Zap,
  User,
  FileText,
  ArrowLeft,
  Edit3
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useLearningStore } from '@/store/learningStore'
import { useRouter } from 'next/navigation'
import * as Progress from '@radix-ui/react-progress'
import { moduleColorScheme } from '@/lib/constants/moduleColors'
import { cn } from '@/lib/utils/cn'
import { getYouTubeThumbnail, getThumbnailAltText } from '@/lib/youtube'
import { Video, Day } from '@/types/learning'

interface DayViewProps {
  day: Day
  moduleInfo: {
    id: string
    title: string
  }
  weekInfo: {
    id: string
    title: string
  }
  onVideoSelect: (videoId: string) => void
  onBack?: () => void
}

export function DayView({ 
  day, 
  moduleInfo,
  weekInfo,
  onVideoSelect,
  onBack
}: DayViewProps) {
  const { isVideoCompleted } = useLearningStore()
  const router = useRouter()
  
  // Calculate day progress
  const completedVideos = day.videos.filter(v => isVideoCompleted(v.id)).length
  const totalVideos = day.videos.length
  const completionPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0
  const dayCompleted = completionPercentage === 100
  const dayInProgress = completionPercentage > 0 && completionPercentage < 100
  
  // Extract day number from ID (e.g., "day-1" -> "1")
  const dayNumber = day.id.split('-').pop() || '1'
  
  // Extract module index for color coding (e.g., "module-1" -> 0, "module-2" -> 1)
  const moduleNumber = moduleInfo.id.split('-')[1]
  const moduleIndex = parseInt(moduleNumber, 10) - 1
  
  // Get module-specific colors
  const {
    dayBackgrounds,
    dayHoverBackgrounds,
    dayBorders,
    dayActiveBorders,
    textColors,
    progressBarColors
  } = moduleColorScheme
  
  return (
    <div className="h-full flex flex-col bg-blox-very-dark-blue">
      {/* Day Header */}
      <div className="p-6 border-b border-blox-medium-blue-gray bg-gradient-to-r from-blox-very-dark-blue to-blox-dark-blue">
        
        {/* Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4 text-blox-off-white hover:text-blox-teal"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Week Overview
          </Button>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Badge className="bg-gradient-to-r from-blox-teal to-blox-teal-dark text-white px-3 py-1 text-lg font-bold shadow-md">
              Day {dayNumber}
            </Badge>
            <h1 className="text-2xl font-bold text-blox-white">
              {day.title}
            </h1>
            {dayCompleted && (
              <Badge className="bg-blox-success/20 text-blox-success border-blox-success/30 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Completed
              </Badge>
            )}
          </div>
          
          {/* Day Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blox-teal" />
              <span className="text-blox-off-white">{day.estimatedTime || '2.5h'} total</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blox-purple" />
              <span className="text-blox-off-white">{totalVideos} videos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blox-success" />
              <span className="text-blox-off-white">{completedVideos} completed</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Day Progress Bar */}
      <div className="px-6 py-3 bg-blox-dark-blue/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-blox-off-white">Day Progress</span>
          <span className={cn("text-sm font-semibold", textColors[moduleIndex])}>{completionPercentage}% Complete</span>
        </div>
        <Progress.Root 
          className="relative overflow-hidden bg-blox-medium-blue-gray/30 rounded-full w-full h-2"
          value={completionPercentage}
        >
          <Progress.Indicator
            className={cn(
              "h-full w-full flex-1 transition-transform duration-500 ease-out",
              dayCompleted 
                ? 'bg-blox-success' 
                : progressBarColors[moduleIndex]
            )}
            style={{ transform: `translateX(-${100 - completionPercentage}%)` }}
          />
        </Progress.Root>
      </div>
      
      {/* Videos List */}
      <div className="flex-1 overflow-auto p-6">
        {/* Color-coded Container Card for Videos */}
        <Card className={cn(
          "mb-6 transition-all duration-200",
          dayBackgrounds[moduleIndex],
          dayActiveBorders[moduleIndex]
        )}>
          <CardHeader className="pb-4">
            <CardTitle className={cn("text-lg font-semibold flex items-center gap-2", textColors[moduleIndex])}>
              <BookOpen className="h-5 w-5" />
              Videos for Today
              <Badge variant="outline" className={cn("ml-auto", textColors[moduleIndex])}>
                {completedVideos}/{totalVideos} completed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
          {day.videos.map((video, videoIndex) => {
            const isCompleted = isVideoCompleted(video.id)
            
            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: videoIndex * 0.1 }}
              >
                {/* Check if this is an assignment */}
                {(video as any).type === 'assignment' ? (
                  <div className={cn(
                    "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all group",
                    dayBackgrounds[moduleIndex],
                    dayHoverBackgrounds[moduleIndex], 
                    dayBorders[moduleIndex]
                  )}>
                    {/* Assignment Thumbnails - Show both images side by side */}
                    <div className="flex gap-2 flex-shrink-0">
                      {(video as any).thumbnails?.map((thumbnail: string, index: number) => (
                        <div key={index} className="relative w-32 h-24 bg-blox-very-dark-blue rounded-lg overflow-hidden shadow-lg">
                          <img
                            src={thumbnail}
                            alt={`${video.title} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className={cn(
                            "absolute top-1 right-1 text-blox-very-dark-blue text-[8px] px-1 py-0.5 rounded font-bold",
                            moduleColorScheme.buttonBackgrounds[moduleIndex]
                          )}>
                            ASSIGNMENT
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-blox-white mb-1 line-clamp-2">{video.title}</h3>
                          {(video as any).subtitle && (
                            <p className={cn("text-sm font-medium", textColors[moduleIndex])}>{(video as any).subtitle}</p>
                          )}
                        </div>
                        {isCompleted && (
                          <div className="ml-2">
                            <CheckCircle className="h-6 w-6 text-blox-success flex-shrink-0" />
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-blox-off-white/80 mb-3 line-clamp-2">{(video as any).description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className={cn("h-4 w-4", textColors[moduleIndex])} />
                            <span className={cn("font-medium", textColors[moduleIndex])}>{video.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="h-4 w-4 text-blox-warning" />
                            <span className="text-blox-warning font-medium">{video.xpReward} XP</span>
                          </div>
                        </div>
                        <Button size="sm" className={cn(
                          "text-blox-very-dark-blue font-semibold",
                          moduleColorScheme.buttonBackgrounds[moduleIndex],
                          moduleColorScheme.buttonHoverBackgrounds[moduleIndex]
                        )}>
                          Start Assignment
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all group",
                      dayBackgrounds[moduleIndex],
                      dayHoverBackgrounds[moduleIndex],
                      dayBorders[moduleIndex]
                    )}
                    onClick={() => onVideoSelect(video.id)}
                  >
                  {/* Enhanced Video Thumbnail */}
                  <div className="relative w-40 h-24 bg-blox-very-dark-blue rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                    {video.youtubeId ? (
                      <>
                        <img
                          src={getYouTubeThumbnail(video.youtubeId, 'medium')}
                          alt={getThumbnailAltText(video.title, video.youtubeId)}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-blox-teal/90 rounded-full p-2">
                            <Play className="h-6 w-6 text-white fill-white" />
                          </div>
                        </div>
                        {/* Duration Badge */}
                        <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white">
                          {video.duration}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blox-medium-blue-gray to-blox-dark-blue">
                        <div className="text-center">
                          <span className="text-2xl font-bold text-blox-white/80">{videoIndex + 1}</span>
                          <p className="text-xs text-blox-off-white/60 mt-1">Video</p>
                        </div>
                      </div>
                    )}
                    {isCompleted && (
                      <div className="absolute top-1 right-1 bg-blox-success rounded-full p-1">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced Video Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`text-lg font-semibold transition-colors ${
                          isCompleted 
                            ? 'text-blox-success' 
                            : 'text-blox-white group-hover:text-blox-teal'
                        }`}>
                          {videoIndex + 1}. {video.title}
                        </h4>
                        
                        {/* Video Description */}
                        <p className="text-sm text-blox-off-white/80 mt-2 line-clamp-2">
                          {(video as any).description || "Learn the fundamentals and best practices. This video covers essential concepts you'll need to master for game development."}
                        </p>
                        
                        {/* Video Metadata */}
                        <div className="flex items-center gap-4 mt-3">
                          {video.creator === 'Coming Soon' ? (
                            <Badge className="bg-blox-warning/20 text-blox-warning border-blox-warning/30">
                              Coming Soon
                            </Badge>
                          ) : (
                            <>
                              <div className="flex items-center gap-1 text-xs text-blox-off-white/60">
                                <Clock className="h-3 w-3" />
                                <span>{video.duration}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Zap className="h-3 w-3 text-blox-teal" />
                                <span className="text-blox-teal font-semibold">+{video.xpReward} XP</span>
                              </div>
                              {video.creator && (
                                <div className="flex items-center gap-1 text-xs text-blox-light-blue-gray">
                                  <User className="h-3 w-3" />
                                  <span>{video.creator}</span>
                                </div>
                              )}
                            </>
                          )}
                          {isCompleted && (
                            <Badge className="bg-blox-success/20 text-blox-success border-blox-success/30">
                              ✓ Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Watch Button */}
                      <Button
                        size="sm"
                        className="ml-4 bg-blox-teal hover:bg-blox-teal/80 text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          onVideoSelect(video.id)
                        }}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Watch
                      </Button>
                    </div>
                  </div>
                  </div>
                )}
              </motion.div>
            )
          })}
            </div>
          </CardContent>
        </Card>
        
        {/* Practice Task */}
        {day.practiceTask && (
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-blox-purple/20 to-blox-teal/10 border border-blox-purple/30">
            <div className="flex items-start gap-3">
              <div className="bg-blox-purple/30 rounded-full p-2">
                <Target className="h-5 w-5 text-blox-purple" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blox-white mb-2 flex items-center gap-2">
                  Practice Task for Day {dayNumber}
                  <Badge className="bg-blox-purple/20 text-blox-purple border-blox-purple/30 text-xs">
                    Hands-on
                  </Badge>
                </h3>
                <p className="text-sm text-blox-off-white leading-relaxed mb-3">
                  {typeof day.practiceTask === 'string' 
                    ? day.practiceTask 
                    : day.practiceTask?.description || 'Practice task available'
                  }
                </p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4 text-xs text-blox-off-white/60">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>Complete after watching all videos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-blox-teal" />
                      <span className="text-blox-teal">+100 XP on completion</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const practiceUrl = `/learning/${moduleInfo.id}/${weekInfo.id}/${day.id}/practice`
                      console.log('Practice button clicked, navigating to:', practiceUrl)
                      router.push(practiceUrl)
                    }}
                    size="sm"
                    className={cn(
                      "text-blox-very-dark-blue font-semibold",
                      moduleColorScheme.buttonBackgrounds[moduleIndex],
                      moduleColorScheme.buttonHoverBackgrounds[moduleIndex]
                    )}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Start Practice
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}