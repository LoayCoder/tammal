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
      action_sub_tasks: {
        Row: {
          action_id: string
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          duration_minutes: number
          id: string
          scheduled_at: string | null
          status: string
          tenant_id: string
          title: string
          title_ar: string | null
        }
        Insert: {
          action_id: string
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number
          id?: string
          scheduled_at?: string | null
          status?: string
          tenant_id: string
          title: string
          title_ar?: string | null
        }
        Update: {
          action_id?: string
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number
          id?: string
          scheduled_at?: string | null
          status?: string
          tenant_id?: string
          title?: string
          title_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_sub_tasks_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "objective_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_sub_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_cost_alerts: {
        Row: {
          alert_month: string
          created_at: string
          feature: string
          id: string
          limit_type: string
          percent_used: number
          tenant_id: string
        }
        Insert: {
          alert_month: string
          created_at?: string
          feature?: string
          id?: string
          limit_type: string
          percent_used: number
          tenant_id: string
        }
        Update: {
          alert_month?: string
          created_at?: string
          feature?: string
          id?: string
          limit_type?: string
          percent_used?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_cost_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
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
      ai_tenant_limits: {
        Row: {
          created_at: string
          id: string
          monthly_cost_limit: number
          monthly_token_limit: number
          tenant_id: string
          updated_at: string
          warning_threshold_percent: number
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_cost_limit?: number
          monthly_token_limit?: number
          tenant_id: string
          updated_at?: string
          warning_threshold_percent?: number
        }
        Update: {
          created_at?: string
          id?: string
          monthly_cost_limit?: number
          monthly_token_limit?: number
          tenant_id?: string
          updated_at?: string
          warning_threshold_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_tenant_limits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appeals: {
        Row: {
          appellant_id: string
          committee_review: Json | null
          deleted_at: string | null
          description: string
          grounds: string
          id: string
          new_evidence_attachment_ids: Json | null
          resolved_at: string | null
          submitted_at: string
          tenant_id: string
          theme_results_id: string
        }
        Insert: {
          appellant_id: string
          committee_review?: Json | null
          deleted_at?: string | null
          description: string
          grounds: string
          id?: string
          new_evidence_attachment_ids?: Json | null
          resolved_at?: string | null
          submitted_at?: string
          tenant_id: string
          theme_results_id: string
        }
        Update: {
          appellant_id?: string
          committee_review?: Json | null
          deleted_at?: string | null
          description?: string
          grounds?: string
          id?: string
          new_evidence_attachment_ids?: Json | null
          resolved_at?: string | null
          submitted_at?: string
          tenant_id?: string
          theme_results_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appeals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeals_theme_results_id_fkey"
            columns: ["theme_results_id"]
            isOneToOne: false
            referencedRelation: "theme_results"
            referencedColumns: ["id"]
          },
        ]
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
      award_cycles: {
        Row: {
          announcement_date: string
          audit_review_days: number
          created_at: string
          created_by: string
          deleted_at: string | null
          fairness_config: Json
          id: string
          name: string
          name_ar: string | null
          nomination_end: string
          nomination_start: string
          peer_endorsement_end: string
          stats: Json | null
          status: string
          tenant_id: string
          updated_at: string
          voting_end: string
          voting_start: string
        }
        Insert: {
          announcement_date: string
          audit_review_days?: number
          created_at?: string
          created_by: string
          deleted_at?: string | null
          fairness_config?: Json
          id?: string
          name: string
          name_ar?: string | null
          nomination_end: string
          nomination_start: string
          peer_endorsement_end: string
          stats?: Json | null
          status?: string
          tenant_id: string
          updated_at?: string
          voting_end: string
          voting_start: string
        }
        Update: {
          announcement_date?: string
          audit_review_days?: number
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          fairness_config?: Json
          id?: string
          name?: string
          name_ar?: string | null
          nomination_end?: string
          nomination_start?: string
          peer_endorsement_end?: string
          stats?: Json | null
          status?: string
          tenant_id?: string
          updated_at?: string
          voting_end?: string
          voting_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "award_cycles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      award_themes: {
        Row: {
          created_at: string
          cycle_id: string
          data_integration: Json | null
          deleted_at: string | null
          description: string | null
          description_ar: string | null
          id: string
          image_url: string | null
          name: string
          name_ar: string | null
          nomination_rules: Json
          rewards: Json
          sort_order: number | null
          tenant_id: string
          voting_rules: Json
        }
        Insert: {
          created_at?: string
          cycle_id: string
          data_integration?: Json | null
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string | null
          name: string
          name_ar?: string | null
          nomination_rules?: Json
          rewards?: Json
          sort_order?: number | null
          tenant_id: string
          voting_rules?: Json
        }
        Update: {
          created_at?: string
          cycle_id?: string
          data_integration?: Json | null
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string | null
          name?: string
          name_ar?: string | null
          nomination_rules?: Json
          rewards?: Json
          sort_order?: number | null
          tenant_id?: string
          voting_rules?: Json
        }
        Relationships: [
          {
            foreignKeyName: "award_themes_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "award_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "award_themes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          address_ar: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_ar?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_ar?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      breathing_sessions: {
        Row: {
          completed: boolean | null
          created_at: string
          deleted_at: string | null
          duration_seconds: number
          employee_id: string
          id: string
          mood_after: number | null
          mood_before: number | null
          rounds_completed: number | null
          rounds_target: number | null
          technique: string
          tenant_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          deleted_at?: string | null
          duration_seconds?: number
          employee_id: string
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          rounds_completed?: number | null
          rounds_target?: number | null
          technique: string
          tenant_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          deleted_at?: string | null
          duration_seconds?: number
          employee_id?: string
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          rounds_completed?: number | null
          rounds_target?: number | null
          technique?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breathing_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breathing_sessions_tenant_id_fkey"
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
      departments: {
        Row: {
          branch_id: string | null
          color: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          description_ar: string | null
          division_id: string | null
          head_employee_id: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          parent_id: string | null
          sort_order: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          division_id?: string | null
          head_employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          parent_id?: string | null
          sort_order?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          division_id?: string | null
          head_employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          parent_id?: string | null
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_head_employee_id_fkey"
            columns: ["head_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          description_ar: string | null
          head_employee_id: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          head_employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          head_employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "divisions_head_employee_id_fkey"
            columns: ["head_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "divisions_tenant_id_fkey"
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
          deleted_at: string | null
          device_type: string | null
          employee_id: string
          id: string
          is_draft: boolean
          question_id: string
          responded_at: string | null
          response_time_seconds: number | null
          scheduled_question_id: string | null
          session_id: string | null
          survey_session_id: string | null
          tenant_id: string
        }
        Insert: {
          answer_text?: string | null
          answer_value: Json
          created_at?: string | null
          deleted_at?: string | null
          device_type?: string | null
          employee_id: string
          id?: string
          is_draft?: boolean
          question_id: string
          responded_at?: string | null
          response_time_seconds?: number | null
          scheduled_question_id?: string | null
          session_id?: string | null
          survey_session_id?: string | null
          tenant_id: string
        }
        Update: {
          answer_text?: string | null
          answer_value?: Json
          created_at?: string | null
          deleted_at?: string | null
          device_type?: string | null
          employee_id?: string
          id?: string
          is_draft?: boolean
          question_id?: string
          responded_at?: string | null
          response_time_seconds?: number | null
          scheduled_question_id?: string | null
          session_id?: string | null
          survey_session_id?: string | null
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
          branch_id: string | null
          created_at: string | null
          deleted_at: string | null
          department: string | null
          department_id: string | null
          email: string
          employee_number: string | null
          full_name: string
          hire_date: string | null
          id: string
          manager_id: string | null
          metadata: Json | null
          role_title: string | null
          section_id: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          department?: string | null
          department_id?: string | null
          email: string
          employee_number?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          metadata?: Json | null
          role_title?: string | null
          section_id?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          department?: string | null
          department_id?: string | null
          email?: string
          employee_number?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          metadata?: Json | null
          role_title?: string | null
          section_id?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sites"
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
          affective_state: string | null
          ambiguity_flag: boolean | null
          bias_flag: boolean | null
          category_id: string | null
          complexity: string | null
          confidence_score: number | null
          created_at: string | null
          explanation: string | null
          generation_period_id: string | null
          id: string
          mood_score: number | null
          options: Json | null
          question_hash: string | null
          question_set_id: string
          question_text: string
          question_text_ar: string | null
          subcategory_id: string | null
          tenant_id: string | null
          tone: string | null
          type: string
          validation_details: Json | null
          validation_status: string | null
        }
        Insert: {
          affective_state?: string | null
          ambiguity_flag?: boolean | null
          bias_flag?: boolean | null
          category_id?: string | null
          complexity?: string | null
          confidence_score?: number | null
          created_at?: string | null
          explanation?: string | null
          generation_period_id?: string | null
          id?: string
          mood_score?: number | null
          options?: Json | null
          question_hash?: string | null
          question_set_id: string
          question_text: string
          question_text_ar?: string | null
          subcategory_id?: string | null
          tenant_id?: string | null
          tone?: string | null
          type: string
          validation_details?: Json | null
          validation_status?: string | null
        }
        Update: {
          affective_state?: string | null
          ambiguity_flag?: boolean | null
          bias_flag?: boolean | null
          category_id?: string | null
          complexity?: string | null
          confidence_score?: number | null
          created_at?: string | null
          explanation?: string | null
          generation_period_id?: string | null
          id?: string
          mood_score?: number | null
          options?: Json | null
          question_hash?: string | null
          question_set_id?: string
          question_text?: string
          question_text_ar?: string | null
          subcategory_id?: string | null
          tenant_id?: string | null
          tone?: string | null
          type?: string
          validation_details?: Json | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_questions_generation_period_id_fkey"
            columns: ["generation_period_id"]
            isOneToOne: false
            referencedRelation: "generation_periods"
            referencedColumns: ["id"]
          },
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
      generation_periods: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          end_date: string
          id: string
          locked_category_ids: Json
          locked_subcategory_ids: Json
          period_type: string
          purpose: string
          start_date: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          end_date: string
          id?: string
          locked_category_ids?: Json
          locked_subcategory_ids?: Json
          period_type?: string
          purpose?: string
          start_date: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          end_date?: string
          id?: string
          locked_category_ids?: Json
          locked_subcategory_ids?: Json
          period_type?: string
          purpose?: string
          start_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      initiatives: {
        Row: {
          budget: number | null
          created_at: string
          deleted_at: string | null
          department_id: string | null
          description: string | null
          description_ar: string | null
          division_id: string | null
          end_date: string | null
          id: string
          is_locked: boolean
          locked_at: string | null
          locked_by: string | null
          objective_id: string
          owner_user_id: string | null
          progress: number
          start_date: string | null
          status: string
          tenant_id: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          description?: string | null
          description_ar?: string | null
          division_id?: string | null
          end_date?: string | null
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          objective_id: string
          owner_user_id?: string | null
          progress?: number
          start_date?: string | null
          status?: string
          tenant_id: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          description?: string | null
          description_ar?: string | null
          division_id?: string | null
          end_date?: string | null
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          objective_id?: string
          owner_user_id?: string | null
          progress?: number
          start_date?: string | null
          status?: string
          tenant_id?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiatives_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_tenant_id_fkey"
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
      judging_criteria: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          description_ar: string | null
          id: string
          name: string
          name_ar: string | null
          scoring_guide: Json
          sort_order: number | null
          tenant_id: string
          theme_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          name: string
          name_ar?: string | null
          scoring_guide?: Json
          sort_order?: number | null
          tenant_id: string
          theme_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          scoring_guide?: Json
          sort_order?: number | null
          tenant_id?: string
          theme_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "judging_criteria_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judging_criteria_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "award_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          created_at: string
          current_value: number
          deleted_at: string | null
          id: string
          objective_id: string
          target_value: number
          tenant_id: string
          title: string
          title_ar: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          deleted_at?: string | null
          id?: string
          objective_id: string
          target_value?: number
          tenant_id: string
          title: string
          title_ar?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          deleted_at?: string | null
          id?: string
          objective_id?: string
          target_value?: number
          tenant_id?: string
          title?: string
          title_ar?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_results_tenant_id_fkey"
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
      mh_crisis_cases: {
        Row: {
          accepted_at: string | null
          anonymity_mode: string
          assigned_first_aider_id: string | null
          closed_at: string | null
          created_at: string
          first_response_at: string | null
          id: string
          intent: string
          matched_at: string | null
          preferred_contact_method: string | null
          requester_user_id: string
          reroute_count: number
          resolved_at: string | null
          risk_level: string
          scheduled_session_id: string | null
          status: string
          summary: string | null
          tenant_id: string
          urgency_level: number | null
        }
        Insert: {
          accepted_at?: string | null
          anonymity_mode?: string
          assigned_first_aider_id?: string | null
          closed_at?: string | null
          created_at?: string
          first_response_at?: string | null
          id?: string
          intent: string
          matched_at?: string | null
          preferred_contact_method?: string | null
          requester_user_id: string
          reroute_count?: number
          resolved_at?: string | null
          risk_level?: string
          scheduled_session_id?: string | null
          status?: string
          summary?: string | null
          tenant_id: string
          urgency_level?: number | null
        }
        Update: {
          accepted_at?: string | null
          anonymity_mode?: string
          assigned_first_aider_id?: string | null
          closed_at?: string | null
          created_at?: string
          first_response_at?: string | null
          id?: string
          intent?: string
          matched_at?: string | null
          preferred_contact_method?: string | null
          requester_user_id?: string
          reroute_count?: number
          resolved_at?: string | null
          risk_level?: string
          scheduled_session_id?: string | null
          status?: string
          summary?: string | null
          tenant_id?: string
          urgency_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mh_crisis_cases_assigned_first_aider_id_fkey"
            columns: ["assigned_first_aider_id"]
            isOneToOne: false
            referencedRelation: "mh_first_aiders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mh_crisis_cases_scheduled_session_id_fkey"
            columns: ["scheduled_session_id"]
            isOneToOne: false
            referencedRelation: "mh_support_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mh_crisis_cases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mh_crisis_escalations: {
        Row: {
          case_id: string
          created_at: string
          escalation_type: string
          id: string
          notes: string | null
          tenant_id: string
          triggered_by: string
        }
        Insert: {
          case_id: string
          created_at?: string
          escalation_type: string
          id?: string
          notes?: string | null
          tenant_id: string
          triggered_by: string
        }
        Update: {
          case_id?: string
          created_at?: string
          escalation_type?: string
          id?: string
          notes?: string | null
          tenant_id?: string
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "mh_crisis_escalations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "mh_crisis_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mh_crisis_escalations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mh_crisis_messages: {
        Row: {
          attachments: Json | null
          case_id: string
          created_at: string
          id: string
          message: string
          message_type: string | null
          reactions: Json | null
          read_at: string | null
          reply_to_id: string | null
          sender_user_id: string
          tenant_id: string
        }
        Insert: {
          attachments?: Json | null
          case_id: string
          created_at?: string
          id?: string
          message: string
          message_type?: string | null
          reactions?: Json | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_user_id: string
          tenant_id: string
        }
        Update: {
          attachments?: Json | null
          case_id?: string
          created_at?: string
          id?: string
          message?: string
          message_type?: string | null
          reactions?: Json | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_user_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mh_crisis_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "mh_crisis_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mh_crisis_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "mh_crisis_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mh_crisis_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mh_crisis_notifications: {
        Row: {
          body: string | null
          case_id: string | null
          created_at: string
          id: string
          is_read: boolean
          tenant_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          tenant_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          tenant_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mh_crisis_notifications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "mh_crisis_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mh_crisis_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mh_emergency_contacts: {
        Row: {
          available_24_7: boolean
          country: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          phone: string | null
          sort_order: number
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          available_24_7?: boolean
          country?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          sort_order?: number
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          available_24_7?: boolean
          country?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          sort_order?: number
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mh_emergency_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mh_first_aider_availability: {
        Row: {
          created_at: string
          date: string
          deleted_at: string | null
          external_busy_times: Json | null
          first_aider_id: string
          id: string
          tenant_id: string
          time_slots: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          deleted_at?: string | null
          external_busy_times?: Json | null
          first_aider_id: string
          id?: string
          tenant_id: string
          time_slots?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          deleted_at?: string | null
          external_busy_times?: Json | null
          first_aider_id?: string
          id?: string
          tenant_id?: string
          time_slots?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mh_first_aider_availability_first_aider_id_fkey"
            columns: ["first_aider_id"]
            isOneToOne: false
            referencedRelation: "mh_first_aiders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mh_first_aider_availability_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mh_first_aider_schedule: {
        Row: {
          created_at: string
          first_aider_id: string
          id: string
          is_enabled: boolean
          response_sla_minutes: number
          temp_unavailable: boolean
          tenant_id: string
          timezone: string
          updated_at: string
          weekly_rules: Json
        }
        Insert: {
          created_at?: string
          first_aider_id: string
          id?: string
          is_enabled?: boolean
          response_sla_minutes?: number
          temp_unavailable?: boolean
          tenant_id: string
          timezone?: string
          updated_at?: string
          weekly_rules?: Json
        }
        Update: {
          created_at?: string
          first_aider_id?: string
          id?: string
          is_enabled?: boolean
          response_sla_minutes?: number
          temp_unavailable?: boolean
          tenant_id?: string
          timezone?: string
          updated_at?: string
          weekly_rules?: Json
        }
        Relationships: [
          {
            foreignKeyName: "mh_first_aider_schedule_first_aider_id_fkey"
            columns: ["first_aider_id"]
            isOneToOne: false
            referencedRelation: "mh_first_aiders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mh_first_aider_schedule_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mh_first_aiders: {
        Row: {
          allow_anonymous_requests: boolean
          availability_config: Json | null
          bio: string | null
          calendar_integrations: Json | null
          contact_modes: Json | null
          created_at: string
          deleted_at: string | null
          department: string | null
          display_name: string
          id: string
          is_active: boolean
          languages: string[] | null
          max_active_cases: number
          max_concurrent_sessions: number | null
          rating: number | null
          response_time_avg: number | null
          role_title: string | null
          specializations: string[] | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_anonymous_requests?: boolean
          availability_config?: Json | null
          bio?: string | null
          calendar_integrations?: Json | null
          contact_modes?: Json | null
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          languages?: string[] | null
          max_active_cases?: number
          max_concurrent_sessions?: number | null
          rating?: number | null
          response_time_avg?: number | null
          role_title?: string | null
          specializations?: string[] | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_anonymous_requests?: boolean
          availability_config?: Json | null
          bio?: string | null
          calendar_integrations?: Json | null
          contact_modes?: Json | null
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          languages?: string[] | null
          max_active_cases?: number
          max_concurrent_sessions?: number | null
          rating?: number | null
          response_time_avg?: number | null
          role_title?: string | null
          specializations?: string[] | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mh_first_aiders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mh_risk_mappings: {
        Row: {
          action_description: string | null
          created_at: string
          deleted_at: string | null
          id: string
          intent: string
          is_default: boolean | null
          risk_level: string
          sort_order: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          action_description?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          intent: string
          is_default?: boolean | null
          risk_level: string
          sort_order?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          action_description?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          intent?: string
          is_default?: boolean | null
          risk_level?: string
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mh_risk_mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mh_secure_attachments: {
        Row: {
          access_log: Json | null
          context: string
          context_id: string | null
          created_at: string
          deleted_at: string | null
          expires_at: string
          filename: string
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          tenant_id: string
          uploader_user_id: string
          watermark_text: string | null
        }
        Insert: {
          access_log?: Json | null
          context?: string
          context_id?: string | null
          created_at?: string
          deleted_at?: string | null
          expires_at: string
          filename: string
          id?: string
          mime_type: string
          size_bytes?: number
          storage_path: string
          tenant_id: string
          uploader_user_id: string
          watermark_text?: string | null
        }
        Update: {
          access_log?: Json | null
          context?: string
          context_id?: string | null
          created_at?: string
          deleted_at?: string | null
          expires_at?: string
          filename?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          tenant_id?: string
          uploader_user_id?: string
          watermark_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mh_secure_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mh_session_ratings: {
        Row: {
          comment: string | null
          created_at: string
          deleted_at: string | null
          id: string
          rater_user_id: string
          rating: number
          session_id: string
          tenant_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          rater_user_id: string
          rating: number
          session_id: string
          tenant_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          rater_user_id?: string
          rating?: number
          session_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mh_session_ratings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mh_support_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mh_session_ratings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mh_support_sessions: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          calendar_event_id: string | null
          call_record: Json | null
          case_id: string | null
          channel: string | null
          chat_room_id: string | null
          created_at: string
          data_retention_until: string | null
          deleted_at: string | null
          first_aider_id: string
          id: string
          outcome: string | null
          requester_user_id: string
          scheduled_end: string | null
          scheduled_start: string | null
          session_notes: string | null
          shared_resources: Json | null
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          calendar_event_id?: string | null
          call_record?: Json | null
          case_id?: string | null
          channel?: string | null
          chat_room_id?: string | null
          created_at?: string
          data_retention_until?: string | null
          deleted_at?: string | null
          first_aider_id: string
          id?: string
          outcome?: string | null
          requester_user_id: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          session_notes?: string | null
          shared_resources?: Json | null
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          calendar_event_id?: string | null
          call_record?: Json | null
          case_id?: string | null
          channel?: string | null
          chat_room_id?: string | null
          created_at?: string
          data_retention_until?: string | null
          deleted_at?: string | null
          first_aider_id?: string
          id?: string
          outcome?: string | null
          requester_user_id?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          session_notes?: string | null
          shared_resources?: Json | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mh_support_sessions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "mh_crisis_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mh_support_sessions_first_aider_id_fkey"
            columns: ["first_aider_id"]
            isOneToOne: false
            referencedRelation: "mh_first_aiders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mh_support_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_definitions: {
        Row: {
          color: string
          created_at: string
          deleted_at: string | null
          emoji: string
          id: string
          is_active: boolean
          is_default: boolean
          key: string
          label_ar: string
          label_en: string
          score: number
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          deleted_at?: string | null
          emoji?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          key: string
          label_ar: string
          label_en: string
          score?: number
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          deleted_at?: string | null
          emoji?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          key?: string
          label_ar?: string
          label_en?: string
          score?: number
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_definitions_tenant_id_fkey"
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
      mood_question_configs: {
        Row: {
          created_at: string
          custom_prompt_context: string | null
          enable_free_text: boolean
          id: string
          is_custom_override: boolean
          is_enabled: boolean
          max_questions: number
          mood_level: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_prompt_context?: string | null
          enable_free_text?: boolean
          id?: string
          is_custom_override?: boolean
          is_enabled?: boolean
          max_questions?: number
          mood_level: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_prompt_context?: string | null
          enable_free_text?: boolean
          id?: string
          is_custom_override?: boolean
          is_enabled?: boolean
          max_questions?: number
          mood_level?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_question_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_question_history: {
        Row: {
          created_at: string
          id: string
          mood_level: string
          question_hash: string
          tenant_id: string
          theme: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood_level: string
          question_hash: string
          tenant_id: string
          theme: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood_level?: string
          question_hash?: string
          tenant_id?: string
          theme?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_question_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      nomination_attachments: {
        Row: {
          created_at: string
          deleted_at: string | null
          filename: string
          id: string
          mime_type: string
          nomination_id: string
          size_bytes: number
          storage_path: string
          tenant_id: string
          thumbnail_path: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          filename: string
          id?: string
          mime_type: string
          nomination_id: string
          size_bytes: number
          storage_path: string
          tenant_id: string
          thumbnail_path?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          filename?: string
          id?: string
          mime_type?: string
          nomination_id?: string
          size_bytes?: number
          storage_path?: string
          tenant_id?: string
          thumbnail_path?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "nomination_attachments_nomination_id_fkey"
            columns: ["nomination_id"]
            isOneToOne: false
            referencedRelation: "nominations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nomination_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      nominations: {
        Row: {
          ai_analysis: Json | null
          created_at: string
          cross_department_evidence: Json | null
          cycle_id: string
          deleted_at: string | null
          endorsement_status: string
          headline: string
          id: string
          impact_metrics: Json | null
          justification: string
          manager_assessment: Json | null
          nominator_department_id: string | null
          nominator_id: string
          nominator_role: string
          nominee_department_id: string | null
          nominee_id: string
          nominee_tenure_months: number | null
          specific_examples: Json | null
          status: string
          submitted_at: string | null
          tenant_id: string
          theme_id: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string
          cross_department_evidence?: Json | null
          cycle_id: string
          deleted_at?: string | null
          endorsement_status?: string
          headline: string
          id?: string
          impact_metrics?: Json | null
          justification: string
          manager_assessment?: Json | null
          nominator_department_id?: string | null
          nominator_id: string
          nominator_role?: string
          nominee_department_id?: string | null
          nominee_id: string
          nominee_tenure_months?: number | null
          specific_examples?: Json | null
          status?: string
          submitted_at?: string | null
          tenant_id: string
          theme_id: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string
          cross_department_evidence?: Json | null
          cycle_id?: string
          deleted_at?: string | null
          endorsement_status?: string
          headline?: string
          id?: string
          impact_metrics?: Json | null
          justification?: string
          manager_assessment?: Json | null
          nominator_department_id?: string | null
          nominator_id?: string
          nominator_role?: string
          nominee_department_id?: string | null
          nominee_id?: string
          nominee_tenure_months?: number | null
          specific_examples?: Json | null
          status?: string
          submitted_at?: string | null
          tenant_id?: string
          theme_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nominations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "award_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominations_nominator_department_id_fkey"
            columns: ["nominator_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominations_nominee_department_id_fkey"
            columns: ["nominee_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominations_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "award_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      nominee_rankings: {
        Row: {
          confidence_interval: Json | null
          created_at: string
          criterion_breakdown: Json
          data_metrics_validation: Json | null
          deleted_at: string | null
          id: string
          nomination_id: string
          rank: number
          raw_average_score: number | null
          tenant_id: string
          theme_results_id: string
          total_votes: number | null
          vote_distribution: Json | null
          weighted_average_score: number | null
        }
        Insert: {
          confidence_interval?: Json | null
          created_at?: string
          criterion_breakdown?: Json
          data_metrics_validation?: Json | null
          deleted_at?: string | null
          id?: string
          nomination_id: string
          rank: number
          raw_average_score?: number | null
          tenant_id: string
          theme_results_id: string
          total_votes?: number | null
          vote_distribution?: Json | null
          weighted_average_score?: number | null
        }
        Update: {
          confidence_interval?: Json | null
          created_at?: string
          criterion_breakdown?: Json
          data_metrics_validation?: Json | null
          deleted_at?: string | null
          id?: string
          nomination_id?: string
          rank?: number
          raw_average_score?: number | null
          tenant_id?: string
          theme_results_id?: string
          total_votes?: number | null
          vote_distribution?: Json | null
          weighted_average_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nominee_rankings_nomination_id_fkey"
            columns: ["nomination_id"]
            isOneToOne: false
            referencedRelation: "nominations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominee_rankings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominee_rankings_theme_results_id_fkey"
            columns: ["theme_results_id"]
            isOneToOne: false
            referencedRelation: "theme_results"
            referencedColumns: ["id"]
          },
        ]
      }
      objective_actions: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          comments: Json
          created_at: string
          created_by: string | null
          deleted_at: string | null
          dependencies: string[] | null
          description: string | null
          estimated_hours: number
          id: string
          initiative_id: string
          is_locked: boolean
          locked_at: string | null
          locked_by: string | null
          metadata: Json | null
          planned_end: string | null
          planned_start: string | null
          priority: number
          source: string
          status: string
          tenant_id: string
          title: string
          title_ar: string | null
          updated_at: string
          work_hours_only: boolean
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          comments?: Json
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          estimated_hours?: number
          id?: string
          initiative_id: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          planned_end?: string | null
          planned_start?: string | null
          priority?: number
          source?: string
          status?: string
          tenant_id: string
          title: string
          title_ar?: string | null
          updated_at?: string
          work_hours_only?: boolean
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          comments?: Json
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          estimated_hours?: number
          id?: string
          initiative_id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          planned_end?: string | null
          planned_start?: string | null
          priority?: number
          source?: string
          status?: string
          tenant_id?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
          work_hours_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "objective_actions_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objective_actions_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objective_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      off_hours_sessions: {
        Row: {
          category: string
          created_at: string
          deleted_at: string | null
          employee_id: string
          ended_at: string | null
          flagged: boolean
          id: string
          manager_notified: boolean
          source_task_ids: string[] | null
          started_at: string
          task_count: number
          tenant_id: string
          total_minutes: number
        }
        Insert: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          employee_id: string
          ended_at?: string | null
          flagged?: boolean
          id?: string
          manager_notified?: boolean
          source_task_ids?: string[] | null
          started_at: string
          task_count?: number
          tenant_id: string
          total_minutes?: number
        }
        Update: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          employee_id?: string
          ended_at?: string | null
          flagged?: boolean
          id?: string
          manager_notified?: boolean
          source_task_ids?: string[] | null
          started_at?: string
          task_count?: number
          tenant_id?: string
          total_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "off_hours_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "off_hours_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_endorsements: {
        Row: {
          additional_context: string | null
          confirmation_statement: string
          deleted_at: string | null
          endorser_department_id: string | null
          endorser_id: string
          id: string
          is_valid: boolean | null
          nomination_id: string
          relationship: string
          submitted_at: string
          tenant_id: string
          validation_reason: string | null
        }
        Insert: {
          additional_context?: string | null
          confirmation_statement: string
          deleted_at?: string | null
          endorser_department_id?: string | null
          endorser_id: string
          id?: string
          is_valid?: boolean | null
          nomination_id: string
          relationship?: string
          submitted_at?: string
          tenant_id: string
          validation_reason?: string | null
        }
        Update: {
          additional_context?: string | null
          confirmation_statement?: string
          deleted_at?: string | null
          endorser_department_id?: string | null
          endorser_id?: string
          id?: string
          is_valid?: boolean | null
          nomination_id?: string
          relationship?: string
          submitted_at?: string
          tenant_id?: string
          validation_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peer_endorsements_endorser_department_id_fkey"
            columns: ["endorser_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_endorsements_nomination_id_fkey"
            columns: ["nomination_id"]
            isOneToOne: false
            referencedRelation: "nominations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_endorsements_tenant_id_fkey"
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
      platform_settings: {
        Row: {
          allow_public_signup: boolean
          id: string
          show_invitation_link: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_public_signup?: boolean
          id?: string
          show_invitation_link?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_public_signup?: boolean
          id?: string
          show_invitation_link?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          amount: number
          awarded_at: string
          awarded_by: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          source_id: string | null
          source_type: string
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          amount: number
          awarded_at?: string
          awarded_by?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          source_id?: string | null
          source_type: string
          status?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          amount?: number
          awarded_at?: string
          awarded_by?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          source_id?: string | null
          source_type?: string
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          generation_period_id: string | null
          id: string
          name: string | null
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
          generation_period_id?: string | null
          id?: string
          name?: string | null
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
          generation_period_id?: string | null
          id?: string
          name?: string | null
          published_at?: string | null
          question_count?: number
          status?: string
          target_month?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_generation_batches_generation_period_id_fkey"
            columns: ["generation_period_id"]
            isOneToOne: false
            referencedRelation: "generation_periods"
            referencedColumns: ["id"]
          },
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
          batch_ids: Json | null
          created_at: string | null
          created_by: string | null
          custom_schedule: Json | null
          deleted_at: string | null
          description: string | null
          enable_ai_generation: boolean | null
          enable_validation: boolean | null
          end_date: string | null
          frequency: string
          generation_period_id: string | null
          id: string
          name: string
          preferred_time: string | null
          questions_per_delivery: number | null
          schedule_type: string
          start_date: string | null
          status: string
          target_audience: Json | null
          tenant_id: string
          timezone: string | null
          updated_at: string | null
          weekend_days: Json | null
        }
        Insert: {
          active_categories?: Json | null
          avoid_holidays?: boolean | null
          avoid_weekends?: boolean | null
          batch_ids?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_schedule?: Json | null
          deleted_at?: string | null
          description?: string | null
          enable_ai_generation?: boolean | null
          enable_validation?: boolean | null
          end_date?: string | null
          frequency?: string
          generation_period_id?: string | null
          id?: string
          name: string
          preferred_time?: string | null
          questions_per_delivery?: number | null
          schedule_type?: string
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          tenant_id: string
          timezone?: string | null
          updated_at?: string | null
          weekend_days?: Json | null
        }
        Update: {
          active_categories?: Json | null
          avoid_holidays?: boolean | null
          avoid_weekends?: boolean | null
          batch_ids?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_schedule?: Json | null
          deleted_at?: string | null
          description?: string | null
          enable_ai_generation?: boolean | null
          enable_validation?: boolean | null
          end_date?: string | null
          frequency?: string
          generation_period_id?: string | null
          id?: string
          name?: string
          preferred_time?: string | null
          questions_per_delivery?: number | null
          schedule_type?: string
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          tenant_id?: string
          timezone?: string | null
          updated_at?: string | null
          weekend_days?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "question_schedules_generation_period_id_fkey"
            columns: ["generation_period_id"]
            isOneToOne: false
            referencedRelation: "generation_periods"
            referencedColumns: ["id"]
          },
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
          generation_period_id: string | null
          id: string
          model_used: string
          name: string | null
          question_count: number
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
          generation_period_id?: string | null
          id?: string
          model_used: string
          name?: string | null
          question_count?: number
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
          generation_period_id?: string | null
          id?: string
          model_used?: string
          name?: string | null
          question_count?: number
          settings?: Json | null
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          validation_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "question_sets_generation_period_id_fkey"
            columns: ["generation_period_id"]
            isOneToOne: false
            referencedRelation: "generation_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_sets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      question_subcategories: {
        Row: {
          category_id: string
          color: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          description_ar: string | null
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
          category_id: string
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
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
          category_id?: string
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
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
            foreignKeyName: "question_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "question_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_subcategories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          affective_state: string | null
          ai_generated: boolean | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          is_global: boolean | null
          mood_levels: Json | null
          mood_score: number | null
          options: Json | null
          subcategory_id: string | null
          tenant_id: string | null
          text: string
          text_ar: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          affective_state?: string | null
          ai_generated?: boolean | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          mood_levels?: Json | null
          mood_score?: number | null
          options?: Json | null
          subcategory_id?: string | null
          tenant_id?: string | null
          text: string
          text_ar?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          affective_state?: string | null
          ai_generated?: boolean | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          mood_levels?: Json | null
          mood_score?: number | null
          options?: Json | null
          subcategory_id?: string | null
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
      redemption_options: {
        Row: {
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          description_ar: string | null
          fulfillment_config: Json
          id: string
          is_active: boolean | null
          max_per_year: number | null
          min_tenure_months: number | null
          name: string
          name_ar: string | null
          points_cost: number
          tenant_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          fulfillment_config?: Json
          id?: string
          is_active?: boolean | null
          max_per_year?: number | null
          min_tenure_months?: number | null
          name: string
          name_ar?: string | null
          points_cost: number
          tenant_id: string
        }
        Update: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          fulfillment_config?: Json
          id?: string
          is_active?: boolean | null
          max_per_year?: number | null
          min_tenure_months?: number | null
          name?: string
          name_ar?: string | null
          points_cost?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemption_options_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      redemption_requests: {
        Row: {
          deleted_at: string | null
          fulfilled_at: string | null
          hr_notes: string | null
          id: string
          option_id: string
          points_spent: number
          rejection_reason: string | null
          requested_at: string
          status: string
          tenant_id: string
          tracking_number: string | null
          user_id: string
        }
        Insert: {
          deleted_at?: string | null
          fulfilled_at?: string | null
          hr_notes?: string | null
          id?: string
          option_id: string
          points_spent: number
          rejection_reason?: string | null
          requested_at?: string
          status?: string
          tenant_id: string
          tracking_number?: string | null
          user_id: string
        }
        Update: {
          deleted_at?: string | null
          fulfilled_at?: string | null
          hr_notes?: string | null
          id?: string
          option_id?: string
          points_spent?: number
          rejection_reason?: string | null
          requested_at?: string
          status?: string
          tenant_id?: string
          tracking_number?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemption_requests_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "redemption_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemption_requests_tenant_id_fkey"
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
          question_source: string
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
          question_source?: string
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
          question_source?: string
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
      sites: {
        Row: {
          address: string | null
          address_ar: string | null
          branch_id: string
          color: string | null
          created_at: string
          deleted_at: string | null
          department_id: string | null
          head_employee_id: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_ar?: string | null
          branch_id: string
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          head_employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_ar?: string | null
          branch_id?: string
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          head_employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_head_employee_id_fkey"
            columns: ["head_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      spiritual_fasting_logs: {
        Row: {
          completed: boolean
          created_at: string
          energy_rating: number | null
          fast_date: string
          fast_type: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          energy_rating?: number | null
          fast_date: string
          fast_type?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          energy_rating?: number | null
          fast_date?: string
          fast_type?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      spiritual_insight_reports: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          report_data: Json
          report_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          report_data?: Json
          report_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          report_data?: Json
          report_type?: string
          user_id?: string
        }
        Relationships: []
      }
      spiritual_prayer_logs: {
        Row: {
          created_at: string
          id: string
          logged_at: string
          prayer_date: string
          prayer_name: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logged_at?: string
          prayer_date: string
          prayer_name: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logged_at?: string
          prayer_date?: string
          prayer_name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      spiritual_preferences: {
        Row: {
          calculation_method: number
          city: string | null
          country: string | null
          created_at: string
          enabled: boolean
          fasting_enabled: boolean
          id: string
          latitude: number | null
          longitude: number | null
          prayer_enabled: boolean
          quran_enabled: boolean
          reminder_intensity: string
          reminder_time: string | null
          reminders_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          calculation_method?: number
          city?: string | null
          country?: string | null
          created_at?: string
          enabled?: boolean
          fasting_enabled?: boolean
          id?: string
          latitude?: number | null
          longitude?: number | null
          prayer_enabled?: boolean
          quran_enabled?: boolean
          reminder_intensity?: string
          reminder_time?: string | null
          reminders_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          calculation_method?: number
          city?: string | null
          country?: string | null
          created_at?: string
          enabled?: boolean
          fasting_enabled?: boolean
          id?: string
          latitude?: number | null
          longitude?: number | null
          prayer_enabled?: boolean
          quran_enabled?: boolean
          reminder_intensity?: string
          reminder_time?: string | null
          reminders_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spiritual_quran_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          juz_number: number | null
          reflection_notes: string | null
          session_date: string
          surah_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          juz_number?: number | null
          reflection_notes?: string | null
          session_date?: string
          surah_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          juz_number?: number | null
          reflection_notes?: string | null
          session_date?: string
          surah_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      strategic_objectives: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          description_ar: string | null
          end_date: string | null
          id: string
          is_locked: boolean
          locked_at: string | null
          locked_by: string | null
          owner_user_id: string | null
          progress: number
          quarter: string
          start_date: string
          status: string
          tenant_id: string
          title: string
          title_ar: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          end_date?: string | null
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          owner_user_id?: string | null
          progress?: number
          quarter?: string
          start_date?: string
          status?: string
          tenant_id: string
          title: string
          title_ar?: string | null
          updated_at?: string
          year?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          description_ar?: string | null
          end_date?: string | null
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          owner_user_id?: string | null
          progress?: number
          quarter?: string
          start_date?: string
          status?: string
          tenant_id?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "strategic_objectives_tenant_id_fkey"
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
      survey_monitor_snapshots: {
        Row: {
          created_at: string
          id: string
          schedule_id: string
          snapshot_date: string
          stats: Json
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          schedule_id: string
          snapshot_date?: string
          stats?: Json
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          schedule_id?: string
          snapshot_date?: string
          stats?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_monitor_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_workload_correlations: {
        Row: {
          correlation_date: string
          correlation_score: number | null
          created_at: string
          employee_id: string
          id: string
          insights: Json | null
          mood_score: number | null
          survey_response_id: string | null
          tenant_id: string
          workload_snapshot: Json
        }
        Insert: {
          correlation_date?: string
          correlation_score?: number | null
          created_at?: string
          employee_id: string
          id?: string
          insights?: Json | null
          mood_score?: number | null
          survey_response_id?: string | null
          tenant_id: string
          workload_snapshot?: Json
        }
        Update: {
          correlation_date?: string
          correlation_score?: number | null
          created_at?: string
          employee_id?: string
          id?: string
          insights?: Json | null
          mood_score?: number | null
          survey_response_id?: string | null
          tenant_id?: string
          workload_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "survey_workload_correlations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_workload_correlations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_connectors: {
        Row: {
          config: Json | null
          created_at: string
          deleted_at: string | null
          display_name: string
          employee_id: string
          id: string
          last_sync_at: string | null
          provider: string
          status: string
          sync_frequency: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          deleted_at?: string | null
          display_name: string
          employee_id: string
          id?: string
          last_sync_at?: string | null
          provider: string
          status?: string
          sync_frequency?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          employee_id?: string
          id?: string
          last_sync_at?: string | null
          provider?: string
          status?: string
          sync_frequency?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_connectors_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_connectors_tenant_id_fkey"
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
      theme_results: {
        Row: {
          appeal_status: string
          created_at: string
          cycle_id: string
          deleted_at: string | null
          fairness_report: Json
          first_place_nomination_id: string | null
          id: string
          published_at: string | null
          second_place_nomination_id: string | null
          tenant_id: string
          theme_id: string
          third_place_nomination_id: string | null
        }
        Insert: {
          appeal_status?: string
          created_at?: string
          cycle_id: string
          deleted_at?: string | null
          fairness_report?: Json
          first_place_nomination_id?: string | null
          id?: string
          published_at?: string | null
          second_place_nomination_id?: string | null
          tenant_id: string
          theme_id: string
          third_place_nomination_id?: string | null
        }
        Update: {
          appeal_status?: string
          created_at?: string
          cycle_id?: string
          deleted_at?: string | null
          fairness_report?: Json
          first_place_nomination_id?: string | null
          id?: string
          published_at?: string | null
          second_place_nomination_id?: string | null
          tenant_id?: string
          theme_id?: string
          third_place_nomination_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "theme_results_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "award_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_results_first_place_nomination_id_fkey"
            columns: ["first_place_nomination_id"]
            isOneToOne: false
            referencedRelation: "nominations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_results_second_place_nomination_id_fkey"
            columns: ["second_place_nomination_id"]
            isOneToOne: false
            referencedRelation: "nominations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_results_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "award_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_results_third_place_nomination_id_fkey"
            columns: ["third_place_nomination_id"]
            isOneToOne: false
            referencedRelation: "nominations"
            referencedColumns: ["id"]
          },
        ]
      }
      thought_reframes: {
        Row: {
          challenge_answers: Json | null
          created_at: string
          deleted_at: string | null
          employee_id: string
          id: string
          negative_thought: string
          reframed_thought: string
          tenant_id: string
        }
        Insert: {
          challenge_answers?: Json | null
          created_at?: string
          deleted_at?: string | null
          employee_id: string
          id?: string
          negative_thought: string
          reframed_thought: string
          tenant_id: string
        }
        Update: {
          challenge_answers?: Json | null
          created_at?: string
          deleted_at?: string | null
          employee_id?: string
          id?: string
          negative_thought?: string
          reframed_thought?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thought_reframes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thought_reframes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_tasks: {
        Row: {
          actual_minutes: number | null
          comments: Json
          connector_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          employee_id: string
          estimated_minutes: number | null
          external_url: string | null
          id: string
          is_locked: boolean
          is_work_hours: boolean
          locked_at: string | null
          locked_by: string | null
          metadata: Json | null
          priority: number
          scheduled_end: string | null
          scheduled_start: string | null
          source_id: string | null
          source_type: string
          status: string
          synced_at: string | null
          tags: string[] | null
          tenant_id: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          actual_minutes?: number | null
          comments?: Json
          connector_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          employee_id: string
          estimated_minutes?: number | null
          external_url?: string | null
          id?: string
          is_locked?: boolean
          is_work_hours?: boolean
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          priority?: number
          scheduled_end?: string | null
          scheduled_start?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          synced_at?: string | null
          tags?: string[] | null
          tenant_id: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          actual_minutes?: number | null
          comments?: Json
          connector_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          employee_id?: string
          estimated_minutes?: number | null
          external_url?: string | null
          id?: string
          is_locked?: boolean
          is_work_hours?: boolean
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          priority?: number
          scheduled_end?: string | null
          scheduled_start?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          synced_at?: string | null
          tags?: string[] | null
          tenant_id?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_tasks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      votes: {
        Row: {
          applied_weight: number | null
          calculated_weighted_score: number | null
          confidence_level: string | null
          criteria_scores: Json
          cycle_id: string
          deleted_at: string | null
          id: string
          ip_hash: string | null
          justifications: Json | null
          nomination_id: string
          relationship_to_nominee: Json
          tenant_id: string
          theme_id: string
          time_spent_seconds: number | null
          voted_at: string
          voter_department_id: string | null
          voter_id: string
          voter_role: string | null
        }
        Insert: {
          applied_weight?: number | null
          calculated_weighted_score?: number | null
          confidence_level?: string | null
          criteria_scores?: Json
          cycle_id: string
          deleted_at?: string | null
          id?: string
          ip_hash?: string | null
          justifications?: Json | null
          nomination_id: string
          relationship_to_nominee?: Json
          tenant_id: string
          theme_id: string
          time_spent_seconds?: number | null
          voted_at?: string
          voter_department_id?: string | null
          voter_id: string
          voter_role?: string | null
        }
        Update: {
          applied_weight?: number | null
          calculated_weighted_score?: number | null
          confidence_level?: string | null
          criteria_scores?: Json
          cycle_id?: string
          deleted_at?: string | null
          id?: string
          ip_hash?: string | null
          justifications?: Json | null
          nomination_id?: string
          relationship_to_nominee?: Json
          tenant_id?: string
          theme_id?: string
          time_spent_seconds?: number | null
          voted_at?: string
          voter_department_id?: string | null
          voter_id?: string
          voter_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "award_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_nomination_id_fkey"
            columns: ["nomination_id"]
            isOneToOne: false
            referencedRelation: "nominations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "award_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_department_id_fkey"
            columns: ["voter_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_insight_cache: {
        Row: {
          created_at: string
          id: string
          insight_data: Json
          insight_date: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insight_data?: Json
          insight_date?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insight_data?: Json
          insight_date?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_insight_cache_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      work_sites: {
        Row: {
          address: string | null
          address_ar: string | null
          created_at: string
          deleted_at: string | null
          department_id: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          section_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_ar?: string | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          section_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_ar?: string | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          section_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_sites_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_sites_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_sites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      workload_predictions: {
        Row: {
          confidence: number
          created_at: string
          employee_id: string
          id: string
          predicted_hours: number
          prediction_date: string
          risk_factors: Json | null
          source_breakdown: Json | null
          suggested_actions: Json | null
          tenant_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          employee_id: string
          id?: string
          predicted_hours?: number
          prediction_date: string
          risk_factors?: Json | null
          source_breakdown?: Json | null
          suggested_actions?: Json | null
          tenant_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          employee_id?: string
          id?: string
          predicted_hours?: number
          prediction_date?: string
          risk_factors?: Json | null
          source_breakdown?: Json | null
          suggested_actions?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workload_predictions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workload_predictions_tenant_id_fkey"
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
      auto_assign_crisis_case: {
        Args: { p_case_id: string; p_tenant_id: string }
        Returns: string
      }
      count_active_cases: { Args: { _first_aider_id: string }; Returns: number }
      date_trunc_utc: { Args: { ts: string }; Returns: string }
      get_first_aider_id: { Args: { _user_id: string }; Returns: string }
      get_profile_email: { Args: { _user_id: string }; Returns: string }
      get_user_department_id: { Args: { _user_id: string }; Returns: string }
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
      is_first_aider: { Args: { _user_id: string }; Returns: boolean }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      map_intent_to_risk: { Args: { p_intent: string }; Returns: string }
      redeem_points: {
        Args: {
          p_option_id: string
          p_points_cost: number
          p_tenant_id: string
          p_user_id: string
        }
        Returns: string
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
