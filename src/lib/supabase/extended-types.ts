/**
 * Temporary extended types for calendar and todo tables
 * These should be replaced with generated types once the migration runs
 */

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
  status: 'confirmed' | 'tentative' | 'cancelled'
  visibility: 'public' | 'private'
  created_by: string
  created_at: string
  updated_at: string
}

export interface TodoItem {
  id: string
  user_id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  scheduled_date?: string
  estimated_duration?: number
  tags: string[]
  parent_todo_id?: string
  order_index: number
  completion_notes?: string
  bump_count: number
  last_bumped_at?: string
  created_at: string
  updated_at: string
}

// Create a typed supabase client override
export interface ExtendedDatabase {
  public: {
    Tables: {
      calendar_events: {
        Row: CalendarEvent
        Insert: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>>
      }
      todos: {
        Row: TodoItem
        Insert: Omit<TodoItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TodoItem, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}