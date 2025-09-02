'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths
} from 'date-fns'

type ViewMode = 'day' | 'week' | 'month' | 'agenda'

interface MiniCalendarProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  viewMode?: ViewMode
  className?: string
}

export function MiniCalendar({ 
  selectedDate, 
  onDateSelect, 
  viewMode = 'month',
  className 
}: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  
  const calendarDays = eachDayOfInterval({ 
    start: calendarStart, 
    end: calendarEnd 
  })

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  const handleDateClick = (date: Date) => {
    onDateSelect(date)
  }

  return (
    <div className={cn("p-4 bg-blox-very-dark-blue border border-blox-glass-border rounded-lg", className)}>
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={handlePrevMonth}
          className="h-8 w-8 p-0 text-blox-off-white hover:text-blox-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h3 className="text-sm font-medium text-blox-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0 text-blox-off-white hover:text-blox-white"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div 
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-blox-off-white/60"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(day => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = isSameDay(day, selectedDate)
          const isTodayDate = isToday(day)

          return (
            <Button
              key={day.toISOString()}
              size="sm"
              variant="ghost"
              onClick={() => handleDateClick(day)}
              className={cn(
                "h-8 w-8 p-0 text-xs font-normal",
                !isCurrentMonth && "text-blox-off-white/30",
                isCurrentMonth && "text-blox-off-white hover:text-blox-white",
                isTodayDate && "bg-blox-teal/20 text-blox-teal",
                isSelected && "bg-blox-teal text-white hover:bg-blox-teal/80",
                isSelected && isTodayDate && "bg-blox-teal text-white"
              )}
            >
              {format(day, 'd')}
            </Button>
          )
        })}
      </div>

      {/* Quick Navigation */}
      <div className="mt-4 flex justify-center">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const today = new Date()
            setCurrentMonth(today)
            onDateSelect(today)
          }}
          className="text-xs border-blox-teal/30 text-blox-teal hover:bg-blox-teal/10"
        >
          Today
        </Button>
      </div>
    </div>
  )
}