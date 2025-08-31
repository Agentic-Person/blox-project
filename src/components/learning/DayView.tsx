'use client'

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
  ArrowLeft
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useLearningStore } from '@/store/learningStore'
import * as Progress from '@radix-ui/react-progress'

interface Video {
  id: string
  title: string
  youtubeId: string
  duration: string
  xpReward: number
  creator?: string
}

interface Day {
  id: string
  title: string
  videos: Video[]
  practiceTask?: string
  estimatedTime?: string
}

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
  
  // Calculate day progress
  const completedVideos = day.videos.filter(v => isVideoCompleted(v.id)).length
  const totalVideos = day.videos.length
  const completionPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0
  const dayCompleted = completionPercentage === 100
  const dayInProgress = completionPercentage > 0 && completionPercentage < 100
  
  // Extract day number from ID (e.g., "day-1" -> "1")
  const dayNumber = day.id.split('-').pop() || '1'
  
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
          <span className="text-sm font-semibold text-blox-teal">{completionPercentage}% Complete</span>
        </div>
        <Progress.Root 
          className="relative overflow-hidden bg-blox-medium-blue-gray/30 rounded-full w-full h-2"
          value={completionPercentage}
        >
          <Progress.Indicator
            className={`h-full w-full flex-1 transition-transform duration-500 ease-out ${
              dayCompleted 
                ? 'bg-blox-success' 
                : dayInProgress 
                  ? 'bg-gradient-to-r from-blox-warning to-blox-teal'
                  : 'bg-blox-medium-blue-gray'
            }`}
            style={{ transform: `translateX(-${100 - completionPercentage}%)` }}
          />
        </Progress.Root>
      </div>
      
      {/* Videos List */}
      <div className="flex-1 overflow-auto p-6">
        <h2 className="text-lg font-semibold text-blox-white mb-4">Videos for Today</h2>
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
                <div
                  className="flex items-start gap-4 p-4 rounded-lg bg-blox-second-dark-blue/30 hover:bg-blox-second-dark-blue/50 cursor-pointer transition-all group border border-blox-glass-border hover:border-blox-teal/30"
                  onClick={() => onVideoSelect(video.id)}
                >
                  {/* Enhanced Video Thumbnail */}
                  <div className="relative w-40 h-24 bg-blox-very-dark-blue rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                    {video.youtubeId ? (
                      <>
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                          alt={video.title}
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
                          Learn the fundamentals and best practices. This video covers essential concepts you'll need to master for game development.
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
              </motion.div>
            )
          })}
        </div>
        
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
                <p className="text-sm text-blox-off-white leading-relaxed mb-3">{day.practiceTask}</p>
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}