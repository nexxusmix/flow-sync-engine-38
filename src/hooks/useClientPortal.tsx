import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  content: string;
  timecode: string | null;
  status: string;
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

export interface PortalData {
  portal: PortalLink;
  files: PortalFile[];
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

      // Get files from project_files (instead of portal_deliverables)
      const { data: files, error: filesError } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', portal.project_id)
        .eq('visible_in_portal', true)
        .order('created_at', { ascending: false });

      if (filesError) throw filesError;

      // Get file IDs for querying comments and approvals
      const fileIds = files?.map(f => f.id) || [];

      // Get comments for all files
      const { data: comments } = fileIds.length > 0 
        ? await supabase
            .from('portal_comments')
            .select('*')
            .in('project_file_id', fileIds)
            .order('created_at', { ascending: true })
        : { data: [] };

      // Get approvals for all files
      const { data: approvals } = fileIds.length > 0
        ? await supabase
            .from('portal_approvals')
            .select('*')
            .in('project_file_id', fileIds)
        : { data: [] };

      // Log portal visit
      await supabase.from('event_logs').insert({
        action: 'portal_visited',
        entity_type: 'portal_link',
        entity_id: portal.id,
      });

      return {
        portal: portal as PortalLink,
        files: (files || []) as PortalFile[],
        comments: (comments || []) as PortalComment[],
        approvals: (approvals || []) as PortalApproval[],
      };
    },
    enabled: !!shareToken,
    retry: false,
  });

  const addComment = useMutation({
    mutationFn: async ({ 
      fileId, 
      authorName, 
      authorEmail, 
      content, 
      timecode 
    }: {
      fileId: string;
      authorName: string;
      authorEmail?: string;
      content: string;
      timecode?: string;
    }) => {
      // Using type assertion since types haven't been regenerated yet
      const { data, error } = await supabase
        .from('portal_comments')
        .insert({
          project_file_id: fileId,
          deliverable_id: null as unknown as string, // Required by old types, will be null
          author_name: authorName,
          author_email: authorEmail,
          content,
          timecode,
        } as any)
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

  const approveFile = useMutation({
    mutationFn: async ({
      fileId,
      approvedByName,
      approvedByEmail,
      notes,
    }: {
      fileId: string;
      approvedByName: string;
      approvedByEmail?: string;
      notes?: string;
    }) => {
      // Create approval - using type assertion since types haven't been regenerated yet
      const { data, error } = await supabase
        .from('portal_approvals')
        .insert({
          project_file_id: fileId,
          deliverable_id: null as unknown as string, // Required by old types, will be null
          approved_by_name: approvedByName,
          approved_by_email: approvedByEmail,
          notes,
        } as any)
        .select()
        .single();

      if (error) throw error;

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
      fileId,
      authorName,
      authorEmail,
      content,
    }: {
      fileId: string;
      authorName: string;
      authorEmail?: string;
      content: string;
    }) => {
      // Add comment with revision request - using type assertion since types haven't been regenerated yet
      const { data, error } = await supabase
        .from('portal_comments')
        .insert({
          project_file_id: fileId,
          deliverable_id: null as unknown as string, // Required by old types, will be null
          author_name: authorName,
          author_email: authorEmail,
          content,
          status: 'revision_requested',
        } as any)
        .select()
        .single();

      if (error) throw error;

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
    approveFile: approveFile.mutate,
    isApproving: approveFile.isPending,
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

  return {
    portalLink,
    isLoading,
    createPortalLink: createPortalLink.mutate,
    updatePortalLink: updatePortalLink.mutate,
    regenerateToken: regenerateToken.mutate,
  };
}
