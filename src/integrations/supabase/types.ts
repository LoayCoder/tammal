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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_generation_logs: {
        Row: {
          accuracy_mode: string | null
          created_at: string | null
          critic_pass_result: Json | null
          duration_ms: number | null
          error_message: string | null
          focus_areas: Json | null
          id: string
          model_used: string | null
          prompt_type: string
          questions_approved: number | null
          questions_generated: number | null
          settings: Json | null
          success: boolean | null
          temperature: number | null
          tenant_id: string | null
          tokens_used: number | null
          user_id: string | null
          validation_result: Json | null
        }
        Insert: {
          accuracy_mode?: string | null
          created_at?: string | null
          critic_pass_result?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          focus_areas?: Json | null
          id?: string
          model_used?: string | null
          prompt_type: string
          questions_approved?: number | null
          questions_generated?: number | null
          settings?: Json | null
          success?: boolean | null
          temperature?: number | null
          tenant_id?: string | null
          tokens_used?: number | null
          user_id?: string | null
          validation_result?: Json | null
        }
        Update: {
          accuracy_mode?: string | null
          created_at?: string | null
          critic_pass_result?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          focus_areas?: Json | null
          id?: string
          model_used?: string | null
          prompt_type?: string
          questions_approved?: number | null
          questions_generated?: number | null
          settings?: Json | null
          success?: boolean | null
          temperature?: number | null
          tenant_id?: string | null
          tokens_used?: number | null
          user_id?: string | null
          validation_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_documents: {
        Row: {
          content_text: string | null
          created_at: string
          deleted_at: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_active: boolean
          tenant_id: string
          user_id: string
        }
        Insert: {
          content_text?: string | null
          created_at?: string
          deleted_at?: string | null
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          is_active?: boolean
          tenant_id: string
          user_id: string
        }
        Update: {
          content_text?: string | null
          created_at?: string
          deleted_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_active?: boolean
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          accuracy_tier: string
          cost_tier: string
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean
          model_key: string
        }
        Insert: {
          accuracy_tier?: string
          cost_tier?: string
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          model_key: string
        }
        Update: {
          accuracy_tier?: string
          cost_tier?: string
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          model_key?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_question_schedule: {
        Row: {
          created_at: string
          id: string
          question_id: string
          scheduled_date: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          scheduled_date: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          scheduled_date?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_question_schedule_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "wellness_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_question_schedule_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_responses: {
        Row: {
          answer_text: string | null
          answer_value: Json
          created_at: string | null
          device_type: string | null
          employee_id: string
          id: string
          question_id: string
          responded_at: string | null
          response_time_seconds: number | null
          scheduled_question_id: string | null
          session_id: string | null
          tenant_id: string
        }
        Insert: {
          answer_text?: string | null
          answer_value: Json
          created_at?: string | null
          device_type?: string | null
          employee_id: string
          id?: string
          question_id: string
          responded_at?: string | null
          response_time_seconds?: number | null
          scheduled_question_id?: string | null
          session_id?: string | null
          tenant_id: string
        }
        Update: {
          answer_text?: string | null
          answer_value?: Json
          created_at?: string | null
          device_type?: string | null
          employee_id?: string
          id?: string
          question_id?: string
          responded_at?: string | null
          response_time_seconds?: number | null
          scheduled_question_id?: string | null
          session_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_responses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_responses_scheduled_question_id_fkey"
            columns: ["scheduled_question_id"]
            isOneToOne: false
            referencedRelation: "scheduled_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_responses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          department: string | null
          email: string
          employee_number: string | null
          full_name: string
          hire_date: string | null
          id: string
          manager_id: string | null
          metadata: Json | null
          role_title: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          department?: string | null
          email: string
          employee_number?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          metadata?: Json | null
          role_title?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          department?: string | null
          email?: string
          employee_number?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          metadata?: Json | null
          role_title?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_areas: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          is_default: boolean
          label_ar: string | null
          label_key: string
          sort_order: number
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          label_ar?: string | null
          label_key: string
          sort_order?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          label_ar?: string | null
          label_key?: string
          sort_order?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_areas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_questions: {
        Row: {
          ambiguity_flag: boolean | null
          bias_flag: boolean | null
          complexity: string | null
          confidence_score: number | null
          created_at: string | null
          explanation: string | null
          id: string
          options: Json | null
          question_set_id: string
          question_text: string
          question_text_ar: string | null
          tenant_id: string | null
          tone: string | null
          type: string
          validation_details: Json | null
          validation_status: string | null
        }
        Insert: {
          ambiguity_flag?: boolean | null
          bias_flag?: boolean | null
          complexity?: string | null
          confidence_score?: number | null
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          question_set_id: string
          question_text: string
          question_text_ar?: string | null
          tenant_id?: string | null
          tone?: string | null
          type: string
          validation_details?: Json | null
          validation_status?: string | null
        }
        Update: {
          ambiguity_flag?: boolean | null
          bias_flag?: boolean | null
          complexity?: string | null
          confidence_score?: number | null
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          question_set_id?: string
          question_text?: string
          question_text_ar?: string | null
          tenant_id?: string | null
          tone?: string | null
          type?: string
          validation_details?: Json | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_questions_question_set_id_fkey"
            columns: ["question_set_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_questions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          branch_id: string | null
          code: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          delivery_channel: string | null
          delivery_status: string | null
          email: string
          email_sent_at: string | null
          employee_id: string | null
          expires_at: string
          full_name: string | null
          id: string
          last_send_error: string | null
          metadata: Json | null
          phone_number: string | null
          tenant_id: string
          used: boolean | null
          used_at: string | null
          used_by: string | null
          whatsapp_sent_at: string | null
        }
        Insert: {
          branch_id?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          delivery_channel?: string | null
          delivery_status?: string | null
          email: string
          email_sent_at?: string | null
          employee_id?: string | null
          expires_at: string
          full_name?: string | null
          id?: string
          last_send_error?: string | null
          metadata?: Json | null
          phone_number?: string | null
          tenant_id: string
          used?: boolean | null
          used_at?: string | null
          used_by?: string | null
          whatsapp_sent_at?: string | null
        }
        Update: {
          branch_id?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          delivery_channel?: string | null
          delivery_status?: string | null
          email?: string
          email_sent_at?: string | null
          employee_id?: string | null
          expires_at?: string
          full_name?: string | null
          id?: string
          last_send_error?: string | null
          metadata?: Json | null
          phone_number?: string | null
          tenant_id?: string
          used?: boolean | null
          used_at?: string | null
          used_by?: string | null
          whatsapp_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_type: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          os: string | null
          success: boolean | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          success?: boolean | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          success?: boolean | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_entries: {
        Row: {
          ai_tip: string | null
          answer_text: string | null
          answer_value: Json | null
          created_at: string
          employee_id: string
          entry_date: string
          id: string
          mood_level: string
          mood_score: number
          points_earned: number
          question_id: string | null
          streak_count: number
          support_actions: Json | null
          tenant_id: string
        }
        Insert: {
          ai_tip?: string | null
          answer_text?: string | null
          answer_value?: Json | null
          created_at?: string
          employee_id: string
          entry_date?: string
          id?: string
          mood_level: string
          mood_score: number
          points_earned?: number
          question_id?: string | null
          streak_count?: number
          support_actions?: Json | null
          tenant_id: string
        }
        Update: {
          ai_tip?: string | null
          answer_text?: string | null
          answer_value?: Json | null
          created_at?: string
          employee_id?: string
          entry_date?: string
          id?: string
          mood_level?: string
          mood_score?: number
          points_earned?: number
          question_id?: string | null
          streak_count?: number
          support_actions?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mood_entries_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "wellness_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mood_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string | null
          description_ar: string | null
          id: string
          name: string
          name_ar: string | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          name: string
          name_ar?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          name?: string
          name_ar?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          billing_period: string
          created_at: string
          deleted_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          max_storage_gb: number | null
          max_users: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          billing_period?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_storage_gb?: number | null
          max_users?: number | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_storage_gb?: number | null
          max_users?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          full_name: string | null
          id: string
          job_title: string | null
          location: string | null
          phone: string | null
          status: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          location?: string | null
          phone?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          location?: string | null
          phone?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      question_categories: {
        Row: {
          color: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_global: boolean | null
          name: string
          name_ar: string | null
          tenant_id: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          name: string
          name_ar?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          name?: string
          name_ar?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "question_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      question_generation_batches: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          published_at: string | null
          question_count: number
          status: string
          target_month: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          published_at?: string | null
          question_count?: number
          status?: string
          target_month: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          published_at?: string | null
          question_count?: number
          status?: string
          target_month?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_generation_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      question_schedule_settings: {
        Row: {
          active_days: Json
          delivery_time: string
          id: string
          is_active: boolean
          questions_per_day: number
          tenant_id: string
          updated_at: string
          workdays_only: boolean
        }
        Insert: {
          active_days?: Json
          delivery_time?: string
          id?: string
          is_active?: boolean
          questions_per_day?: number
          tenant_id: string
          updated_at?: string
          workdays_only?: boolean
        }
        Update: {
          active_days?: Json
          delivery_time?: string
          id?: string
          is_active?: boolean
          questions_per_day?: number
          tenant_id?: string
          updated_at?: string
          workdays_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "question_schedule_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      question_schedules: {
        Row: {
          active_categories: Json | null
          avoid_holidays: boolean | null
          avoid_weekends: boolean | null
          created_at: string | null
          created_by: string | null
          custom_schedule: Json | null
          deleted_at: string | null
          description: string | null
          enable_ai_generation: boolean | null
          enable_validation: boolean | null
          frequency: string
          id: string
          name: string
          preferred_time: string | null
          questions_per_delivery: number | null
          status: string
          target_audience: Json | null
          tenant_id: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          active_categories?: Json | null
          avoid_holidays?: boolean | null
          avoid_weekends?: boolean | null
          created_at?: string | null
          created_by?: string | null
          custom_schedule?: Json | null
          deleted_at?: string | null
          description?: string | null
          enable_ai_generation?: boolean | null
          enable_validation?: boolean | null
          frequency?: string
          id?: string
          name: string
          preferred_time?: string | null
          questions_per_delivery?: number | null
          status?: string
          target_audience?: Json | null
          tenant_id: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          active_categories?: Json | null
          avoid_holidays?: boolean | null
          avoid_weekends?: boolean | null
          created_at?: string | null
          created_by?: string | null
          custom_schedule?: Json | null
          deleted_at?: string | null
          description?: string | null
          enable_ai_generation?: boolean | null
          enable_validation?: boolean | null
          frequency?: string
          id?: string
          name?: string
          preferred_time?: string | null
          questions_per_delivery?: number | null
          status?: string
          target_audience?: Json | null
          tenant_id?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      question_sets: {
        Row: {
          accuracy_mode: string
          created_at: string | null
          critic_pass_result: Json | null
          deleted_at: string | null
          id: string
          model_used: string
          settings: Json | null
          status: string
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
          validation_result: Json | null
        }
        Insert: {
          accuracy_mode?: string
          created_at?: string | null
          critic_pass_result?: Json | null
          deleted_at?: string | null
          id?: string
          model_used: string
          settings?: Json | null
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          validation_result?: Json | null
        }
        Update: {
          accuracy_mode?: string
          created_at?: string | null
          critic_pass_result?: Json | null
          deleted_at?: string | null
          id?: string
          model_used?: string
          settings?: Json | null
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          validation_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "question_sets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          ai_generated: boolean | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          is_global: boolean | null
          options: Json | null
          tenant_id: string | null
          text: string
          text_ar: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          options?: Json | null
          tenant_id?: string | null
          text: string
          text_ar?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          options?: Json | null
          tenant_id?: string | null
          text?: string
          text_ar?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "question_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_documents: {
        Row: {
          created_at: string
          extracted_text: string | null
          file_name: string
          framework_id: string | null
          id: string
          question_set_id: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          file_name: string
          framework_id?: string | null
          id?: string
          question_set_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          framework_id?: string | null
          id?: string
          question_set_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reference_documents_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "reference_frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_documents_question_set_id_fkey"
            columns: ["question_set_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_frameworks: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          description_ar: string | null
          framework_key: string
          icon: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          name_ar: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          framework_key: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          name_ar?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          framework_key?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          name_ar?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reference_frameworks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          base_role: Database["public"]["Enums"]["app_role"] | null
          color: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          description_ar: string | null
          id: string
          is_system_role: boolean | null
          name: string
          name_ar: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          base_role?: Database["public"]["Enums"]["app_role"] | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          name_ar?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          base_role?: Database["public"]["Enums"]["app_role"] | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          name_ar?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_questions: {
        Row: {
          actual_delivery: string | null
          created_at: string | null
          delivery_channel: string | null
          employee_id: string
          id: string
          question_id: string
          reminder_count: number | null
          schedule_id: string
          scheduled_delivery: string
          status: string
          tenant_id: string
        }
        Insert: {
          actual_delivery?: string | null
          created_at?: string | null
          delivery_channel?: string | null
          employee_id: string
          id?: string
          question_id: string
          reminder_count?: number | null
          schedule_id: string
          scheduled_delivery: string
          status?: string
          tenant_id: string
        }
        Update: {
          actual_delivery?: string | null
          created_at?: string | null
          delivery_channel?: string | null
          employee_id?: string
          id?: string
          question_id?: string
          reminder_count?: number | null
          schedule_id?: string
          scheduled_delivery?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_questions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_questions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "question_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_questions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          deleted_at: string | null
          end_date: string | null
          id: string
          metadata: Json | null
          payment_status: string
          plan_id: string
          renewal_date: string | null
          start_date: string
          status: string
          tenant_id: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          payment_status?: string
          plan_id: string
          renewal_date?: string | null
          start_date?: string
          status?: string
          tenant_id: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          payment_status?: string
          plan_id?: string
          renewal_date?: string | null
          start_date?: string
          status?: string
          tenant_id?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_usage: {
        Row: {
          active_users: number | null
          api_calls: number | null
          created_at: string
          id: string
          period_end: string
          period_start: string
          storage_used_mb: number | null
          tenant_id: string
          total_users: number | null
          updated_at: string
        }
        Insert: {
          active_users?: number | null
          api_calls?: number | null
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          storage_used_mb?: number | null
          tenant_id: string
          total_users?: number | null
          updated_at?: string
        }
        Update: {
          active_users?: number | null
          api_calls?: number | null
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          storage_used_mb?: number | null
          tenant_id?: string
          total_users?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          billing_email: string | null
          branding_config: Json | null
          city: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          country: string | null
          cr_number: string | null
          created_at: string
          default_language: string
          deleted_at: string | null
          domain: string | null
          employee_count: number | null
          glass_break_active: boolean | null
          id: string
          industry: string | null
          max_concurrent_sessions: number | null
          max_users_override: number | null
          mfa_trust_duration_days: number | null
          name: string
          notes: string | null
          plan_id: string | null
          preferred_currency: string | null
          session_timeout_minutes: number | null
          settings: Json | null
          slug: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          subscription_status: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          billing_email?: string | null
          branding_config?: Json | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          cr_number?: string | null
          created_at?: string
          default_language?: string
          deleted_at?: string | null
          domain?: string | null
          employee_count?: number | null
          glass_break_active?: boolean | null
          id?: string
          industry?: string | null
          max_concurrent_sessions?: number | null
          max_users_override?: number | null
          mfa_trust_duration_days?: number | null
          name: string
          notes?: string | null
          plan_id?: string | null
          preferred_currency?: string | null
          session_timeout_minutes?: number | null
          settings?: Json | null
          slug?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          billing_email?: string | null
          branding_config?: Json | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          cr_number?: string | null
          created_at?: string
          default_language?: string
          deleted_at?: string | null
          domain?: string | null
          employee_count?: number | null
          glass_break_active?: boolean | null
          id?: string
          industry?: string | null
          max_concurrent_sessions?: number | null
          max_users_override?: number | null
          mfa_trust_duration_days?: number | null
          name?: string
          notes?: string | null
          plan_id?: string | null
          preferred_currency?: string | null
          session_timeout_minutes?: number | null
          settings?: Json | null
          slug?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          custom_role_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_role_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          custom_role_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          question_set_id: string | null
          result: string
          tenant_id: string | null
          validation_type: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          question_set_id?: string | null
          result?: string
          tenant_id?: string | null
          validation_type: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          question_set_id?: string | null
          result?: string
          tenant_id?: string | null
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_logs_question_set_id_fkey"
            columns: ["question_set_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_pairs: {
        Row: {
          created_at: string | null
          expected_consistency_logic: string | null
          id: string
          is_active: boolean | null
          primary_question_id: string
          tenant_id: string | null
          tolerance_threshold: number | null
          validation_method: string | null
          validation_question_id: string
        }
        Insert: {
          created_at?: string | null
          expected_consistency_logic?: string | null
          id?: string
          is_active?: boolean | null
          primary_question_id: string
          tenant_id?: string | null
          tolerance_threshold?: number | null
          validation_method?: string | null
          validation_question_id: string
        }
        Update: {
          created_at?: string | null
          expected_consistency_logic?: string | null
          id?: string
          is_active?: boolean | null
          primary_question_id?: string
          tenant_id?: string | null
          tolerance_threshold?: number | null
          validation_method?: string | null
          validation_question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_pairs_primary_question_id_fkey"
            columns: ["primary_question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_pairs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_pairs_validation_question_id_fkey"
            columns: ["validation_question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_questions: {
        Row: {
          batch_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          options: Json | null
          question_text_ar: string | null
          question_text_en: string
          question_type: string
          status: string
          tenant_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          options?: Json | null
          question_text_ar?: string | null
          question_text_en: string
          question_type?: string
          status?: string
          tenant_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          options?: Json | null
          question_text_ar?: string | null
          question_text_en?: string
          question_type?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_questions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "question_generation_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellness_questions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_with_email: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string | null
          id: string | null
          job_title: string | null
          location: string | null
          phone: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: never
          full_name?: string | null
          id?: string | null
          job_title?: string | null
          location?: string | null
          phone?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: never
          full_name?: string | null
          id?: string | null
          job_title?: string | null
          location?: string | null
          phone?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_email: { Args: { _user_id: string }; Returns: string }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_permission: {
        Args: { _permission_code: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "tenant_admin" | "manager" | "user"
      tenant_status: "active" | "trial" | "suspended" | "inactive"
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
    Enums: {
      app_role: ["super_admin", "tenant_admin", "manager", "user"],
      tenant_status: ["active", "trial", "suspended", "inactive"],
    },
  },
} as const
