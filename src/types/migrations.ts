/**
 * Database Migration Types for Integration
 * 
 * Defines database schema types for the AI-Powered Learning System integration
 */

// Database migration types for integration
export interface TodoVideoLinkRow {
  id: string
  todo_id: string
  video_id: string
  youtube_id: string
  timestamp_start?: string
  timestamp_end?: string
  relevance_score?: number
  link_type: 'reference' | 'requirement' | 'output'
  created_at: string
  created_by: 'user' | 'ai' | 'system'
  notes?: string
}

export interface VideoProgressRow {
  id: string
  user_id: string
  youtube_id: string
  watch_progress: number  // 0-100
  last_position: number   // seconds
  total_duration: number  // seconds
  completed: boolean
  completed_at?: string
  updated_at: string
}

export interface LearningPathVideoRow {
  id: string
  path_id: string
  video_id: string
  youtube_id: string
  order_index: number
  is_required: boolean
  is_completed: boolean
  completed_at?: string
  created_at: string
}

export interface ProgressSyncLogRow {
  id: string
  event_type: string
  user_id: string
  event_data: Record<string, any>
  source_system: string
  processed: boolean
  processed_at?: string
  created_at: string
}

export interface ChatTodoSuggestionRow {
  id: string
  session_id: string
  user_id: string
  suggestion_title: string
  suggestion_description?: string
  priority: string
  category: string
  estimated_minutes: number
  confidence_score: number
  video_references: Record<string, any>[]
  auto_generated: boolean
  accepted: boolean
  accepted_at?: string
  created_at: string
}

export interface LearningPathRow {
  id: string
  user_id: string
  title: string
  description?: string
  total_videos: number
  completed_videos: number
  estimated_hours: number
  created_from: 'chat' | 'manual' | 'playlist'
  status: 'active' | 'completed' | 'paused'
  created_at: string
  completed_at?: string
}

export interface VideoTranscriptChunkRow {
  id: string
  video_id: string
  youtube_id: string
  chunk_index: number
  start_time: number
  end_time: number
  text: string
  embedding?: number[]
  todo_suggestions?: string[]
  learning_objectives?: string[]
  created_at: string
}

export interface IntegrationMetricsRow {
  id: string
  user_id: string
  metric_type: string
  metric_value: number
  metadata?: Record<string, any>
  date: string
  created_at: string
}

// Database table creation SQL types
export type CreateTableSQL = {
  tableName: string
  sql: string
  dependencies?: string[]
}

// Migration script metadata
export interface MigrationScript {
  version: string
  description: string
  tables: CreateTableSQL[]
  indexes: string[]
  functions?: string[]
  triggers?: string[]
  rollback: string[]
}