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
          ai_generated?: boolean | null
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
          ai_generated?: boolean | null
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
      contract_signatures: {
        Row: {
          contract_id: string
          id: string
          ip_address: string | null
          signature_type: string
          signed_at: string
          signed_file_url: string | null
          signer_email: string
          signer_name: string
          user_agent: string | null
        }
        Insert: {
          contract_id: string
          id?: string
          ip_address?: string | null
          signature_type: string
          signed_at?: string
          signed_file_url?: string | null
          signer_email: string
          signer_name: string
          user_agent?: string | null
        }
        Update: {
          contract_id?: string
          id?: string
          ip_address?: string | null
          signature_type?: string
          signed_at?: string
          signed_file_url?: string | null
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
      creative_briefs: {
        Row: {
          account_id: string | null
          brand_kit_id: string | null
          created_at: string
          extracted_context: Json | null
          id: string
          input_files: Json | null
          input_text: string | null
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
          extracted_context?: Json | null
          id?: string
          input_files?: Json | null
          input_text?: string | null
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
          extracted_context?: Json | null
          id?: string
          input_files?: Json | null
          input_text?: string | null
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
