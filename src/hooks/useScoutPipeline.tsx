import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────
export interface ScoutOpportunity {
  id: string;
  workspace_id: string;
  user_id: string;
  source: string;
  source_ref: string | null;
  company_name: string;
  contact_name: string | null;
  contact_role: string | null;
  contact_phone_e164: string | null;
  context: Record<string, any>;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ScoutMessage {
  id: string;
  opportunity_id: string;
  version: number;
  text_message: string | null;
  audio_script: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ScoutAudioAsset {
  id: string;
  opportunity_id: string;
  message_id: string;
  storage_path: string;
  duration_seconds: number | null;
  voice_id: string | null;
  created_at: string;
}

export interface WhatsAppOutboxItem {
  id: string;
  opportunity_id: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

// ─── Fetch functions ────────────────────────────────────
async function fetchOpportunities(): Promise<ScoutOpportunity[]> {
  const { data, error } = await supabase
    .from('scout_opportunities')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as any[]) || [];
}

async function fetchMessages(oppId: string): Promise<ScoutMessage[]> {
  const { data, error } = await supabase
    .from('scout_messages')
    .select('*')
    .eq('opportunity_id', oppId)
    .order('version', { ascending: false });
  if (error) throw error;
  return (data as any[]) || [];
}

async function fetchAudioAssets(oppId: string): Promise<ScoutAudioAsset[]> {
  const { data, error } = await supabase
    .from('scout_audio_assets')
    .select('*')
    .eq('opportunity_id', oppId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as any[]) || [];
}

// ─── Hook ───────────────────────────────────────────────
export function useScoutPipeline() {
  const qc = useQueryClient();

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['scout-opportunities'],
    queryFn: fetchOpportunities,
    staleTime: 15_000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('scout-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scout_opportunities' }, () => {
        qc.invalidateQueries({ queryKey: ['scout-opportunities'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_outbox' }, () => {
        qc.invalidateQueries({ queryKey: ['scout-opportunities'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  // ── Create opportunity ────────────────────────────────
  const createOpportunity = useMutation({
    mutationFn: async (data: {
      company_name: string;
      contact_name?: string;
      contact_role?: string;
      contact_phone_e164?: string;
      source?: string;
      context?: Record<string, any>;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: opp, error } = await supabase
        .from('scout_opportunities')
        .insert({
          user_id: userData.user.id,
          company_name: data.company_name,
          contact_name: data.contact_name || null,
          contact_role: data.contact_role || null,
          contact_phone_e164: data.contact_phone_e164 || null,
          source: data.source || 'manual',
          context: data.context || {},
        } as any)
        .select()
        .single();
      if (error) throw error;
      return opp as unknown as ScoutOpportunity;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scout-opportunities'] });
      toast.success('Oportunidade criada');
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  // ── Generate copy ─────────────────────────────────────
  const generateCopy = useMutation({
    mutationFn: async (oppId: string) => {
      const { data, error } = await supabase.functions.invoke('scout-generate-copy', {
        body: { opportunity_id: oppId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scout-opportunities'] });
      toast.success('Abordagem gerada com sucesso');
    },
    onError: (err) => toast.error(`Erro ao gerar copy: ${err.message}`),
  });

  // ── Generate audio ────────────────────────────────────
  const generateAudio = useMutation({
    mutationFn: async ({ oppId, messageId }: { oppId: string; messageId: string }) => {
      const { data, error } = await supabase.functions.invoke('scout-generate-audio', {
        body: { opportunity_id: oppId, message_id: messageId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scout-opportunities'] });
      toast.success('Áudio gerado com sucesso');
    },
    onError: (err) => toast.error(`Erro ao gerar áudio: ${err.message}`),
  });

  // ── Approve and send ──────────────────────────────────
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());

  const approveSend = useMutation({
    mutationFn: async ({
      oppId, messageId, audioAssetId,
    }: {
      oppId: string;
      messageId?: string;
      audioAssetId?: string;
    }) => {
      const clientRequestId = `${oppId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      
      setSendingIds(prev => new Set(prev).add(oppId));

      const { data, error } = await supabase.functions.invoke('scout-approve-send', {
        body: {
          opportunity_id: oppId,
          message_id: messageId,
          audio_asset_id: audioAssetId,
          client_request_id: clientRequestId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['scout-opportunities'] });
      if (data?.status === 'SENT') {
        toast.success('Mensagem enviada via WhatsApp!');
      } else if (data?.already_queued) {
        toast.info('Envio já em andamento');
      } else {
        toast.info('Mensagem enfileirada para envio');
      }
    },
    onError: (err) => toast.error(`Erro no envio: ${err.message}`),
    onSettled: (_data, _err, vars) => {
      setSendingIds(prev => {
        const next = new Set(prev);
        next.delete(vars.oppId);
        return next;
      });
    },
  });

  // ── Update opportunity ────────────────────────────────
  const updateOpportunity = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ScoutOpportunity> }) => {
      const { error } = await supabase
        .from('scout_opportunities')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scout-opportunities'] }),
  });

  // ── Get signed audio URL ──────────────────────────────
  const getAudioUrl = useCallback(async (storagePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('scout-audio')
      .createSignedUrl(storagePath, 3600);
    if (error) return null;
    return data.signedUrl;
  }, []);

  return {
    opportunities,
    isLoading,
    createOpportunity: createOpportunity.mutateAsync,
    generateCopy: generateCopy.mutate,
    generateAudio: generateAudio.mutate,
    approveSend: approveSend.mutate,
    updateOpportunity: updateOpportunity.mutate,
    getAudioUrl,
    fetchMessages,
    fetchAudioAssets,
    isGeneratingCopy: generateCopy.isPending,
    isGeneratingAudio: generateAudio.isPending,
    isSending: (oppId: string) => sendingIds.has(oppId),
    isCreating: createOpportunity.isPending,
  };
}
