'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Target,
  TrendingUp,
  Filter,
  Plus,
  BarChart3,
  Timer,
  Flag,
  Video,
  Code,
  BookOpen,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useCalendarTodoStore, Todo, CalendarEvent } from '@/store/calendarTodoStore'
import { useDroppable } from '@dnd-kit/core'

interface CalendarSidebarProps {
  className?: string
  onDateSelect?: (date: Date) => void
  onTodoClick?: (todo: Todo) => void
  onEventClick?: (event: CalendarEvent) => void
}

interface MiniCalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  hasEvents: boolean
  hasTodos: boolean
  eventCount: number
  todoCount: number
}

function MiniCalendarCell({
  day,
  isSelected,
  onClick
}: {
  day: MiniCalendarDay
  isSelected: boolean
  onClick: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `mini-day-${format(day.date, 'yyyy-MM-dd')}`
  })

  return (
    <motion.button
      ref={setNodeRef}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative w-8 h-8 rounded-lg text-xs font-medium transition-all
        ${!day.isCurrentMonth ? 'text-blox-off-white/30' : 'text-blox-white'}
        ${day.isToday ? 'bg-blox-teal text-white' : ''}
        ${isSelected && !day.isToday ? 'bg-blox-purple/50' : ''}
        ${!day.isToday && !isSelected ? 'hover:bg-blox-off-white/10' : ''}
        ${isOver ? 'ring-2 ring-blox-purple/50' : ''}
      `}
    >
      {format(day.date, 'd')}

      {/* Event/Todo indicators */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
        {day.hasEvents && (
          <div className="w-1 h-1 bg-blox-teal rounded-full" />
        )}
        {day.hasTodos && (
          <div className="w-1 h-1 bg-blox-purple rounded-full" />
        )}
      </div>
    </motion.button>
  )
}

function QuickTodoItem({
  todo,
  onClick,
  onComplete
}: {
  todo: Todo
  onClick?: () => void
  onComplete?: () => void
}) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444'
      case 'high': return '#f59e0b'
      case 'medium': return '#3b82f6'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && todo.status !== 'completed'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`
        group p-2 rounded-lg border-l-2 bg-blox-second-dark-blue/20
        hover:bg-blox-second-dark-blue/40 transition-colors cursor-pointer
        ${isOverdue ? 'border-red-500' : ''}
      `}
      style={{
        borderLeftColor: isOverdue ? '#ef4444' : getPriorityColor(todo.priority)
      }}
      onClick={() => onClick?.()}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium text-blox-white truncate ${
            todo.status === 'completed' ? 'line-through opacity-60' : ''
          }`}>
            {todo.title}
          </p>

          <div className="flex items-center gap-2 mt-1">
            {todo.estimated_minutes && (
              <span className="text-[10px] text-blox-off-white/60">
                {todo.estimated_minutes}min
              </span>
            )}

            {todo.auto_bumped && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 text-orange-400">
                Bumped
              </Badge>
            )}

            {isOverdue && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                Overdue
              </Badge>
            )}
          </div>
        </div>

        {todo.status !== 'completed' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onComplete?.()
            }}
          >
            <CheckCircle2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

