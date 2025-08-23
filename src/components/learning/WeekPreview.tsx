'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Clock, 
  Star, 
  BookOpen, 
  CheckCircle,
  Target,
  ChevronRight,
  Calendar
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useLearningStore } from '@/store/learningStore'

// Type to match the store's expected format
interface DayProgress {
  completionPercentage: number
  xpEarned: number
  bloxEarned: number
  status: 'not_started' | 'in_progress' | 'completed'
}

interface Video {
  id: string
  title: string
  youtubeId: string
  duration: string
  xpReward: number
}

interface Day {
  id: string
  title: string
  videos: Video[]
  practiceTask?: string
  estimatedTime?: string
}

interface Week {
  id: string
  title: string
  description: string
  days: Day[]
}

interface WeekPreviewProps {
  week: Week
  onDaySelect: (dayId: string) => void
  onVideoSelect?: (videoId: string, dayId: string) => void
}

export function WeekPreview({ 
  week, 
  onDaySelect,
  onVideoSelect 
}: WeekPreviewProps) {
  const { isVideoCompleted } = useLearningStore()
  
  // Calculate day progress locally since calculateDayProgress might not exist
  const calculateDayProgress = (dayId: string): DayProgress => {
    const day = week.days.find(d => d.id === dayId)
    if (!day) return { completionPercentage: 0, xpEarned: 0, bloxEarned: 0, status: 'not_started' }
    
    const completedVideos = day.videos.filter(v => isVideoCompleted(v.id)).length
    const totalVideos = day.videos.length
    const completionPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0
    
    return {
      completionPercentage,
      xpEarned: completedVideos * 50, // Placeholder XP calculation
      bloxEarned: completedVideos * 10, // Placeholder BLOX calculation
      status: completionPercentage === 0 ? 'not_started' : completionPercentage === 100 ? 'completed' : 'in_progress'
    }
  }
  
  // Calculate total time for the week
  const totalWeekHours = week.days.reduce((acc, day) => {
    const hours = parseFloat(day.estimatedTime?.replace(/[^0-9.]/g, '') || '2.5')
    return acc + hours
  }, 0)
  
  // Calculate total videos
  const totalVideos = week.days.reduce((acc, day) => acc + day.videos.length, 0)
  
  return (
    <div className="h-full flex flex-col bg-blox-very-dark-blue">
      {/* Week Header */}
      <div className="p-6 border-b border-blox-medium-blue-gray">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-blox-white mb-2">
            {week.title}
          </h1>
          <p className="text-blox-off-white mb-4">
            {week.description || 'Navigate the new Creator Hub and master the modern Studio interface'}
          </p>
          
          {/* Week Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blox-teal" />
              <span className="text-blox-off-white">{totalWeekHours.toFixed(1)} hours total</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blox-purple" />
              <span className="text-blox-off-white">{totalVideos} videos</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blox-warning" />
              <span className="text-blox-off-white">{week.days.length} days</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Days Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {week.days.map((day, dayIndex) => {
            const dayProgress = calculateDayProgress(day.id)
            const dayNumber = dayIndex + 1
            
            return (
              <motion.div
                key={day.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: dayIndex * 0.1 }}
              >
                <Card className="glass-card border-blox-glass-border hover:border-blox-teal/50 transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className="bg-blox-teal text-white">
                            Day {dayNumber}
                          </Badge>
                          <CardTitle className="text-lg text-blox-white">
                            {day.title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-blox-off-white">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{day.estimatedTime || '2.5h'} estimated time</span>
                          </div>
                          {dayProgress.completionPercentage > 0 && (
                            <div className="flex items-center gap-1 text-blox-success">
                              <CheckCircle className="h-3 w-3" />
                              <span>{dayProgress.completionPercentage}% complete</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Videos List */}
                    <div className="space-y-3 mb-4">
                      {day.videos.map((video, videoIndex) => {
                        const isCompleted = isVideoCompleted(video.id)
                        
                        return (
                          <div
                            key={video.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-blox-second-dark-blue/30 hover:bg-blox-second-dark-blue/50 cursor-pointer transition-all group"
                            onClick={() => onVideoSelect?.(video.id, day.id)}
                          >
                            {/* Video Thumbnail or Number */}
                            <div className="relative w-20 h-12 bg-blox-very-dark-blue rounded overflow-hidden flex-shrink-0">
                              {video.youtubeId ? (
                                <>
                                  <img
                                    src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="h-5 w-5 text-white" />
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blox-medium-blue-gray">
                                  <span className="text-blox-white font-bold">{videoIndex + 1}</span>
                                </div>
                              )}
                              {isCompleted && (
                                <div className="absolute top-1 right-1">
                                  <CheckCircle className="h-4 w-4 text-blox-success" />
                                </div>
                              )}
                            </div>
                            
                            {/* Video Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-blox-white group-hover:text-blox-teal transition-colors line-clamp-1">
                                {video.title}
                              </h4>
                              <div className="flex items-center gap-3 mt-1 text-xs text-blox-off-white">
                                <span>{video.duration}</span>
                                <span className="text-blox-teal">+{video.xpReward} XP</span>
                              </div>
                            </div>
                            
                            {/* Watch Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                onVideoSelect?.(video.id, day.id)
                              }}
                            >
                              Watch
                              <Play className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Practice Task */}
                    {day.practiceTask && (
                      <div className="p-4 rounded-lg bg-blox-purple/10 border border-blox-purple/20 mb-4">
                        <div className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-blox-purple mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-blox-white mb-1">Practice Task</h4>
                            <p className="text-xs text-blox-off-white">{day.practiceTask}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Start Day Button */}
                    <Button 
                      className="w-full bg-blox-teal hover:bg-blox-teal/80 text-white"
                      onClick={() => onDaySelect(day.id)}
                    >
                      Start Day {dayNumber}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}