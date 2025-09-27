'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, startOfDay, endOfDay, addWeeks, subWeeks } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Video,
  Code,
  BookOpen,
  TrendingUp,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { useCalendarTodoStore, CalendarEvent, Todo } from '@/store/calendarTodoStore'
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useUser } from '@clerk/nextjs'

interface FullCalendarProps {
  className?: string
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  onEventCreate?: (date: Date, time?: string) => void
}

interface CalendarDay {
  date: Date
  events: CalendarEvent[]
  todos: Todo[]
  isCurrentMonth: boolean
  isToday: boolean
}

const eventTypeIcons = {
  video: Video,
  practice: Code,
  project: BookOpen,
  review: TrendingUp,
  meeting: CalendarIcon,
  break: Clock,
  custom: CalendarIcon
}

const eventTypeColors = {
  video: '#3b82f6',
  practice: '#10b981',
  project: '#8b5cf6',
  review: '#f59e0b',
  meeting: '#ef4444',
  break: '#6b7280',
  custom: '#06b6d4'
}

function EventCard({
  event,
  onClick,
  onEdit,
  onDelete,
  isDragging = false
}: {
  event: CalendarEvent
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  isDragging?: boolean
}) {
  const Icon = eventTypeIcons[event.type]
  const startTime = new Date(event.start_time)
  const endTime = new Date(event.end_time)

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `event-${event.id}`,
    data: { type: 'event', event }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: `${event.color}20`,
        borderColor: `${event.color}50`,
        color: event.color
      }}
      {...listeners}
      {...attributes}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className={`
        group relative p-2 rounded-lg border text-xs cursor-pointer
        hover:shadow-md transition-all duration-200
        ${isDragging ? 'z-50' : 'z-10'}
      `}
      onClick={() => onClick?.()}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Icon className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-blox-white">
              {event.title}
            </p>
            <p className="text-blox-off-white/60 text-[10px]">
              {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEdit?.()}>
              <Edit className="h-3 w-3 mr-2" />
              Edit Event
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onClick?.()}>
              <ExternalLink className="h-3 w-3 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-3 w-3 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.()}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {event.description && (
        <p className="text-blox-off-white/70 text-[10px] mt-1 truncate">
          {event.description}
        </p>
      )}

      {event.location && (
        <p className="text-blox-off-white/50 text-[10px] truncate">
          📍 {event.location}
        </p>
      )}
    </motion.div>
  )
}

function TodoCard({
  todo,
  onClick,
  onComplete,
  isDragging = false
}: {
  todo: Todo
  onClick?: () => void
  onComplete?: () => void
  isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `todo-${todo.id}`,
    data: { type: 'todo', todo }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444'
      case 'high': return '#f59e0b'
      case 'medium': return '#3b82f6'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeftColor: getPriorityColor(todo.priority)
      }}
      {...listeners}
      {...attributes}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className={`
        group p-2 rounded-lg border-l-2 bg-blox-second-dark-blue/30
        hover:bg-blox-second-dark-blue/50 transition-all duration-200
        text-xs cursor-pointer ${isDragging ? 'z-50' : 'z-10'}
      `}
      onClick={() => onClick?.()}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-blox-white truncate">
            {todo.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className="text-[10px] px-1 py-0"
              style={{ color: getPriorityColor(todo.priority) }}
            >
              {todo.priority}
            </Badge>
            {todo.estimated_minutes && (
              <span className="text-blox-off-white/60 text-[10px]">
                {todo.estimated_minutes}min
              </span>
            )}
            {todo.auto_bumped && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 text-orange-400">
                Bumped
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onComplete?.()
          }}
        >
          <Clock className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  )
}

