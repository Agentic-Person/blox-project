export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auto_bump_logs: {
        Row: {
          bumped_at: string
          id: string
          todo_id: string
        }
        Insert: {
          bumped_at?: string
          id?: string
          todo_id: string
        }
        Update: {
          bumped_at?: string
          id?: string
          todo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_bump_logs_todo_id_fkey"
            columns: ["todo_id"]
            isOneToOne: false
            referencedRelation: "todos"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean
          color: string | null
          created_at: string
          description: string | null
          end_time: string
          id: string
          recurrence_rule: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          recurrence_rule?: string | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          recurrence_rule?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_preferences: {
        Row: {
          default_view: string
          enable_auto_bump: boolean
          id: string
          show_completed_todos: boolean
          todo_default_duration: number
          updated_at: string
          user_id: string
          week_starts_on: number
          working_hours_end: string
          working_hours_start: string
        }
        Insert: {
          default_view?: string
          enable_auto_bump?: boolean
          id?: string
          show_completed_todos?: boolean
          todo_default_duration?: number
          updated_at?: string
          user_id: string
          week_starts_on?: number
          working_hours_end?: string
          working_hours_start?: string
        }
        Update: {
          default_view?: string
          enable_auto_bump?: boolean
          id?: string
          show_completed_todos?: boolean
          todo_default_duration?: number
          updated_at?: string
          user_id?: string
          week_starts_on?: number
          working_hours_end?: string
          working_hours_start?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          id: string
          user_id: string | null
          session_id: string
          title: string | null
          last_message_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id: string
          title?: string | null
          last_message_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string
          title?: string | null
          last_message_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string | null
          role: string
          content: string
          video_context: Json | null
          video_references: Json | null
          suggested_questions: Json | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          role: string
          content: string
          video_context?: Json | null
          video_references?: Json | null
          suggested_questions?: Json | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string | null
          role?: string
          content?: string
          video_context?: Json | null
          video_references?: Json | null
          suggested_questions?: Json | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_queue: {
        Row: {
          amount: number
          created_at: string
          id: string
          processed: boolean
          processed_at: string | null
          reason: string
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          reason: string
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          reason?: string
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_queue_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "user_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_calendar_links: {
        Row: {
          calendar_event_id: string
          created_at: string
          id: string
          todo_id: string
        }
        Insert: {
          calendar_event_id: string
          created_at?: string
          id?: string
          todo_id: string
        }
        Update: {
          calendar_event_id?: string
          created_at?: string
          id?: string
          todo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_calendar_links_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_calendar_links_todo_id_fkey"
            columns: ["todo_id"]
            isOneToOne: false
            referencedRelation: "todos"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          auto_bump: boolean
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_bump?: boolean
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_bump?: boolean
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      token_tiers: {
        Row: {
          benefits: Json
          created_at: string
          id: string
          max_tokens: number | null
          min_tokens: number
          name: string
          updated_at: string
        }
        Insert: {
          benefits?: Json
          created_at?: string
          id?: string
          max_tokens?: number | null
          min_tokens: number
          name: string
          updated_at?: string
        }
        Update: {
          benefits?: Json
          created_at?: string
          id?: string
          max_tokens?: number | null
          min_tokens?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_ai_usage: {
        Row: {
          id: string
          user_id: string
          date: string
          question_count: number
          last_question_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          question_count?: number
          last_question_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          question_count?: number
          last_question_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          user_id: string
          data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          data?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          solana_address: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          solana_address: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          solana_address?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          id: string
          youtube_id: string
          title: string
          creator: string | null
          description: string | null
          duration: string | null
          total_minutes: number | null
          thumbnail_url: string | null
          xp_reward: number | null
          module_id: string | null
          week_id: string | null
          day_id: string | null
          order_index: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          youtube_id: string
          title: string
          creator?: string | null
          description?: string | null
          duration?: string | null
          total_minutes?: number | null
          thumbnail_url?: string | null
          xp_reward?: number | null
          module_id?: string | null
          week_id?: string | null
          day_id?: string | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          youtube_id?: string
          title?: string
          creator?: string | null
          description?: string | null
          duration?: string | null
          total_minutes?: number | null
          thumbnail_url?: string | null
          xp_reward?: number | null
          module_id?: string | null
          week_id?: string | null
          day_id?: string | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      video_progress: {
        Row: {
          id: string
          user_id: string | null
          video_id: string | null
          youtube_id: string
          watch_progress: number | null
          last_position: number | null
          total_duration: number | null
          completed: boolean | null
          completed_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          video_id?: string | null
          youtube_id: string
          watch_progress?: number | null
          last_position?: number | null
          total_duration?: number | null
          completed?: boolean | null
          completed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          video_id?: string | null
          youtube_id?: string
          watch_progress?: number | null
          last_position?: number | null
          total_duration?: number | null
          completed?: boolean | null
          completed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_transcripts: {
        Row: {
          id: string
          video_id: string | null
          youtube_id: string
          full_transcript: Json | null
          segment_count: number | null
          language: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          video_id?: string | null
          youtube_id: string
          full_transcript?: Json | null
          segment_count?: number | null
          language?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          video_id?: string | null
          youtube_id?: string
          full_transcript?: Json | null
          segment_count?: number | null
          language?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_transcripts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_transcript_chunks: {
        Row: {
          id: string
          video_id: string | null
          transcript_id: string | null
          youtube_id: string
          chunk_index: number
          start_time: number
          end_time: number
          text: string
          embedding: string | null
          todo_suggestions: string[] | null
          learning_objectives: string[] | null
          created_at: string | null
        }
        Insert: {
          id?: string
          video_id?: string | null
          transcript_id?: string | null
          youtube_id: string
          chunk_index: number
          start_time: number
          end_time: number
          text: string
          embedding?: string | null
          todo_suggestions?: string[] | null
          learning_objectives?: string[] | null
          created_at?: string | null
        }
        Update: {
          id?: string
          video_id?: string | null
          transcript_id?: string | null
          youtube_id?: string
          chunk_index?: number
          start_time?: number
          end_time?: number
          text?: string
          embedding?: string | null
          todo_suggestions?: string[] | null
          learning_objectives?: string[] | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_transcript_chunks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_transcript_chunks_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "video_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string | null
          signature: string | null
          status: string
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason?: string | null
          signature?: string | null
          status?: string
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          signature?: string | null
          status?: string
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "user_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      conversation_summaries: {
        Row: {
          id: string | null
          user_id: string | null
          session_id: string | null
          title: string | null
          last_message_at: string | null
          created_at: string | null
          total_messages: number | null
          user_messages: number | null
          assistant_messages: number | null
          last_message_created_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_ai_usage: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_conversation_title: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      get_conversation_with_messages: {
        Args: {
          p_session_id: string
          p_user_id: string
          message_limit?: number
        }
        Returns: {
          conversation_id: string
          session_id: string
          conversation_title: string
          last_message_at: string
          message_id: string
          message_role: string
          message_content: string
          message_video_context: Json
          message_video_references: Json
          message_suggested_questions: Json
          message_created_at: string
        }[]
      }
      get_user_ai_usage: {
        Args: {
          p_user_id: string
        }
        Returns: {
          question_count: number
          daily_limit: number
          remaining_questions: number
          is_premium: boolean
          date: string
        }[]
      }
      get_user_conversations: {
        Args: {
          p_user_id: string
          conversation_limit?: number
        }
        Returns: {
          conversation_id: string
          session_id: string
          title: string
          last_message_at: string
          message_count: number
        }[]
      }
      increment_ai_usage: {
        Args: {
          p_user_id: string
        }
        Returns: {
          success: boolean
          new_count: number
          remaining: number
          message: string
        }[]
      }
      search_similar_chunks: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          chunk_id: string
          video_id: string
          youtube_id: string
          video_title: string
          video_creator: string
          chunk_index: number
          start_time: number
          end_time: number
          chunk_text: string
          similarity: number
        }[]
      }
      search_video_transcripts: {
        Args: {
          search_query: string
          limit_count?: number
        }
        Returns: {
          video_id: string
          youtube_id: string
          video_title: string
          chunk_text: string
          start_time: number
          end_time: number
          relevance: number
        }[]
      }
      set_updated_at: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      update_conversation_timestamp: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      update_video_completion: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof Database["public"]["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
    ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
