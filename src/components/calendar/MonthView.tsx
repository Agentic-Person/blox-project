'use client'

import React from 'react'
import { format, isSameMonth, isSameDay, isToday, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Todo } from '@/types/todo'
import type { ScheduleItem } from '@/types/calendar'

interface MonthViewProps {
  todos: Todo[]
  schedule: ScheduleItem[]
  selectedDate: Date
  month: Date
  onDateClick: (date: Date) => void
  onTodoClick?: (todo: Todo) => void
  onCreateTodo: (date: Date, title: string) => Promise<Todo>
  onRescheduleTodo: (todoId: string, newDate: Date) => Promise<void>
  loading?: boolean
  error?: string | null
}

export function MonthView({
  todos,
  schedule,
  selectedDate,
  month,
  onDateClick,
  onTodoClick,
  onCreateTodo,
  onRescheduleTodo,
  loading = false,
  error
}: MonthViewProps) {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  
  const calendarDays = eachDayOfInterval({ 
    start: calendarStart, 
    end: calendarEnd 
  })

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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

  const handleQuickAddTodo = async (date: Date, event: React.MouseEvent) => {
    event.stopPropagation()
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
    <div className="h-full">
      {/* Month Header */}
      <div className="border-b border-blox-second-dark-blue/30 p-4">
        <h2 className="text-xl font-semibold text-blox-white">
          {format(month, 'MMMM yyyy')}
        </h2>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b border-blox-second-dark-blue/30">
        {weekDays.map(day => (
          <div 
            key={day}
            className="p-3 text-center text-sm font-medium text-blox-off-white/60 border-r border-blox-second-dark-blue/30"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1">
        {calendarDays.map(day => {
          const isCurrentMonth = isSameMonth(day, month)
          const isSelected = isSameDay(day, selectedDate)
          const isTodayDate = isToday(day)
          const dayTodos = getTodosForDay(day)
          const daySchedule = getScheduleForDay(day)

          return (
            <div 
              key={day.toISOString()}
              className={cn(
                "min-h-32 p-2 border-r border-b border-blox-second-dark-blue/30 cursor-pointer group hover:bg-blox-second-dark-blue/20 transition-colors",
                !isCurrentMonth && "bg-blox-very-dark-blue/50",
                isSelected && "bg-blox-teal/10 ring-1 ring-blox-teal/30",
                isTodayDate && "bg-blox-teal/5"
              )}
              onClick={() => onDateClick(day)}
            >
              {/* Date Header */}
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-sm font-medium",
                  !isCurrentMonth && "text-blox-off-white/40",
                  isCurrentMonth && "text-blox-white",
                  isTodayDate && "text-blox-teal"
                )}>
                  {format(day, 'd')}
                </span>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleQuickAddTodo(day, e)}
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Tasks & Events */}
              <div className="space-y-1">
                {/* Todos */}
                {dayTodos.slice(0, 2).map((todo) => (
                  <div
                    key={todo.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onTodoClick?.(todo)
                    }}
                    className={cn(
                      "text-xs p-1 rounded cursor-pointer truncate",
                      todo.status === 'completed' ? "bg-green-500/20 text-green-400" :
                      todo.priority === 'high' ? "bg-orange-500/20 text-orange-400" :
                      todo.priority === 'urgent' ? "bg-red-500/20 text-red-400" :
                      "bg-blue-500/20 text-blue-400"
                    )}
                    title={todo.title}
                  >
                    {todo.title}
                  </div>
                ))}

                {/* Schedule items */}
                {daySchedule.slice(0, 1).map((item) => (
                  <div
                    key={item.id}
                    className="text-xs p-1 rounded bg-purple-500/20 text-purple-400 truncate"
                    title={item.title}
                  >
                    {item.title}
                  </div>
                ))}

                {/* Overflow indicator */}
                {(dayTodos.length > 2 || daySchedule.length > 1) && (
                  <div className="text-xs text-blox-off-white/60 pl-1">
                    +{Math.max(dayTodos.length - 2, 0) + Math.max(daySchedule.length - 1, 0)} more
                  </div>
                )}
              </div>

              {/* Day indicator badges */}
              {(dayTodos.length > 0 || daySchedule.length > 0) && (
                <div className="flex items-center justify-end mt-2 space-x-1">
                  {dayTodos.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {dayTodos.length}
                    </Badge>
                  )}
                  {daySchedule.length > 0 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {daySchedule.length}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}