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