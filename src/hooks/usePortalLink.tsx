import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interface matches DB schema - uses Partial for flexibility
export interface PortalLink {
  id: string;
  project_id: string;
  share_token: string;
  is_active: boolean;
  expires_at: string | null;
  blocked_by_payment: boolean;
  created_at: string;
  client_name?: string | null;
  project_name?: string | null;
}

export interface PortalActivity {
  id: string;
  portal_link_id: string;
  action: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function usePortalLink(projectId: string | undefined, projectData?: { name?: string; clientName?: string }) {
  const queryClient = useQueryClient();

  const { data: portalLink, isLoading, error } = useQuery({
    queryKey: ['portal-link', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('portal_links')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data as PortalLink | null;
    },
    enabled: !!projectId,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['portal-activities', portalLink?.id],
    queryFn: async () => {
      if (!portalLink?.id) return [];
      
      const { data, error } = await supabase
        .from('portal_activities')
        .select('*')
        .eq('portal_link_id', portalLink.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PortalActivity[];
    },
    enabled: !!portalLink?.id,
  });

  const createLink = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error('Project ID required');

      const { data, error } = await supabase
        .from('portal_links')
        .insert({
          project_id: projectId,
          share_token: generateToken(),
          is_active: true,
          project_name: projectData?.name || null,
          client_name: projectData?.clientName || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-link', projectId] });
      toast.success('Link do portal criado!');
    },
    onError: (error) => {
      console.error('Create link error:', error);
      toast.error('Erro ao criar link do portal');
    },
  });

  const regenerateLink = useMutation({
    mutationFn: async () => {
      if (!portalLink?.id) throw new Error('Portal link not found');

      const { data, error } = await supabase
        .from('portal_links')
        .update({
          share_token: generateToken(),
        })
        .eq('id', portalLink.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-link', projectId] });
      toast.success('Link regenerado! O link anterior foi invalidado.');
    },
    onError: (error) => {
      console.error('Regenerate link error:', error);
      toast.error('Erro ao regenerar link');
    },
  });

  const updateLink = useMutation({
    mutationFn: async (updates: Partial<PortalLink>) => {
      if (!portalLink?.id) throw new Error('Portal link not found');

      const { data, error } = await supabase
        .from('portal_links')
        .update(updates)
        .eq('id', portalLink.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-link', projectId] });
      toast.success('Portal atualizado');
    },
    onError: (error) => {
      console.error('Update link error:', error);
      toast.error('Erro ao atualizar portal');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!portalLink?.id) throw new Error('Portal link not found');

      const { data, error } = await supabase
        .from('portal_links')
        .update({ is_active: isActive })
        .eq('id', portalLink.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portal-link', projectId] });
      toast.success(data.is_active ? 'Portal ativado' : 'Portal desativado');
    },
    onError: (error) => {
      console.error('Toggle active error:', error);
      toast.error('Erro ao alterar status');
    },
  });

  const setExpiration = useMutation({
    mutationFn: async (expiresAt: string | null) => {
      if (!portalLink?.id) throw new Error('Portal link not found');

      const { data, error } = await supabase
        .from('portal_links')
        .update({ expires_at: expiresAt })
        .eq('id', portalLink.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-link', projectId] });
      toast.success('Data de expiração atualizada');
    },
    onError: (error) => {
      console.error('Set expiration error:', error);
      toast.error('Erro ao definir expiração');
    },
  });

  const setBlockIfUnpaid = useMutation({
    mutationFn: async (block: boolean) => {
      if (!portalLink?.id) throw new Error('Portal link not found');

      const { data, error } = await supabase
        .from('portal_links')
        .update({ blocked_by_payment: block })
        .eq('id', portalLink.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portal-link', projectId] });
      toast.success(data.blocked_by_payment ? 'Bloqueio por inadimplência ativado' : 'Bloqueio por inadimplência desativado');
    },
    onError: (error) => {
      console.error('Set block error:', error);
      toast.error('Erro ao alterar bloqueio');
    },
  });

  // Generate portal URL
  const portalUrl = portalLink?.share_token 
    ? `${window.location.origin}/client/${portalLink.share_token}`
    : null;

  return {
    portalLink,
    portalUrl,
    activities,
    isLoading,
    error,
    createLink,
    regenerateLink,
    updateLink,
    toggleActive,
    setExpiration,
    setBlockIfUnpaid,
  };
}
