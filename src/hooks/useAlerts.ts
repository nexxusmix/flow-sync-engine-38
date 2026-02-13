import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface Alert {
  id: string;
  workspace_id: string;
  scope: 'hub' | 'portal' | 'both';
  project_id: string | null;
  client_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string | null;
  due_at: string | null;
  trigger_at: string;
  status: 'open' | 'snoozed' | 'resolved' | 'dismissed';
  read_at: string | null;
  snoozed_until: string | null;
  assigned_to: string | null;
  channels: Record<string, boolean>;
  ai_assist_enabled: boolean;
  ai_context: any;
  action_label: string | null;
  action_url: string | null;
  meta: any;
  idempotency_key: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useAlerts(filters?: {
  status?: string;
  severity?: string;
  limit?: number;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      let query = supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status as any);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity as any);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Alert[];
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('alerts-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'alerts',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const unreadCount = alerts.filter(a => a.status === 'open' && !a.read_at).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'open').length;

  const markAsRead = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({ read_at: new Date().toISOString() })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ alertId, status, snoozedUntil }: { alertId: string; status: string; snoozedUntil?: string }) => {
      const update: any = { status };
      if (snoozedUntil) update.snoozed_until = snoozedUntil;
      if (status === 'resolved' || status === 'dismissed') update.read_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('alerts')
        .update(update)
        .eq('id', alertId);
      if (error) throw error;

      // Log event
      await supabase.from('alert_events').insert({
        alert_id: alertId,
        event: status === 'snoozed' ? 'snoozed' : status === 'resolved' ? 'resolved' : 'dismissed',
        payload: { snoozed_until: snoozedUntil },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const createAlert = useMutation({
    mutationFn: async (alert: Partial<Alert> & { title: string; type: string }) => {
      const { created_by, ...rest } = alert as any;
      const { data, error } = await supabase
        .from('alerts')
        .insert([{
          ...rest,
          created_by: user?.id,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const deleteAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase.from('alerts').delete().eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  return {
    alerts,
    isLoading,
    unreadCount,
    criticalCount,
    markAsRead,
    updateStatus,
    createAlert,
    deleteAlert,
  };
}
