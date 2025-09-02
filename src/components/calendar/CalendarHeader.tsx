'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Today,
  Clock,
  Grid3X3,
  List,
  Eye
} from 'lucide-react'
import { MiniCalendar } from './MiniCalendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type ViewMode = 'day' | 'week' | 'month' | 'agenda'

interface CalendarHeaderProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  currentDate: Date
  onNavigateNext: () => void
  onNavigatePrevious: () => void
  onToday: () => void
  onDateJump: (date: Date) => void
  showMiniCalendar?: boolean
  onMiniCalendarDateSelect?: (date: Date) => void
}

const viewModeConfig = {
  day: { icon: Clock, label: 'Day' },
  week: { icon: Grid3X3, label: 'Week' },
  month: { icon: CalendarIcon, label: 'Month' },
  agenda: { icon: List, label: 'Agenda' }
}

export function CalendarHeader({
  viewMode,
  onViewModeChange,
  currentDate,
  onNavigateNext,
  onNavigatePrevious,
  onToday,
  onDateJump,
  showMiniCalendar = true,
  onMiniCalendarDateSelect
}: CalendarHeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  const formatPeriod = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy')
      case 'week':
        // Get week range
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'd, yyyy')}`
        } else {
          return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
        }
      case 'month':
        return format(currentDate, 'MMMM yyyy')
      case 'agenda':
        const agendaEnd = new Date(currentDate)
        agendaEnd.setDate(agendaEnd.getDate() + 30)
        return `${format(currentDate, 'MMM d')} - ${format(agendaEnd, 'MMM d, yyyy')}`
      default:
        return format(currentDate, 'MMMM yyyy')
    }
  }

  const handleMiniCalendarSelect = (date: Date) => {
    onDateJump(date)
    if (onMiniCalendarDateSelect) {
      onMiniCalendarDateSelect(date)
    }
    setShowDatePicker(false)
  }

  return (
    <div className="flex items-center justify-between p-4 bg-blox-second-dark-blue/20 rounded-lg border border-blox-second-dark-blue/30">
      {/* Left: Period Navigation */}
      <div className="flex items-center space-x-4">
        {/* Navigation Buttons */}
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onNavigatePrevious}
            className="h-8 w-8 p-0 text-blox-off-white hover:text-blox-white hover:bg-blox-second-dark-blue/50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onNavigateNext}
            className="h-8 w-8 p-0 text-blox-off-white hover:text-blox-white hover:bg-blox-second-dark-blue/50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onToday}
            className="h-8 ml-2 text-xs border-blox-teal/30 text-blox-teal hover:bg-blox-teal/10"
          >
            <Today className="h-3 w-3 mr-1" />
            Today
          </Button>
        </div>

        {/* Current Period Display */}
        <div className="flex items-center space-x-2">
          {showMiniCalendar ? (
            <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-medium text-lg text-blox-white hover:text-blox-teal"
                >
                  {formatPeriod()}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-auto">
                <DialogHeader>
                  <DialogTitle>Jump to Date</DialogTitle>
                </DialogHeader>
                <MiniCalendar
                  selectedDate={currentDate}
                  onDateSelect={handleMiniCalendarSelect}
                  viewMode={viewMode}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <h2 className="font-medium text-lg text-blox-white">
              {formatPeriod()}
            </h2>
          )}
        </div>
      </div>

      {/* Right: View Mode Selector */}
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-blox-second-dark-blue/50 text-blox-white hover:bg-blox-second-dark-blue/50"
            >
              <Eye className="h-4 w-4 mr-2" />
              {viewModeConfig[viewMode].label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(viewModeConfig).map(([mode, config]) => {
              const Icon = config.icon
              return (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => onViewModeChange(mode as ViewMode)}
                  className={cn(
                    viewMode === mode && "bg-blox-teal/10 text-blox-teal"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {config.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick View Mode Buttons */}
        <div className="hidden sm:flex items-center space-x-1">
          {Object.entries(viewModeConfig).map(([mode, config]) => {
            const Icon = config.icon
            return (
              <Button
                key={mode}
                size="sm"
                variant={viewMode === mode ? "default" : "ghost"}
                onClick={() => onViewModeChange(mode as ViewMode)}
                className={cn(
                  "h-8 w-8 p-0",
                  viewMode === mode 
                    ? "bg-blox-teal hover:bg-blox-teal/80 text-white"
                    : "text-blox-off-white hover:text-blox-white hover:bg-blox-second-dark-blue/50"
                )}
                title={config.label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}