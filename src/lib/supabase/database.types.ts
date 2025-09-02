// Database types generated from Supabase schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          discord_id: string | null
          avatar_url: string | null
          age_range: string | null
          parent_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          leader_id: string
          discord_channel_id: string | null
          recruiting: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['teams']['Insert']>
      }
      learning_progress: {
        Row: {
          id: string
          user_id: string
          content_id: string
          completed: boolean
          progress_percentage: number
          watch_time: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['learning_progress']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['learning_progress']['Insert']>
      }
      // Chat Wizard tables
      video_transcripts: {
        Row: {
          id: string
          video_id: string
          youtube_id: string
          title: string
          creator: string | null
          duration_seconds: number | null
          full_transcript: string | null
          transcript_json: any | null
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['video_transcripts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['video_transcripts']['Insert']>
      }
      transcript_chunks: {
        Row: {
          id: string
          transcript_id: string
          chunk_text: string
          chunk_index: number
          start_timestamp: string
          end_timestamp: string
          start_seconds: number
          end_seconds: number
          embedding: string | null // Vector type as string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['transcript_chunks']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['transcript_chunks']['Insert']>
      }
      common_questions: {
        Row: {
          id: string
          question_pattern: string
          question_embedding: string | null // Vector type as string
          usage_count: number
          last_used: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['common_questions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['common_questions']['Insert']>
      }
      question_answers: {
        Row: {
          id: string
          question_id: string
          answer_text: string
          video_references: any // JSONB array of video references
          confidence_score: number | null
          generated_at: string
          expires_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['question_answers']['Row'], 'id' | 'generated_at'>
        Update: Partial<Database['public']['Tables']['question_answers']['Insert']>
      }
      content_items: {
        Row: {
          id: string
          module_id: number
          week_id: number
          day_id: number
          title: string
          description: string | null
          youtube_video_id: string
          duration: number
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['content_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['content_items']['Insert']>
      }
    }
  }
}