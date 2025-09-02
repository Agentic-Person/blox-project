'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Play, CheckCircle, Loader2, Plus } from 'lucide-react'
import { useTodoCalendar } from '@/hooks/useTodoCalendar'
import type { ScheduleItem } from '@/types/calendar'

const taskTypeColors = {
  video: 'bg-blue-500/20 text-blue-400',
  practice: 'bg-green-500/20 text-green-400',
  project: 'bg-purple-500/20 text-purple-400',
  review: 'bg-yellow-500/20 text-yellow-400'
}

export function TodaySchedule() {
  const { 
    todaySchedule, 
    loadingSchedule, 
    markScheduleCompleted, 
    error,
    refreshAll 
  } = useTodoCalendar()

  const completedTasks = todaySchedule.filter(task => task.status === 'completed').length
  const totalTasks = todaySchedule.length

  const handleCompleteTask = async (task: ScheduleItem) => {
    try {
      await markScheduleCompleted(task.id)
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blox-teal" />
            <CardTitle className="text-lg font-semibold text-blox-white">
              Today's Schedule
            </CardTitle>
          </div>
          
          <div className="text-sm text-blox-off-white">
            {loadingSchedule ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `${completedTasks}/${totalTasks} complete`
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {loadingSchedule ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blox-teal" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={refreshAll}
              className="text-xs"
            >
              Retry
            </Button>
          </div>
        ) : todaySchedule.length === 0 ? (
          <div className="text-center py-8 text-blox-off-white/60">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm mb-2">No tasks scheduled for today</p>
            <p className="text-xs">Add tasks to get started!</p>
          </div>
        ) : (
          todaySchedule.map((task) => (
            <div 
              key={task.id}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                task.status === 'completed'
                  ? 'bg-blox-success/10 border border-blox-success/20' 
                  : 'bg-blox-second-dark-blue/30 hover:bg-blox-second-dark-blue/50'
              }`}
            >
              {/* Task Status */}
              <div className="flex-shrink-0">
                {task.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-blox-success" />
                ) : (
                  <button
                    onClick={() => handleCompleteTask(task)}
                    className="w-5 h-5 rounded-full border-2 border-blox-teal hover:bg-blox-teal/10 transition-colors cursor-pointer"
                  />
                )}
              </div>
              
              {/* Task Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium truncate ${
                      task.status === 'completed' ? 'text-blox-success line-through' : 'text-blox-white'
                    }`}>
                      {task.title}
                    </h4>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1 text-xs text-blox-off-white">
                        <Clock className="h-3 w-3" />
                        <span>{task.duration} min</span>
                      </div>
                      
                      {task.startTime && (
                        <>
                          <span className="text-xs text-blox-off-white/40">•</span>
                          <span className="text-xs text-blox-off-white/60">
                            {task.startTime}
                          </span>
                        </>
                      )}
                      
                      <span className={`text-xs px-2 py-0.5 rounded-full ${taskTypeColors[task.taskType]}`}>
                        {task.taskType}
                      </span>
                      
                      {task.priority === 'high' && (
                        <>
                          <span className="text-xs text-blox-off-white/40">•</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                            High Priority
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  {task.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCompleteTask(task)}
                      className="ml-2 h-8 w-8 p-0 text-blox-teal hover:bg-blox-teal/10"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Add More Tasks */}
        <Button
          variant="ghost"
          className="w-full mt-2 text-blox-off-white hover:text-blox-teal hover:bg-blox-second-dark-blue/50"
          size="sm"
          onClick={refreshAll}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </CardContent>
    </Card>
  )
}