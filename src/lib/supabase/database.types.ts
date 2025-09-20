export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_key: string
          achievement_type: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          metadata: Json | null
          points: number | null
          title: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_key: string
          achievement_type: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          points?: number | null
          title: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_key?: string
          achievement_type?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          points?: number | null
          title?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_activity_logs: {
        Row: {
          action: string
          admin_email: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_email: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          permissions: Json | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_journey_chat: {
        Row: {
          attachments: Json | null
          context_data: Json | null
          created_at: string | null
          id: string
          journey_id: string | null
          message_content: string
          message_role: string
          suggestions: Json | null
        }
        Insert: {
          attachments?: Json | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          journey_id?: string | null
          message_content: string
          message_role: string
          suggestions?: Json | null
        }
        Update: {
          attachments?: Json | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          journey_id?: string | null
          message_content?: string
          message_role?: string
          suggestions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_journey_chat_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "ai_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_journey_chat_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "user_journey_summary"
            referencedColumns: ["journey_id"]
          },
        ]
      }
      ai_journey_insights: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          insight_type: string
          is_read: boolean | null
          journey_id: string | null
          message: string
          metadata: Json | null
          priority: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          insight_type: string
          is_read?: boolean | null
          journey_id?: string | null
          message: string
          metadata?: Json | null
          priority?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_read?: boolean | null
          journey_id?: string | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_journey_insights_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "ai_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_journey_insights_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "user_journey_summary"
            referencedColumns: ["journey_id"]
          },
        ]
      }
      ai_journey_preferences: {
        Row: {
          created_at: string | null
          id: string
          learning_pace: string | null
          notification_settings: Json | null
          preferred_study_times: Json | null
          ui_preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          learning_pace?: string | null
          notification_settings?: Json | null
          preferred_study_times?: Json | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          learning_pace?: string | null
          notification_settings?: Json | null
          preferred_study_times?: Json | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_journey_schedule: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          duration_minutes: number
          id: string
          journey_id: string | null
          module_id: string | null
          priority: string | null
          scheduled_date: string
          skill_id: string | null
          task_description: string | null
          task_title: string
          task_type: string
          updated_at: string | null
          video_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes: number
          id?: string
          journey_id?: string | null
          module_id?: string | null
          priority?: string | null
          scheduled_date: string
          skill_id?: string | null
          task_description?: string | null
          task_title: string
          task_type: string
          updated_at?: string | null
          video_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          journey_id?: string | null
          module_id?: string | null
          priority?: string | null
          scheduled_date?: string
          skill_id?: string | null
          task_description?: string | null
          task_title?: string
          task_type?: string
          updated_at?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_journey_schedule_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "ai_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_journey_schedule_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "user_journey_summary"
            referencedColumns: ["journey_id"]
          },
        ]
      }
      ai_journey_skills: {
        Row: {
          completed_at: string | null
          created_at: string | null
          estimated_hours: number | null
          id: string
          journey_id: string | null
          skill_description: string | null
          skill_icon: string | null
          skill_id: string
          skill_name: string
          skill_order: number
          started_at: string | null
          status: string | null
          updated_at: string | null
          video_count: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          estimated_hours?: number | null
          id?: string
          journey_id?: string | null
          skill_description?: string | null
          skill_icon?: string | null
          skill_id: string
          skill_name: string
          skill_order: number
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          video_count?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          estimated_hours?: number | null
          id?: string
          journey_id?: string | null
          skill_description?: string | null
          skill_icon?: string | null
          skill_id?: string
          skill_name?: string
          skill_order?: number
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          video_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_journey_skills_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "ai_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_journey_skills_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "user_journey_summary"
            referencedColumns: ["journey_id"]
          },
        ]
      }
      ai_journeys: {
        Row: {
          created_at: string | null
          current_day: number | null
          current_module: string | null
          current_skill_id: string | null
          current_week: number | null
          custom_goal: string | null
          game_title: string
          game_type: string
          id: string
          last_activity_date: string | null
          streak_days: number | null
          total_progress: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_day?: number | null
          current_module?: string | null
          current_skill_id?: string | null
          current_week?: number | null
          custom_goal?: string | null
          game_title: string
          game_type: string
          id?: string
          last_activity_date?: string | null
          streak_days?: number | null
          total_progress?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_day?: number | null
          current_module?: string | null
          current_skill_id?: string | null
          current_week?: number | null
          custom_goal?: string | null
          game_title?: string
          game_type?: string
          id?: string
          last_activity_date?: string | null
          streak_days?: number | null
          total_progress?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      common_questions: {
        Row: {
          created_at: string | null
          id: string
          last_used: string | null
          question_embedding: string | null
          question_pattern: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_used?: string | null
          question_embedding?: string | null
          question_pattern: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_used?: string | null
          question_embedding?: string | null
          question_pattern?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      extraction_logs: {
        Row: {
          action: string
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          error_stack: string | null
          id: string
          input_size: number | null
          metadata: Json | null
          method: string | null
          output_size: number | null
          retry_count: number | null
          status: string
          video_queue_id: string | null
          youtube_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          input_size?: number | null
          metadata?: Json | null
          method?: string | null
          output_size?: number | null
          retry_count?: number | null
          status: string
          video_queue_id?: string | null
          youtube_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          input_size?: number | null
          metadata?: Json | null
          method?: string | null
          output_size?: number | null
          retry_count?: number | null
          status?: string
          video_queue_id?: string | null
          youtube_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_logs_video_queue_id_fkey"
            columns: ["video_queue_id"]
            isOneToOne: false
            referencedRelation: "video_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_steps: {
        Row: {
          completed_at: string | null
          completion_criteria: string | null
          created_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          learning_path_id: string
          metadata: Json | null
          resources: Json | null
          status: string | null
          step_order: number
          step_type: string
          title: string
          todo_id: string | null
          updated_at: string | null
          video_references: Json | null
        }
        Insert: {
          completed_at?: string | null
          completion_criteria?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          learning_path_id: string
          metadata?: Json | null
          resources?: Json | null
          status?: string | null
          step_order: number
          step_type: string
          title: string
          todo_id?: string | null
          updated_at?: string | null
          video_references?: Json | null
        }
        Update: {
          completed_at?: string | null
          completion_criteria?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          learning_path_id?: string
          metadata?: Json | null
          resources?: Json | null
          status?: string | null
          step_order?: number
          step_type?: string
          title?: string
          todo_id?: string | null
          updated_at?: string | null
          video_references?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_steps_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_steps_todo_id_fkey"
            columns: ["todo_id"]
            isOneToOne: false
            referencedRelation: "todos"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          estimated_hours: number | null
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          name: string
          tags: string[] | null
          template_data: Json
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          name: string
          tags?: string[] | null
          template_data: Json
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          name?: string
          tags?: string[] | null
          template_data?: Json
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      learning_paths: {
        Row: {
          ai_generated: boolean | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          goal_analysis: Json | null
          id: string
          journey_id: string | null
          metadata: Json | null
          name: string
          progress_percentage: number | null
          status: string | null
          template_id: string | null
          total_estimated_hours: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          goal_analysis?: Json | null
          id?: string
          journey_id?: string | null
          metadata?: Json | null
          name: string
          progress_percentage?: number | null
          status?: string | null
          template_id?: string | null
          total_estimated_hours?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          goal_analysis?: Json | null
          id?: string
          journey_id?: string | null
          metadata?: Json | null
          name?: string
          progress_percentage?: number | null
          status?: string | null
          template_id?: string | null
          total_estimated_hours?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "ai_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "user_journey_summary"
            referencedColumns: ["journey_id"]
          },
        ]
      }
      processing_stats: {
        Row: {
          api_calls_openai: number | null
          api_calls_youtube: number | null
          average_processing_time_ms: number | null
          chunks_created: number | null
          created_at: string | null
          date: string | null
          embeddings_generated: number | null
          error_rate: number | null
          id: string
          success_rate: number | null
          total_processing_time_ms: number | null
          transcripts_extracted: number | null
          updated_at: string | null
          videos_added: number | null
          videos_failed: number | null
          videos_processed: number | null
          videos_retried: number | null
        }
        Insert: {
          api_calls_openai?: number | null
          api_calls_youtube?: number | null
          average_processing_time_ms?: number | null
          chunks_created?: number | null
          created_at?: string | null
          date?: string | null
          embeddings_generated?: number | null
          error_rate?: number | null
          id?: string
          success_rate?: number | null
          total_processing_time_ms?: number | null
          transcripts_extracted?: number | null
          updated_at?: string | null
          videos_added?: number | null
          videos_failed?: number | null
          videos_processed?: number | null
          videos_retried?: number | null
        }
        Update: {
          api_calls_openai?: number | null
          api_calls_youtube?: number | null
          average_processing_time_ms?: number | null
          chunks_created?: number | null
          created_at?: string | null
          date?: string | null
          embeddings_generated?: number | null
          error_rate?: number | null
          id?: string
          success_rate?: number | null
          total_processing_time_ms?: number | null
          transcripts_extracted?: number | null
          updated_at?: string | null
          videos_added?: number | null
          videos_failed?: number | null
          videos_processed?: number | null
          videos_retried?: number | null
        }
        Relationships: []
      }
      progress_conflicts: {
        Row: {
          conflict_details: Json | null
          conflict_type: string
          conflicting_event_id: string
          created_at: string | null
          id: string
          primary_event_id: string
          resolution_status: string | null
          resolution_strategy: string | null
          resolved_at: string | null
          user_id: string
        }
        Insert: {
          conflict_details?: Json | null
          conflict_type: string
          conflicting_event_id: string
          created_at?: string | null
          id?: string
          primary_event_id: string
          resolution_status?: string | null
          resolution_strategy?: string | null
          resolved_at?: string | null
          user_id: string
        }
        Update: {
          conflict_details?: Json | null
          conflict_type?: string
          conflicting_event_id?: string
          created_at?: string | null
          id?: string
          primary_event_id?: string
          resolution_status?: string | null
          resolution_strategy?: string | null
          resolved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_conflicts_conflicting_event_id_fkey"
            columns: ["conflicting_event_id"]
            isOneToOne: false
            referencedRelation: "progress_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_conflicts_primary_event_id_fkey"
            columns: ["primary_event_id"]
            isOneToOne: false
            referencedRelation: "progress_events"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_events: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          error_details: string | null
          event_data: Json
          event_type: string
          id: string
          processed_at: string | null
          source_system: string
          sync_status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_details?: string | null
          event_data: Json
          event_type: string
          id?: string
          processed_at?: string | null
          source_system: string
          sync_status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_details?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          processed_at?: string | null
          source_system?: string
          sync_status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      question_answers: {
        Row: {
          answer_text: string
          confidence_score: number | null
          expires_at: string | null
          generated_at: string | null
          id: string
          question_id: string | null
          video_references: Json
        }
        Insert: {
          answer_text: string
          confidence_score?: number | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          question_id?: string | null
          video_references: Json
        }
        Update: {
          answer_text?: string
          confidence_score?: number | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          question_id?: string | null
          video_references?: Json
        }
        Relationships: [
          {
            foreignKeyName: "question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "common_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_workers: {
        Row: {
          created_at: string | null
          current_task: string | null
          errors_encountered: number | null
          id: string
          last_heartbeat: string | null
          started_at: string | null
          status: string | null
          tasks_processed: number | null
          updated_at: string | null
          worker_name: string
        }
        Insert: {
          created_at?: string | null
          current_task?: string | null
          errors_encountered?: number | null
          id?: string
          last_heartbeat?: string | null
          started_at?: string | null
          status?: string | null
          tasks_processed?: number | null
          updated_at?: string | null
          worker_name: string
        }
        Update: {
          created_at?: string | null
          current_task?: string | null
          errors_encountered?: number | null
          id?: string
          last_heartbeat?: string | null
          started_at?: string | null
          status?: string | null
          tasks_processed?: number | null
          updated_at?: string | null
          worker_name?: string
        }
        Relationships: []
      }
      schedule_conflicts: {
        Row: {
          conflict_details: Json | null
          conflict_type: string
          conflicting_schedule_id: string | null
          created_at: string | null
          detected_at: string | null
          id: string
          primary_schedule_id: string
          resolution_action: string | null
          resolution_status: string | null
          resolved_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conflict_details?: Json | null
          conflict_type: string
          conflicting_schedule_id?: string | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          primary_schedule_id: string
          resolution_action?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conflict_details?: Json | null
          conflict_type?: string
          conflicting_schedule_id?: string | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          primary_schedule_id?: string
          resolution_action?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_conflicts_conflicting_schedule_id_fkey"
            columns: ["conflicting_schedule_id"]
            isOneToOne: false
            referencedRelation: "ai_journey_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_conflicts_primary_schedule_id_fkey"
            columns: ["primary_schedule_id"]
            isOneToOne: false
            referencedRelation: "ai_journey_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_templates: {
        Row: {
          created_at: string | null
          default_duration_minutes: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          name: string
          schedule_pattern: Json
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_duration_minutes?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          name: string
          schedule_pattern: Json
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_duration_minutes?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          name?: string
          schedule_pattern?: Json
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_sync_status: {
        Row: {
          created_at: string | null
          error_count: number | null
          id: string
          last_error: string | null
          last_sync_at: string | null
          metadata: Json | null
          sync_status: string | null
          system_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          sync_status?: string | null
          system_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_count?: number | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          sync_status?: string | null
          system_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      todo_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string | null
          depends_on_todo_id: string
          id: string
          todo_id: string
        }
        Insert: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_todo_id: string
          id?: string
          todo_id: string
        }
        Update: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_todo_id?: string
          id?: string
          todo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_dependencies_depends_on_todo_id_fkey"
            columns: ["depends_on_todo_id"]
            isOneToOne: false
            referencedRelation: "todos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_dependencies_todo_id_fkey"
            columns: ["todo_id"]
            isOneToOne: false
            referencedRelation: "todos"
            referencedColumns: ["id"]
          },
        ]
      }
      todo_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          priority: string | null
          tags: string[] | null
          template_data: Json | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: string | null
          tags?: string[] | null
          template_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: string | null
          tags?: string[] | null
          template_data?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      todos: {
        Row: {
          actual_minutes: number | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          id: string
          journey_id: string | null
          metadata: Json | null
          parent_todo_id: string | null
          priority: string | null
          status: string | null
          tags: string[] | null
          template_id: string | null
          title: string
          updated_at: string | null
          user_id: string
          video_references: Json | null
        }
        Insert: {
          actual_minutes?: number | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          journey_id?: string | null
          metadata?: Json | null
          parent_todo_id?: string | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          template_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          video_references?: Json | null
        }
        Update: {
          actual_minutes?: number | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          journey_id?: string | null
          metadata?: Json | null
          parent_todo_id?: string | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_references?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "todos_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "ai_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "user_journey_summary"
            referencedColumns: ["journey_id"]
          },
          {
            foreignKeyName: "todos_parent_todo_id_fkey"
            columns: ["parent_todo_id"]
            isOneToOne: false
            referencedRelation: "todos"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_chunks: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string | null
          embedding: string | null
          end_seconds: number
          end_timestamp: string
          id: string
          start_seconds: number
          start_timestamp: string
          transcript_id: string | null
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          embedding?: string | null
          end_seconds: number
          end_timestamp: string
          id?: string
          start_seconds: number
          start_timestamp: string
          transcript_id?: string | null
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          embedding?: string | null
          end_seconds?: number
          end_timestamp?: string
          id?: string
          start_seconds?: number
          start_timestamp?: string
          transcript_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcript_chunks_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "video_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress_summary: {
        Row: {
          achievements_count: number | null
          active_learning_paths: number | null
          completed_todos: number | null
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          last_calculated_at: string | null
          longest_streak: number | null
          summary_data: Json | null
          total_study_hours: number | null
          total_todos: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievements_count?: number | null
          active_learning_paths?: number | null
          completed_todos?: number | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          last_calculated_at?: string | null
          longest_streak?: number | null
          summary_data?: Json | null
          total_study_hours?: number | null
          total_todos?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievements_count?: number | null
          active_learning_paths?: number | null
          completed_todos?: number | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          last_calculated_at?: string | null
          longest_streak?: number | null
          summary_data?: Json | null
          total_study_hours?: number | null
          total_todos?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_schedule_preferences: {
        Row: {
          auto_schedule: boolean | null
          avoid_times: Json | null
          break_duration_minutes: number | null
          created_at: string | null
          id: string
          max_daily_study_hours: number | null
          notification_preferences: Json | null
          preferred_session_length: number | null
          preferred_study_times: Json | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          weekend_availability: boolean | null
        }
        Insert: {
          auto_schedule?: boolean | null
          avoid_times?: Json | null
          break_duration_minutes?: number | null
          created_at?: string | null
          id?: string
          max_daily_study_hours?: number | null
          notification_preferences?: Json | null
          preferred_session_length?: number | null
          preferred_study_times?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          weekend_availability?: boolean | null
        }
        Update: {
          auto_schedule?: boolean | null
          avoid_times?: Json | null
          break_duration_minutes?: number | null
          created_at?: string | null
          id?: string
          max_daily_study_hours?: number | null
          notification_preferences?: Json | null
          preferred_session_length?: number | null
          preferred_study_times?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          weekend_availability?: boolean | null
        }
        Relationships: []
      }
      user_skill_assessments: {
        Row: {
          assessment_date: string | null
          assessment_type: string | null
          confidence_score: number | null
          created_at: string | null
          evidence_data: Json | null
          id: string
          is_current: boolean | null
          skill_category: string
          skill_level: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assessment_date?: string | null
          assessment_type?: string | null
          confidence_score?: number | null
          created_at?: string | null
          evidence_data?: Json | null
          id?: string
          is_current?: boolean | null
          skill_category: string
          skill_level?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assessment_date?: string | null
          assessment_type?: string | null
          confidence_score?: number | null
          created_at?: string | null
          evidence_data?: Json | null
          id?: string
          is_current?: boolean | null
          skill_category?: string
          skill_level?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_queue: {
        Row: {
          added_by: string | null
          attempts: number | null
          created_at: string | null
          creator: string | null
          day_id: string | null
          description: string | null
          duration: string | null
          error_details: Json | null
          error_message: string | null
          id: string
          last_attempt: string | null
          max_attempts: number | null
          module_id: string | null
          playlist_id: string | null
          priority: number | null
          processing_completed_at: string | null
          processing_started_at: string | null
          processing_time_ms: number | null
          status: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          week_id: string | null
          youtube_id: string
        }
        Insert: {
          added_by?: string | null
          attempts?: number | null
          created_at?: string | null
          creator?: string | null
          day_id?: string | null
          description?: string | null
          duration?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          last_attempt?: string | null
          max_attempts?: number | null
          module_id?: string | null
          playlist_id?: string | null
          priority?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_time_ms?: number | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          week_id?: string | null
          youtube_id: string
        }
        Update: {
          added_by?: string | null
          attempts?: number | null
          created_at?: string | null
          creator?: string | null
          day_id?: string | null
          description?: string | null
          duration?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          last_attempt?: string | null
          max_attempts?: number | null
          module_id?: string | null
          playlist_id?: string | null
          priority?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_time_ms?: number | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          week_id?: string | null
          youtube_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_queue_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      video_transcripts: {
        Row: {
          created_at: string | null
          creator: string | null
          duration_seconds: number | null
          full_transcript: string | null
          id: string
          processed_at: string | null
          title: string
          transcript_json: Json | null
          updated_at: string | null
          video_id: string
          youtube_id: string
        }
        Insert: {
          created_at?: string | null
          creator?: string | null
          duration_seconds?: number | null
          full_transcript?: string | null
          id?: string
          processed_at?: string | null
          title: string
          transcript_json?: Json | null
          updated_at?: string | null
          video_id: string
          youtube_id: string
        }
        Update: {
          created_at?: string | null
          creator?: string | null
          duration_seconds?: number | null
          full_transcript?: string | null
          id?: string
          processed_at?: string | null
          title?: string
          transcript_json?: Json | null
          updated_at?: string | null
          video_id?: string
          youtube_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_journey_summary: {
        Row: {
          completed_hours: number | null
          completed_skills: number | null
          created_at: string | null
          current_skills: number | null
          game_title: string | null
          game_type: string | null
          journey_id: string | null
          last_activity_date: string | null
          streak_days: number | null
          total_estimated_hours: number | null
          total_progress: number | null
          total_skills: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_admin_role: {
        Args: { user_uuid?: string }
        Returns: string
      }
      get_queue_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_processing_time_ms: number
          completed: number
          failed: number
          oldest_pending_minutes: number
          pending: number
          processing: number
          total_queued: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      log_admin_activity: {
        Args: {
          action_name: string
          admin_user_id: string
          details_param?: Json
          ip_address_param?: string
          new_values_param?: Json
          old_values_param?: Json
          resource_id_param?: string
          resource_type_param?: string
          session_id_param?: string
          user_agent_param?: string
        }
        Returns: string
      }
      search_transcript_chunks: {
        Args: {
          max_results?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          chunk_id: string
          chunk_text: string
          creator: string
          end_seconds: number
          end_timestamp: string
          similarity_score: number
          start_seconds: number
          start_timestamp: string
          title: string
          transcript_id: string
          video_id: string
          youtube_id: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_processing_stats: {
        Args: {
          chunks_created_delta?: number
          embeddings_generated_delta?: number
          openai_api_calls_delta?: number
          processing_time_delta?: number
          stat_date?: string
          transcripts_extracted_delta?: number
          videos_added_delta?: number
          videos_failed_delta?: number
          videos_processed_delta?: number
          videos_retried_delta?: number
          youtube_api_calls_delta?: number
        }
        Returns: string
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
  public: {
    Enums: {},
  },
} as const
