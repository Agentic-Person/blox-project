'use client'

import React from 'react'
import { format, isSameDay, isToday } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Todo } from '@/types/todo'
import type { ScheduleItem } from '@/types/calendar'

interface WeekViewProps {
  todos: Todo[]
  schedule: ScheduleItem[]
  selectedDate: Date
  weekStart: Date
  onDateClick: (date: Date) => void
  onTodoClick?: (todo: Todo) => void
  onCreateTodo: (date: Date, title: string) => Promise<Todo>
  onRescheduleTodo: (todoId: string, newDate: Date) => Promise<void>
  loading?: boolean
  error?: string | null
}

export function WeekView({
  todos,
  schedule,
  selectedDate,
  weekStart,
  onDateClick,
  onTodoClick,
  onCreateTodo,
  onRescheduleTodo,
  loading = false,
  error
}: WeekViewProps) {
  // Generate week days (Sunday to Saturday)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })

  // Generate hour slots (6 AM to 11 PM)
  const hourSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 6
    return {
      hour,
      display: hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`,
      isWorkingHour: hour >= 9 && hour <= 17
    }
  })

  const getTodosForDay = (date: Date) => {
    return todos.filter(todo => {
      if (!todo.dueDate) return false
      return isSameDay(new Date(todo.dueDate), date)
    })
  }

  const getScheduleForDay = (date: Date) => {
    return schedule.filter(item => {
      const itemDate = new Date(item.scheduledDate || item.createdAt)
      return isSameDay(itemDate, date)
    })
  }

  const handleQuickAddTodo = async (date: Date) => {
    const title = window.prompt(`Add task for ${format(date, 'MMM d')}:`)
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
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Week Header */}
        <div className="grid grid-cols-8 border-b border-blox-second-dark-blue/30">
          {/* Time Column Header */}
          <div className="p-4 border-r border-blox-second-dark-blue/30">
            <Clock className="h-4 w-4 text-blox-off-white/60" />
          </div>

          {/* Day Headers */}
          {weekDays.map((day) => (
            <div 
              key={day.toISOString()}
              className={cn(
                "p-4 text-center border-r border-blox-second-dark-blue/30 cursor-pointer hover:bg-blox-second-dark-blue/20 transition-colors",
                isSameDay(day, selectedDate) && "bg-blox-teal/10",
                isToday(day) && "bg-blox-teal/5"
              )}
              onClick={() => onDateClick(day)}
            >
              <div className="space-y-1">
                <div className="text-xs text-blox-off-white/60 uppercase">
                  {format(day, 'EEE')}
                </div>
                <div className={cn(
                  "text-lg font-medium",
                  isToday(day) ? "text-blox-teal" : "text-blox-white"
                )}>
                  {format(day, 'd')}
                </div>
                
                {/* Day Summary */}
                <div className="space-y-1">
                  {getTodosForDay(day).length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {getTodosForDay(day).length} tasks
                    </Badge>
                  )}
                  {getScheduleForDay(day).length > 0 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      {getScheduleForDay(day).length} events
                    </Badge>
                  )}
                </div>

                {/* Quick Add Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQuickAddTodo(day)
                  }}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="grid grid-cols-8">
          {/* Time Column */}
          <div className="border-r border-blox-second-dark-blue/30">
            {hourSlots.map(({ hour, display, isWorkingHour }) => (
              <div 
                key={hour}
                className={cn(
                  "h-16 p-2 text-xs text-blox-off-white/60 border-b border-blox-second-dark-blue/20",
                  isWorkingHour && "bg-blox-second-dark-blue/10"
                )}
              >
                {display}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day) => {
            const dayTodos = getTodosForDay(day)
            const daySchedule = getScheduleForDay(day)
            
            return (
              <div 
                key={day.toISOString()}
                className="border-r border-blox-second-dark-blue/30"
              >
                {hourSlots.map(({ hour, isWorkingHour }) => (
                  <div 
                    key={`${day.toISOString()}-${hour}`}
                    className={cn(
                      "h-16 p-1 border-b border-blox-second-dark-blue/20 relative group",
                      isWorkingHour && "bg-blox-second-dark-blue/5"
                    )}
                  >
                    {/* Hour slot content would go here */}
                    {/* For now, showing todos at the top of each day */}
                    {hour === 9 && dayTodos.length > 0 && (
                      <div className="space-y-1">
                        {dayTodos.slice(0, 3).map((todo) => (
                          <div
                            key={todo.id}
                            onClick={() => onTodoClick?.(todo)}
                            className={cn(
                              "text-xs p-1 rounded cursor-pointer truncate",
                              todo.priority === 'high' ? "bg-orange-500/20 text-orange-400" :
                              todo.priority === 'urgent' ? "bg-red-500/20 text-red-400" :
                              "bg-blue-500/20 text-blue-400"
                            )}
                            title={todo.title}
                          >
                            {todo.title}
                          </div>
                        ))}
                        {dayTodos.length > 3 && (
                          <div className="text-xs text-blox-off-white/60 pl-1">
                            +{dayTodos.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}