function CalendarDayCell({
  day,
  onDateClick,
  onEventClick,
  onEventCreate
}: {
  day: CalendarDay
  onDateClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onEventCreate?: (date: Date) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${format(day.date, 'yyyy-MM-dd')}`
  })

  return (
    <motion.div
      ref={setNodeRef}
      layout
      className={`
        min-h-[120px] p-2 border border-blox-off-white/10
        hover:bg-blox-second-dark-blue/20 transition-colors
        ${!day.isCurrentMonth ? 'opacity-50' : ''}
        ${day.isToday ? 'bg-blox-teal/10 border-blox-teal/30' : ''}
        ${isOver ? 'bg-blox-purple/20 border-blox-purple/50' : ''}
      `}
      onClick={() => onDateClick?.(day.date)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`
          text-sm font-medium
          ${day.isToday ? 'text-blox-teal' : 'text-blox-white'}
          ${!day.isCurrentMonth ? 'text-blox-off-white/50' : ''}
        `}>
          {format(day.date, 'd')}
        </span>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onEventCreate?.(day.date)
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-1">
        <AnimatePresence>
          {day.events.slice(0, 2).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => onEventClick?.(event)}
            />
          ))}
        </AnimatePresence>

        {day.events.length > 2 && (
          <div className="text-xs text-blox-off-white/60 text-center">
            +{day.events.length - 2} more
          </div>
        )}

        <AnimatePresence>
          {day.todos.slice(0, 2).map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onClick={() => {}}
            />
          ))}
        </AnimatePresence>

        {day.todos.length > 2 && (
          <div className="text-xs text-blox-off-white/60 text-center">
            +{day.todos.length - 2} todos
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function FullCalendar({
  className = '',
  onEventClick,
  onDateClick,
  onEventCreate
}: FullCalendarProps) {
  const { user } = useUser()
  const {
    events,
    todos,
    currentView,
    currentDate,
    selectedEvent,
    loadEvents,
    loadTodos,
    setCurrentDate,
    setView,
    updateEvent,
    updateTodo,
    deleteEvent,
    startDrag,
    endDrag,
    cancelDrag,
    isDragging,
    dragOperation
  } = useCalendarTodoStore()

  // Generate calendar days based on current view
  const calendarDays = useMemo(() => {
    if (currentView === 'month') {
      const start = startOfWeek(startOfMonth(currentDate))
      const end = endOfWeek(endOfMonth(currentDate))
      const days: CalendarDay[] = []

      let current = start
      while (current <= end) {
        const dayEvents = events.filter(event =>
          isSameDay(new Date(event.start_time), current)
        )
        const dayTodos = todos.filter(todo =>
          todo.scheduled_date && isSameDay(new Date(todo.scheduled_date), current)
        )

        days.push({
          date: current,
          events: dayEvents,
          todos: dayTodos,
          isCurrentMonth: isSameMonth(current, currentDate),
          isToday: isToday(current)
        })

        current = addDays(current, 1)
      }

      return days
    }

    // For week view (simplified for now)
    const start = startOfWeek(currentDate)
    const days: CalendarDay[] = []

    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i)
      const dayEvents = events.filter(event =>
        isSameDay(new Date(event.start_time), date)
      )
      const dayTodos = todos.filter(todo =>
        todo.scheduled_date && isSameDay(new Date(todo.scheduled_date), date)
      )

      days.push({
        date,
        events: dayEvents,
        todos: dayTodos,
        isCurrentMonth: true,
        isToday: isToday(date)
      })
    }

    return days
  }, [currentDate, currentView, events, todos])

  // Load data when component mounts or date changes
  useEffect(() => {
    if (!user?.id) return

    const loadData = async () => {
      const start = currentView === 'month'
        ? startOfWeek(startOfMonth(currentDate))
        : startOfWeek(currentDate)

      const end = currentView === 'month'
        ? endOfWeek(endOfMonth(currentDate))
        : endOfWeek(currentDate)

      await Promise.all([
        loadEvents(user.id, start, end),
        loadTodos(user.id)
      ])
    }

    loadData()
  }, [user?.id, currentDate, currentView, loadEvents, loadTodos])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const data = active.data.current

    if (data?.type === 'event') {
      startDrag({
        type: 'event',
        id: data.event.id,
        source: format(new Date(data.event.start_time), 'yyyy-MM-dd')
      })
    } else if (data?.type === 'todo') {
      startDrag({
        type: 'todo',
        id: data.todo.id,
        source: data.todo.scheduled_date || 'unscheduled'
      })
    }
  }, [startDrag])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      cancelDrag()
      return
    }

    const dragId = active.id.toString()
    const dropId = over.id.toString()

    if (dropId.startsWith('day-')) {
      const newDate = dropId.replace('day-', '')

      if (dragOperation) {
        if (dragOperation.type === 'event') {
          const eventToMove = events.find(e => e.id === dragOperation.id)
          if (eventToMove) {
            const originalStart = new Date(eventToMove.start_time)
            const originalEnd = new Date(eventToMove.end_time)
            const duration = originalEnd.getTime() - originalStart.getTime()

            const newStart = new Date(newDate)
            newStart.setHours(originalStart.getHours(), originalStart.getMinutes())
            const newEnd = new Date(newStart.getTime() + duration)

            await updateEvent(eventToMove.id, {
              start_time: newStart.toISOString(),
              end_time: newEnd.toISOString()
            })
          }
        } else if (dragOperation.type === 'todo') {
          await updateTodo(dragOperation.id, {
            scheduled_date: newDate
          })
        }
      }
    }

    await endDrag()
  }, [dragOperation, events, updateEvent, updateTodo, endDrag, cancelDrag])

  const navigateCalendar = useCallback((direction: 'prev' | 'next') => {
    if (currentView === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
    } else if (currentView === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
    }
  }, [currentView, currentDate, setCurrentDate])

  const handleEventDelete = useCallback(async (eventId: string) => {
    await deleteEvent(eventId)
  }, [deleteEvent])

  return (
    <div className={`${className}`}>
      <Card className="glass-card-teal">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateCalendar('prev')}
                  className="text-blox-off-white/70 hover:text-blox-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <CardTitle className="text-xl text-blox-white">
                  {format(currentDate, currentView === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
                </CardTitle>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateCalendar('next')}
                  className="text-blox-off-white/70 hover:text-blox-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="text-blox-off-white/70 hover:text-blox-white"
              >
                Today
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={currentView === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
                className={currentView === 'month' ? 'bg-blox-teal' : ''}
              >
                Month
              </Button>
              <Button
                variant={currentView === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
                className={currentView === 'week' ? 'bg-blox-teal' : ''}
              >
                Week
              </Button>
              <Button
                variant={currentView === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('day')}
                className={currentView === 'day' ? 'bg-blox-teal' : ''}
              >
                Day
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-7 gap-0 border border-blox-off-white/10 rounded-lg overflow-hidden">
              {/* Header row with day names */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="p-3 bg-blox-second-dark-blue/30 border-b border-blox-off-white/10 text-center"
                >
                  <span className="text-sm font-medium text-blox-off-white/70">
                    {day}
                  </span>
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => (
                <CalendarDayCell
                  key={format(day.date, 'yyyy-MM-dd')}
                  day={day}
                  onDateClick={onDateClick}
                  onEventClick={onEventClick}
                  onEventCreate={onEventCreate}
                />
              ))}
            </div>

            <DragOverlay>
              {isDragging && dragOperation && (
                <div className="p-2 bg-blox-purple/20 border border-blox-purple/50 rounded-lg">
                  <p className="text-sm text-blox-white">
                    Moving {dragOperation.type}...
                  </p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  )
}