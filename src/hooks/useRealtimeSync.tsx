import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableName = 
  | 'projects' 
  | 'project_stages' 
  | 'calendar_events' 
  | 'project_files' 
  | 'portal_links'
  | 'portal_deliverables'
  | 'portal_comments'
  | 'portal_approvals'
  | 'portal_change_requests'
  | 'portal_deliverable_versions'
  | 'revenues'
  | 'expenses'
  | 'prospect_opportunities'
  | 'proposals'
  | 'contracts'
  | 'payment_milestones'
  | 'content_items'
  | 'content_ideas'
  | 'tasks'
  | 'panorama_snapshots';

interface QueryKeyMapping {
  table: TableName;
  queryKeys: (string | string[])[];
  getProjectId?: (payload: any) => string | null;
  getPortalLinkId?: (payload: any) => string | null;
  getDeliverableId?: (payload: any) => string | null;
}

// Mapeamento de tabelas para query keys que devem ser invalidadas
const TABLE_QUERY_MAPPINGS: QueryKeyMapping[] = [
  {
    table: 'projects',
    queryKeys: [
      ['projects'],
      ['dashboard-metrics'],
    ],
  },
  {
    table: 'project_stages',
    queryKeys: [
      ['projects'],
    ],
    getProjectId: (payload) => payload.new?.project_id || payload.old?.project_id,
  },
  {
    table: 'calendar_events',
    queryKeys: [
      ['calendar-events'],
      ['dashboard-metrics'],
    ],
  },
  {
    table: 'project_files',
    queryKeys: [],
    getProjectId: (payload) => payload.new?.project_id || payload.old?.project_id,
  },
  {
    table: 'portal_links',
    queryKeys: [['portal-link']],
    getProjectId: (payload) => payload.new?.project_id || payload.old?.project_id,
  },
  {
    table: 'portal_deliverables',
    queryKeys: [['portal-deliverables'], ['client-portal']],
    getPortalLinkId: (payload) => payload.new?.portal_link_id || payload.old?.portal_link_id,
  },
  {
    table: 'portal_comments',
    queryKeys: [['portal-comments'], ['client-portal'], ['project-revision-comments']],
    getDeliverableId: (payload) => payload.new?.deliverable_id || payload.old?.deliverable_id,
  },
  {
    table: 'portal_approvals',
    queryKeys: [['portal-approvals'], ['client-portal']],
    getDeliverableId: (payload) => payload.new?.deliverable_id || payload.old?.deliverable_id,
  },
  {
    table: 'portal_change_requests',
    queryKeys: [['portal-change-requests'], ['client-portal'], ['project-change-requests']],
    getPortalLinkId: (payload) => payload.new?.portal_link_id || payload.old?.portal_link_id,
  },
  {
    table: 'portal_deliverable_versions',
    queryKeys: [['portal-versions'], ['client-portal']],
    getDeliverableId: (payload) => payload.new?.deliverable_id || payload.old?.deliverable_id,
  },
  {
    table: 'revenues',
    queryKeys: [
      ['dashboard-metrics'],
      ['revenues'],
    ],
  },
  {
    table: 'expenses',
    queryKeys: [
      ['dashboard-metrics'],
      ['expenses'],
    ],
  },
  {
    table: 'prospect_opportunities',
    queryKeys: [
      ['dashboard-metrics'],
      ['opportunities'],
    ],
  },
  {
    table: 'proposals',
    queryKeys: [
      ['proposals'],
    ],
  },
  {
    table: 'contracts',
    queryKeys: [
      ['contracts'],
      ['dashboard-metrics'],
    ],
  },
  {
    // Milestones (parcelas) - invalidate contracts to refetch with milestones
    table: 'payment_milestones',
    queryKeys: [
      ['contracts'],
      ['dashboard-metrics'],
    ],
  },
  {
    table: 'content_items',
    queryKeys: [
      ['content-items'],
      ['marketing-pipeline'],
    ],
  },
  {
    table: 'content_ideas',
    queryKeys: [
      ['content-ideas'],
    ],
  },
  {
    table: 'tasks',
    queryKeys: [
      ['tasks'],
      ['dashboard-metrics'],
    ],
  },
];

