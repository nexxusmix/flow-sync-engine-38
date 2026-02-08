/**
 * useProjectRevisions - Hook centralizado para revisões do projeto
 * 
 * Busca comentários e change requests do portal vinculado ao projeto
 * Permite gerenciamento de status pela equipe
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectComment {
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
  // Joined data
  deliverable_title?: string | null;
  file_name?: string | null;
}

export interface ProjectChangeRequest {
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
  // Joined data
  deliverable_title?: string | null;
}

export interface RevisionStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

export function useProjectRevisions(projectId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch portal link for this project
  const { data: portalLink } = useQuery({
    queryKey: ['project-portal-link', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('portal_links')
        .select('id, project_id, share_token')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch comments from portal
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['project-revision-comments', portalLink?.id],
    queryFn: async () => {
      if (!portalLink?.id) return [];

      // First get deliverable IDs for this portal
      const { data: deliverables } = await supabase
        .from('portal_deliverables')
        .select('id, title')
        .eq('portal_link_id', portalLink.id);

      if (!deliverables?.length) return [];

      const deliverableIds = deliverables.map(d => d.id);
      const deliverableMap = new Map(deliverables.map(d => [d.id, d.title]));

      // Fetch comments for these deliverables
      const { data, error } = await supabase
        .from('portal_comments')
        .select('*')
        .in('deliverable_id', deliverableIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with deliverable titles
      return (data || []).map(comment => ({
        ...comment,
        deliverable_title: comment.deliverable_id 
          ? deliverableMap.get(comment.deliverable_id) 
          : null,
      })) as ProjectComment[];
    },
    enabled: !!portalLink?.id,
  });

  // Fetch change requests
  const { data: changeRequests = [], isLoading: isLoadingChangeRequests } = useQuery({
    queryKey: ['project-change-requests', portalLink?.id],
    queryFn: async () => {
      if (!portalLink?.id) return [];

      const { data, error } = await supabase
        .from('portal_change_requests')
        .select(`
          *,
          portal_deliverables (title)
        `)
        .eq('portal_link_id', portalLink.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(cr => ({
        ...cr,
        deliverable_title: (cr.portal_deliverables as any)?.title || null,
      })) as ProjectChangeRequest[];
    },
    enabled: !!portalLink?.id,
  });

  // Calculate stats
  const stats: RevisionStats = {
    total: comments.length + changeRequests.length,
    pending: comments.filter(c => c.status === 'revision_requested' || c.status === 'open').length +
             changeRequests.filter(cr => cr.status === 'open').length,
    inProgress: changeRequests.filter(cr => cr.status === 'in_progress').length,
    resolved: comments.filter(c => c.status === 'resolved').length +
              changeRequests.filter(cr => cr.status === 'resolved').length,
  };

  // Update comment status
  const updateCommentStatus = useMutation({
    mutationFn: async ({ 
      commentId, 
      status 
    }: { 
      commentId: string; 
      status: string;
    }) => {
      const { error } = await supabase
        .from('portal_comments')
        .update({ status })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-revision-comments'] });
      toast.success('Status atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  // Update change request status
  const updateChangeRequestStatus = useMutation({
    mutationFn: async ({ 
      requestId, 
      status,
      resolvedBy,
    }: { 
      requestId: string; 
      status: 'open' | 'in_progress' | 'resolved' | 'rejected';
      resolvedBy?: string;
    }) => {
      const updateData: any = { status };
      
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = resolvedBy;
      }

      const { error } = await supabase
        .from('portal_change_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-change-requests'] });
      toast.success('Status atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  // Add manager response to comment
  const addManagerResponse = useMutation({
    mutationFn: async ({
      deliverableId,
      content,
      authorName,
    }: {
      deliverableId: string;
      content: string;
      authorName: string;
    }) => {
      const { error } = await supabase
        .from('portal_comments')
        .insert({
          deliverable_id: deliverableId,
          author_name: authorName,
          author_role: 'manager',
          content,
          status: 'manager_response',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-revision-comments'] });
      toast.success('Resposta enviada');
    },
    onError: () => {
      toast.error('Erro ao enviar resposta');
    },
  });

  // Mark comment as resolved
  const resolveComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('portal_comments')
        .update({ status: 'resolved' })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-revision-comments'] });
      toast.success('Comentário resolvido');
    },
  });

  return {
    comments,
    changeRequests,
    stats,
    portalLink,
    isLoading: isLoadingComments || isLoadingChangeRequests,
    updateCommentStatus: updateCommentStatus.mutate,
    updateChangeRequestStatus: updateChangeRequestStatus.mutate,
    addManagerResponse: addManagerResponse.mutate,
    resolveComment: resolveComment.mutate,
    isUpdating: updateCommentStatus.isPending || updateChangeRequestStatus.isPending,
  };
}
