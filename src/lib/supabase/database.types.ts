export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      auto_bump_logs: {
        Row: {
          ai_suggested: boolean | null
          bump_context: Json | null
          bump_reason: string
          created_at: string | null
          id: string
          new_due_date: string | null
          new_scheduled_date: string | null
          old_due_date: string | null
          old_scheduled_date: string | null
          todo_id: string | null
          user_confirmed: boolean | null
          user_id: string | null
        }
        Insert: {
          ai_suggested?: boolean | null
          bump_context?: Json | null
          bump_reason: string
          created_at?: string | null
          id?: string
          new_due_date?: string | null
          new_scheduled_date?: string | null
          old_due_date?: string | null
          old_scheduled_date?: string | null
          todo_id?: string | null
          user_confirmed?: boolean | null
          user_id?: string | null
        }
        Update: {
          ai_suggested?: boolean | null
          bump_context?: Json | null
          bump_reason?: string
          created_at?: string | null
          id?: string
          new_due_date?: string | null
          new_scheduled_date?: string | null
          old_due_date?: string | null
          old_scheduled_date?: string | null
          todo_id?: string | null
          user_confirmed?: boolean | null
          user_id?: string | null
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
          all_day: boolean | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string
          id: string
          location: string | null
          parent_event_id: string | null
          recurrence_exception: boolean | null
          recurring_config: Json | null
          related_todo_ids: string[] | null
          reminder_minutes: number[] | null
          start_time: string
          status: string | null
          timezone: string | null
          title: string
          type: Database["public"]["Enums"]["calendar_event_type_enum"] | null
          updated_at: string | null
          url: string | null
          user_id: string | null
          video_reference: Json | null
          visibility: string | null
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          parent_event_id?: string | null
          recurrence_exception?: boolean | null
          recurring_config?: Json | null
          related_todo_ids?: string[] | null
          reminder_minutes?: number[] | null
          start_time: string
          status?: string | null
          timezone?: string | null
          title: string
          type?: Database["public"]["Enums"]["calendar_event_type_enum"] | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          video_reference?: Json | null
          visibility?: string | null
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          parent_event_id?: string | null
          recurrence_exception?: boolean | null
          recurring_config?: Json | null
          related_todo_ids?: string[] | null
          reminder_minutes?: number[] | null
          start_time?: string
          status?: string | null
          timezone?: string | null
          title?: string
          type?: Database["public"]["Enums"]["calendar_event_type_enum"] | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          video_reference?: Json | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "upcoming_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_preferences: {
        Row: {
          ai_scheduling_enabled: boolean | null
          ai_suggestion_frequency: string | null
          auto_bump_time: string | null
          auto_reschedule: boolean | null
          created_at: string | null
          daily_summary: boolean | null
          default_view: string | null
          email_reminders: boolean | null
          enable_auto_bump: boolean | null
          max_bumps_per_task: number | null
          preferred_study_times: string[] | null
          push_notifications: boolean | null
          start_of_week: number | null
          time_format: string | null
          updated_at: string | null
          user_id: string
          work_days: number[] | null
          work_end_time: string | null
          work_start_time: string | null
        }
        Insert: {
          ai_scheduling_enabled?: boolean | null
          ai_suggestion_frequency?: string | null
          auto_bump_time?: string | null
          auto_reschedule?: boolean | null
          created_at?: string | null
          daily_summary?: boolean | null
          default_view?: string | null
          email_reminders?: boolean | null
          enable_auto_bump?: boolean | null
          max_bumps_per_task?: number | null
          preferred_study_times?: string[] | null
          push_notifications?: boolean | null
          start_of_week?: number | null
          time_format?: string | null
          updated_at?: string | null
          user_id: string
          work_days?: number[] | null
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Update: {
          ai_scheduling_enabled?: boolean | null
          ai_suggestion_frequency?: string | null
          auto_bump_time?: string | null
          auto_reschedule?: boolean | null
          created_at?: string | null
          daily_summary?: boolean | null
          default_view?: string | null
          email_reminders?: boolean | null
          enable_auto_bump?: boolean | null
          max_bumps_per_task?: number | null
          preferred_study_times?: string[] | null
          push_notifications?: boolean | null
          start_of_week?: number | null
          time_format?: string | null
          updated_at?: string | null
          user_id?: string
          work_days?: number[] | null
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Relationships: []
      }
      rewards_queue: {
        Row: {
          activity_type: string
          amount: number
          claimed: boolean | null
          claimed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          reason: string
          user_id: string | null
          xp_earned: number | null
        }
        Insert: {
          activity_type: string
          amount: number
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reason: string
          user_id?: string | null
          xp_earned?: number | null
        }
        Update: {
          activity_type?: string
          amount?: number
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reason?: string
          user_id?: string | null
          xp_earned?: number | null
        }
        Relationships: []
      }
      todo_calendar_links: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          link_type: string | null
          todo_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          link_type?: string | null
          todo_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          link_type?: string | null
          todo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "todo_calendar_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_calendar_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "upcoming_events"
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
          actual_minutes: number | null
          assigned_to: string | null
          auto_bumped: boolean | null
          auto_generated: boolean | null
          bump_count: number | null
          category: string | null
          completed_at: string | null
          confidence: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          generated_from: string | null
          id: string
          last_bumped_at: string | null
          learning_objectives: string[] | null
          order_index: number | null
          original_due_date: string | null
          parent_todo_id: string | null
          prerequisites: string[] | null
          priority: Database["public"]["Enums"]["todo_priority_enum"] | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: Database["public"]["Enums"]["todo_status_enum"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
          video_references: Json | null
        }
        Insert: {
          actual_minutes?: number | null
          assigned_to?: string | null
          auto_bumped?: boolean | null
          auto_generated?: boolean | null
          bump_count?: number | null
          category?: string | null
          completed_at?: string | null
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          generated_from?: string | null
          id?: string
          last_bumped_at?: string | null
          learning_objectives?: string[] | null
          order_index?: number | null
          original_due_date?: string | null
          parent_todo_id?: string | null
          prerequisites?: string[] | null
          priority?: Database["public"]["Enums"]["todo_priority_enum"] | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["todo_status_enum"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          video_references?: Json | null
        }
        Update: {
          actual_minutes?: number | null
          assigned_to?: string | null
          auto_bumped?: boolean | null
          auto_generated?: boolean | null
          bump_count?: number | null
          category?: string | null
          completed_at?: string | null
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          generated_from?: string | null
          id?: string
          last_bumped_at?: string | null
          learning_objectives?: string[] | null
          order_index?: number | null
          original_due_date?: string | null
          parent_todo_id?: string | null
          prerequisites?: string[] | null
          priority?: Database["public"]["Enums"]["todo_priority_enum"] | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["todo_status_enum"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          video_references?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "todos_parent_todo_id_fkey"
            columns: ["parent_todo_id"]
            isOneToOne: false
            referencedRelation: "todos"
            referencedColumns: ["id"]
          },
        ]
      }
      token_tiers: {
        Row: {
          bonus_multiplier: number | null
          current_tier: string | null
          id: string
          last_active_date: string | null
          streak_days: number | null
          total_earned: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bonus_multiplier?: number | null
          current_tier?: string | null
          id?: string
          last_active_date?: string | null
          streak_days?: number | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bonus_multiplier?: number | null
          current_tier?: string | null
          id?: string
          last_active_date?: string | null
          streak_days?: number | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          encrypted_private_key: string | null
          id: string
          is_primary: boolean | null
          migrated_at: string | null
          public_key: string
          updated_at: string | null
          user_id: string | null
          wallet_type: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          encrypted_private_key?: string | null
          id?: string
          is_primary?: boolean | null
          migrated_at?: string | null
          public_key: string
          updated_at?: string | null
          user_id?: string | null
          wallet_type?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          encrypted_private_key?: string | null
          id?: string
          is_primary?: boolean | null
          migrated_at?: string | null
          public_key?: string
          updated_at?: string | null
          user_id?: string | null
          wallet_type?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          from_wallet: string
          id: string
          metadata: Json | null
          signature: string | null
          status: string | null
          to_wallet: string
          transaction_type: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          from_wallet: string
          id?: string
          metadata?: Json | null
          signature?: string | null
          status?: string | null
          to_wallet: string
          transaction_type: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          from_wallet?: string
          id?: string
          metadata?: Json | null
          signature?: string | null
          status?: string | null
          to_wallet?: string
          transaction_type?: string
          wallet_id?: string | null
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
      upcoming_events: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          id: string | null
          location: string | null
          parent_event_id: string | null
          recurrence_exception: boolean | null
          recurring_config: Json | null
          related_todo_ids: string[] | null
          related_todo_titles: string[] | null
          reminder_minutes: number[] | null
          start_time: string | null
          status: string | null
          timezone: string | null
          title: string | null
          type: Database["public"]["Enums"]["calendar_event_type_enum"] | null
          updated_at: string | null
          url: string | null
          user_id: string | null
          video_reference: Json | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "upcoming_events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_todo_summary: {
        Row: {
          auto_bumped_todos: number | null
          avg_completion_time: number | null
          completed_todos: number | null
          in_progress_todos: number | null
          overdue_todos: number | null
          pending_todos: number | null
          total_todos: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_reward: {
        Args: {
          p_activity_type: string
          p_amount: number
          p_reason: string
          p_user_id: string
          p_xp_earned?: number
        }
        Returns: string
      }
      claim_rewards: {
        Args: { p_user_id: string }
        Returns: {
          claimed_amount: number
          transaction_id: string
        }[]
      }
      update_user_tier: {
        Args: { p_user_id: string }
        Returns: string
      }
    }
    Enums: {
      calendar_event_type_enum:
        | "video"
        | "practice"
        | "project"
        | "review"
        | "meeting"
        | "break"
        | "custom"
      todo_priority_enum: "low" | "medium" | "high" | "urgent"
      todo_status_enum:
        | "pending"
        | "in_progress"
        | "completed"
        | "blocked"
        | "cancelled"
        | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      calendar_event_type_enum: [
        "video",
        "practice",
        "project",
        "review",
        "meeting",
        "break",
        "custom",
      ],
      todo_priority_enum: ["low", "medium", "high", "urgent"],
      todo_status_enum: [
        "pending",
        "in_progress",
        "completed",
        "blocked",
        "cancelled",
        "archived",
      ],
    },
  },
} as const

