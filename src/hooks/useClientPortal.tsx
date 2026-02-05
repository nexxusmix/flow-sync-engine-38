import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DeliverableStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'delivered';

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

export interface PortalDeliverable {
  id: string;
  portal_link_id: string;
  title: string;
  description: string | null;
  type: string;
  file_url: string | null;
  thumbnail_url: string | null;
  status: DeliverableStatus;
  visible_in_portal: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PortalComment {
  id: string;
  deliverable_id: string;
  author_name: string;
  author_email: string | null;
  content: string;
  timecode: string | null;
  status: string;
  created_at: string;
}

export interface PortalApproval {
  id: string;
  deliverable_id: string;
  approved_by_name: string;
  approved_by_email: string | null;
  approved_at: string;
  notes: string | null;
}

export interface PortalData {
  portal: PortalLink;
  deliverables: PortalDeliverable[];
  comments: PortalComment[];
  approvals: PortalApproval[];
}

// Hook for public portal access (client-side)
export function useClientPortal(shareToken: string | undefined) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['client-portal', shareToken],
    queryFn: async (): Promise<PortalData | null> => {
      if (!shareToken) return null;

      // Get portal link
      const { data: portal, error: portalError } = await supabase
        .from('portal_links')
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (portalError || !portal) {
        throw new Error('Portal not found');
      }

      // Check if expired
      if (portal.expires_at && new Date(portal.expires_at) < new Date()) {
        throw new Error('Portal expired');
      }

      // Check if active
      if (!portal.is_active) {
        throw new Error('Portal inactive');
      }

      // Get deliverables
      const { data: deliverables, error: delivError } = await supabase
        .from('portal_deliverables')
        .select('*')
        .eq('portal_link_id', portal.id)
        .eq('visible_in_portal', true)
        .order('sort_order', { ascending: true });

      if (delivError) throw delivError;

      // Get comments for all deliverables
      const deliverableIds = deliverables?.map(d => d.id) || [];
      const { data: comments } = await supabase
        .from('portal_comments')
        .select('*')
        .in('deliverable_id', deliverableIds)
        .order('created_at', { ascending: true });

      // Get approvals for all deliverables
      const { data: approvals } = await supabase
        .from('portal_approvals')
        .select('*')
        .in('deliverable_id', deliverableIds);

      // Log portal visit
      await supabase.from('event_logs').insert({
        action: 'portal_visited',
        entity_type: 'portal_link',
        entity_id: portal.id,
      });

      return {
        portal: portal as PortalLink,
        deliverables: (deliverables || []) as PortalDeliverable[],
        comments: (comments || []) as PortalComment[],
        approvals: (approvals || []) as PortalApproval[],
      };
    },
    enabled: !!shareToken,
    retry: false,
  });

  const addComment = useMutation({
    mutationFn: async ({ 
      deliverableId, 
      authorName, 
      authorEmail, 
      content, 
      timecode 
    }: {
      deliverableId: string;
      authorName: string;
      authorEmail?: string;
      content: string;
      timecode?: string;
    }) => {
      const { data, error } = await supabase
        .from('portal_comments')
        .insert({
          deliverable_id: deliverableId,
          author_name: authorName,
          author_email: authorEmail,
          content,
          timecode,
        })
        .select()
        .single();

      if (error) throw error;

      // Log event
      await supabase.from('event_logs').insert({
        action: 'comment_added',
        entity_type: 'portal_comment',
        entity_id: data.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', shareToken] });
    },
  });

  const approveDeliverable = useMutation({
    mutationFn: async ({
      deliverableId,
      approvedByName,
      approvedByEmail,
      notes,
    }: {
      deliverableId: string;
      approvedByName: string;
      approvedByEmail?: string;
      notes?: string;
    }) => {
      // Create approval
      const { data, error } = await supabase
        .from('portal_approvals')
        .insert({
          deliverable_id: deliverableId,
          approved_by_name: approvedByName,
          approved_by_email: approvedByEmail,
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Update deliverable status
      await supabase
        .from('portal_deliverables')
        .update({ status: 'approved' })
        .eq('id', deliverableId);

      // Log event
      await supabase.from('event_logs').insert({
        action: 'approval_granted',
        entity_type: 'portal_approval',
        entity_id: data.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal', shareToken] });
    },
  });

  const requestRevision = useMutation({
    mutationFn: async ({
      deliverableId,
      authorName,
      authorEmail,
      content,
    }: {
      deliverableId: string;
      authorName: string;
      authorEmail?: string;
      content: string;
    }) => {
      // Add comment with revision request
      const { data, error } = await supabase
        .from('portal_comments')
        .insert({
          deliverable_id: deliverableId,
          author_name: authorName,
          author_email: authorEmail,
          content,
          status: 'revision_requested',
        })
        .select()
        .single();

      if (error) throw error;

      // Update deliverable status
      await supabase
        .from('portal_deliverables')
        .update({ status: 'in_review' })
        .eq('id', deliverableId);

      // Log event
      await supabase.from('event_logs').insert({
        action: 'revision_requested',
        entity_type: 'portal_comment',
        entity_id: data.id,
      });

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
  };
}

// Hook for internal portal management
export function usePortalManagement(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: portalLink, isLoading } = useQuery({
    queryKey: ['portal-link', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('portal_links')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as PortalLink | null;
    },
    enabled: !!projectId,
  });

  const createPortalLink = useMutation({
    mutationFn: async ({ projectId, projectName, clientName }: {
      projectId: string;
      projectName?: string;
      clientName?: string;
    }) => {
      const shareToken = crypto.randomUUID().split('-').slice(0, 2).join('');
      
      const { data, error } = await supabase
        .from('portal_links')
        .insert({
          project_id: projectId,
          project_name: projectName,
          client_name: clientName,
          share_token: shareToken,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-link', projectId] });
    },
  });

  const updatePortalLink = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PortalLink> & { id: string }) => {
      const { data, error } = await supabase
        .from('portal_links')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-link', projectId] });
    },
  });

  const regenerateToken = useMutation({
    mutationFn: async (linkId: string) => {
      const newToken = crypto.randomUUID().split('-').slice(0, 2).join('');
      
      const { data, error } = await supabase
        .from('portal_links')
        .update({ share_token: newToken })
        .eq('id', linkId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-link', projectId] });
    },
  });

  const addDeliverable = useMutation({
    mutationFn: async (deliverable: { 
      portal_link_id: string;
      title: string;
      description?: string;
      type?: string;
      file_url?: string;
      thumbnail_url?: string;
      visible_in_portal?: boolean;
      sort_order?: number;
    }) => {
      const { data, error } = await supabase
        .from('portal_deliverables')
        .insert({
          portal_link_id: deliverable.portal_link_id,
          title: deliverable.title,
          description: deliverable.description,
          type: deliverable.type || 'video',
          file_url: deliverable.file_url,
          thumbnail_url: deliverable.thumbnail_url,
          visible_in_portal: deliverable.visible_in_portal ?? true,
          sort_order: deliverable.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-link', projectId] });
    },
  });

  return {
    portalLink,
    isLoading,
    createPortalLink: createPortalLink.mutate,
    updatePortalLink: updatePortalLink.mutate,
    regenerateToken: regenerateToken.mutate,
    addDeliverable: addDeliverable.mutate,
  };
}
