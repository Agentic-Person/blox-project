'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Code, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAIJourney } from '@/hooks/useAIJourney'
import { useTodoCalendar } from '@/hooks/useTodoCalendar'
import type { ScheduleItem } from '@/types/calendar'

interface ScheduleTask {
  id: string
  type: 'video' | 'practice' | 'project' | 'review'
  title: string
  duration: number // in minutes
  scheduledTime: string // HH:MM format
  date: string
  completed: boolean
  skillId?: string
  priority?: 'high' | 'medium' | 'low'
}

interface DaySchedule {
  date: string
  tasks: ScheduleTask[]
  totalMinutes: number
  completedMinutes: number
}

type ViewMode = 'week' | 'month' | 'day'

interface AISchedulerProps {
  className?: string
  onTaskUpdate?: (task: ScheduleTask) => void
}

const taskTypeIcons = {
  video: Video,
  practice: Code,
  project: BookOpen,
  review: TrendingUp
}

const taskTypeColors = {
  video: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  practice: 'bg-green-500/20 border-green-500/50 text-green-400',
  project: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
  review: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
}

function TaskCard({ 
  task, 
  onComplete, 
  onReschedule 
}: { 
  task: ScheduleItem
  onComplete: () => void
  onReschedule: (newTime: string) => void
}) {
  const Icon = taskTypeIcons[task.taskType]
  const isCompleted = task.status === 'completed'
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02 }}
      className={`p-3 rounded-lg border ${taskTypeColors[task.taskType]} 
        ${isCompleted ? 'opacity-60' : ''} transition-all cursor-pointer group`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <div className={`p-1.5 rounded-lg ${isCompleted ? 'bg-blox-success/20' : ''}`}>
            {isCompleted ? (
              <CheckCircle className="h-4 w-4 text-blox-success" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1">
            <h5 className={`text-sm font-medium text-blox-white ${
              isCompleted ? 'line-through' : ''
            }`}>
              {task.title}
            </h5>
            <div className="flex items-center gap-2 mt-1">
              {task.startTime && (
                <>
                  <span className="text-xs text-blox-off-white/60">
                    {task.startTime}
                  </span>
                  <span className="text-xs text-blox-off-white/40">•</span>
                </>
              )}
              <span className="text-xs text-blox-off-white/60">
                {task.duration} min
              </span>
              {task.priority === 'high' && (
                <>
                  <span className="text-xs text-blox-off-white/40">•</span>
                  <Badge variant="outline" className="text-xs px-1 py-0 text-red-400 border-red-400/50">
                    Priority
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
        
        {!isCompleted && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onComplete}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
          >
            <CheckCircle className="h-4 w-4 text-blox-success" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

function DayColumn({ 
  day, 
  isToday, 
  onComplete 
}: { 
  day: DaySchedule; 
  isToday: boolean; 
  onComplete: (task: ScheduleItem) => void;
}) {
  const completionRate = day.totalMinutes > 0 
    ? Math.round((day.completedMinutes / day.totalMinutes) * 100)
    : 0

  return (
    <div className={`flex-1 min-w-[200px] ${isToday ? 'ring-2 ring-blox-teal rounded-lg' : ''}`}>
      <div className={`p-3 ${isToday ? 'bg-blox-teal/10' : 'bg-blox-second-dark-blue/30'} 
        rounded-t-lg border-b border-blox-off-white/10`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-blox-off-white/60 uppercase">
              {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
            </p>
            <p className="text-lg font-semibold text-blox-white">
              {new Date(day.date).getDate()}
            </p>
          </div>
          {isToday && (
            <Badge className="bg-blox-teal text-white">
              Today
            </Badge>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-blox-off-white/60">Progress</span>
            <span className="text-blox-white">{completionRate}%</span>
          </div>
          <div className="h-1 bg-blox-off-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blox-teal to-blox-success"
            />
          </div>
        </div>
      </div>
      
      <div className="p-3 space-y-2 bg-blox-off-white/5 rounded-b-lg min-h-[300px]">
        <AnimatePresence>
          {day.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task as ScheduleItem}
              onComplete={() => onComplete(task as ScheduleItem)}
              onReschedule={(time) => console.log('Reschedule:', task.id, time)}
            />
          ))}
        </AnimatePresence>
        
        {day.tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[200px] text-blox-off-white/40">
            <CalendarIcon className="h-8 w-8 mb-2" />
            <p className="text-sm">No tasks scheduled</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function AIScheduler({ className = '', onTaskUpdate }: AISchedulerProps) {
  const { journey, todayFocus, markTaskComplete } = useAIJourney()
  const { 
    weekSchedule, 
    loadingSchedule, 
    markScheduleCompleted, 
    error,
    refreshAll
  } = useTodoCalendar()
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentWeek, setCurrentWeek] = useState(0) // 0 = current week

  const handleCompleteTask = async (task: ScheduleItem) => {
    try {
      await markScheduleCompleted(task.id)
      if (onTaskUpdate) {
        onTaskUpdate(task as any) // Type compatibility
      }
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }
  
  // Process real schedule data into week view
  const scheduleData = useMemo(() => {
    const days: DaySchedule[] = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - today.getDay() + i + (currentWeek * 7))
      const dateStr = date.toISOString().split('T')[0]
      
      // Filter schedule items for this specific date
      const dayTasks = weekSchedule.filter(item => 
        item.scheduledDate === dateStr
      )
      
      const completedMinutes = dayTasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.duration, 0)
      
      const totalMinutes = dayTasks.reduce((sum, t) => sum + t.duration, 0)
      
      days.push({
        date: date.toISOString(),
        tasks: dayTasks as any, // Type compatibility - we'll handle the differences in the UI
        totalMinutes,
        completedMinutes
      })
    }
    
    return days
  }, [weekSchedule, currentWeek])

  const todayIndex = new Date().getDay()
  const weeklyStats = useMemo(() => {
    const totalTasks = scheduleData.reduce((sum, day) => sum + day.tasks.length, 0)
    const completedTasks = scheduleData.reduce(
      (sum, day) => sum + day.tasks.filter(t => t.completed).length, 
      0
    )
    const totalHours = scheduleData.reduce((sum, day) => sum + day.totalMinutes, 0) / 60
    const completedHours = scheduleData.reduce((sum, day) => sum + day.completedMinutes, 0) / 60
    
    return {
      totalTasks,
      completedTasks,
      totalHours: totalHours.toFixed(1),
      completedHours: completedHours.toFixed(1),
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    }
  }, [scheduleData])

  return (
    <div className={`${className}`}>
      <Card className="glass-card-teal">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blox-teal" />
                AI Learning Schedule
              </CardTitle>
              <p className="text-sm text-blox-off-white/70 mt-1">
                AI-optimized schedule based on your pace and availability
              </p>
            </div>

            {/* View Mode Selector */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={viewMode === 'week' ? 'default' : 'outline'}
                onClick={() => setViewMode('week')}
                className={viewMode === 'week' ? 'bg-blox-teal' : ''}
              >
                Week
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'month' ? 'default' : 'outline'}
                onClick={() => setViewMode('month')}
                className={viewMode === 'month' ? 'bg-blox-teal' : ''}
              >
                Month
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'day' ? 'default' : 'outline'}
                onClick={() => setViewMode('day')}
                className={viewMode === 'day' ? 'bg-blox-teal' : ''}
              >
                Day
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Week Navigation */}
          {viewMode === 'week' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentWeek(currentWeek - 1)}
                  className="text-blox-off-white/70 hover:text-blox-white"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blox-white">
                    {currentWeek === 0 ? 'This Week' : 
                     currentWeek === 1 ? 'Next Week' :
                     currentWeek === -1 ? 'Last Week' :
                     `Week of ${new Date(Date.now() + currentWeek * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}`}
                  </h3>
                  <p className="text-sm text-blox-off-white/60">
                    {weeklyStats.completedTasks}/{weeklyStats.totalTasks} tasks • 
                    {weeklyStats.completedHours}/{weeklyStats.totalHours}h
                  </p>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentWeek(currentWeek + 1)}
                  className="text-blox-off-white/70 hover:text-blox-white"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Week View */}
              {loadingSchedule ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blox-teal" />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-400 text-sm mb-4">{error}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={refreshAll}
                    className="text-xs"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-4">
                  {scheduleData.map((day, index) => (
                    <DayColumn
                      key={day.date}
                      day={day}
                      isToday={currentWeek === 0 && index === todayIndex}
                      onComplete={handleCompleteTask}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* AI Recommendations */}
          <div className="mt-6 space-y-3">
            {/* Optimal Study Time */}
            <div className="p-4 bg-gradient-to-r from-blox-teal/10 to-blox-purple/10 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blox-teal/20 rounded-lg">
                  <Sparkles className="h-4 w-4 text-blox-teal" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-blox-white mb-1">
                    Optimal Study Time Detected
                  </h4>
                  <p className="text-sm text-blox-off-white/70">
                    Based on your activity, you learn best between 2:00 PM - 5:00 PM. 
                    I've scheduled your important tasks during these hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Pace Adjustment */}
            {weeklyStats.completionRate < 50 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-blox-white mb-1">
                      Pace Adjustment Suggested
                    </h4>
                    <p className="text-sm text-blox-off-white/70">
                      You're completing fewer tasks than scheduled. Would you like me to reduce 
                      the daily workload or extend your timeline?
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        Reduce Tasks
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        Extend Timeline
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs">
                        Keep Current
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Task */}
          <div className="mt-6 pt-6 border-t border-blox-off-white/10">
            <Button 
              className="w-full bg-blox-second-dark-blue/50 hover:bg-blox-second-dark-blue/70 
                border border-blox-teal/30 hover:border-blox-teal"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Task
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}