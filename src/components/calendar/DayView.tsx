'use client'

import React from 'react'
import { format, isToday } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Plus, Loader2, Calendar, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Todo } from '@/types/todo'
import type { ScheduleItem } from '@/types/calendar'

interface DayViewProps {
  todos: Todo[]
  schedule: ScheduleItem[]
  selectedDate: Date
  date: Date
  onDateClick: (date: Date) => void
  onTodoClick?: (todo: Todo) => void
  onCreateTodo: (date: Date, title: string) => Promise<Todo>
  onRescheduleTodo: (todoId: string, newDate: Date) => Promise<void>
  loading?: boolean
  error?: string | null
}

export function DayView({
  todos,
  schedule,
  selectedDate,
  date,
  onDateClick,
  onTodoClick,
  onCreateTodo,
  onRescheduleTodo,
  loading = false,
  error
}: DayViewProps) {
  // Generate hour slots (6 AM to 11 PM with 30-minute intervals)
  const hourSlots = Array.from({ length: 36 }, (_, i) => {
    const totalMinutes = (i * 30) + (6 * 60) // Start at 6 AM
    const hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60
    const display12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    const ampm = hour >= 12 ? 'PM' : 'AM'
    
    return {
      hour,
      minute,
      display: `${display12}:${minute.toString().padStart(2, '0')} ${ampm}`,
      isHalfHour: minute === 30,
      isWorkingHour: hour >= 9 && hour <= 17
    }
  })

  const handleQuickAddTodo = async () => {
    const title = window.prompt(`Add task for ${format(date, 'MMM d, yyyy')}:`)
    if (title?.trim()) {
      try {
        await onCreateTodo(date, title.trim())
      } catch (error) {
        console.error('Failed to create todo:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blox-teal" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Day Header */}
      <div className="border-b border-blox-second-dark-blue/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blox-teal" />
              <h2 className={cn(
                "text-xl font-semibold",
                isToday(date) ? "text-blox-teal" : "text-blox-white"
              )}>
                {format(date, 'EEEE, MMMM d, yyyy')}
              </h2>
            </div>
            
            {isToday(date) && (
              <Badge className="bg-blox-teal/20 text-blox-teal">
                Today
              </Badge>
            )}
          </div>

          {/* Day Summary */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-blox-off-white">
              {todos.length} tasks • {schedule.length} events
            </div>
            
            <Button
              size="sm"
              onClick={handleQuickAddTodo}
              className="bg-blox-teal hover:bg-blox-teal/80"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-12 h-full">
          {/* Time Column */}
          <div className="col-span-2 border-r border-blox-second-dark-blue/30">
            {hourSlots.map(({ hour, minute, display, isHalfHour, isWorkingHour }) => (
              <div 
                key={`${hour}-${minute}`}
                className={cn(
                  "h-12 px-3 py-1 text-xs text-blox-off-white/60 border-b border-blox-second-dark-blue/20 flex items-center justify-end",
                  isHalfHour && "border-b-0 border-dashed border-t",
                  isWorkingHour && "bg-blox-second-dark-blue/10"
                )}
              >
                {!isHalfHour && display}
              </div>
            ))}
          </div>

          {/* Event Column */}
          <div className="col-span-10 relative">
            {hourSlots.map(({ hour, minute, isHalfHour, isWorkingHour }, index) => (
              <div 
                key={`${hour}-${minute}`}
                className={cn(
                  "h-12 border-b border-blox-second-dark-blue/20 relative group hover:bg-blox-second-dark-blue/10 transition-colors",
                  isHalfHour && "border-b-0 border-dashed border-t",
                  isWorkingHour && "bg-blox-second-dark-blue/5"
                )}
                onClick={() => {
                  // Quick add todo at specific time
                  const title = window.prompt(`Add task at ${hour}:${minute.toString().padStart(2, '0')}:`)
                  if (title?.trim()) {
                    const taskDate = new Date(date)
                    taskDate.setHours(hour, minute)
                    onCreateTodo(taskDate, title.trim())
                  }
                }}
              >
                {/* Quick add button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Overlay todos and schedule items */}
            <div className="absolute inset-0 pointer-events-none">
              {/* All-day todos at top */}
              <div className="h-16 p-2 border-b border-blox-second-dark-blue/30 pointer-events-auto">
                <div className="text-xs font-medium text-blox-off-white/60 mb-2">All Day</div>
                <div className="flex flex-wrap gap-1">
                  {todos.filter(todo => !todo.metadata?.scheduled_time).map((todo) => (
                    <div
                      key={todo.id}
                      onClick={() => onTodoClick?.(todo)}
                      className={cn(
                        "px-2 py-1 rounded text-xs cursor-pointer flex items-center space-x-1",
                        todo.status === 'completed' ? "bg-green-500/20 text-green-400" :
                        todo.priority === 'high' ? "bg-orange-500/20 text-orange-400" :
                        todo.priority === 'urgent' ? "bg-red-500/20 text-red-400" :
                        "bg-blue-500/20 text-blue-400"
                      )}
                      title={todo.description || todo.title}
                    >
                      {todo.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                      <span className="truncate max-w-32">{todo.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timed todos and schedule items */}
              {todos.filter(todo => todo.metadata?.scheduled_time).map((todo) => {
                const scheduledTime = todo.metadata?.scheduled_time as string
                const [hourStr, minuteStr] = scheduledTime.split(':')
                const todoHour = parseInt(hourStr)
                const todoMinute = parseInt(minuteStr)
                
                // Calculate position (each half-hour slot is 48px)
                const slotIndex = ((todoHour - 6) * 2) + (todoMinute >= 30 ? 1 : 0)
                const topPosition = slotIndex * 48 + 64 // +64 for all-day section
                
                return (
                  <div
                    key={todo.id}
                    className={cn(
                      "absolute left-2 right-2 h-11 p-1 rounded pointer-events-auto cursor-pointer",
                      todo.status === 'completed' ? "bg-green-500/30" :
                      todo.priority === 'high' ? "bg-orange-500/30" :
                      todo.priority === 'urgent' ? "bg-red-500/30" :
                      "bg-blue-500/30"
                    )}
                    style={{ top: topPosition }}
                    onClick={() => onTodoClick?.(todo)}
                    title={todo.description || todo.title}
                  >
                    <div className="flex items-center space-x-1 h-full">
                      {todo.status === 'completed' && <CheckCircle className="h-3 w-3 text-green-400" />}
                      <span className="text-xs font-medium truncate">{todo.title}</span>
                    </div>
                  </div>
                )
              })}

              {/* Schedule items */}
              {schedule.map((item) => {
                const itemTime = new Date(item.scheduledDate || item.createdAt)
                const itemHour = itemTime.getHours()
                const itemMinute = itemTime.getMinutes()
                
                if (itemHour < 6 || itemHour > 23) return null
                
                const slotIndex = ((itemHour - 6) * 2) + (itemMinute >= 30 ? 1 : 0)
                const topPosition = slotIndex * 48 + 64
                
                return (
                  <div
                    key={item.id}
                    className="absolute left-2 right-2 h-11 p-1 rounded bg-purple-500/30 pointer-events-auto cursor-pointer"
                    style={{ top: topPosition }}
                    title={item.description || item.title}
                  >
                    <div className="flex items-center space-x-1 h-full">
                      <Calendar className="h-3 w-3 text-purple-400" />
                      <span className="text-xs font-medium truncate">{item.title}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}