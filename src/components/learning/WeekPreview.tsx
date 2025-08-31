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
  Calendar,
  Zap,
  User,
  FileText
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useLearningStore } from '@/store/learningStore'
import * as Progress from '@radix-ui/react-progress'
import { moduleColorScheme } from '@/lib/constants/moduleColors'
import { cn } from '@/lib/utils/cn'

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
  creator?: string
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
  moduleId?: string
  onDaySelect: (dayId: string) => void
  onVideoSelect?: (videoId: string, dayId: string) => void
}

export function WeekPreview({ 
  week, 
  moduleId,
  onDaySelect,
  onVideoSelect 
}: WeekPreviewProps) {
  const { isVideoCompleted } = useLearningStore()
  
  // Get module index and colors
  const moduleIndex = moduleId ? parseInt(moduleId.split('-')[1], 10) - 1 : 0
  const { textColors, progressBarColors } = moduleColorScheme
  
  // Define static color arrays for proper Tailwind compilation
  const badgeGradients = [
    'from-blox-module-green to-blox-module-green-dark',
    'from-blox-module-blue to-blox-module-blue-dark',
    'from-blox-module-violet to-blox-module-violet-dark',
    'from-blox-module-red to-blox-module-red-dark',
    'from-blox-module-orange to-blox-module-orange-dark',
    'from-blox-module-yellow to-blox-module-yellow-dark'
  ]
  
  const playButtonColors = [
    'bg-blox-module-green/90',
    'bg-blox-module-blue/90',
    'bg-blox-module-violet/90',
    'bg-blox-module-red/90',
    'bg-blox-module-orange/90',
    'bg-blox-module-yellow/90'
  ]
  
  const buttonColors = [
    'bg-blox-module-green hover:bg-blox-module-green/80',
    'bg-blox-module-blue hover:bg-blox-module-blue/80',
    'bg-blox-module-violet hover:bg-blox-module-violet/80',
    'bg-blox-module-red hover:bg-blox-module-red/80',
    'bg-blox-module-orange hover:bg-blox-module-orange/80',
    'bg-blox-module-yellow hover:bg-blox-module-yellow/80'
  ]
  
  const startButtonColors = [
    'bg-blox-module-green hover:bg-blox-module-green/80',
    'bg-blox-module-blue hover:bg-blox-module-blue/80', 
    'bg-blox-module-violet hover:bg-blox-module-violet/80',
    'bg-blox-module-red hover:bg-blox-module-red/80',
    'bg-blox-module-orange hover:bg-blox-module-orange/80',
    'bg-blox-module-yellow hover:bg-blox-module-yellow/80'
  ]
  
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
  
  // Calculate week progress
  const weekProgress = week.days.reduce((acc, day) => {
    const progress = calculateDayProgress(day.id)
    return acc + progress.completionPercentage
  }, 0) / week.days.length
  
  return (
    <div className="h-full flex flex-col bg-blox-very-dark-blue">
      {/* Week Header */}
      <div className="p-6 border-b border-blox-medium-blue-gray bg-gradient-to-r from-blox-very-dark-blue to-blox-dark-blue">
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
              <Clock className={cn("h-4 w-4", textColors[moduleIndex])} />
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
      
      {/* Week Progress Bar */}
      <div className="px-6 py-3 bg-blox-dark-blue/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-blox-off-white">Week Progress</span>
          <span className={cn("text-sm font-semibold", textColors[moduleIndex])}>{Math.round(weekProgress)}% Complete</span>
        </div>
        <Progress.Root 
          className="relative overflow-hidden bg-blox-medium-blue-gray/30 rounded-full w-full h-2"
          value={weekProgress}
        >
          <Progress.Indicator
            className={`h-full w-full flex-1 transition-transform duration-500 ease-out ${
              weekProgress === 100 
                ? 'bg-blox-success' 
                : weekProgress > 0 
                  ? 'bg-gradient-to-r from-blox-warning to-blox-teal'
                  : 'bg-blox-medium-blue-gray'
            }`}
            style={{ transform: `translateX(-${100 - weekProgress}%)` }}
          />
        </Progress.Root>
      </div>
      
      {/* Days Grid - All Expanded */}
      <div className="flex-1 overflow-auto p-6">
        <h2 className="text-lg font-semibold text-blox-white mb-4">Daily Breakdown</h2>
        <div className="space-y-4">
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
                <Card className={`border-2 transition-all ${
                  dayProgress.status === 'completed' 
                    ? 'bg-blox-success/5 border-blox-success/30 shadow-lg shadow-blox-success/10' 
                    : dayProgress.status === 'in_progress'
                      ? 'bg-blox-warning/5 border-blox-warning/30 shadow-lg shadow-blox-warning/10'
                      : 'bg-blox-second-dark-blue/20 border-blox-glass-border hover:border-blox-teal/50 hover:shadow-lg hover:shadow-blox-teal/10'
                }`}>
                  <CardHeader className="pb-4 bg-gradient-to-r from-blox-very-dark-blue/50 to-transparent rounded-t-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={cn("bg-gradient-to-r text-white px-3 py-1 text-sm font-bold shadow-md", badgeGradients[moduleIndex])}>
                            Day {dayNumber}
                          </Badge>
                          <CardTitle className="text-xl font-bold text-blox-white">
                            {day.title}
                          </CardTitle>
                          {dayProgress.status === 'completed' && (
                            <div className="ml-auto">
                              <Badge className="bg-blox-success/20 text-blox-success border-blox-success/30 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Completed
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2 text-blox-off-white">
                            <Clock className={cn("h-4 w-4", textColors[moduleIndex])} />
                            <span className="font-medium">{day.estimatedTime || '2.5h'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-blox-off-white">
                            <BookOpen className="h-4 w-4 text-blox-purple" />
                            <span className="font-medium">{day.videos.length} videos</span>
                          </div>
                          {dayProgress.completionPercentage > 0 && dayProgress.completionPercentage < 100 && (
                            <div className={cn("flex items-center gap-2", textColors[moduleIndex])}>
                              <div className="w-20 h-2 bg-blox-medium-blue-gray/30 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blox-warning to-blox-teal transition-all duration-300"
                                  style={{ width: `${dayProgress.completionPercentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold">{dayProgress.completionPercentage}%</span>
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
                            className="flex items-start gap-4 p-4 rounded-lg bg-blox-second-dark-blue/30 hover:bg-blox-second-dark-blue/50 cursor-pointer transition-all group border border-blox-glass-border hover:border-blox-teal/30"
                            onClick={() => onVideoSelect?.(video.id, day.id)}
                          >
                            {/* Enhanced Video Thumbnail */}
                            <div className="relative w-32 h-20 bg-blox-very-dark-blue rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                              {video.youtubeId ? (
                                <>
                                  <img
                                    src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className={cn("rounded-full p-2", playButtonColors[moduleIndex])}>
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
                                  <h4 className={`text-base font-semibold transition-colors ${
                                    isCompleted 
                                      ? 'text-blox-success' 
                                      : `text-blox-white group-hover:${textColors[moduleIndex]}`
                                  }`}>
                                    {videoIndex + 1}. {video.title}
                                  </h4>
                                  
                                  {/* Video Description */}
                                  <p className="text-sm text-blox-off-white/80 mt-1 line-clamp-2">
                                    Learn the fundamentals and best practices for {video.title.toLowerCase()}. 
                                    This video covers essential concepts you'll need to master.
                                  </p>
                                  
                                  {/* Video Metadata */}
                                  <div className="flex items-center gap-4 mt-2">
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
                                          <Zap className={cn("h-3 w-3", textColors[moduleIndex])} />
                                          <span className={cn("font-semibold", textColors[moduleIndex])}>+{video.xpReward} XP</span>
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
                                  className={cn("ml-4 text-white", buttonColors[moduleIndex])}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onVideoSelect?.(video.id, day.id)
                                  }}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Watch
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Enhanced Practice Task */}
                    {day.practiceTask && (
                      <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blox-purple/20 to-blox-teal/10 border border-blox-purple/30">
                        <div className="flex items-start gap-3">
                          <div className="bg-blox-purple/30 rounded-full p-2">
                            <Target className="h-5 w-5 text-blox-purple" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-blox-white mb-2 flex items-center gap-2">
                              Practice Task for Day {dayNumber}
                              <Badge className="bg-blox-purple/20 text-blox-purple border-blox-purple/30 text-xs">
                                Hands-on
                              </Badge>
                            </h4>
                            <p className="text-sm text-blox-off-white leading-relaxed">{day.practiceTask}</p>
                            <div className="mt-3 flex items-center gap-4 text-xs text-blox-off-white/60">
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>Complete after watching videos</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className={cn("h-3 w-3", textColors[moduleIndex])} />
                                <span className={textColors[moduleIndex]}>+100 XP on completion</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Start/Continue Day Button */}
                    <Button 
                      className={`w-full text-white font-semibold ${
                        dayProgress.status === 'completed'
                          ? 'bg-blox-success hover:bg-blox-success/80'
                          : dayProgress.status === 'in_progress'
                            ? 'bg-blox-warning hover:bg-blox-warning/80'
                            : startButtonColors[moduleIndex]
                      }`}
                      onClick={() => onDaySelect(day.id)}
                    >
                      {dayProgress.status === 'completed' 
                        ? 'Review Day' 
                        : dayProgress.status === 'in_progress'
                          ? 'Continue Day'
                          : 'Start Day'} {dayNumber}
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