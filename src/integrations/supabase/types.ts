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
          channel: string | null
          created_at: string
          created_by: string | null
          format: string | null
          hook: string | null
          id: string
          notes: string | null
          pillar: string | null
          reference_links: Json | null
          score: number | null
          status: string | null
          target: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          channel?: string | null
          created_at?: string
          created_by?: string | null
          format?: string | null
          hook?: string | null
          id?: string
          notes?: string | null
          pillar?: string | null
          reference_links?: Json | null
          score?: number | null
          status?: string | null
          target?: string | null
          title: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          channel?: string | null
          created_at?: string
          created_by?: string | null
          format?: string | null
          hook?: string | null
          id?: string
          notes?: string | null
          pillar?: string | null
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
          assets: Json | null
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
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assets?: Json | null
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
          title: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          assets?: Json | null
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
      contracts: {
        Row: {
          client_name: string | null
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          payment_terms: string | null
          project_id: string
          project_name: string | null
          start_date: string | null
          status: string
          total_value: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          project_id: string
          project_name?: string | null
          start_date?: string | null
          status?: string
          total_value: number
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          project_id?: string
          project_name?: string | null
          start_date?: string | null
          status?: string
          total_value?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
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
      revenues: {
        Row: {
          amount: number
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
