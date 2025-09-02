// Calendar View Hook
// Part of: Phase A Calendar View Implementation

import { useState, useMemo, useCallback } from 'react'
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  format,
  isSameDay,
  isToday,
  startOfDay
} from 'date-fns'

type ViewMode = 'day' | 'week' | 'month' | 'agenda'

interface UseCalendarViewReturn {
  currentDate: Date
  currentDay: Date
  currentWeek: Date
  currentMonth: Date
  navigateNext: () => void
  navigatePrevious: () => void
  goToToday: () => void
  goToDate: (date: Date) => void
  getWeekDays: () => Date[]
  getMonthDays: () => Date[]
  formatCurrentPeriod: () => string
  isCurrentPeriod: (date: Date) => boolean
  getHourSlots: () => string[]
  isWorkingHour: (hour: number) => boolean
}

export function useCalendarView(
  initialDate: Date = new Date(), 
  viewMode: ViewMode = 'week'
): UseCalendarViewReturn {
  const [currentDate, setCurrentDate] = useState(initialDate)

  // Computed periods based on current date
  const currentDay = useMemo(() => startOfDay(currentDate), [currentDate])
  const currentWeek = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]) // Sunday start
  const currentMonth = useMemo(() => startOfMonth(currentDate), [currentDate])

  // Navigation functions
  const navigateNext = useCallback(() => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'day':
          return addDays(prev, 1)
        case 'week':
          return addWeeks(prev, 1)
        case 'month':
          return addMonths(prev, 1)
        case 'agenda':
          return addWeeks(prev, 1) // Scroll by week for agenda
        default:
          return addWeeks(prev, 1)
      }
    })
  }, [viewMode])

  const navigatePrevious = useCallback(() => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'day':
          return subDays(prev, 1)
        case 'week':
          return subWeeks(prev, 1)
        case 'month':
          return subMonths(prev, 1)
        case 'agenda':
          return subWeeks(prev, 1)
        default:
          return subWeeks(prev, 1)
      }
    })
  }, [viewMode])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date)
  }, [])

  // Get week days (Sunday to Saturday)
  const getWeekDays = useCallback((): Date[] => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    const end = endOfWeek(currentDate, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Get month days (includes previous/next month days to fill grid)
  const getMonthDays = useCallback((): Date[] => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentDate])

  // Format current period for display
  const formatCurrentPeriod = useCallback((): string => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'MMMM d, yyyy')
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'd, yyyy')}`
        } else {
          return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
        }
      case 'month':
        return format(currentDate, 'MMMM yyyy')
      case 'agenda':
        const agendaEnd = addDays(currentDate, 30)
        return `${format(currentDate, 'MMM d')} - ${format(agendaEnd, 'MMM d, yyyy')}`
      default:
        return format(currentDate, 'MMMM yyyy')
    }
  }, [currentDate, viewMode])

  // Check if a date is in the current period
  const isCurrentPeriod = useCallback((date: Date): boolean => {
    switch (viewMode) {
      case 'day':
        return isSameDay(date, currentDate)
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
        return date >= weekStart && date <= weekEnd
      case 'month':
        return date.getMonth() === currentDate.getMonth() && 
               date.getFullYear() === currentDate.getFullYear()
      case 'agenda':
        const agendaEnd = addDays(currentDate, 30)
        return date >= currentDate && date <= agendaEnd
      default:
        return false
    }
  }, [currentDate, viewMode])

  // Get hour slots for day/week view (6 AM to 11 PM)
  const getHourSlots = useCallback((): string[] => {
    const slots: string[] = []
    for (let hour = 6; hour <= 23; hour++) {
      const time12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const ampm = hour >= 12 ? 'PM' : 'AM'
      slots.push(`${time12}:00 ${ampm}`)
      
      // Add half-hour slots for detailed scheduling
      if (hour < 23) {
        slots.push(`${time12}:30 ${ampm}`)
      }
    }
    return slots
  }, [])

  // Check if hour is within working hours (9 AM - 6 PM)
  const isWorkingHour = useCallback((hour: number): boolean => {
    return hour >= 9 && hour <= 18
  }, [])

  return {
    currentDate,
    currentDay,
    currentWeek,
    currentMonth,
    navigateNext,
    navigatePrevious,
    goToToday,
    goToDate,
    getWeekDays,
    getMonthDays,
    formatCurrentPeriod,
    isCurrentPeriod,
    getHourSlots,
    isWorkingHour
  }
}