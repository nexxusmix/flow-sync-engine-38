/**
 * useClientPortalEnhanced - Hook completo para o portal do cliente
 * 
 * Usa Edge Function `resolve-portal-token` para resolver token com segurança
 * (bypassa RLS usando service role, retornando apenas dados públicos)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePortalRealtime } from './usePortalRealtime';

// Types
export interface PortalLink {
  id: string;
  project_id: string;
  project_name: string | null;
  client_name: string | null;
  share_token: string;
  is_active: boolean;
  expires_at: string | null;
  blocked_by_payment: boolean;
  created_at: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  client_name: string | null;
  description: string | null;
  template: string | null;
  status: string;
  stage_current: string | null;
  health_score: number | null;
  contract_value: number | null;
  has_payment_block: boolean | null;
  due_date: string | null;
  owner_name: string | null;
  logo_url: string | null;
  banner_url: string | null;
}

export interface PortalDeliverable {
  id: string;
  portal_link_id: string;
  title: string;
  description: string | null;
  type: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  youtube_url: string | null;
  external_url: string | null;
  status: string;
  current_version: number;
  awaiting_approval: boolean;
  visible_in_portal: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  // Client upload fields
  uploaded_by_client?: boolean;
  client_upload_name?: string | null;
  material_category?: string | null;
}

export interface PortalFile {
  id: string;
  project_id: string;
  name: string;
  folder: string;
  file_url: string;
  file_type: string | null;
  visible_in_portal: boolean;
  created_at: string;
}

export interface PortalComment {
  id: string;
  deliverable_id: string | null;
  project_file_id: string | null;
  author_name: string;
  author_email: string | null;
  author_role: string | null;
  content: string;
  timecode: string | null;
  status: string | null;
  priority: string | null;
  frame_timestamp_ms: number | null;
  annotation_data: any | null;
  screenshot_url: string | null;
  created_at: string;
}

export interface PortalApproval {
  id: string;
  deliverable_id: string | null;
  project_file_id: string | null;
  approved_by_name: string;
  approved_by_email: string | null;
  approved_at: string;
  notes: string | null;
}

export interface PortalChangeRequest {
  id: string;
  deliverable_id: string | null;
  portal_link_id: string;
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  author_name: string;
  author_email: string | null;
  author_role: 'client' | 'manager';
  assigned_to: string | null;
  evidence_url: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortalVersion {
  id: string;
  deliverable_id: string;
  version_number: number;
  title: string | null;
  notes: string | null;
  file_url: string | null;
  created_at: string;
  created_by_name: string | null;
  change_tags: string[];
  changelog_items: { description: string; category?: string }[];
}

export interface ProjectStage {
  id: string;
  project_id: string;
  title: string;
  stage_key: string;
  order_index: number;
  status: string;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
}

export interface PortalData {
  portal: PortalLink;
  project: ProjectInfo | null;
  stages: ProjectStage[];
  deliverables: PortalDeliverable[];
  files: PortalFile[];
  comments: PortalComment[];
  approvals: PortalApproval[];
  changeRequests: PortalChangeRequest[];
  versions: PortalVersion[];
}

export function useClientPortalEnhanced(shareToken: string | undefined) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['client-portal', shareToken],
    queryFn: async (): Promise<PortalData | null> => {
      if (!shareToken) return null;

      console.log('[Portal] Resolving token via Edge Function...');

      // Use Edge Function to resolve token (bypasses RLS securely)
      const { data: result, error: fnError } = await supabase.functions.invoke('resolve-portal-token', {
        body: { token: shareToken }
      });

      if (fnError) {
        console.error('[Portal] Edge Function error:', fnError);
        throw new Error('Failed to resolve portal token');
      }

      if (!result?.ok) {
        const code = result?.code || 'UNKNOWN';
        const message = result?.error || 'Portal not found';
        console.error(`[Portal] Token resolution failed: ${code} - ${message}`);
        
        if (code === 'EXPIRED') {
          throw new Error('Portal expired');
        }
        if (code === 'INACTIVE') {
          throw new Error('Portal inactive');
        }
        throw new Error('Portal not found');
      }

      console.log('[Portal] Token resolved successfully for project:', result.project?.name);

      return {
        portal: result.portal as PortalLink,
        project: (result.project || null) as ProjectInfo | null,
        stages: (result.stages || []) as ProjectStage[],
        deliverables: (result.deliverables || []) as PortalDeliverable[],
        files: (result.files || []) as PortalFile[],
        comments: (result.comments || []) as PortalComment[],
        approvals: (result.approvals || []) as PortalApproval[],
        changeRequests: (result.changeRequests || []) as PortalChangeRequest[],
        versions: (result.versions || []) as PortalVersion[],
      };
    },
    enabled: !!shareToken,
    retry: false,
    staleTime: 30000, // 30 seconds
  });

  // Enable realtime updates
  usePortalRealtime(data?.portal?.id, data?.project?.id);

  // Mutations (these still use regular Supabase client with anon RLS)
  const addComment = useMutation({
    mutationFn: async ({ 
      deliverableId, 
      fileId,
      authorName, 
      authorEmail, 
      content, 
      timecode,
      priority,
      frameTimestampMs,
      screenshotUrl,
      authorRole = 'client',
    }: {
      deliverableId?: string;
      fileId?: string;
      authorName: string;
      authorEmail?: string;
      content: string;
      timecode?: string;
      priority?: string;
      frameTimestampMs?: number;
      screenshotUrl?: string;
      authorRole?: 'client' | 'manager';
    }) => {
      const insertData: any = {
        author_name: authorName,
        author_email: authorEmail,
        author_role: authorRole,
        content,
        timecode,
        priority: priority || 'normal',
        frame_timestamp_ms: frameTimestampMs,
        screenshot_url: screenshotUrl,
      };

      if (deliverableId) {
        insertData.deliverable_id = deliverableId;
      }
      if (fileId) {
        insertData.project_file_id = fileId;
      }

      const { data, error } = await supabase
        .from('portal_comments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', shareToken] });
    },
  });

  const approveDeliverable = useMutation({
    mutationFn: async ({
      deliverableId,
      fileId,
      approvedByName,
      approvedByEmail,
      notes,
    }: {
      deliverableId?: string;
      fileId?: string;
      approvedByName: string;
      approvedByEmail?: string;
      notes?: string;
    }) => {
      const insertData: any = {
        approved_by_name: approvedByName,
        approved_by_email: approvedByEmail,
        notes,
      };

      if (deliverableId) {
        insertData.deliverable_id = deliverableId;
      }
      if (fileId) {
        insertData.project_file_id = fileId;
      }

      const { data, error } = await supabase
        .from('portal_approvals')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Update deliverable status if applicable
      if (deliverableId) {
        await supabase
          .from('portal_deliverables')
          .update({ status: 'approved', awaiting_approval: false })
          .eq('id', deliverableId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', shareToken] });
    },
  });

  const requestRevision = useMutation({
    mutationFn: async ({
      deliverableId,
      fileId,
      authorName,
      authorEmail,
      content,
      timecode,
      priority,
      frameTimestampMs,
      screenshotUrl,
    }: {
      deliverableId?: string;
      fileId?: string;
      authorName: string;
      authorEmail?: string;
      content: string;
      timecode?: string;
      priority?: string;
      frameTimestampMs?: number;
      screenshotUrl?: string;
    }) => {
      const insertData: any = {
        author_name: authorName,
        author_email: authorEmail,
        author_role: 'client',
        content,
        status: 'revision_requested',
        timecode,
        priority: priority || 'normal',
        frame_timestamp_ms: frameTimestampMs,
        screenshot_url: screenshotUrl,
      };

      if (deliverableId) {
        insertData.deliverable_id = deliverableId;
      }
      if (fileId) {
        insertData.project_file_id = fileId;
      }

      const { data, error } = await supabase
        .from('portal_comments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Update deliverable status to in_review (revision requested)
      if (deliverableId) {
        await supabase
          .from('portal_deliverables')
          .update({ status: 'in_review', awaiting_approval: false })
          .eq('id', deliverableId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', shareToken] });
    },
  });

  const createChangeRequest = useMutation({
    mutationFn: async ({
      deliverableId,
      title,
      description,
      authorName,
      authorEmail,
      priority = 'normal',
    }: {
      deliverableId?: string;
      title: string;
      description?: string;
      authorName: string;
      authorEmail?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    }) => {
      if (!data?.portal?.id) throw new Error('Portal not loaded');

      const { data: cr, error } = await supabase
        .from('portal_change_requests')
        .insert({
          portal_link_id: data.portal.id,
          deliverable_id: deliverableId,
          title,
          description,
          author_name: authorName,
          author_email: authorEmail,
          author_role: 'client',
          priority,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return cr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', shareToken] });
    },
  });

  // Client upload mutation
  const uploadClientMaterial = useMutation({
    mutationFn: async ({
      portalLinkId,
      title,
      description,
      type,
      url,
      clientName,
    }: {
      portalLinkId: string;
      title: string;
      description?: string;
      type: 'youtube' | 'link' | 'file';
      url?: string;
      clientName?: string;
    }) => {
      const insertData: any = {
        portal_link_id: portalLinkId,
        title,
        description,
        uploaded_by_client: true,
        client_upload_name: clientName,
        material_category: 'reference',
        status: 'pending',
        visible_in_portal: true,
        current_version: 1,
        awaiting_approval: false,
      };

      if (type === 'youtube') {
        insertData.youtube_url = url;
      } else if (type === 'link') {
        insertData.external_url = url;
      } else if (type === 'file' && url) {
        insertData.file_url = url;
      }

      const { data, error } = await supabase
        .from('portal_deliverables')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', shareToken] });
    },
  });

  return {
    data,
    isLoading,
    error,
    addComment: addComment.mutate,
    isAddingComment: addComment.isPending,
    approveDeliverable: approveDeliverable.mutate,
    isApproving: approveDeliverable.isPending,
    requestRevision: requestRevision.mutate,
    isRequestingRevision: requestRevision.isPending,
    createChangeRequest: createChangeRequest.mutate,
    isCreatingChangeRequest: createChangeRequest.isPending,
    uploadClientMaterial: uploadClientMaterial.mutateAsync,
    isUploadingMaterial: uploadClientMaterial.isPending,
  };
}