function UpcomingEventItem({
  event,
  onClick
}: {
  event: CalendarEvent
  onClick?: () => void
}) {
  const eventTypeIcons = {
    video: Video,
    practice: Code,
    project: BookOpen,
    review: TrendingUp,
    meeting: CalendarIcon,
    break: Timer,
    custom: CalendarIcon
  }

  const Icon = eventTypeIcons[event.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-2 rounded-lg bg-blox-second-dark-blue/20 hover:bg-blox-second-dark-blue/40 transition-colors cursor-pointer"
      onClick={() => onClick?.()}
    >
      <div className="flex items-start gap-2">
        <div className="p-1 rounded" style={{ backgroundColor: `${event.color}20` }}>
          <Icon className="h-3 w-3" style={{ color: event.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-blox-white truncate">
            {event.title}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-blox-off-white/60 mt-1">
            <span>
              {format(new Date(event.start_time), 'MMM d')}
            </span>
            <span>
              {format(new Date(event.start_time), 'HH:mm')} - {format(new Date(event.end_time), 'HH:mm')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function CalendarSidebar({
  className = '',
  onDateSelect,
  onTodoClick,
  onEventClick
}: CalendarSidebarProps) {
  const {
    todos,
    events,
    currentDate,
    selectedDate,
    setCurrentDate,
    setSelectedDate,
    completeTodo
  } = useCalendarTodoStore()

  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date())

  // Generate mini calendar days
  const miniCalendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(miniCalendarDate))
    const end = endOfWeek(endOfMonth(miniCalendarDate))
    const days: MiniCalendarDay[] = []

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
        isCurrentMonth: isSameMonth(current, miniCalendarDate),
        isToday: isToday(current),
        hasEvents: dayEvents.length > 0,
        hasTodos: dayTodos.length > 0,
        eventCount: dayEvents.length,
        todoCount: dayTodos.length
      })

      current = addDays(current, 1)
    }

    return days
  }, [miniCalendarDate, events, todos])

  // Today's todos
  const todayTodos = useMemo(() => {
    const today = new Date()
    return todos.filter(todo => {
      if (todo.scheduled_date && isSameDay(new Date(todo.scheduled_date), today)) {
        return true
      }
      if (todo.due_date && isSameDay(new Date(todo.due_date), today)) {
        return true
      }
      return false
    }).sort((a, b) => {
      // Sort by priority first, then by status
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const statusOrder = { pending: 3, in_progress: 2, completed: 1 }

      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return statusOrder[b.status as keyof typeof statusOrder] - statusOrder[a.status as keyof typeof statusOrder]
    }).slice(0, 5)
  }, [todos])

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const weekFromNow = addDays(now, 7)

    return events.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate >= now && eventDate <= weekFromNow
    }).sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    ).slice(0, 5)
  }, [events])

  // Overdue todos
  const overdueTodos = useMemo(() => {
    const now = new Date()
    return todos.filter(todo =>
      todo.due_date &&
      new Date(todo.due_date) < now &&
      todo.status !== 'completed'
    ).slice(0, 3)
  }, [todos])

  // Progress stats
  const progressStats = useMemo(() => {
    const total = todos.length
    const completed = todos.filter(t => t.status === 'completed').length
    const inProgress = todos.filter(t => t.status === 'in_progress').length
    const overdue = overdueTodos.length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, inProgress, overdue, completionRate }
  }, [todos, overdueTodos])

  const handleMiniCalendarNavigation = (direction: 'prev' | 'next') => {
    setMiniCalendarDate(
      direction === 'next'
        ? addMonths(miniCalendarDate, 1)
        : subMonths(miniCalendarDate, 1)
    )
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setCurrentDate(date)
    onDateSelect?.(date)
  }

  const handleTodoComplete = async (todoId: string) => {
    await completeTodo(todoId)
  }

  return (
    <div className={`w-80 space-y-4 ${className}`}>
      {/* Mini Calendar */}
      <Card className="glass-card-teal">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {format(miniCalendarDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleMiniCalendarNavigation('prev')}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleMiniCalendarNavigation('next')}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={index} className="text-center text-xs text-blox-off-white/60 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {miniCalendarDays.map((day) => (
              <MiniCalendarCell
                key={format(day.date, 'yyyy-MM-dd')}
                day={day}
                isSelected={selectedDate ? isSameDay(day.date, selectedDate) : false}
                onClick={() => handleDateClick(day.date)}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blox-teal rounded-full" />
              <span className="text-blox-off-white/60">Events</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blox-purple rounded-full" />
              <span className="text-blox-off-white/60">Todos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card className="glass-card-teal">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-blox-off-white/70">Completion Rate</span>
                <span className="text-blox-white">{progressStats.completionRate}%</span>
              </div>
              <Progress value={progressStats.completionRate} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 rounded-lg bg-blox-success/10">
                <div className="text-lg font-semibold text-blox-success">
                  {progressStats.completed}
                </div>
                <div className="text-xs text-blox-off-white/60">Completed</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-blox-teal/10">
                <div className="text-lg font-semibold text-blox-teal">
                  {progressStats.inProgress}
                </div>
                <div className="text-xs text-blox-off-white/60">In Progress</div>
              </div>
            </div>

            {progressStats.overdue > 0 && (
              <div className="text-center p-2 rounded-lg bg-red-500/10">
                <div className="text-lg font-semibold text-red-400">
                  {progressStats.overdue}
                </div>
                <div className="text-xs text-blox-off-white/60">Overdue</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Focus */}
      <Card className="glass-card-teal">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Today's Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayTodos.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-8 w-8 mx-auto text-blox-off-white/50 mb-2" />
              <p className="text-xs text-blox-off-white/60">
                No todos scheduled for today
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {todayTodos.map((todo) => (
                  <QuickTodoItem
                    key={todo.id}
                    todo={todo}
                    onClick={() => onTodoClick?.(todo)}
                    onComplete={() => handleTodoComplete(todo.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Items */}
      {overdueTodos.length > 0 && (
        <Card className="glass-card-teal border-red-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              Overdue Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence>
                {overdueTodos.map((todo) => (
                  <QuickTodoItem
                    key={todo.id}
                    todo={todo}
                    onClick={() => onTodoClick?.(todo)}
                    onComplete={() => handleTodoComplete(todo.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card className="glass-card-teal">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence>
                {upcomingEvents.map((event) => (
                  <UpcomingEventItem
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="glass-card-teal">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
            >
              <Plus className="h-3 w-3 mr-2" />
              Add Quick Todo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
            >
              <CalendarIcon className="h-3 w-3 mr-2" />
              Schedule Event
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
            >
              <Sparkles className="h-3 w-3 mr-2" />
              Ask AI for Help
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}