// Debounce para evitar múltiplas invalidações em sequência
const createDebouncer = () => {
  const pending = new Map<string, NodeJS.Timeout>();
  
  return (key: string, callback: () => void, delay: number = 100) => {
    const existing = pending.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    
    const timeout = setTimeout(() => {
      callback();
      pending.delete(key);
    }, delay);
    
    pending.set(key, timeout);
  };
};

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounce = useRef(createDebouncer()).current;

  useEffect(() => {
    // Criar canal único para todas as subscrições
    const channel = supabase.channel('realtime-sync');
    channelRef.current = channel;

    // Handler genérico para mudanças
    const handleChange = (
      table: TableName,
      payload: RealtimePostgresChangesPayload<any>
    ) => {
      const mapping = TABLE_QUERY_MAPPINGS.find((m) => m.table === table);
      if (!mapping) return;

      console.log(`[Realtime] ${payload.eventType} em ${table}`, payload);

      // Debounce por tabela para evitar múltiplas invalidações
      debounce(`invalidate-${table}`, () => {
        // Invalidar query keys globais
        mapping.queryKeys.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
        });

        // Invalidar queries específicas por projeto se aplicável
        if (mapping.getProjectId) {
          const projectId = mapping.getProjectId(payload);
          if (projectId) {
            // Invalidar projeto específico
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            
            // Invalidar dados relacionados ao projeto
            if (table === 'project_files') {
              queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
            }
            if (table === 'portal_links') {
              queryClient.invalidateQueries({ queryKey: ['portal-link', projectId] });
            }
          }
        }

        // Invalidar queries por portal_link_id
        if (mapping.getPortalLinkId) {
          const portalLinkId = mapping.getPortalLinkId(payload);
          if (portalLinkId) {
            queryClient.invalidateQueries({ queryKey: ['portal-deliverables', portalLinkId] });
            queryClient.invalidateQueries({ queryKey: ['portal-change-requests', portalLinkId] });
          }
        }

        // Invalidar queries por deliverable_id
        if (mapping.getDeliverableId) {
          const deliverableId = mapping.getDeliverableId(payload);
          if (deliverableId) {
            queryClient.invalidateQueries({ queryKey: ['portal-comments', deliverableId] });
            queryClient.invalidateQueries({ queryKey: ['portal-approvals', deliverableId] });
            queryClient.invalidateQueries({ queryKey: ['portal-versions', deliverableId] });
          }
        }

        // Para projetos, invalidar também o projeto específico
        if (table === 'projects') {
          const newRecord = payload.new as Record<string, any> | null;
          const oldRecord = payload.old as Record<string, any> | null;
          const projectId = newRecord?.id || oldRecord?.id;
          if (projectId) {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          }
        }
      });
    };

    // Configurar subscrições para cada tabela
    TABLE_QUERY_MAPPINGS.forEach(({ table }) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => handleChange(table, payload)
      );
    });

    // Iniciar subscrição
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Conectado - sincronização ativa');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Erro de conexão');
      }
    });

    // Cleanup
    return () => {
      console.log('[Realtime] Desconectando...');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient, debounce]);
}

// Hook para usar em componentes específicos que precisam de realtime local
export function useRealtimeTable<T>(
  table: TableName,
  onInsert?: (data: T) => void,
  onUpdate?: (data: T) => void,
  onDelete?: (data: T) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table },
        (payload) => onInsert?.(payload.new as T)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table },
        (payload) => onUpdate?.(payload.new as T)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table },
        (payload) => onDelete?.(payload.old as T)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onInsert, onUpdate, onDelete]);
}
