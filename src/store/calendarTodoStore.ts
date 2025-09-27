import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { supabase } from '@/lib/supabase/client'
import { autoBumpService } from '@/services/autoBumpService'

// Types for the calendar and todo system
export interface Todo {
  id: string
  user_id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled' | 'archived'
  estimated_minutes?: number
  actual_minutes?: number
  due_date?: string
  scheduled_date?: string
  scheduled_time?: string
  category?: string
  tags: string[]
  order_index: number
  parent_todo_id?: string
  auto_bumped: boolean
  bump_count: number
  last_bumped_at?: string
  original_due_date?: string
  generated_from?: string
  confidence?: number
  auto_generated: boolean
  learning_objectives: string[]
  prerequisites: string[]
  video_references: any[]
  created_at: string
  updated_at: string
  completed_at?: string
  created_by: string
  assigned_to?: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description?: string
  type: 'video' | 'practice' | 'project' | 'review' | 'meeting' | 'break' | 'custom'
  start_time: string
  end_time: string
  all_day: boolean
  timezone: string
  color: string
  location?: string
  url?: string
  recurring_config?: any
  parent_event_id?: string
  recurrence_exception: boolean
  reminder_minutes: number[]
  related_todo_ids: string[]
  video_reference?: any
  status: string
  visibility: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface CalendarPreferences {
  user_id: string
  default_view: 'month' | 'week' | 'day' | 'agenda'
  start_of_week: number
  time_format: '12h' | '24h'
  work_start_time: string
  work_end_time: string
  work_days: number[]
  enable_auto_bump: boolean
  auto_bump_time: string
  max_bumps_per_task: number
  auto_reschedule: boolean
  ai_scheduling_enabled: boolean
  ai_suggestion_frequency: 'realtime' | 'daily' | 'weekly'
  preferred_study_times: string[]
  email_reminders: boolean
  push_notifications: boolean
  daily_summary: boolean
  created_at: string
  updated_at: string
}

export interface DragOperation {
  type: 'todo' | 'event'
  id: string
  source: string
  destination?: string
  newDate?: string
  newTime?: string
}

interface CalendarTodoState {
  // Data
  todos: Todo[]
  events: CalendarEvent[]
  preferences: CalendarPreferences | null

  // UI State
  currentView: 'month' | 'week' | 'day' | 'agenda'
  currentDate: Date
  selectedDate: Date | null
  selectedTodo: Todo | null
  selectedEvent: CalendarEvent | null

  // Drag and Drop
  isDragging: boolean
  dragOperation: DragOperation | null

  // Loading States
  todosLoading: boolean
  eventsLoading: boolean
  preferencesLoading: boolean

  // Filters and Search
  todoFilters: {
    status: string[]
    priority: string[]
    category: string[]
    tags: string[]
  }
  searchQuery: string

  // Auto-bump
  autoBumpQueue: Todo[]
  lastAutoBumpRun?: string

