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
      action_items: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          metadata: Json | null
          priority: string
          project_id: string | null
          scope: string
          snoozed_until: string | null
          source: string
          status: string
          title: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          project_id?: string | null
          scope?: string
          snoozed_until?: string | null
          source?: string
          status?: string
          title: string
          type: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          project_id?: string | null
          scope?: string
          snoozed_until?: string | null
          source?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      action_log: {
        Row: {
          action_type: string
          after_snapshot: Json | null
          before_snapshot: Json | null
          client_request_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          group_id: string | null
          id: string
          undone_at: string | null
          undone_by: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          action_type: string
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          client_request_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          group_id?: string | null
          id?: string
          undone_at?: string | null
          undone_by?: string | null
          user_id: string
          workspace_id?: string
        }
        Update: {
          action_type?: string
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          client_request_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          group_id?: string | null
          id?: string
          undone_at?: string | null
          undone_by?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      agent_actions: {
        Row: {
          action_type: string
          after_json: Json | null
          before_json: Json | null
          created_at: string
          duration_ms: number | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          input_json: Json | null
          run_id: string
          status: string
          step_index: number
        }
        Insert: {
          action_type: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          input_json?: Json | null
          run_id: string
          status?: string
          step_index?: number
        }
        Update: {
          action_type?: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          input_json?: Json | null
          run_id?: string
          status?: string
          step_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_conversations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          summary: string | null
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          summary?: string | null
          title?: string
          updated_at?: string
          user_id: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      agent_memory: {
        Row: {
          created_at: string
          id: string
          key: string
          source_conversation_id: string | null
          updated_at: string
          user_id: string
          value: Json
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          source_conversation_id?: string | null
          updated_at?: string
          user_id: string
          value?: Json
          workspace_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          source_conversation_id?: string | null
          updated_at?: string
          user_id?: string
          value?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_memory_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          plan_json: Json | null
          result_json: Json | null
          role: string
          run_id: string | null
        }
        Insert: {
          attachments?: Json | null
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          plan_json?: Json | null
          result_json?: Json | null
          role?: string
          run_id?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          plan_json?: Json | null
          result_json?: Json | null
          role?: string
          run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_messages_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          attachments: Json | null
          completed_at: string | null
          confirmed_at: string | null
          context_json: Json | null
          created_at: string
          error_message: string | null
          id: string
          input_text: string
          plan_json: Json | null
          result_json: Json | null
          risk_level: string | null
          status: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          attachments?: Json | null
          completed_at?: string | null
          confirmed_at?: string | null
          context_json?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_text: string
          plan_json?: Json | null
          result_json?: Json | null
          risk_level?: string | null
          status?: string
          user_id: string
          workspace_id?: string
        }
        Update: {
          attachments?: Json | null
          completed_at?: string | null
          confirmed_at?: string | null
          context_json?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_text?: string
          plan_json?: Json | null
          result_json?: Json | null
          risk_level?: string | null
          status?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      agent_scout_outputs: {
        Row: {
          approved_at: string | null
          audio_url: string | null
          conversation_id: string | null
          created_at: string
          id: string
          idempotency_key: string | null
          last_error: string | null
          message_text: string | null
          n8n_execution_id: string | null
          recipient_name: string
          recipient_phone: string | null
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          approved_at?: string | null
          audio_url?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          message_text?: string | null
          n8n_execution_id?: string | null
          recipient_name: string
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          workspace_id?: string
        }
        Update: {
          approved_at?: string | null
          audio_url?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          message_text?: string | null
          n8n_execution_id?: string | null
          recipient_name?: string
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      ai_outbox: {
        Row: {
          alert_id: string | null
          attachments: Json | null
          channel: string
          client_id: string | null
          content: string
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          project_id: string | null
          provider_message_id: string | null
          recipient: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["outbox_status"]
          subject: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          alert_id?: string | null
          attachments?: Json | null
          channel?: string
          client_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          project_id?: string | null
          provider_message_id?: string | null
          recipient?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["outbox_status"]
          subject?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          alert_id?: string | null
          attachments?: Json | null
          channel?: string
          client_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          project_id?: string | null
          provider_message_id?: string | null
          recipient?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["outbox_status"]
          subject?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_outbox_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_runs: {
        Row: {
          action_key: string
          created_at: string
          duration_ms: number | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          input_json: Json
          output_json: Json | null
          status: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action_key: string
          created_at?: string
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          input_json?: Json
          output_json?: Json | null
          status?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action_key?: string
          created_at?: string
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          input_json?: Json
          output_json?: Json | null
          status?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      alert_actions: {
        Row: {
          action_item_id: string | null
          action_type: string
          alert_id: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          payload: Json | null
          project_id: string | null
          workspace_id: string
        }
        Insert: {
          action_item_id?: string | null
          action_type: string
          alert_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json | null
          project_id?: string | null
          workspace_id?: string
        }
        Update: {
          action_item_id?: string | null
          action_type?: string
          alert_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json | null
          project_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_actions_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_events: {
        Row: {
          alert_id: string | null
          created_at: string
          error: string | null
          event: string
          id: string
          payload: Json | null
        }
        Insert: {
          alert_id?: string | null
          created_at?: string
          error?: string | null
          event: string
          id?: string
          payload?: Json | null
        }
        Update: {
          alert_id?: string | null
          created_at?: string
          error?: string | null
          event?: string
          id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_events_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          channels: Json
          created_at: string
          enabled: boolean
          id: string
          params: Json
          rule_type: string
          scope: Database["public"]["Enums"]["alert_scope"]
          severity: Database["public"]["Enums"]["alert_severity"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          channels?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          params?: Json
          rule_type: string
          scope?: Database["public"]["Enums"]["alert_scope"]
          severity?: Database["public"]["Enums"]["alert_severity"]
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          channels?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          params?: Json
          rule_type?: string
          scope?: Database["public"]["Enums"]["alert_scope"]
          severity?: Database["public"]["Enums"]["alert_severity"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          action_label: string | null
          action_url: string | null
          ai_assist_enabled: boolean
          ai_context: Json | null
          assigned_to: string | null
          channels: Json
          client_id: string | null
          created_at: string
          created_by: string | null
          due_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          idempotency_key: string | null
          message: string | null
          meta: Json | null
          project_id: string | null
          read_at: string | null
          scope: Database["public"]["Enums"]["alert_scope"]
          severity: Database["public"]["Enums"]["alert_severity"]
          snoozed_until: string | null
          status: Database["public"]["Enums"]["alert_status"]
          title: string
          trigger_at: string
          type: Database["public"]["Enums"]["alert_type"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          ai_assist_enabled?: boolean
          ai_context?: Json | null
          assigned_to?: string | null
          channels?: Json
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          idempotency_key?: string | null
          message?: string | null
          meta?: Json | null
          project_id?: string | null
          read_at?: string | null
          scope?: Database["public"]["Enums"]["alert_scope"]
          severity?: Database["public"]["Enums"]["alert_severity"]
          snoozed_until?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          title: string
          trigger_at?: string
          type: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          ai_assist_enabled?: boolean
          ai_context?: Json | null
          assigned_to?: string | null
          channels?: Json
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          idempotency_key?: string | null
          message?: string | null
          meta?: Json | null
          project_id?: string | null
          read_at?: string | null
          scope?: Database["public"]["Enums"]["alert_scope"]
          severity?: Database["public"]["Enums"]["alert_severity"]
          snoozed_until?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          title?: string
          trigger_at?: string
          type?: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      asset_processing_jobs: {
        Row: {
          asset_id: string
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          status: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          job_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_processing_jobs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "project_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          config_json: Json | null
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          key: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config_json?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key: string
          name: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          config_json?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      automation_suggestions: {
        Row: {
          applied_at: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ignored_at: string | null
          message: string | null
          rule_key: string
          status: string
          suggestion_json: Json | null
          title: string
          workspace_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ignored_at?: string | null
          message?: string | null
          rule_key: string
          status?: string
          suggestion_json?: Json | null
          title: string
          workspace_id?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ignored_at?: string | null
          message?: string | null
          rule_key?: string
          status?: string
          suggestion_json?: Json | null
          title?: string
          workspace_id?: string
        }
        Relationships: []
      }
      brand_kits: {
        Row: {
          account_id: string | null
          colors: Json | null
          created_at: string
          do_list: string | null
          dont_list: string | null
          fonts: Json | null
          id: string
          logo_url: string | null
          name: string
          reference_links: Json | null
          tone_of_voice: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id?: string | null
          colors?: Json | null
          created_at?: string
          do_list?: string | null
          dont_list?: string | null
          fonts?: Json | null
          id?: string
          logo_url?: string | null
          name: string
          reference_links?: Json | null
          tone_of_voice?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          account_id?: string | null
          colors?: Json | null
          created_at?: string
          do_list?: string | null
          dont_list?: string | null
          fonts?: Json | null
          id?: string
          logo_url?: string | null
          name?: string
          reference_links?: Json | null
          tone_of_voice?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      branding_settings: {
        Row: {
          accent_color: string | null
          created_at: string
          favicon_url: string | null
          footer_text: string | null
          id: string
          logo_alt_url: string | null
          logo_url: string | null
          pdf_signature: string | null
          primary_color: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          favicon_url?: string | null
          footer_text?: string | null
          id?: string
          logo_alt_url?: string | null
          logo_url?: string | null
          pdf_signature?: string | null
          primary_color?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          favicon_url?: string | null
          footer_text?: string | null
          id?: string
          logo_alt_url?: string | null
          logo_url?: string | null
          pdf_signature?: string | null
          primary_color?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      cadence_steps: {
        Row: {
          cadence_id: string
          channel: string
          created_at: string
          day_offset: number
          id: string
          is_active: boolean | null
          step_order: number
          template: string
          variations: Json | null
        }
        Insert: {
          cadence_id: string
          channel: string
          created_at?: string
          day_offset?: number
          id?: string
          is_active?: boolean | null
          step_order: number
          template: string
          variations?: Json | null
        }
        Update: {
          cadence_id?: string
          channel?: string
          created_at?: string
          day_offset?: number
          id?: string
          is_active?: boolean | null
          step_order?: number
          template?: string
          variations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cadence_steps_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          },
        ]
      }
      cadences: {
        Row: {
          allowed_channels: string[] | null
          created_at: string
          daily_limit: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          rules: Json | null
          target_niche: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          allowed_channels?: string[] | null
          created_at?: string
          daily_limit?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rules?: Json | null
          target_niche?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          allowed_channels?: string[] | null
          created_at?: string
          daily_limit?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rules?: Json | null
          target_niche?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      calendar_connections: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          connected_at: string | null
          email: string | null
          id: string
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          connected_at?: string | null
          email?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          connected_at?: string | null
          email?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          attendees: Json | null
          color: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          end_at: string
          event_type: string | null
          id: string
          location: string | null
          meet_url: string | null
          owner_user_id: string | null
          project_id: string | null
          provider: string
          provider_event_id: string | null
          recurrence: string | null
          related_id: string | null
          related_type: string | null
          start_at: string
          status: string | null
          timezone: string | null
          title: string
          updated_at: string | null
          visibility: string | null
          workspace_id: string
        }
        Insert: {
          all_day?: boolean | null
          attendees?: Json | null
          color?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          end_at: string
          event_type?: string | null
          id?: string
          location?: string | null
          meet_url?: string | null
          owner_user_id?: string | null
          project_id?: string | null
          provider?: string
          provider_event_id?: string | null
          recurrence?: string | null
          related_id?: string | null
          related_type?: string | null
          start_at: string
          status?: string | null
          timezone?: string | null
          title: string
          updated_at?: string | null
          visibility?: string | null
          workspace_id?: string
        }
        Update: {
          all_day?: boolean | null
          attendees?: Json | null
          color?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          end_at?: string
          event_type?: string | null
          id?: string
          location?: string | null
          meet_url?: string | null
          owner_user_id?: string | null
          project_id?: string | null
          provider?: string
          provider_event_id?: string | null
          recurrence?: string | null
          related_id?: string | null
          related_type?: string | null
          start_at?: string
          status?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string | null
          visibility?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "prospect_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_creative_packages: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string | null
          id: string
          package_json: Json
          studio_run_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          package_json?: Json
          studio_run_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          package_json?: Json
          studio_run_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_creative_packages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_creatives: {
        Row: {
          campaign_id: string | null
          copy: string | null
          created_at: string
          cta: string | null
          format: string | null
          hook: string | null
          id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          copy?: string | null
          created_at?: string
          cta?: string | null
          format?: string | null
          hook?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          copy?: string | null
          created_at?: string
          cta?: string | null
          format?: string | null
          hook?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience: string | null
          budget: number | null
          created_at: string
          end_date: string | null
          id: string
          kpis: Json | null
          name: string
          objective: string | null
          offer: string | null
          start_date: string | null
          status: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          audience?: string | null
          budget?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          kpis?: Json | null
          name: string
          objective?: string | null
          offer?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          audience?: string | null
          budget?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          kpis?: Json | null
          name?: string
          objective?: string | null
          offer?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      cashflow_snapshots: {
        Row: {
          balance: number | null
          generated_at: string
          id: string
          month: string
          total_expense: number | null
          total_revenue: number | null
          workspace_id: string
        }
        Insert: {
          balance?: number | null
          generated_at?: string
          id?: string
          month: string
          total_expense?: number | null
          total_revenue?: number | null
          workspace_id?: string
        }
        Update: {
          balance?: number | null
          generated_at?: string
          id?: string
          month?: string
          total_expense?: number | null
          total_revenue?: number | null
          workspace_id?: string
        }
        Relationships: []
      }
      client_message_events: {
        Row: {
          created_at: string
          event: string
          id: string
          message_id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          message_id: string
          payload?: Json | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          message_id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "client_message_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "client_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          ai_goal: string | null
          ai_variant: string | null
          attachments: Json | null
          channel: string
          client_id: string | null
          content: string
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          material_id: string | null
          material_link: string | null
          project_id: string
          sent_at: string | null
          status: string
          subject: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ai_goal?: string | null
          ai_variant?: string | null
          attachments?: Json | null
          channel?: string
          client_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          material_id?: string | null
          material_link?: string | null
          project_id: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          ai_goal?: string | null
          ai_variant?: string | null
          attachments?: Json | null
          channel?: string
          client_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          material_id?: string | null
          material_link?: string | null
          project_id?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      content_assets: {
        Row: {
          content_item_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          public_url: string | null
          workspace_id: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          public_url?: string | null
          workspace_id?: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          public_url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_assets_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_checklist: {
        Row: {
          content_item_id: string
          created_at: string
          id: string
          status: string | null
          title: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          id?: string
          status?: string | null
          title: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          id?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_checklist_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_comments: {
        Row: {
          author_id: string | null
          author_name: string | null
          content_item_id: string
          created_at: string
          id: string
          text: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          content_item_id: string
          created_at?: string
          id?: string
          text: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          content_item_id?: string
          created_at?: string
          id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_ideas: {
        Row: {
          ai_generated: boolean | null
          angle: string | null
          channel: string | null
          created_at: string
          created_by: string | null
          format: string | null
          hook: string | null
          id: string
          notes: string | null
          pillar: string | null
          priority: number | null
          reference_links: Json | null
          score: number | null
          status: string | null
          target: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          angle?: string | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          format?: string | null
          hook?: string | null
          id?: string
          notes?: string | null
          pillar?: string | null
          priority?: number | null
          reference_links?: Json | null
          score?: number | null
          status?: string | null
          target?: string | null
          title: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          ai_generated?: boolean | null
          angle?: string | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          format?: string | null
          hook?: string | null
          id?: string
          notes?: string | null
          pillar?: string | null
          priority?: number | null
          reference_links?: Json | null
          score?: number | null
          status?: string | null
          target?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          ai_generated: boolean | null
          assets: Json | null
          brand_kit_snapshot: Json | null
          campaign_id: string | null
          caption_long: string | null
          caption_short: string | null
          channel: string | null
          created_at: string
          cta: string | null
          due_at: string | null
          format: string | null
          hashtags: string | null
          hook: string | null
          id: string
          idea_id: string | null
          notes: string | null
          owner_id: string | null
          owner_initials: string | null
          owner_name: string | null
          pillar: string | null
          post_url: string | null
          project_id: string | null
          published_at: string | null
          scheduled_at: string | null
          script: string | null
          status: string | null
          template_fields: Json | null
          template_id: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          assets?: Json | null
          brand_kit_snapshot?: Json | null
          campaign_id?: string | null
          caption_long?: string | null
          caption_short?: string | null
          channel?: string | null
          created_at?: string
          cta?: string | null
          due_at?: string | null
          format?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: string
          idea_id?: string | null
          notes?: string | null
          owner_id?: string | null
          owner_initials?: string | null
          owner_name?: string | null
          pillar?: string | null
          post_url?: string | null
          project_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          script?: string | null
          status?: string | null
          template_fields?: Json | null
          template_id?: string | null
          title: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          ai_generated?: boolean | null
          assets?: Json | null
          brand_kit_snapshot?: Json | null
          campaign_id?: string | null
          caption_long?: string | null
          caption_short?: string | null
          channel?: string | null
          created_at?: string
          cta?: string | null
          due_at?: string | null
          format?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: string
          idea_id?: string | null
          notes?: string | null
          owner_id?: string | null
          owner_initials?: string | null
          owner_name?: string | null
          pillar?: string | null
          post_url?: string | null
          project_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          script?: string | null
          status?: string | null
          template_fields?: Json | null
          template_id?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      content_metrics: {
        Row: {
          collected_at: string
          comments: number | null
          content_item_id: string
          created_at: string
          id: string
          likes: number | null
          reach: number | null
          shares: number | null
          views: number | null
          workspace_id: string
        }
        Insert: {
          collected_at?: string
          comments?: number | null
          content_item_id: string
          created_at?: string
          id?: string
          likes?: number | null
          reach?: number | null
          shares?: number | null
          views?: number | null
          workspace_id?: string
        }
        Update: {
          collected_at?: string
          comments?: number | null
          content_item_id?: string
          created_at?: string
          id?: string
          likes?: number | null
          reach?: number | null
          shares?: number | null
          views?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_metrics_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_scripts: {
        Row: {
          ai_generated: boolean | null
          caption_variations: Json | null
          content_item_id: string | null
          created_at: string
          cta: string | null
          hashtags: string[] | null
          id: string
          idea_id: string | null
          script: string | null
          shotlist: Json | null
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          caption_variations?: Json | null
          content_item_id?: string | null
          created_at?: string
          cta?: string | null
          hashtags?: string[] | null
          id?: string
          idea_id?: string | null
          script?: string | null
          shotlist?: Json | null
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          caption_variations?: Json | null
          content_item_id?: string | null
          created_at?: string
          cta?: string | null
          hashtags?: string[] | null
          id?: string
          idea_id?: string | null
          script?: string | null
          shotlist?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_scripts_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_scripts_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_addendums: {
        Row: {
          body: string | null
          contract_id: string
          created_at: string
          id: string
          signed_at: string | null
          signed_by_email: string | null
          signed_by_name: string | null
          status: string
          title: string
        }
        Insert: {
          body?: string | null
          contract_id: string
          created_at?: string
          id?: string
          signed_at?: string | null
          signed_by_email?: string | null
          signed_by_name?: string | null
          status?: string
          title: string
        }
        Update: {
          body?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          signed_at?: string | null
          signed_by_email?: string | null
          signed_by_name?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_addendums_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_alerts: {
        Row: {
          contract_id: string
          created_at: string
          due_at: string
          id: string
          status: string
          type: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          due_at: string
          id?: string
          status?: string
          type: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          due_at?: string
          id?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_alerts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_links: {
        Row: {
          contract_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_viewed_at: string | null
          share_token: string
          view_count: number | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_viewed_at?: string | null
          share_token: string
          view_count?: number | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_viewed_at?: string | null
          share_token?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_links_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_settings: {
        Row: {
          breach_text: string | null
          created_at: string
          default_renewal_notice_days: number | null
          default_renewal_type: string | null
          default_revisions: number | null
          id: string
          mandatory_clauses: Json | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          breach_text?: string | null
          created_at?: string
          default_renewal_notice_days?: number | null
          default_renewal_type?: string | null
          default_revisions?: number | null
          id?: string
          mandatory_clauses?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          breach_text?: string | null
          created_at?: string
          default_renewal_notice_days?: number | null
          default_renewal_type?: string | null
          default_revisions?: number | null
          id?: string
          mandatory_clauses?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      contract_signatures: {
        Row: {
          contract_id: string
          document_hash: string | null
          id: string
          ip_address: string | null
          proof_url: string | null
          provider: string | null
          raw_payload: Json | null
          signature_type: string
          signed_at: string
          signed_file_url: string | null
          signer_cpf: string | null
          signer_email: string
          signer_name: string
          user_agent: string | null
        }
        Insert: {
          contract_id: string
          document_hash?: string | null
          id?: string
          ip_address?: string | null
          proof_url?: string | null
          provider?: string | null
          raw_payload?: Json | null
          signature_type: string
          signed_at?: string
          signed_file_url?: string | null
          signer_cpf?: string | null
          signer_email: string
          signer_name: string
          user_agent?: string | null
        }
        Update: {
          contract_id?: string
          document_hash?: string | null
          id?: string
          ip_address?: string | null
          proof_url?: string | null
          provider?: string | null
          raw_payload?: Json | null
          signature_type?: string
          signed_at?: string
          signed_file_url?: string | null
          signer_cpf?: string | null
          signer_email?: string
          signer_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          service_type: string | null
          variables: Json | null
          version: number
          workspace_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          service_type?: string | null
          variables?: Json | null
          version?: number
          workspace_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          service_type?: string | null
          variables?: Json | null
          version?: number
          workspace_id?: string
        }
        Relationships: []
      }
      contract_versions: {
        Row: {
          body_rendered: string
          checksum: string | null
          contract_id: string
          created_at: string
          id: string
          variables_filled: Json
          version: number
        }
        Insert: {
          body_rendered: string
          checksum?: string | null
          contract_id: string
          created_at?: string
          id?: string
          variables_filled?: Json
          version: number
        }
        Update: {
          body_rendered?: string
          checksum?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          variables_filled?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_versions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          account_holder_name: string | null
          bank_name: string | null
          client_document: string | null
          client_name: string | null
          created_at: string
          created_by: string | null
          current_version: number | null
          end_date: string | null
          id: string
          notes: string | null
          payment_block_on_breach: boolean | null
          payment_terms: string | null
          pix_key: string | null
          pix_key_type: string | null
          project_id: string
          project_name: string | null
          proposal_id: string | null
          public_summary: Json | null
          renewal_notice_days: number | null
          renewal_type: string | null
          start_date: string | null
          status: string
          template_id: string | null
          total_value: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_holder_name?: string | null
          bank_name?: string | null
          client_document?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          current_version?: number | null
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_block_on_breach?: boolean | null
          payment_terms?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          project_id: string
          project_name?: string | null
          proposal_id?: string | null
          public_summary?: Json | null
          renewal_notice_days?: number | null
          renewal_type?: string | null
          start_date?: string | null
          status?: string
          template_id?: string | null
          total_value: number
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          account_holder_name?: string | null
          bank_name?: string | null
          client_document?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          current_version?: number | null
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_block_on_breach?: boolean | null
          payment_terms?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          project_id?: string
          project_name?: string | null
          proposal_id?: string | null
          public_summary?: Json | null
          renewal_notice_days?: number | null
          renewal_type?: string | null
          start_date?: string | null
          status?: string
          template_id?: string | null
          total_value?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_block_versions: {
        Row: {
          ai_run_id: string | null
          block_id: string
          content: Json
          created_at: string
          created_by: string | null
          id: string
          source: Database["public"]["Enums"]["creative_source"]
          version: number
        }
        Insert: {
          ai_run_id?: string | null
          block_id: string
          content: Json
          created_at?: string
          created_by?: string | null
          id?: string
          source: Database["public"]["Enums"]["creative_source"]
          version: number
        }
        Update: {
          ai_run_id?: string | null
          block_id?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          source?: Database["public"]["Enums"]["creative_source"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "creative_block_versions_ai_run_id_fkey"
            columns: ["ai_run_id"]
            isOneToOne: false
            referencedRelation: "ai_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_block_versions_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "creative_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_blocks: {
        Row: {
          ai_run_id: string | null
          content: Json
          created_at: string
          id: string
          order_index: number
          source: Database["public"]["Enums"]["creative_source"]
          status: Database["public"]["Enums"]["creative_block_status"]
          title: string | null
          type: Database["public"]["Enums"]["creative_block_type"]
          updated_at: string
          version: number
          work_id: string
        }
        Insert: {
          ai_run_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          order_index?: number
          source?: Database["public"]["Enums"]["creative_source"]
          status?: Database["public"]["Enums"]["creative_block_status"]
          title?: string | null
          type: Database["public"]["Enums"]["creative_block_type"]
          updated_at?: string
          version?: number
          work_id: string
        }
        Update: {
          ai_run_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          order_index?: number
          source?: Database["public"]["Enums"]["creative_source"]
          status?: Database["public"]["Enums"]["creative_block_status"]
          title?: string | null
          type?: Database["public"]["Enums"]["creative_block_type"]
          updated_at?: string
          version?: number
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_blocks_ai_run_id_fkey"
            columns: ["ai_run_id"]
            isOneToOne: false
            referencedRelation: "ai_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_blocks_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "creative_works"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_briefs: {
        Row: {
          account_id: string | null
          brand_kit_id: string | null
          created_at: string
          delivery_type: string | null
          extracted_context: Json | null
          id: string
          input_files: Json | null
          input_text: string | null
          objective: string | null
          package_type: string | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id?: string | null
          brand_kit_id?: string | null
          created_at?: string
          delivery_type?: string | null
          extracted_context?: Json | null
          id?: string
          input_files?: Json | null
          input_text?: string | null
          objective?: string | null
          package_type?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          account_id?: string | null
          brand_kit_id?: string | null
          created_at?: string
          delivery_type?: string | null
          extracted_context?: Json | null
          id?: string
          input_files?: Json | null
          input_text?: string | null
          objective?: string | null
          package_type?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_briefs_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "brand_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_outputs: {
        Row: {
          brief_id: string
          content: Json
          created_at: string
          format: string | null
          id: string
          type: string
          version: number | null
        }
        Insert: {
          brief_id: string
          content?: Json
          created_at?: string
          format?: string | null
          id?: string
          type: string
          version?: number | null
        }
        Update: {
          brief_id?: string
          content?: Json
          created_at?: string
          format?: string | null
          id?: string
          type?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_outputs_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "creative_briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_work_references: {
        Row: {
          created_at: string
          creative_work_id: string
          file_id: string | null
          id: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          url: string | null
          use_for_ai: boolean
          workspace_id: string
        }
        Insert: {
          created_at?: string
          creative_work_id: string
          file_id?: string | null
          id?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          use_for_ai?: boolean
          workspace_id?: string
        }
        Update: {
          created_at?: string
          creative_work_id?: string
          file_id?: string | null
          id?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          use_for_ai?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_work_references_creative_work_id_fkey"
            columns: ["creative_work_id"]
            isOneToOne: false
            referencedRelation: "creative_works"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_works: {
        Row: {
          brand_kit_id: string | null
          campaign_id: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          parent_work_id: string | null
          project_id: string | null
          proposal_id: string | null
          source: Database["public"]["Enums"]["creative_source"]
          status: Database["public"]["Enums"]["creative_work_status"]
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["creative_work_type"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          brand_kit_id?: string | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          parent_work_id?: string | null
          project_id?: string | null
          proposal_id?: string | null
          source?: Database["public"]["Enums"]["creative_source"]
          status?: Database["public"]["Enums"]["creative_work_status"]
          tags?: string[] | null
          title: string
          type?: Database["public"]["Enums"]["creative_work_type"]
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          brand_kit_id?: string | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          parent_work_id?: string | null
          project_id?: string | null
          proposal_id?: string | null
          source?: Database["public"]["Enums"]["creative_source"]
          status?: Database["public"]["Enums"]["creative_work_status"]
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["creative_work_type"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_works_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_works_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_works_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_works_parent_work_id_fkey"
            columns: ["parent_work_id"]
            isOneToOne: false
            referencedRelation: "creative_works"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_works_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_works_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          contact_id: string | null
          created_at: string
          created_by: string | null
          id: string
          payload: Json | null
          title: string | null
          type: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json | null
          title?: string | null
          type: string
          user_id: string
          workspace_id?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json | null
          title?: string | null
          type?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          company: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          instagram: string | null
          name: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
          workspace_id?: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          lost_reason: string | null
          next_action: string | null
          next_action_at: string | null
          project_id: string | null
          score: number | null
          source: string | null
          stage_key: string | null
          temperature: string | null
          title: string
          updated_at: string | null
          value: number | null
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lost_reason?: string | null
          next_action?: string | null
          next_action_at?: string | null
          project_id?: string | null
          score?: number | null
          source?: string | null
          stage_key?: string | null
          temperature?: string | null
          title: string
          updated_at?: string | null
          value?: number | null
          workspace_id?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lost_reason?: string | null
          next_action?: string | null
          next_action_at?: string | null
          project_id?: string | null
          score?: number | null
          source?: string | null
          stage_key?: string | null
          temperature?: string | null
          title?: string
          updated_at?: string | null
          value?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_stage_key_fkey"
            columns: ["stage_key"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["key"]
          },
        ]
      }
      crm_stages: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          key: string
          order_index: number
          title: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          key: string
          order_index: number
          title: string
          workspace_id?: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          key?: string
          order_index?: number
          title?: string
          workspace_id?: string
        }
        Relationships: []
      }
      deadlines: {
        Row: {
          assignee_id: string | null
          assignee_name: string | null
          block_reason: string | null
          created_at: string | null
          deliverable_id: string | null
          description: string | null
          due_at: string
          id: string
          priority: string | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assignee_id?: string | null
          assignee_name?: string | null
          block_reason?: string | null
          created_at?: string | null
          deliverable_id?: string | null
          description?: string | null
          due_at: string
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          workspace_id?: string
        }
        Update: {
          assignee_id?: string | null
          assignee_name?: string | null
          block_reason?: string | null
          created_at?: string | null
          deliverable_id?: string | null
          description?: string | null
          due_at?: string
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      deliverable_comments: {
        Row: {
          attachments: Json | null
          author_id: string | null
          author_name: string
          author_type: string
          content: string
          created_at: string
          deliverable_id: string
          id: string
          workspace_id: string
        }
        Insert: {
          attachments?: Json | null
          author_id?: string | null
          author_name?: string
          author_type?: string
          content: string
          created_at?: string
          deliverable_id: string
          id?: string
          workspace_id?: string
        }
        Update: {
          attachments?: Json | null
          author_id?: string | null
          author_name?: string
          author_type?: string
          content?: string
          created_at?: string
          deliverable_id?: string
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_comments_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "project_deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      do_not_contact: {
        Row: {
          blocked_by: string | null
          created_at: string
          id: string
          prospect_id: string
          reason: string | null
          workspace_id: string
        }
        Insert: {
          blocked_by?: string | null
          created_at?: string
          id?: string
          prospect_id: string
          reason?: string | null
          workspace_id?: string
        }
        Update: {
          blocked_by?: string | null
          created_at?: string
          id?: string
          prospect_id?: string
          reason?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "do_not_contact_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: true
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      event_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          payload: Json | null
          user_agent: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
          user_agent?: string | null
          workspace_id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
          user_agent?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          due_date: string
          id: string
          notes: string | null
          paid_date: string | null
          project_id: string | null
          status: string
          supplier: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          project_id?: string | null
          status?: string
          supplier?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          project_id?: string | null
          status?: string
          supplier?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      finance_settings: {
        Row: {
          block_after_days: number | null
          block_message: string | null
          created_at: string
          expense_categories: Json | null
          id: string
          payment_methods: Json | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          block_after_days?: number | null
          block_message?: string | null
          created_at?: string
          expense_categories?: Json | null
          id?: string
          payment_methods?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          block_after_days?: number | null
          block_message?: string | null
          created_at?: string
          expense_categories?: Json | null
          id?: string
          payment_methods?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          balance: number | null
          created_at: string
          id: string
          name: string
          type: string
          workspace_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          id?: string
          name: string
          type?: string
          workspace_id?: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          id?: string
          name?: string
          type?: string
          workspace_id?: string
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          account_id: string | null
          brief_id: string | null
          created_at: string
          height: number | null
          id: string
          project_id: string | null
          prompt: string
          public_url: string | null
          purpose: string | null
          scene_id: string | null
          storage_path: string | null
          width: number | null
          workspace_id: string
        }
        Insert: {
          account_id?: string | null
          brief_id?: string | null
          created_at?: string
          height?: number | null
          id?: string
          project_id?: string | null
          prompt: string
          public_url?: string | null
          purpose?: string | null
          scene_id?: string | null
          storage_path?: string | null
          width?: number | null
          workspace_id?: string
        }
        Update: {
          account_id?: string | null
          brief_id?: string | null
          created_at?: string
          height?: number | null
          id?: string
          project_id?: string | null
          prompt?: string
          public_url?: string | null
          purpose?: string | null
          scene_id?: string | null
          storage_path?: string | null
          width?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "creative_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_images_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "storyboard_scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      govbr_signing_sessions: {
        Row: {
          completed_at: string | null
          contract_id: string
          created_at: string | null
          document_hash: string
          expires_at: string | null
          id: string
          return_url: string | null
          state_token: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          contract_id: string
          created_at?: string | null
          document_hash: string
          expires_at?: string | null
          id?: string
          return_url?: string | null
          state_token: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          contract_id?: string
          created_at?: string | null
          document_hash?: string
          expires_at?: string | null
          id?: string
          return_url?: string | null
          state_token?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "govbr_signing_sessions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_messages: {
        Row: {
          direction: Database["public"]["Enums"]["inbox_direction"]
          id: string
          media_url: string | null
          meta: Json | null
          sent_at: string
          text: string
          thread_id: string
        }
        Insert: {
          direction: Database["public"]["Enums"]["inbox_direction"]
          id?: string
          media_url?: string | null
          meta?: Json | null
          sent_at?: string
          text: string
          thread_id: string
        }
        Update: {
          direction?: Database["public"]["Enums"]["inbox_direction"]
          id?: string
          media_url?: string | null
          meta?: Json | null
          sent_at?: string
          text?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "inbox_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_threads: {
        Row: {
          assigned_to: string | null
          channel: Database["public"]["Enums"]["inbox_channel"]
          contact_avatar_url: string | null
          contact_handle: string | null
          contact_name: string
          created_at: string
          external_thread_id: string | null
          id: string
          last_message_at: string | null
          status: Database["public"]["Enums"]["inbox_status"]
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          channel: Database["public"]["Enums"]["inbox_channel"]
          contact_avatar_url?: string | null
          contact_handle?: string | null
          contact_name: string
          created_at?: string
          external_thread_id?: string | null
          id?: string
          last_message_at?: string | null
          status?: Database["public"]["Enums"]["inbox_status"]
          workspace_id?: string
        }
        Update: {
          assigned_to?: string | null
          channel?: Database["public"]["Enums"]["inbox_channel"]
          contact_avatar_url?: string | null
          contact_handle?: string | null
          contact_name?: string
          created_at?: string
          external_thread_id?: string | null
          id?: string
          last_message_at?: string | null
          status?: Database["public"]["Enums"]["inbox_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_threads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_connections: {
        Row: {
          access_token: string | null
          connected_at: string
          id: string
          ig_user_id: string | null
          ig_username: string
          token_expires_at: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string
          id?: string
          ig_user_id?: string | null
          ig_username: string
          token_expires_at?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string
          id?: string
          ig_user_id?: string | null
          ig_username?: string
          token_expires_at?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      instagram_references: {
        Row: {
          caption: string | null
          content_idea_id: string | null
          content_item_id: string | null
          created_at: string
          id: string
          media_id: string | null
          media_type: string | null
          media_url: string | null
          note: string | null
          permalink: string | null
          project_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          timestamp: string | null
          workspace_id: string
        }
        Insert: {
          caption?: string | null
          content_idea_id?: string | null
          content_item_id?: string | null
          created_at?: string
          id?: string
          media_id?: string | null
          media_type?: string | null
          media_url?: string | null
          note?: string | null
          permalink?: string | null
          project_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          timestamp?: string | null
          workspace_id?: string
        }
        Update: {
          caption?: string | null
          content_idea_id?: string | null
          content_item_id?: string | null
          created_at?: string
          id?: string
          media_id?: string | null
          media_type?: string | null
          media_url?: string | null
          note?: string | null
          permalink?: string | null
          project_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          timestamp?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_references_content_idea_id_fkey"
            columns: ["content_idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_references_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_snapshots: {
        Row: {
          connection_id: string | null
          fetched_at: string
          id: string
          insights: Json | null
          latest_posts: Json | null
          profile_data: Json | null
          workspace_id: string
        }
        Insert: {
          connection_id?: string | null
          fetched_at?: string
          id?: string
          insights?: Json | null
          latest_posts?: Json | null
          profile_data?: Json | null
          workspace_id?: string
        }
        Update: {
          connection_id?: string | null
          fetched_at?: string
          id?: string
          insights?: Json | null
          latest_posts?: Json | null
          profile_data?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_snapshots_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "instagram_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          config: Json | null
          connected_at: string | null
          created_at: string
          id: string
          last_error: string | null
          provider: string
          status: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config?: Json | null
          connected_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          provider: string
          status?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          config?: Json | null
          connected_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          provider?: string
          status?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      knowledge_articles: {
        Row: {
          category: string | null
          content_md: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          content_md?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          category?: string | null
          content_md?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_files: {
        Row: {
          article_id: string
          created_at: string
          file_name: string | null
          file_url: string
          id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          file_name?: string | null
          file_url: string
          id?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_files_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_assets: {
        Row: {
          brand_kit_id: string | null
          created_at: string
          file_size: number | null
          id: string
          mime_type: string | null
          project_id: string | null
          public_url: string | null
          storage_path: string | null
          tags: string[] | null
          title: string
          type: string
          workspace_id: string
        }
        Insert: {
          brand_kit_id?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          project_id?: string | null
          public_url?: string | null
          storage_path?: string | null
          tags?: string[] | null
          title: string
          type: string
          workspace_id?: string
        }
        Update: {
          brand_kit_id?: string | null
          created_at?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          project_id?: string | null
          public_url?: string | null
          storage_path?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_assets_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "brand_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_settings: {
        Row: {
          active_channels: Json | null
          active_formats: Json | null
          active_pillars: Json | null
          created_at: string
          default_tone: string | null
          id: string
          recommended_frequency: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active_channels?: Json | null
          active_formats?: Json | null
          active_pillars?: Json | null
          created_at?: string
          default_tone?: string | null
          id?: string
          recommended_frequency?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          active_channels?: Json | null
          active_formats?: Json | null
          active_pillars?: Json | null
          created_at?: string
          default_tone?: string | null
          id?: string
          recommended_frequency?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      meeting_notes: {
        Row: {
          ai_generated: boolean | null
          created_at: string | null
          event_id: string
          id: string
          next_steps: Json | null
          objections: string | null
          owner: string | null
          pain_points: string | null
          recommendations: string | null
          requirements: string | null
          summary: string | null
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string | null
          event_id: string
          id?: string
          next_steps?: Json | null
          objections?: string | null
          owner?: string | null
          pain_points?: string | null
          recommendations?: string | null
          requirements?: string | null
          summary?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string | null
          event_id?: string
          id?: string
          next_steps?: Json | null
          objections?: string | null
          owner?: string | null
          pain_points?: string | null
          recommendations?: string | null
          requirements?: string | null
          summary?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      message_drafts: {
        Row: {
          action_item_id: string | null
          attachments: Json | null
          channel: string
          client_id: string | null
          content: string
          created_at: string
          id: string
          project_id: string | null
          scope: string
          sent_at: string | null
          sent_by: string | null
          status: string
          tone: string
          updated_at: string
          variables_used: Json | null
          workspace_id: string
        }
        Insert: {
          action_item_id?: string | null
          attachments?: Json | null
          channel?: string
          client_id?: string | null
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          scope?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          tone?: string
          updated_at?: string
          variables_used?: Json | null
          workspace_id?: string
        }
        Update: {
          action_item_id?: string | null
          attachments?: Json | null
          channel?: string
          client_id?: string | null
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          scope?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          tone?: string
          updated_at?: string
          variables_used?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_drafts_action_item_id_fkey"
            columns: ["action_item_id"]
            isOneToOne: false
            referencedRelation: "action_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          meta: Json | null
          read_at: string | null
          severity: string | null
          title: string
          type: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          meta?: Json | null
          read_at?: string | null
          severity?: string | null
          title: string
          type: string
          user_id?: string | null
          workspace_id?: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          meta?: Json | null
          read_at?: string | null
          severity?: string | null
          title?: string
          type?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          blocks_enabled: boolean | null
          contracts_enabled: boolean | null
          created_at: string
          delays_enabled: boolean | null
          email_enabled: boolean | null
          id: string
          inapp_enabled: boolean | null
          proposals_enabled: boolean | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          blocks_enabled?: boolean | null
          contracts_enabled?: boolean | null
          created_at?: string
          delays_enabled?: boolean | null
          email_enabled?: boolean | null
          id?: string
          inapp_enabled?: boolean | null
          proposals_enabled?: boolean | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          blocks_enabled?: boolean | null
          contracts_enabled?: boolean | null
          created_at?: string
          delays_enabled?: boolean | null
          email_enabled?: boolean | null
          id?: string
          inapp_enabled?: boolean | null
          proposals_enabled?: boolean | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      panorama_access_log: {
        Row: {
          created_at: string
          event: string
          id: string
          ip_address: string | null
          snapshot_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          ip_address?: string | null
          snapshot_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          ip_address?: string | null
          snapshot_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "panorama_access_log_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "panorama_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      panorama_snapshots: {
        Row: {
          created_at: string
          generated_by: string | null
          id: string
          metadata: Json | null
          pdf_file_path: string | null
          pdf_url: string | null
          project_id: string
          share_expires_at: string | null
          share_token: string | null
          text_content: string | null
          tone: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          pdf_file_path?: string | null
          pdf_url?: string | null
          project_id: string
          share_expires_at?: string | null
          share_token?: string | null
          text_content?: string | null
          tone?: string | null
          version?: number
          workspace_id?: string
        }
        Update: {
          created_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          pdf_file_path?: string | null
          pdf_url?: string | null
          project_id?: string
          share_expires_at?: string | null
          share_token?: string | null
          text_content?: string | null
          tone?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: []
      }
      payment_milestones: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          due_date: string
          id: string
          paid_date: string | null
          revenue_id: string | null
          status: string
          title: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          paid_date?: string | null
          revenue_id?: string | null
          status?: string
          title: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          paid_date?: string | null
          revenue_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_activities: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          portal_link_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          portal_link_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          portal_link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_activities_portal_link_id_fkey"
            columns: ["portal_link_id"]
            isOneToOne: false
            referencedRelation: "portal_links"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_approvals: {
        Row: {
          approved_at: string
          approved_by_email: string | null
          approved_by_name: string
          deliverable_id: string
          id: string
          notes: string | null
          project_file_id: string | null
        }
        Insert: {
          approved_at?: string
          approved_by_email?: string | null
          approved_by_name: string
          deliverable_id: string
          id?: string
          notes?: string | null
          project_file_id?: string | null
        }
        Update: {
          approved_at?: string
          approved_by_email?: string | null
          approved_by_name?: string
          deliverable_id?: string
          id?: string
          notes?: string | null
          project_file_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_approvals_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "portal_deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_approvals_project_file_id_fkey"
            columns: ["project_file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_change_requests: {
        Row: {
          assigned_to: string | null
          author_email: string | null
          author_name: string
          author_role: string
          created_at: string
          deliverable_id: string | null
          description: string | null
          evidence_url: string | null
          id: string
          portal_link_id: string
          priority: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          author_email?: string | null
          author_name: string
          author_role?: string
          created_at?: string
          deliverable_id?: string | null
          description?: string | null
          evidence_url?: string | null
          id?: string
          portal_link_id: string
          priority?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          author_email?: string | null
          author_name?: string
          author_role?: string
          created_at?: string
          deliverable_id?: string | null
          description?: string | null
          evidence_url?: string | null
          id?: string
          portal_link_id?: string
          priority?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_change_requests_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "portal_deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_change_requests_portal_link_id_fkey"
            columns: ["portal_link_id"]
            isOneToOne: false
            referencedRelation: "portal_links"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_comments: {
        Row: {
          annotation_data: Json | null
          author_email: string | null
          author_name: string
          author_role: string | null
          content: string
          created_at: string
          deliverable_id: string
          frame_timestamp_ms: number | null
          id: string
          priority: string | null
          project_file_id: string | null
          screenshot_url: string | null
          status: string | null
          timecode: string | null
        }
        Insert: {
          annotation_data?: Json | null
          author_email?: string | null
          author_name: string
          author_role?: string | null
          content: string
          created_at?: string
          deliverable_id: string
          frame_timestamp_ms?: number | null
          id?: string
          priority?: string | null
          project_file_id?: string | null
          screenshot_url?: string | null
          status?: string | null
          timecode?: string | null
        }
        Update: {
          annotation_data?: Json | null
          author_email?: string | null
          author_name?: string
          author_role?: string | null
          content?: string
          created_at?: string
          deliverable_id?: string
          frame_timestamp_ms?: number | null
          id?: string
          priority?: string | null
          project_file_id?: string | null
          screenshot_url?: string | null
          status?: string | null
          timecode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_comments_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "portal_deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_comments_project_file_id_fkey"
            columns: ["project_file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_deliverable_versions: {
        Row: {
          change_tags: string[] | null
          changelog_items: Json | null
          created_at: string
          created_by_name: string | null
          deliverable_id: string
          file_url: string | null
          id: string
          notes: string | null
          title: string | null
          version_number: number
        }
        Insert: {
          change_tags?: string[] | null
          changelog_items?: Json | null
          created_at?: string
          created_by_name?: string | null
          deliverable_id: string
          file_url?: string | null
          id?: string
          notes?: string | null
          title?: string | null
          version_number?: number
        }
        Update: {
          change_tags?: string[] | null
          changelog_items?: Json | null
          created_at?: string
          created_by_name?: string | null
          deliverable_id?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          title?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "portal_deliverable_versions_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "portal_deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_deliverables: {
        Row: {
          awaiting_approval: boolean | null
          client_upload_name: string | null
          created_at: string
          current_version: number | null
          description: string | null
          external_url: string | null
          file_url: string | null
          id: string
          material_category: string | null
          portal_link_id: string
          sort_order: number | null
          status: Database["public"]["Enums"]["deliverable_status"]
          thumbnail_url: string | null
          title: string
          type: string | null
          updated_at: string
          uploaded_by_client: boolean | null
          visible_in_portal: boolean | null
          youtube_url: string | null
        }
        Insert: {
          awaiting_approval?: boolean | null
          client_upload_name?: string | null
          created_at?: string
          current_version?: number | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          material_category?: string | null
          portal_link_id: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["deliverable_status"]
          thumbnail_url?: string | null
          title: string
          type?: string | null
          updated_at?: string
          uploaded_by_client?: boolean | null
          visible_in_portal?: boolean | null
          youtube_url?: string | null
        }
        Update: {
          awaiting_approval?: boolean | null
          client_upload_name?: string | null
          created_at?: string
          current_version?: number | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          material_category?: string | null
          portal_link_id?: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["deliverable_status"]
          thumbnail_url?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          uploaded_by_client?: boolean | null
          visible_in_portal?: boolean | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_deliverables_portal_link_id_fkey"
            columns: ["portal_link_id"]
            isOneToOne: false
            referencedRelation: "portal_links"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_links: {
        Row: {
          blocked_by_payment: boolean | null
          client_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          project_id: string
          project_name: string | null
          share_token: string
        }
        Insert: {
          blocked_by_payment?: boolean | null
          client_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          project_id: string
          project_name?: string | null
          share_token: string
        }
        Update: {
          blocked_by_payment?: boolean | null
          client_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string
          project_name?: string | null
          share_token?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          module_access: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          module_access?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          module_access?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_action_items: {
        Row: {
          assignee: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          interaction_id: string | null
          project_id: string
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assignee?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          interaction_id?: string | null
          project_id: string
          status?: string
          title: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          assignee?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          interaction_id?: string | null
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_action_items_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "project_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_action_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_assets: {
        Row: {
          ai_confidence: number | null
          ai_entities: Json | null
          ai_processed: boolean
          ai_summary: string | null
          ai_tags: string[] | null
          ai_title: string | null
          asset_type: string
          category: string
          created_at: string
          deliverable_id: string | null
          description: string | null
          duration_seconds: number | null
          embed_url: string | null
          file_ext: string | null
          file_name: string | null
          file_size_bytes: number | null
          height: number | null
          id: string
          mime_type: string | null
          og_image_url: string | null
          preview_url: string | null
          project_id: string
          provider: string | null
          source_type: string
          stage_key: string | null
          status: string
          storage_bucket: string | null
          storage_path: string | null
          tags: string[] | null
          thumb_url: string | null
          title: string
          updated_at: string
          uploaded_by_client_name: string | null
          uploaded_by_user_id: string | null
          url: string | null
          visibility: string
          width: number | null
          workspace_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_entities?: Json | null
          ai_processed?: boolean
          ai_summary?: string | null
          ai_tags?: string[] | null
          ai_title?: string | null
          asset_type?: string
          category?: string
          created_at?: string
          deliverable_id?: string | null
          description?: string | null
          duration_seconds?: number | null
          embed_url?: string | null
          file_ext?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          og_image_url?: string | null
          preview_url?: string | null
          project_id: string
          provider?: string | null
          source_type?: string
          stage_key?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          tags?: string[] | null
          thumb_url?: string | null
          title?: string
          updated_at?: string
          uploaded_by_client_name?: string | null
          uploaded_by_user_id?: string | null
          url?: string | null
          visibility?: string
          width?: number | null
          workspace_id?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_entities?: Json | null
          ai_processed?: boolean
          ai_summary?: string | null
          ai_tags?: string[] | null
          ai_title?: string | null
          asset_type?: string
          category?: string
          created_at?: string
          deliverable_id?: string | null
          description?: string | null
          duration_seconds?: number | null
          embed_url?: string | null
          file_ext?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          og_image_url?: string | null
          preview_url?: string | null
          project_id?: string
          provider?: string | null
          source_type?: string
          stage_key?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          tags?: string[] | null
          thumb_url?: string | null
          title?: string
          updated_at?: string
          uploaded_by_client_name?: string | null
          uploaded_by_user_id?: string | null
          url?: string | null
          visibility?: string
          width?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_deliverables: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_archived: boolean
          last_activity_at: string | null
          link_provider: string | null
          link_url: string | null
          lock_reason: string | null
          mime_type: string | null
          name: string
          order_index: number
          priority: string
          project_id: string
          status: string
          thumbnail_url: string | null
          type: string
          updated_at: string
          version_number: number
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_archived?: boolean
          last_activity_at?: string | null
          link_provider?: string | null
          link_url?: string | null
          lock_reason?: string | null
          mime_type?: string | null
          name: string
          order_index?: number
          priority?: string
          project_id: string
          status?: string
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          version_number?: number
          workspace_id?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_archived?: boolean
          last_activity_at?: string | null
          link_provider?: string | null
          link_url?: string | null
          lock_reason?: string | null
          mime_type?: string | null
          name?: string
          order_index?: number
          priority?: string
          project_id?: string
          status?: string
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          folder: string
          id: string
          name: string
          project_id: string
          tags: string[] | null
          uploaded_by: string | null
          uploaded_by_name: string | null
          visible_in_portal: boolean | null
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          folder?: string
          id?: string
          name: string
          project_id: string
          tags?: string[] | null
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          visible_in_portal?: boolean | null
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          folder?: string
          id?: string
          name?: string
          project_id?: string
          tags?: string[] | null
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          visible_in_portal?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_interaction_assets: {
        Row: {
          created_at: string
          file_size: number | null
          filename: string | null
          id: string
          interaction_id: string
          mime_type: string | null
          storage_path: string | null
          type: string
          url: string | null
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          filename?: string | null
          id?: string
          interaction_id: string
          mime_type?: string | null
          storage_path?: string | null
          type: string
          url?: string | null
        }
        Update: {
          created_at?: string
          file_size?: number | null
          filename?: string | null
          id?: string
          interaction_id?: string
          mime_type?: string | null
          storage_path?: string | null
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_interaction_assets_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "project_interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      project_interaction_summaries: {
        Row: {
          action_items: Json | null
          ai_run_id: string | null
          deadlines: Json | null
          decisions: Json | null
          generated_at: string
          id: string
          interaction_id: string
          risks: Json | null
          summary_bullets: Json | null
        }
        Insert: {
          action_items?: Json | null
          ai_run_id?: string | null
          deadlines?: Json | null
          decisions?: Json | null
          generated_at?: string
          id?: string
          interaction_id: string
          risks?: Json | null
          summary_bullets?: Json | null
        }
        Update: {
          action_items?: Json | null
          ai_run_id?: string | null
          deadlines?: Json | null
          decisions?: Json | null
          generated_at?: string
          id?: string
          interaction_id?: string
          risks?: Json | null
          summary_bullets?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_interaction_summaries_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: true
            referencedRelation: "project_interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      project_interactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_public: boolean
          notes_internal: string | null
          occurred_at: string
          participants: string | null
          project_id: string
          source: string | null
          title: string
          transcript: string | null
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          notes_internal?: string | null
          occurred_at?: string
          participants?: string | null
          project_id: string
          source?: string | null
          title: string
          transcript?: string | null
          type: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          notes_internal?: string | null
          occurred_at?: string
          participants?: string | null
          project_id?: string
          source?: string | null
          title?: string
          transcript?: string | null
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_interactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_media_items: {
        Row: {
          created_at: string
          duration_sec: number | null
          external_url: string | null
          id: string
          media_type: string
          media_url: string | null
          pinned: boolean
          project_id: string
          sort_order: number
          source_id: string | null
          source_type: string
          status: string
          thumb_url: string | null
          title: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          duration_sec?: number | null
          external_url?: string | null
          id?: string
          media_type: string
          media_url?: string | null
          pinned?: boolean
          project_id: string
          sort_order?: number
          source_id?: string | null
          source_type: string
          status?: string
          thumb_url?: string | null
          title?: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          duration_sec?: number | null
          external_url?: string | null
          id?: string
          media_type?: string
          media_url?: string | null
          pinned?: boolean
          project_id?: string
          sort_order?: number
          source_id?: string | null
          source_type?: string
          status?: string
          thumb_url?: string | null
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_media_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stage_settings: {
        Row: {
          blocks_delivery: boolean | null
          created_at: string
          id: string
          is_active: boolean | null
          sla_days: number | null
          stage_key: string
          stage_label: string
          stage_order: number
          workspace_id: string
        }
        Insert: {
          blocks_delivery?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          sla_days?: number | null
          stage_key: string
          stage_label: string
          stage_order: number
          workspace_id?: string
        }
        Update: {
          blocks_delivery?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          sla_days?: number | null
          stage_key?: string
          stage_label?: string
          stage_order?: number
          workspace_id?: string
        }
        Relationships: []
      }
      project_stages: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          created_at: string | null
          id: string
          order_index: number
          planned_end: string | null
          planned_start: string | null
          project_id: string
          stage_key: string
          status: string | null
          title: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string | null
          id?: string
          order_index: number
          planned_end?: string | null
          planned_start?: string | null
          project_id: string
          stage_key: string
          status?: string | null
          title: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string | null
          id?: string
          order_index?: number
          planned_end?: string | null
          planned_start?: string | null
          project_id?: string
          stage_key?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_storyboard_scenes: {
        Row: {
          ai_prompt: string | null
          camera_movement: string | null
          color_grading: string | null
          created_at: string
          description: string | null
          direction: string | null
          fps: string | null
          id: string
          lens: string | null
          lighting: string | null
          mood: string | null
          negative_prompt: string | null
          production_type: string | null
          scene_number: number
          storyboard_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          ai_prompt?: string | null
          camera_movement?: string | null
          color_grading?: string | null
          created_at?: string
          description?: string | null
          direction?: string | null
          fps?: string | null
          id?: string
          lens?: string | null
          lighting?: string | null
          mood?: string | null
          negative_prompt?: string | null
          production_type?: string | null
          scene_number: number
          storyboard_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          ai_prompt?: string | null
          camera_movement?: string | null
          color_grading?: string | null
          created_at?: string
          description?: string | null
          direction?: string | null
          fps?: string | null
          id?: string
          lens?: string | null
          lighting?: string | null
          mood?: string | null
          negative_prompt?: string | null
          production_type?: string | null
          scene_number?: number
          storyboard_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_storyboard_scenes_storyboard_id_fkey"
            columns: ["storyboard_id"]
            isOneToOne: false
            referencedRelation: "project_storyboards"
            referencedColumns: ["id"]
          },
        ]
      }
      project_storyboards: {
        Row: {
          created_at: string
          created_by: string | null
          deliverable_id: string | null
          id: string
          project_id: string
          source_files: Json | null
          source_reference_id: string | null
          source_text: string | null
          source_type: string
          style_global: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deliverable_id?: string | null
          id?: string
          project_id: string
          source_files?: Json | null
          source_reference_id?: string | null
          source_text?: string | null
          source_type: string
          style_global?: string | null
          title: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deliverable_id?: string | null
          id?: string
          project_id?: string
          source_files?: Json | null
          source_reference_id?: string | null
          source_text?: string | null
          source_type?: string
          style_global?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_storyboards_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "project_deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_storyboards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          banner_url: string | null
          client_name: string
          contract_value: number | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          has_payment_block: boolean | null
          health_score: number | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          owner_name: string | null
          product_type: string
          stage_current: string
          start_date: string | null
          status: string | null
          template: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          banner_url?: string | null
          client_name: string
          contract_value?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          has_payment_block?: boolean | null
          health_score?: number | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          owner_name?: string | null
          product_type?: string
          stage_current?: string
          start_date?: string | null
          status?: string | null
          template?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          banner_url?: string | null
          client_name?: string
          contract_value?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          has_payment_block?: boolean | null
          health_score?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          owner_name?: string | null
          product_type?: string
          stage_current?: string
          start_date?: string | null
          status?: string | null
          template?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_acceptance: {
        Row: {
          accepted_at: string
          accepted_by_email: string
          accepted_by_name: string
          id: string
          ip_address: string | null
          notes: string | null
          proposal_id: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          accepted_by_email: string
          accepted_by_name: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          proposal_id: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          accepted_by_email?: string
          accepted_by_name?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          proposal_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_acceptance_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_deliverables: {
        Row: {
          created_at: string
          description: string | null
          id: string
          notes: string | null
          proposal_id: string
          quantity: number | null
          title: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          proposal_id: string
          quantity?: number | null
          title: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          proposal_id?: string
          quantity?: number | null
          title?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_deliverables_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_links: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_viewed_at: string | null
          proposal_id: string
          share_token: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_viewed_at?: string | null
          proposal_id: string
          share_token: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_viewed_at?: string | null
          proposal_id?: string
          share_token?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_links_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_sections: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          order_index: number
          proposal_id: string
          title: string | null
          type: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          order_index?: number
          proposal_id: string
          title?: string | null
          type: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          order_index?: number
          proposal_id?: string
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_sections_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_settings: {
        Row: {
          created_at: string
          id: string
          intro_text: string | null
          prefix: string | null
          required_sections: Json | null
          terms_text: string | null
          updated_at: string
          validity_days: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intro_text?: string | null
          prefix?: string | null
          required_sections?: Json | null
          terms_text?: string | null
          updated_at?: string
          validity_days?: number | null
          workspace_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          intro_text?: string | null
          prefix?: string | null
          required_sections?: Json | null
          terms_text?: string | null
          updated_at?: string
          validity_days?: number | null
          workspace_id?: string
        }
        Relationships: []
      }
      proposal_timeline: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          order_index: number | null
          phase: string
          proposal_id: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          order_index?: number | null
          phase: string
          proposal_id: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          order_index?: number | null
          phase?: string
          proposal_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_timeline_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          client_email: string | null
          client_name: string
          contract_id: string | null
          converted_to_contract: boolean
          created_at: string
          created_by: string | null
          id: string
          notes_internal: string | null
          opportunity_id: string | null
          project_id: string | null
          status: string
          title: string
          total_value: number
          updated_at: string
          valid_until: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          client_email?: string | null
          client_name: string
          contract_id?: string | null
          converted_to_contract?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          notes_internal?: string | null
          opportunity_id?: string | null
          project_id?: string | null
          status?: string
          title: string
          total_value?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
          workspace_id?: string
        }
        Update: {
          client_email?: string | null
          client_name?: string
          contract_id?: string | null
          converted_to_contract?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          notes_internal?: string | null
          opportunity_id?: string | null
          project_id?: string | null
          status?: string
          title?: string
          total_value?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "prospect_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_activities: {
        Row: {
          cadence_step_id: string | null
          channel: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          opportunity_id: string
          outcome: string | null
          title: string
          type: string
          workspace_id: string
        }
        Insert: {
          cadence_step_id?: string | null
          channel?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          opportunity_id: string
          outcome?: string | null
          title: string
          type: string
          workspace_id?: string
        }
        Update: {
          cadence_step_id?: string | null
          channel?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          opportunity_id?: string
          outcome?: string | null
          title?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_activities_cadence_step_id_fkey"
            columns: ["cadence_step_id"]
            isOneToOne: false
            referencedRelation: "cadence_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "prospect_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_audio: {
        Row: {
          audio_url: string | null
          campaign_id: string | null
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          opportunity_id: string | null
          prospect_id: string | null
          script_text: string
          status: string
          trace_id: string | null
          updated_at: string
          voice_id: string
          workspace_id: string
        }
        Insert: {
          audio_url?: string | null
          campaign_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          opportunity_id?: string | null
          prospect_id?: string | null
          script_text: string
          status?: string
          trace_id?: string | null
          updated_at?: string
          voice_id?: string
          workspace_id?: string
        }
        Update: {
          audio_url?: string | null
          campaign_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          opportunity_id?: string | null
          prospect_id?: string | null
          script_text?: string
          status?: string
          trace_id?: string | null
          updated_at?: string
          voice_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_audio_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "prospect_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_audio_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          segment: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          segment?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          segment?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      prospect_opportunities: {
        Row: {
          conversation_summary: string | null
          created_at: string
          estimated_value: number | null
          fit_score: string | null
          id: string
          linked_project_id: string | null
          lost_at: string | null
          lost_reason: string | null
          next_action_at: string | null
          next_action_notes: string | null
          next_action_type: string | null
          objections: string[] | null
          owner_initials: string | null
          owner_name: string | null
          probability: number | null
          prospect_id: string
          stage: string | null
          title: string
          updated_at: string
          won_at: string | null
          workspace_id: string
        }
        Insert: {
          conversation_summary?: string | null
          created_at?: string
          estimated_value?: number | null
          fit_score?: string | null
          id?: string
          linked_project_id?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          next_action_at?: string | null
          next_action_notes?: string | null
          next_action_type?: string | null
          objections?: string[] | null
          owner_initials?: string | null
          owner_name?: string | null
          probability?: number | null
          prospect_id: string
          stage?: string | null
          title: string
          updated_at?: string
          won_at?: string | null
          workspace_id?: string
        }
        Update: {
          conversation_summary?: string | null
          created_at?: string
          estimated_value?: number | null
          fit_score?: string | null
          id?: string
          linked_project_id?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          next_action_at?: string | null
          next_action_notes?: string | null
          next_action_type?: string | null
          objections?: string[] | null
          owner_initials?: string | null
          owner_name?: string | null
          probability?: number | null
          prospect_id?: string
          stage?: string | null
          title?: string
          updated_at?: string
          won_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_opportunities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecting_settings: {
        Row: {
          allowed_channels: Json | null
          approve_first: boolean | null
          auto_send: boolean | null
          blacklist_rules: Json | null
          created_at: string
          daily_activity_limit: number | null
          global_enabled: boolean | null
          id: string
          min_followup_delay_hours: number | null
          optout_text: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          allowed_channels?: Json | null
          approve_first?: boolean | null
          auto_send?: boolean | null
          blacklist_rules?: Json | null
          created_at?: string
          daily_activity_limit?: number | null
          global_enabled?: boolean | null
          id?: string
          min_followup_delay_hours?: number | null
          optout_text?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          allowed_channels?: Json | null
          approve_first?: boolean | null
          auto_send?: boolean | null
          blacklist_rules?: Json | null
          created_at?: string
          daily_activity_limit?: number | null
          global_enabled?: boolean | null
          id?: string
          min_followup_delay_hours?: number | null
          optout_text?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          city: string | null
          company_name: string
          created_at: string
          decision_maker_name: string | null
          decision_maker_role: string | null
          email: string | null
          enriched_at: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          list_id: string | null
          niche: string | null
          notes: string | null
          phone: string | null
          priority: string | null
          region: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          website: string | null
          workspace_id: string
        }
        Insert: {
          city?: string | null
          company_name: string
          created_at?: string
          decision_maker_name?: string | null
          decision_maker_role?: string | null
          email?: string | null
          enriched_at?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          list_id?: string | null
          niche?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string | null
          region?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Update: {
          city?: string | null
          company_name?: string
          created_at?: string
          decision_maker_name?: string | null
          decision_maker_role?: string | null
          email?: string | null
          enriched_at?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          list_id?: string | null
          niche?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string | null
          region?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospects_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "prospect_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_links: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reference_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reference_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reference_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_links_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "instagram_references"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          channel: string | null
          created_at: string | null
          id: string
          related_id: string | null
          related_type: string
          remind_at: string
          status: string | null
          title: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          id?: string
          related_id?: string | null
          related_type: string
          remind_at: string
          status?: string | null
          title?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          id?: string
          related_id?: string | null
          related_type?: string
          remind_at?: string
          status?: string | null
          title?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      report_exports: {
        Row: {
          created_at: string
          file_url: string | null
          format: string
          id: string
          report_type: string
          scope_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          format?: string
          id?: string
          report_type: string
          scope_id?: string | null
          workspace_id?: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          format?: string
          id?: string
          report_type?: string
          scope_id?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      report_snapshots: {
        Row: {
          generated_at: string
          generated_by: string | null
          id: string
          metrics: Json
          period_end: string
          period_start: string
          report_type: string
          scope_id: string | null
          workspace_id: string
        }
        Insert: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          metrics?: Json
          period_end: string
          period_start: string
          report_type: string
          scope_id?: string | null
          workspace_id?: string
        }
        Update: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          metrics?: Json
          period_end?: string
          period_start?: string
          report_type?: string
          scope_id?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      revenues: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          installment_group_id: string | null
          notes: string | null
          payment_method: string | null
          project_id: string | null
          received_date: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount: number
          contract_id?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: string
          installment_group_id?: string | null
          notes?: string | null
          payment_method?: string | null
          project_id?: string | null
          received_date?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          installment_group_id?: string | null
          notes?: string | null
          payment_method?: string | null
          project_id?: string | null
          received_date?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenues_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_focus_plans: {
        Row: {
          completed_tasks: Json
          created_at: string
          id: string
          plan_data: Json
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_tasks?: Json
          created_at?: string
          id?: string
          plan_data?: Json
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_tasks?: Json
          created_at?: string
          id?: string
          plan_data?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scout_audio_assets: {
        Row: {
          content_hash: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          message_id: string
          opportunity_id: string
          public_url: string | null
          storage_path: string
          voice_id: string | null
          workspace_id: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          message_id: string
          opportunity_id: string
          public_url?: string | null
          storage_path: string
          voice_id?: string | null
          workspace_id?: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          message_id?: string
          opportunity_id?: string
          public_url?: string | null
          storage_path?: string
          voice_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scout_audio_assets_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "scout_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scout_audio_assets_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "scout_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      scout_messages: {
        Row: {
          audio_script: string | null
          channel: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          language: string
          opportunity_id: string
          text_message: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          audio_script?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          language?: string
          opportunity_id: string
          text_message?: string | null
          version?: number
          workspace_id?: string
        }
        Update: {
          audio_script?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          language?: string
          opportunity_id?: string
          text_message?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scout_messages_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "scout_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      scout_opportunities: {
        Row: {
          company_name: string
          contact_name: string | null
          contact_phone_e164: string | null
          contact_role: string | null
          context: Json | null
          created_at: string
          created_by: string | null
          id: string
          source: string
          source_ref: string | null
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          company_name: string
          contact_name?: string | null
          contact_phone_e164?: string | null
          contact_role?: string | null
          context?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          source?: string
          source_ref?: string | null
          status?: string
          updated_at?: string
          user_id: string
          workspace_id?: string
        }
        Update: {
          company_name?: string
          contact_name?: string | null
          contact_phone_e164?: string | null
          contact_role?: string | null
          context?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          source?: string
          source_ref?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      storyboard_frames: {
        Row: {
          block_id: string | null
          created_at: string
          id: string
          image_url: string | null
          metadata: Json | null
          prompt: string | null
          scene_index: number
          status: string
          storage_path: string | null
          updated_at: string
          work_id: string
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          prompt?: string | null
          scene_index: number
          status?: string
          storage_path?: string | null
          updated_at?: string
          work_id: string
        }
        Update: {
          block_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          prompt?: string | null
          scene_index?: number
          status?: string
          storage_path?: string | null
          updated_at?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storyboard_frames_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "creative_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_frames_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "creative_works"
            referencedColumns: ["id"]
          },
        ]
      }
      storyboard_scenes: {
        Row: {
          audio: string | null
          brief_id: string
          camera: string | null
          created_at: string
          description: string | null
          duration_sec: number | null
          emotion: string | null
          id: string
          image_url: string | null
          notes: string | null
          output_id: string | null
          scene_number: number
          title: string | null
        }
        Insert: {
          audio?: string | null
          brief_id: string
          camera?: string | null
          created_at?: string
          description?: string | null
          duration_sec?: number | null
          emotion?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          output_id?: string | null
          scene_number: number
          title?: string | null
        }
        Update: {
          audio?: string | null
          brief_id?: string
          camera?: string | null
          created_at?: string
          description?: string | null
          duration_sec?: number | null
          emotion?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          output_id?: string | null
          scene_number?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storyboard_scenes_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "creative_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_scenes_output_id_fkey"
            columns: ["output_id"]
            isOneToOne: false
            referencedRelation: "creative_outputs"
            referencedColumns: ["id"]
          },
        ]
      }
      system_flags: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
          workspace_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
          workspace_id?: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
          workspace_id?: string
        }
        Relationships: []
      }
      task_execution_plans: {
        Row: {
          break_pattern: string | null
          cognitive_load: number | null
          created_at: string
          definition_of_done: Json | null
          emergency_mode: boolean
          energy_level: string | null
          estimate_max: number | null
          estimate_min: number | null
          id: string
          micro_steps: Json | null
          next_action: string | null
          pinned: boolean
          suggested_time_slot: string | null
          task_id: string
          updated_at: string
          user_notes: string | null
          work_mode: string | null
        }
        Insert: {
          break_pattern?: string | null
          cognitive_load?: number | null
          created_at?: string
          definition_of_done?: Json | null
          emergency_mode?: boolean
          energy_level?: string | null
          estimate_max?: number | null
          estimate_min?: number | null
          id?: string
          micro_steps?: Json | null
          next_action?: string | null
          pinned?: boolean
          suggested_time_slot?: string | null
          task_id: string
          updated_at?: string
          user_notes?: string | null
          work_mode?: string | null
        }
        Update: {
          break_pattern?: string | null
          cognitive_load?: number | null
          created_at?: string
          definition_of_done?: Json | null
          emergency_mode?: boolean
          energy_level?: string | null
          estimate_max?: number | null
          estimate_min?: number | null
          id?: string
          micro_steps?: Json | null
          next_action?: string | null
          pinned?: boolean
          suggested_time_slot?: string | null
          task_id?: string
          updated_at?: string
          user_notes?: string | null
          work_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_execution_plans_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          ai_refined: boolean
          attachments: Json | null
          category: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          links: Json | null
          position: number
          priority: string
          progress: number
          start_date: string | null
          status: string
          tags: string[] | null
          time_spent_seconds: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_refined?: boolean
          attachments?: Json | null
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          links?: Json | null
          position?: number
          priority?: string
          progress?: number
          start_date?: string | null
          status?: string
          tags?: string[] | null
          time_spent_seconds?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_refined?: boolean
          attachments?: Json | null
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          links?: Json | null
          position?: number
          priority?: string
          progress?: number
          start_date?: string | null
          status?: string
          tags?: string[] | null
          time_spent_seconds?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ui_state: {
        Row: {
          id: string
          scope: string
          scope_key: string
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          scope: string
          scope_key: string
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          scope?: string
          scope_key?: string
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          permissions: Json
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          permissions?: Json
          workspace_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          permissions?: Json
          workspace_id?: string
        }
        Relationships: []
      }
      whatsapp_outbox: {
        Row: {
          attempts: number
          audio_asset_id: string | null
          client_request_id: string
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          message_id: string | null
          next_retry_at: string | null
          opportunity_id: string | null
          payload: Json | null
          provider: string
          provider_message_id: string | null
          sent_at: string | null
          status: string
          to_phone_e164: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          attempts?: number
          audio_asset_id?: string | null
          client_request_id: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          message_id?: string | null
          next_retry_at?: string | null
          opportunity_id?: string | null
          payload?: Json | null
          provider?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          to_phone_e164: string
          updated_at?: string
          user_id: string
          workspace_id?: string
        }
        Update: {
          attempts?: number
          audio_asset_id?: string | null
          client_request_id?: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          message_id?: string | null
          next_retry_at?: string | null
          opportunity_id?: string | null
          payload?: Json | null
          provider?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          to_phone_e164?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_outbox_audio_asset_id_fkey"
            columns: ["audio_asset_id"]
            isOneToOne: false
            referencedRelation: "scout_audio_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_outbox_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "scout_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_outbox_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "scout_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          company_document: string | null
          company_name: string
          created_at: string
          default_currency: string
          default_timezone: string
          id: string
          subscription_plan: string
          updated_at: string
          working_days: Json
          working_hours: Json
          workspace_id: string
        }
        Insert: {
          company_document?: string | null
          company_name?: string
          created_at?: string
          default_currency?: string
          default_timezone?: string
          id?: string
          subscription_plan?: string
          updated_at?: string
          working_days?: Json
          working_hours?: Json
          workspace_id?: string
        }
        Update: {
          company_document?: string | null
          company_name?: string
          created_at?: string
          default_currency?: string
          default_timezone?: string
          id?: string
          subscription_plan?: string
          updated_at?: string
          working_days?: Json
          working_hours?: Json
          workspace_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_project_health_score: {
        Args: { p_project_id: string }
        Returns: number
      }
      has_app_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_scope: "hub" | "portal" | "both"
      alert_severity: "info" | "warning" | "critical"
      alert_status: "open" | "snoozed" | "resolved" | "dismissed"
      alert_type:
        | "deadline_due"
        | "deadline_overdue"
        | "delivery_due"
        | "delivery_overdue"
        | "no_client_contact"
        | "client_waiting_reply"
        | "internal_waiting_reply"
        | "meeting_upcoming"
        | "meeting_followup"
        | "payment_due"
        | "payment_overdue"
        | "production_stalled"
        | "risk_health_drop"
        | "materials_missing"
        | "review_pending"
        | "custom_reminder"
      app_role: "admin" | "comercial" | "operacao" | "financeiro"
      creative_block_status: "empty" | "draft" | "ready" | "approved"
      creative_block_type:
        | "brief"
        | "narrative_script"
        | "storyboard"
        | "storyboard_images"
        | "shotlist"
        | "moodboard"
        | "visual_identity"
        | "motion_direction"
        | "lettering"
        | "copy_variations"
      creative_source: "manual" | "ai" | "hybrid"
      creative_work_status:
        | "draft"
        | "in_production"
        | "review"
        | "approved"
        | "archived"
      creative_work_type:
        | "script"
        | "storyboard"
        | "identity"
        | "motion"
        | "campaign_pack"
        | "full_package"
      deliverable_status:
        | "pending"
        | "in_review"
        | "approved"
        | "rejected"
        | "delivered"
      inbox_channel: "instagram" | "whatsapp" | "email"
      inbox_direction: "in" | "out"
      inbox_status: "open" | "pending" | "closed"
      outbox_status:
        | "draft"
        | "queued"
        | "sending"
        | "sent"
        | "failed"
        | "canceled"
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
      alert_scope: ["hub", "portal", "both"],
      alert_severity: ["info", "warning", "critical"],
      alert_status: ["open", "snoozed", "resolved", "dismissed"],
      alert_type: [
        "deadline_due",
        "deadline_overdue",
        "delivery_due",
        "delivery_overdue",
        "no_client_contact",
        "client_waiting_reply",
        "internal_waiting_reply",
        "meeting_upcoming",
        "meeting_followup",
        "payment_due",
        "payment_overdue",
        "production_stalled",
        "risk_health_drop",
        "materials_missing",
        "review_pending",
        "custom_reminder",
      ],
      app_role: ["admin", "comercial", "operacao", "financeiro"],
      creative_block_status: ["empty", "draft", "ready", "approved"],
      creative_block_type: [
        "brief",
        "narrative_script",
        "storyboard",
        "storyboard_images",
        "shotlist",
        "moodboard",
        "visual_identity",
        "motion_direction",
        "lettering",
        "copy_variations",
      ],
      creative_source: ["manual", "ai", "hybrid"],
      creative_work_status: [
        "draft",
        "in_production",
        "review",
        "approved",
        "archived",
      ],
      creative_work_type: [
        "script",
        "storyboard",
        "identity",
        "motion",
        "campaign_pack",
        "full_package",
      ],
      deliverable_status: [
        "pending",
        "in_review",
        "approved",
        "rejected",
        "delivered",
      ],
      inbox_channel: ["instagram", "whatsapp", "email"],
      inbox_direction: ["in", "out"],
      inbox_status: ["open", "pending", "closed"],
      outbox_status: [
        "draft",
        "queued",
        "sending",
        "sent",
        "failed",
        "canceled",
      ],
    },
  },
} as const
