'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Play, CheckCircle } from 'lucide-react'

interface ScheduleItem {
  id: string
  title: string
  type: 'video' | 'practice' | 'review'
  duration: string
  completed: boolean
  dueTime?: string
}

const todaysTasks: ScheduleItem[] = [
  {
    id: '1',
    title: 'Complete Lighting Video',
    type: 'video',
    duration: '18 min',
    completed: false,
    dueTime: 'Due today'
  },
  {
    id: '2',
    title: 'Practice in Studio',
    type: 'practice',
    duration: '30 min',
    completed: false,
    dueTime: 'Recommended'
  }
]

export function TodaySchedule() {
  const completedTasks = todaysTasks.filter(task => task.completed).length
  const totalTasks = todaysTasks.length

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
            {completedTasks}/{totalTasks} complete
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {todaysTasks.map((task) => (
          <div 
            key={task.id}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
              task.completed 
                ? 'bg-blox-success/10 border border-blox-success/20' 
                : 'bg-blox-second-dark-blue/30 hover:bg-blox-second-dark-blue/50'
            }`}
          >
            {/* Task Status */}
            <div className="flex-shrink-0">
              {task.completed ? (
                <CheckCircle className="h-5 w-5 text-blox-success" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-blox-teal hover:bg-blox-teal/10 transition-colors" />
              )}
            </div>
            
            {/* Task Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium truncate ${
                    task.completed ? 'text-blox-success line-through' : 'text-blox-white'
                  }`}>
                    {task.title}
                  </h4>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1 text-xs text-blox-off-white">
                      <Clock className="h-3 w-3" />
                      <span>{task.duration}</span>
                    </div>
                    
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      task.dueTime === 'Due today' 
                        ? 'bg-blox-yellow/20 text-blox-yellow' 
                        : 'bg-blox-teal/20 text-blox-teal'
                    }`}>
                      {task.dueTime}
                    </span>
                  </div>
                </div>
                
                {/* Action Button */}
                {!task.completed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 h-8 w-8 p-0 text-blox-teal hover:bg-blox-teal/10"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Add More Tasks */}
        <Button
          variant="ghost"
          className="w-full mt-2 text-blox-off-white hover:text-blox-teal hover:bg-blox-second-dark-blue/50"
          size="sm"
        >
          + Add Task
        </Button>
      </CardContent>
    </Card>
  )
}