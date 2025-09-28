'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering to prevent SSR/static generation issues with Clerk
export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Plus,
  Settings,
  Download,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { FullCalendar } from '@/components/calendar/FullCalendar'
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar'
import { TodoManager } from '@/components/todos/TodoManager'
import { useCalendarTodoStore, CalendarEvent, Todo } from '@/store/calendarTodoStore'
import { useUser } from '@/lib/providers'

export default function CalendarPage() {
  const { user } = useUser()
  const {
    currentView,
    currentDate,
    todos,
    events,
    loadTodos,
    loadEvents,
    loadPreferences,
    processAutoBump,
    setSelectedTodo,
    setSelectedEvent
  } = useCalendarTodoStore()

  const [activeTab, setActiveTab] = useState<'calendar' | 'todos'>('calendar')
  const [showSidebar, setShowSidebar] = useState(true)
  const [lastAutoBumpCheck, setLastAutoBumpCheck] = useState<string | null>(null)

  // Initialize data when user is available
  useEffect(() => {
    if (!user?.id) return

    const initializeData = async () => {
      try {
        await Promise.all([
          loadPreferences(user.id),
          loadTodos(user.id),
          loadEvents(user.id, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
        ])
      } catch (error) {
        console.error('Failed to initialize calendar data:', error)
      }
    }

    initializeData()
  }, [user?.id, loadPreferences, loadTodos, loadEvents])

  // Auto-bump check (runs once per session)
  useEffect(() => {
    if (!user?.id || lastAutoBumpCheck) return

    const checkAutoBump = async () => {
      try {
        const result = await processAutoBump(user.id)
        if (result.bumpedCount > 0) {
          console.log(`Auto-bumped ${result.bumpedCount} overdue todos`)
        }
        setLastAutoBumpCheck(new Date().toISOString())
      } catch (error) {
        console.error('Auto-bump check failed:', error)
      }
    }

    // Run auto-bump check after a short delay to let initial data load
    const timer = setTimeout(checkAutoBump, 3000)
    return () => clearTimeout(timer)
  }, [user?.id, processAutoBump, lastAutoBumpCheck])

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    // TODO: Open event details modal
  }

  const handleDateClick = (date: Date) => {
    // TODO: Open create event dialog for this date
    console.log('Date clicked:', date)
  }

  const handleEventCreate = (date: Date, time?: string) => {
    // TODO: Open create event dialog
    console.log('Create event for:', date, time)
  }

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo)
    // TODO: Open todo details modal
  }

  const handleExportCalendar = () => {
    // TODO: Implement calendar export (iCal format)
    console.log('Exporting calendar...')
  }

  const handleCalendarSettings = () => {
    // TODO: Open calendar preferences modal
    console.log('Opening calendar settings...')
  }

  const stats = {
    totalTodos: todos.length,
    completedTodos: todos.filter(t => t.status === 'completed').length,
    overdueTodos: todos.filter(t =>
      t.due_date &&
      new Date(t.due_date) < new Date() &&
      t.status !== 'completed'
    ).length,
    upcomingEvents: events.filter(e =>
      new Date(e.start_time) > new Date() &&
      new Date(e.start_time) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blox-very-dark-blue to-blox-black-blue">
      {/* Header */}
      <div className="border-b border-blox-off-white/10 bg-blox-black-blue/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blox-teal/30 to-blox-purple/30 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-blox-teal" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text">
                    Learning Calendar
                  </h1>
                  <p className="text-sm text-blox-off-white/60">
                    Organize your learning journey with smart scheduling
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-blox-off-white/70 hover:text-blox-white"
              >
                {showSidebar ? 'Hide' : 'Show'} Sidebar
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blox-off-white/70 hover:text-blox-white"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCalendarSettings}>
                    <Settings className="h-4 w-4 mr-2" />
                    Calendar Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCalendar}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Calendar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Filter className="h-4 w-4 mr-2" />
                    Filter Options
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                className="bg-gradient-to-r from-blox-teal to-blox-purple"
              >
                <Plus className="h-4 w-4 mr-2" />
                Quick Add
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Card className="bg-blox-second-dark-blue/50 border-blox-off-white/10">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blox-off-white/60">Total Todos</p>
                    <p className="text-lg font-semibold text-blox-white">
                      {stats.totalTodos}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-blox-teal" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blox-second-dark-blue/50 border-blox-off-white/10">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blox-off-white/60">Completed</p>
                    <p className="text-lg font-semibold text-blox-white">
                      {stats.completedTodos}
                    </p>
                  </div>
                  <div className="w-5 h-5 bg-blox-success rounded-full" />
                </div>
              </CardContent>
            </Card>

            {stats.overdueTodos > 0 && (
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-red-400">Overdue</p>
                      <p className="text-lg font-semibold text-red-400">
                        {stats.overdueTodos}
                      </p>
                    </div>
                    <div className="w-5 h-5 bg-red-500 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-blox-second-dark-blue/50 border-blox-off-white/10">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blox-off-white/60">This Week</p>
                    <p className="text-lg font-semibold text-blox-white">
                      {stats.upcomingEvents}
                    </p>
                  </div>
                  <CalendarIcon className="h-5 w-5 text-blox-purple" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-2 bg-blox-second-dark-blue/50">
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                <TabsTrigger value="todos">Todo Manager</TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <FullCalendar
                    onEventClick={handleEventClick}
                    onDateClick={handleDateClick}
                    onEventCreate={handleEventCreate}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="todos" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <TodoManager onTodoClick={handleTodoClick} />
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <CalendarSidebar
                onTodoClick={handleTodoClick}
                onEventClick={handleEventClick}
                onDateSelect={(date) => {
                  setActiveTab('calendar')
                  handleDateClick(date)
                }}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}