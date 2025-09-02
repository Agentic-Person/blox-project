'use client'

import React from 'react'
import { format, isSameDay, isToday, eachDayOfInterval } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  Play,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Todo } from '@/types/todo'
import type { ScheduleItem } from '@/types/calendar'

interface AgendaViewProps {
  todos: Todo[]
  schedule: ScheduleItem[]
  selectedDate: Date
  startDate: Date
  endDate: Date
  onDateClick: (date: Date) => void
  onTodoClick?: (todo: Todo) => void
  onCreateTodo: (date: Date, title: string) => Promise<Todo>
  onRescheduleTodo: (todoId: string, newDate: Date) => Promise<void>
  loading?: boolean
  error?: string | null
}

export function AgendaView({
  todos,
  schedule,
  selectedDate,
  startDate,
  endDate,
  onDateClick,
  onTodoClick,
  onCreateTodo,
  onRescheduleTodo,
  loading = false,
  error
}: AgendaViewProps) {
  // Generate days in range
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const getItemsForDay = (date: Date) => {
    const dayTodos = todos.filter(todo => {
      if (!todo.dueDate) return false
      return isSameDay(new Date(todo.dueDate), date)
    })

    const daySchedule = schedule.filter(item => {
      const itemDate = new Date(item.scheduledDate || item.createdAt)
      return isSameDay(itemDate, date)
    })

    // Combine and sort by time
    const combined = [
      ...dayTodos.map(todo => ({ 
        type: 'todo' as const, 
        item: todo, 
        time: todo.metadata?.scheduled_time || '09:00',
        sortKey: `${todo.metadata?.scheduled_time || '09:00'}-todo-${todo.id}`
      })),
      ...daySchedule.map(item => ({ 
        type: 'schedule' as const, 
        item, 
        time: format(new Date(item.scheduledDate || item.createdAt), 'HH:mm'),
        sortKey: `${format(new Date(item.scheduledDate || item.createdAt), 'HH:mm')}-schedule-${item.id}`
      }))
    ].sort((a, b) => a.sortKey.localeCompare(b.sortKey))

    return { dayTodos, daySchedule, combined }
  }

  const handleQuickAddTodo = async (date: Date) => {
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

  const daysWithItems = days.filter(day => {
    const { combined } = getItemsForDay(day)
    return combined.length > 0
  })

  if (daysWithItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Calendar className="h-12 w-12 text-blox-off-white/40 mb-4" />
        <h3 className="text-lg font-medium text-blox-white mb-2">No upcoming tasks or events</h3>
        <p className="text-sm text-blox-off-white/60 mb-4">
          Your agenda is clear for the next 30 days
        </p>
        <Button 
          onClick={() => handleQuickAddTodo(new Date())}
          className="bg-blox-teal hover:bg-blox-teal/80"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
      {daysWithItems.map(day => {
        const { dayTodos, daySchedule, combined } = getItemsForDay(day)
        const isTodayDate = isToday(day)
        const isSelected = isSameDay(day, selectedDate)

        return (
          <Card 
            key={day.toISOString()} 
            className={cn(
              "card-hover",
              isSelected && "ring-2 ring-blox-teal/50",
              isTodayDate && "border-blox-teal/30"
            )}
          >
            <CardContent className="p-4">
              {/* Day Header */}
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={() => onDateClick(day)}
                >
                  <Calendar className={cn(
                    "h-5 w-5",
                    isTodayDate ? "text-blox-teal" : "text-blox-off-white/60"
                  )} />
                  <div>
                    <h3 className={cn(
                      "font-semibold",
                      isTodayDate ? "text-blox-teal" : "text-blox-white"
                    )}>
                      {format(day, 'EEEE, MMMM d')}
                    </h3>
                    {isTodayDate && (
                      <span className="text-xs text-blox-teal">Today</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {dayTodos.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayTodos.length} task{dayTodos.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {daySchedule.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {daySchedule.length} event{daySchedule.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleQuickAddTodo(day)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {combined.map(({ type, item, time, sortKey }) => {
                  if (type === 'todo') {
                    const todo = item as Todo
                    return (
                      <div
                        key={sortKey}
                        onClick={() => onTodoClick?.(todo)}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                          "hover:bg-blox-second-dark-blue/30",
                          todo.status === 'completed' && "opacity-75"
                        )}
                      >
                        {/* Status */}
                        <div className="flex-shrink-0">
                          {todo.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : todo.status === 'blocked' ? (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <div className={cn(
                              "w-4 h-4 rounded-full border-2",
                              todo.priority === 'urgent' ? "border-red-500" :
                              todo.priority === 'high' ? "border-orange-500" :
                              "border-blox-teal"
                            )} />
                          )}
                        </div>

                        {/* Time */}
                        <div className="flex items-center space-x-1 text-xs text-blox-off-white/60 w-16">
                          <Clock className="h-3 w-3" />
                          <span>{time}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className={cn(
                              "text-sm font-medium truncate",
                              todo.status === 'completed' ? "text-green-400 line-through" : "text-blox-white"
                            )}>
                              {todo.title}
                            </h4>

                            {/* Priority Badge */}
                            {todo.priority !== 'medium' && (
                              <Badge className={cn(
                                "text-xs px-1.5 py-0.5",
                                todo.priority === 'urgent' ? "bg-red-500/20 text-red-400" :
                                todo.priority === 'high' ? "bg-orange-500/20 text-orange-400" :
                                "bg-gray-500/20 text-gray-400"
                              )}>
                                {todo.priority}
                              </Badge>
                            )}

                            {/* Category */}
                            {todo.category && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                <Tag className="h-2 w-2 mr-1" />
                                {todo.category}
                              </Badge>
                            )}
                          </div>

                          {/* Description */}
                          {todo.description && (
                            <p className="text-xs text-blox-off-white/60 mt-1 line-clamp-1">
                              {todo.description}
                            </p>
                          )}

                          {/* Duration */}
                          {todo.estimatedMinutes && (
                            <div className="flex items-center space-x-1 mt-1 text-xs text-blox-off-white/60">
                              <Clock className="h-3 w-3" />
                              <span>{todo.estimatedMinutes} min</span>
                            </div>
                          )}
                        </div>

                        {/* Action */}
                        {todo.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )
                  } else {
                    const scheduleItem = item as ScheduleItem
                    return (
                      <div
                        key={sortKey}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
                      >
                        <Calendar className="h-4 w-4 text-purple-400 flex-shrink-0" />
                        
                        <div className="flex items-center space-x-1 text-xs text-blox-off-white/60 w-16">
                          <Clock className="h-3 w-3" />
                          <span>{time}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-purple-400 truncate">
                            {scheduleItem.title}
                          </h4>
                          {scheduleItem.description && (
                            <p className="text-xs text-blox-off-white/60 mt-1 line-clamp-1">
                              {scheduleItem.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  }
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}