/**
 * usePortalRealtime - Hook para subscriptions realtime no portal do cliente
 * 
 * Implementa:
 * - Atualização automática de entregas quando gestor publica nova versão
 * - Atualização de comentários em tempo real (cliente ↔ gestor)
 * - Atualização de status de ajustes/change requests
 * - Notificação de aprovações
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePortalRealtime(portalLinkId: string | undefined, projectId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!portalLinkId && !projectId) return;

    // Subscribe to portal realtime updates
    const channel = supabase
      .channel(`portal-${portalLinkId || projectId}`)
      // Deliverables changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_deliverables',
          filter: portalLinkId ? `portal_link_id=eq.${portalLinkId}` : undefined,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['portal-deliverables'] });
          queryClient.invalidateQueries({ queryKey: ['client-portal'] });
          queryClient.invalidateQueries({ queryKey: ['project-revision-comments'] });
          queryClient.invalidateQueries({ queryKey: ['project-change-requests'] });
        }
      )
      // Comments changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_comments',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['portal-comments'] });
          queryClient.invalidateQueries({ queryKey: ['client-portal'] });
          queryClient.invalidateQueries({ queryKey: ['project-revision-comments'] });
        }
      )
      // Approvals changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_approvals',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['portal-approvals'] });
          queryClient.invalidateQueries({ queryKey: ['client-portal'] });
        }
      )
      // Change requests changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_change_requests',
          filter: portalLinkId ? `portal_link_id=eq.${portalLinkId}` : undefined,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['portal-change-requests'] });
          queryClient.invalidateQueries({ queryKey: ['client-portal'] });
          queryClient.invalidateQueries({ queryKey: ['project-change-requests'] });
        }
      )
      // Version changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_deliverable_versions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['portal-versions'] });
          queryClient.invalidateQueries({ queryKey: ['client-portal'] });
        }
      )
      // Project files changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_files',
          filter: projectId ? `project_id=eq.${projectId}` : undefined,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['client-portal'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [portalLinkId, projectId, queryClient]);
}
