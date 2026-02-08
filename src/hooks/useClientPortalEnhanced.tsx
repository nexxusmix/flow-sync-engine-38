/**
 * useClientPortalEnhanced - Hook completo para o portal do cliente
 * 
 * Fonte de dados:
 * - portal_links: token de acesso e configurações
 * - portal_deliverables: entregas publicadas para o cliente
 * - portal_comments: comentários em entregas
 * - portal_approvals: aprovações de entregas
 * - portal_change_requests: solicitações de ajustes
 * - portal_deliverable_versions: histórico de versões
 * - project_files: arquivos do projeto marcados como visíveis
 * 
 * Realtime: Todas as tabelas têm subscription para atualização automática
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
}

export interface PortalData {
  portal: PortalLink;
  project: ProjectInfo | null;
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

      // 1. Get portal link by token
      const { data: portal, error: portalError } = await supabase
        .from('portal_links')
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (portalError || !portal) {
        throw new Error('Portal not found');
      }

      // Check expiration
      if (portal.expires_at && new Date(portal.expires_at) < new Date()) {
        throw new Error('Portal expired');
      }

      // Check active
      if (!portal.is_active) {
        throw new Error('Portal inactive');
      }

      // 2. Get project info
      const { data: project } = await supabase
        .from('projects')
        .select('id, name, client_name, description, template, status, stage_current, health_score, contract_value, has_payment_block, due_date, owner_name, logo_url, banner_url')
        .eq('id', portal.project_id)
        .single();

      // 3. Get portal deliverables
      const { data: deliverables, error: delError } = await supabase
        .from('portal_deliverables')
        .select('*')
        .eq('portal_link_id', portal.id)
        .eq('visible_in_portal', true)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (delError) throw delError;

      // 4. Get project files visible in portal
      const { data: files } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', portal.project_id)
        .eq('visible_in_portal', true)
        .order('created_at', { ascending: false });

      // 5. Get IDs for comments/approvals queries
      const deliverableIds = deliverables?.map(d => d.id) || [];
      const fileIds = files?.map(f => f.id) || [];

      // 6. Get comments
      let comments: PortalComment[] = [];
      if (deliverableIds.length > 0) {
        const { data: delComments } = await supabase
          .from('portal_comments')
          .select('*')
          .in('deliverable_id', deliverableIds)
          .order('created_at', { ascending: true });
        if (delComments) comments = [...comments, ...(delComments as PortalComment[])];
      }
      if (fileIds.length > 0) {
        const { data: fileComments } = await supabase
          .from('portal_comments')
          .select('*')
          .in('project_file_id', fileIds)
          .order('created_at', { ascending: true });
        if (fileComments) comments = [...comments, ...(fileComments as PortalComment[])];
      }

      // 7. Get approvals
      let approvals: PortalApproval[] = [];
      if (deliverableIds.length > 0) {
        const { data: delApprovals } = await supabase
          .from('portal_approvals')
          .select('*')
          .in('deliverable_id', deliverableIds);
        if (delApprovals) approvals = [...approvals, ...(delApprovals as PortalApproval[])];
      }
      if (fileIds.length > 0) {
        const { data: fileApprovals } = await supabase
          .from('portal_approvals')
          .select('*')
          .in('project_file_id', fileIds);
        if (fileApprovals) approvals = [...approvals, ...(fileApprovals as PortalApproval[])];
      }

      // 8. Get change requests
      const { data: changeRequests } = await supabase
        .from('portal_change_requests')
        .select('*')
        .eq('portal_link_id', portal.id)
        .order('created_at', { ascending: false });

      // 9. Get versions for deliverables
      let versions: PortalVersion[] = [];
      if (deliverableIds.length > 0) {
        const { data: versionData } = await supabase
          .from('portal_deliverable_versions')
          .select('*')
          .in('deliverable_id', deliverableIds)
          .order('version_number', { ascending: false });
        if (versionData) versions = versionData as PortalVersion[];
      }

      // 10. Log visit
      await supabase.from('event_logs').insert({
        action: 'portal_visited',
        entity_type: 'portal_link',
        entity_id: portal.id,
      });

      return {
        portal: portal as PortalLink,
        project: (project || null) as ProjectInfo | null,
        deliverables: (deliverables || []) as PortalDeliverable[],
        files: (files || []) as PortalFile[],
        comments,
        approvals,
        changeRequests: (changeRequests || []) as PortalChangeRequest[],
        versions,
      };
    },
    enabled: !!shareToken,
    retry: false,
    staleTime: 30000, // 30 seconds
  });

  // Enable realtime updates
  usePortalRealtime(data?.portal?.id, data?.project?.id);

  // Mutations
  const addComment = useMutation({
    mutationFn: async ({ 
      deliverableId, 
      fileId,
      authorName, 
      authorEmail, 
      content, 
      timecode,
      authorRole = 'client',
    }: {
      deliverableId?: string;
      fileId?: string;
      authorName: string;
      authorEmail?: string;
      content: string;
      timecode?: string;
      authorRole?: 'client' | 'manager';
    }) => {
      const insertData: any = {
        author_name: authorName,
        author_email: authorEmail,
        author_role: authorRole,
        content,
        timecode,
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
    }: {
      deliverableId?: string;
      fileId?: string;
      authorName: string;
      authorEmail?: string;
      content: string;
    }) => {
      const insertData: any = {
        author_name: authorName,
        author_email: authorEmail,
        author_role: 'client',
        content,
        status: 'revision_requested',
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

  return {
    data,
    isLoading,
    error,
    // Comments
    addComment: addComment.mutate,
    isAddingComment: addComment.isPending,
    // Approvals
    approveDeliverable: approveDeliverable.mutate,
    isApproving: approveDeliverable.isPending,
    // Revisions
    requestRevision: requestRevision.mutate,
    isRequestingRevision: requestRevision.isPending,
    // Change requests
    createChangeRequest: createChangeRequest.mutate,
    isCreatingChangeRequest: createChangeRequest.isPending,
  };
}
