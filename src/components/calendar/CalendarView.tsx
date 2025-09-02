'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarHeader } from './CalendarHeader'
import { DayView } from './DayView'
import { WeekView } from './WeekView'
import { MonthView } from './MonthView'
import { AgendaView } from './AgendaView'
import { useTodoCalendar } from '@/hooks/useTodoCalendar'
import { useCalendarView } from '@/hooks/useCalendarView'
import type { ScheduleItem } from '@/types/calendar'
import type { Todo } from '@/types/todo'

type ViewMode = 'day' | 'week' | 'month' | 'agenda'

interface CalendarViewProps {
  defaultView?: ViewMode
  onTodoClick?: (todo: Todo) => void
  onDateClick?: (date: Date) => void
  showMiniCalendar?: boolean
}

export function CalendarView({ 
  defaultView = 'week',
  onTodoClick,
  onDateClick,
  showMiniCalendar = true
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const {
    todos,
    todaySchedule,
    weekSchedule,
    loadingSchedule,
    loadingTodos,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    createSchedule,
    updateSchedule,
    deleteSchedule
  } = useTodoCalendar()

  const {
    currentMonth,
    currentWeek,
    currentDay,
    navigateNext,
    navigatePrevious,
    goToToday,
    goToDate,
    getWeekDays,
    getMonthDays
  } = useCalendarView(selectedDate, viewMode)

  // Filter and organize data based on current view
  const viewData = useMemo(() => {
    const startDate = viewMode === 'day' ? currentDay :
                     viewMode === 'week' ? getWeekDays()[0] :
                     viewMode === 'month' ? getMonthDays()[0] : currentDay

    const endDate = viewMode === 'day' ? currentDay :
                   viewMode === 'week' ? getWeekDays()[6] :
                   viewMode === 'month' ? getMonthDays()[getMonthDays().length - 1] : 
                   new Date(currentDay.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days for agenda

    // Filter todos and schedule items for the current view period
    const filteredTodos = todos.filter(todo => {
      if (!todo.dueDate) return viewMode === 'day' && isSameDay(new Date(), currentDay)
      const dueDate = new Date(todo.dueDate)
      return dueDate >= startDate && dueDate <= endDate
    })

    const filteredSchedule = weekSchedule.filter(item => {
      const itemDate = new Date(item.scheduledDate || item.createdAt)
      return itemDate >= startDate && itemDate <= endDate
    })

    return {
      todos: filteredTodos,
      schedule: filteredSchedule,
      startDate,
      endDate
    }
  }, [viewMode, currentDay, todos, weekSchedule, getWeekDays, getMonthDays])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    if (onDateClick) {
      onDateClick(date)
    }
  }

  const handleCreateTodoOnDate = async (date: Date, title: string) => {
    try {
      const todo = await createTodo({
        title,
        dueDate: date.toISOString(),
        status: 'pending',
        priority: 'medium'
      })
      return todo
    } catch (error) {
      console.error('Failed to create todo:', error)
      throw error
    }
  }

  const handleRescheduleTodo = async (todoId: string, newDate: Date) => {
    try {
      await updateTodo(todoId, {
        dueDate: newDate.toISOString()
      })
    } catch (error) {
      console.error('Failed to reschedule todo:', error)
      throw error
    }
  }

  const renderCalendarView = () => {
    const commonProps = {
      todos: viewData.todos,
      schedule: viewData.schedule,
      selectedDate,
      onDateClick: handleDateSelect,
      onTodoClick,
      onCreateTodo: handleCreateTodoOnDate,
      onRescheduleTodo: handleRescheduleTodo,
      loading: loadingTodos || loadingSchedule,
      error
    }

    switch (viewMode) {
      case 'day':
        return <DayView {...commonProps} date={currentDay} />
      
      case 'week':
        return <WeekView {...commonProps} weekStart={getWeekDays()[0]} />
      
      case 'month':
        return <MonthView {...commonProps} month={currentMonth} />
      
      case 'agenda':
        return (
          <AgendaView 
            {...commonProps}
            startDate={viewData.startDate}
            endDate={viewData.endDate}
          />
        )
      
      default:
        return <WeekView {...commonProps} weekStart={getWeekDays()[0]} />
    }
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <CalendarHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentDate={selectedDate}
        onNavigateNext={navigateNext}
        onNavigatePrevious={navigatePrevious}
        onToday={goToToday}
        onDateJump={goToDate}
        showMiniCalendar={showMiniCalendar}
        onMiniCalendarDateSelect={handleDateSelect}
      />

      {/* Calendar Content */}
      <Card className="card-hover">
        <CardContent className="p-0">
          {renderCalendarView()}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}