  // Actions
  // Todo Actions
  loadTodos: (userId: string, filters?: any) => Promise<void>
  createTodo: (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => Promise<Todo | null>
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  completeTodo: (id: string) => Promise<void>
  reorderTodos: (reorderedTodos: Todo[]) => Promise<void>

  // Calendar Actions
  loadEvents: (userId: string, startDate: Date, endDate: Date) => Promise<void>
  createEvent: (event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<CalendarEvent | null>
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>

  // Drag and Drop Actions
  startDrag: (operation: DragOperation) => void
  updateDrag: (updates: Partial<DragOperation>) => void
  endDrag: () => Promise<void>
  cancelDrag: () => void

  // Auto-bump Actions
  processAutoBump: (userId: string) => Promise<{
    success: boolean
    bumpedCount: number
    skippedCount: number
    errors: string[]
  }>
  scheduleAutoBump: (todos: Todo[], targetDate: string) => Promise<void>

  // View Actions
  setView: (view: 'month' | 'week' | 'day' | 'agenda') => void
  setCurrentDate: (date: Date) => void
  setSelectedDate: (date: Date | null) => void
  setSelectedTodo: (todo: Todo | null) => void
  setSelectedEvent: (event: CalendarEvent | null) => void

  // Filter Actions
  setTodoFilters: (filters: Partial<CalendarTodoState['todoFilters']>) => void
  setSearchQuery: (query: string) => void

  // Preferences Actions
  loadPreferences: (userId: string) => Promise<void>
  updatePreferences: (userId: string, updates: Partial<CalendarPreferences>) => Promise<void>

  // Utility Actions
  reset: () => void
}


export const useCalendarTodoStore = create<CalendarTodoState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        todos: [],
        events: [],
        preferences: null,

        currentView: 'week',
        currentDate: new Date(),
        selectedDate: null,
        selectedTodo: null,
        selectedEvent: null,

        isDragging: false,
        dragOperation: null,

        todosLoading: false,
        eventsLoading: false,
        preferencesLoading: false,

        todoFilters: {
          status: [],
          priority: [],
          category: [],
          tags: []
        },
        searchQuery: '',

        autoBumpQueue: [],
        lastAutoBumpRun: undefined,

        // Todo Actions
        loadTodos: async (userId: string, filters?: any) => {
          set((state) => {
            state.todosLoading = true
          })

          try {
            let query = supabase!
              .from('todos')
              .select('*')
              .eq('user_id', userId)
              .order('order_index')

            // Apply filters
            if (filters?.status?.length) {
              query = query.in('status', filters.status)
            }
            if (filters?.priority?.length) {
              query = query.in('priority', filters.priority)
            }
            if (filters?.category) {
              query = query.eq('category', filters.category)
            }

            const { data, error } = await query

            if (error) throw error

            set((state) => {
              state.todos = (data || []).filter(todo => todo.user_id) as Todo[]
              state.todosLoading = false
            })
          } catch (error) {
            console.error('Error loading todos:', error)
            set((state) => {
              state.todosLoading = false
            })
          }
        },

        createTodo: async (todoData) => {
          try {
            const { data, error } = await supabase!
              .from('todos')
              .insert([todoData])
              .select()
              .single()

            if (error) throw error

            set((state) => {
              state.todos.push(data as Todo)
            })

            return data as Todo
          } catch (error) {
            console.error('Error creating todo:', error)
            return null
          }
        },

        updateTodo: async (id: string, updates: Partial<Todo>) => {
          try {
            const { data, error } = await supabase!
              .from('todos')
              .update(updates)
              .eq('id', id)
              .select()
              .single()

            if (error) throw error

            set((state) => {
              const index = state.todos.findIndex(t => t.id === id)
              if (index !== -1) {
                state.todos[index] = { ...state.todos[index], ...data } as Todo
              }
            })
          } catch (error) {
            console.error('Error updating todo:', error)
          }
        },

        deleteTodo: async (id: string) => {
          try {
            const { error } = await supabase!
              .from('todos')
              .delete()
              .eq('id', id)

            if (error) throw error

            set((state) => {
              state.todos = state.todos.filter(t => t.id !== id)
              if (state.selectedTodo?.id === id) {
                state.selectedTodo = null
              }
            })
          } catch (error) {
            console.error('Error deleting todo:', error)
          }
        },

        completeTodo: async (id: string) => {
          const now = new Date().toISOString()
          await get().updateTodo(id, {
            status: 'completed',
            completed_at: now
          })
        },

        reorderTodos: async (reorderedTodos: Todo[]) => {
          // Update order_index for each todo
          const updates = reorderedTodos.map((todo, index) => ({
            id: todo.id,
            order_index: index
          }))

          try {
            // Batch update
            for (const update of updates) {
              await supabase!
                .from('todos')
                .update({ order_index: update.order_index })
                .eq('id', update.id)
            }

            set((state) => {
              state.todos = reorderedTodos
            })
          } catch (error) {
            console.error('Error reordering todos:', error)
          }
        },

        // Calendar Actions
        loadEvents: async (userId: string, startDate: Date, endDate: Date) => {
          set((state) => {
            state.eventsLoading = true
          })

          try {
            const { data, error } = await supabase!
              .from('calendar_events')
              .select('*')
              .eq('user_id', userId)
              .gte('start_time', startDate.toISOString())
              .lte('end_time', endDate.toISOString())
              .order('start_time')

            if (error) throw error

            set((state) => {
              state.events = (data || []).filter(event => event.user_id) as CalendarEvent[]
              state.eventsLoading = false
            })
          } catch (error) {
            console.error('Error loading events:', error)
            set((state) => {
              state.eventsLoading = false
            })
          }
        },

        createEvent: async (eventData) => {
          try {
            const { data, error } = await supabase!
              .from('calendar_events')
              .insert([eventData])
              .select()
              .single()

            if (error) throw error

            set((state) => {
              state.events.push(data as CalendarEvent)
            })

            return data as CalendarEvent
          } catch (error) {
            console.error('Error creating event:', error)
            return null
          }
        },

        updateEvent: async (id: string, updates: Partial<CalendarEvent>) => {
          try {
            const { data, error } = await supabase!
              .from('calendar_events')
              .update(updates)
              .eq('id', id)
              .select()
              .single()

            if (error) throw error

            set((state) => {
              const index = state.events.findIndex(e => e.id === id)
              if (index !== -1) {
                state.events[index] = { ...state.events[index], ...data } as CalendarEvent
              }
            })
          } catch (error) {
            console.error('Error updating event:', error)
          }
        },

        deleteEvent: async (id: string) => {
          try {
            const { error } = await supabase!
              .from('calendar_events')
              .delete()
              .eq('id', id)

            if (error) throw error

            set((state) => {
              state.events = state.events.filter(e => e.id !== id)
              if (state.selectedEvent?.id === id) {
                state.selectedEvent = null
              }
            })
          } catch (error) {
            console.error('Error deleting event:', error)
          }
        },

        // Drag and Drop Actions
        startDrag: (operation: DragOperation) => {
          set((state) => {
            state.isDragging = true
            state.dragOperation = operation
          })
        },

        updateDrag: (updates: Partial<DragOperation>) => {
          set((state) => {
            if (state.dragOperation) {
              state.dragOperation = { ...state.dragOperation, ...updates }
            }
          })
        },

        endDrag: async () => {
          const { dragOperation } = get()

          if (!dragOperation) return

          try {
            if (dragOperation.type === 'todo') {
              const todo = get().todos.find(t => t.id === dragOperation.id)
              if (todo && dragOperation.newDate) {
                await get().updateTodo(dragOperation.id, {
                  scheduled_date: dragOperation.newDate,
                  scheduled_time: dragOperation.newTime || undefined
                })
              }
            } else if (dragOperation.type === 'event') {
              const event = get().events.find(e => e.id === dragOperation.id)
              if (event && dragOperation.newDate) {
                // Calculate new start and end times
                const originalStart = new Date(event.start_time)
                const originalEnd = new Date(event.end_time)
                const duration = originalEnd.getTime() - originalStart.getTime()

                const newStart = new Date(dragOperation.newDate)
                if (dragOperation.newTime) {
                  const [hours, minutes] = dragOperation.newTime.split(':')
                  newStart.setHours(parseInt(hours), parseInt(minutes))
                } else {
                  newStart.setHours(originalStart.getHours(), originalStart.getMinutes())
                }

                const newEnd = new Date(newStart.getTime() + duration)

                await get().updateEvent(dragOperation.id, {
                  start_time: newStart.toISOString(),
                  end_time: newEnd.toISOString()
                })
              }
            }
          } catch (error) {
            console.error('Error processing drag operation:', error)
          }

          set((state) => {
            state.isDragging = false
            state.dragOperation = null
          })
        },

        cancelDrag: () => {
          set((state) => {
            state.isDragging = false
            state.dragOperation = null
          })
        },

        // Auto-bump Actions
        processAutoBump: async (userId: string) => {
          try {
            const result = await autoBumpService.processAutoBump(userId)

            if (result.success && result.bumpedCount > 0) {
              // Reload todos to reflect the changes
              await get().loadTodos(userId)

              set((state) => {
                state.lastAutoBumpRun = new Date().toISOString()
              })
            }

            return result
          } catch (error) {
            console.error('Error processing auto-bump:', error)
            return {
              success: false,
              bumpedCount: 0,
              skippedCount: 0,
              errors: [error instanceof Error ? error.message : 'Unknown error']
            }
          }
        },

        scheduleAutoBump: async (todos: Todo[], targetDate: string) => {
          try {
            const bumpPromises = todos.map(async (todo) => {
              const updates: Partial<Todo> = {
                scheduled_date: targetDate,
                auto_bumped: true,
                bump_count: todo.bump_count + 1,
                last_bumped_at: new Date().toISOString()
              }

              if (!todo.original_due_date && todo.due_date) {
                updates.original_due_date = todo.due_date
              }

              await get().updateTodo(todo.id, updates)

              // Log the bump
              await supabase!
                .from('auto_bump_logs')
                .insert({
                  todo_id: todo.id,
                  user_id: todo.user_id,
                  bump_reason: 'auto_schedule',
                  old_scheduled_date: todo.scheduled_date,
                  new_scheduled_date: targetDate,
                  old_due_date: todo.due_date,
                  new_due_date: todo.due_date, // Keep same due date
                  ai_suggested: true,
                  user_confirmed: false
                })
            })

            await Promise.all(bumpPromises)
          } catch (error) {
            console.error('Error scheduling auto-bump:', error)
          }
        },

        // View Actions
        setView: (view) => {
          set((state) => {
            state.currentView = view
          })
        },

        setCurrentDate: (date) => {
          set((state) => {
            state.currentDate = date
          })
        },

        setSelectedDate: (date) => {
          set((state) => {
            state.selectedDate = date
          })
        },

        setSelectedTodo: (todo) => {
          set((state) => {
            state.selectedTodo = todo
          })
        },

        setSelectedEvent: (event) => {
          set((state) => {
            state.selectedEvent = event
          })
        },

        // Filter Actions
        setTodoFilters: (filters) => {
          set((state) => {
            state.todoFilters = { ...state.todoFilters, ...filters }
          })
        },

        setSearchQuery: (query) => {
          set((state) => {
            state.searchQuery = query
          })
        },

        // Preferences Actions
        loadPreferences: async (userId: string) => {
          set((state) => {
            state.preferencesLoading = true
          })

          try {
            const { data, error } = await supabase!
              .from('calendar_preferences')
              .select('*')
              .eq('user_id', userId)
              .single()

            if (error && error.code !== 'PGRST116') throw error

            set((state) => {
              state.preferences = (data as CalendarPreferences) || null
              state.preferencesLoading = false
            })
          } catch (error) {
            console.error('Error loading preferences:', error)
            set((state) => {
              state.preferencesLoading = false
            })
          }
        },

        updatePreferences: async (userId: string, updates: Partial<CalendarPreferences>) => {
          try {
            const { data, error } = await supabase!
              .from('calendar_preferences')
              .upsert({ user_id: userId, ...updates })
              .select()
              .single()

            if (error) throw error

            set((state) => {
              state.preferences = data as CalendarPreferences
            })
          } catch (error) {
            console.error('Error updating preferences:', error)
          }
        },

        // Utility Actions
        reset: () => {
          set((state) => {
            state.todos = []
            state.events = []
            state.preferences = null
            state.selectedDate = null
            state.selectedTodo = null
            state.selectedEvent = null
            state.isDragging = false
            state.dragOperation = null
            state.todosLoading = false
            state.eventsLoading = false
            state.preferencesLoading = false
            state.todoFilters = {
              status: [],
              priority: [],
              category: [],
              tags: []
            }
            state.searchQuery = ''
            state.autoBumpQueue = []
            state.lastAutoBumpRun = undefined
          })
        }
      })),
      {
        name: 'calendar-todo-store',
        partialize: (state) => ({
          currentView: state.currentView,
          currentDate: state.currentDate,
          todoFilters: state.todoFilters,
          preferences: state.preferences
        })
      }
    ),
    { name: 'calendar-todo-store' }
  )
)