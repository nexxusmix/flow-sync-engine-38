import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ClientMessage {
  id: string;
  project_id: string;
  client_id: string | null;
  channel: string;
  subject: string | null;
  content: string;
  attachments: any;
  status: string;
  error: string | null;
  ai_goal: string | null;
  ai_variant: string | null;
  material_id: string | null;
  material_link: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
}

export function useClientMessages(projectId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['client-messages', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as ClientMessage[];
    },
    enabled: !!user && !!projectId,
  });

  const saveDraft = useMutation({
    mutationFn: async (draft: Partial<ClientMessage> & { project_id: string; content: string }) => {
      const { data, error } = await supabase
        .from('client_messages')
        .insert([{ ...draft, created_by: user?.id, status: 'draft' }])
        .select()
        .single();
      if (error) throw error;

      // Log event
      await supabase.from('client_message_events').insert({
        message_id: data.id,
        event: 'created',
      });

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-messages', projectId] }),
  });

  const logCopyEvent = useMutation({
    mutationFn: async (messageId: string) => {
      await supabase.from('client_messages').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', messageId);
      await supabase.from('client_message_events').insert({
        message_id: messageId,
        event: 'copied',
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-messages', projectId] }),
  });

  const logQuickCopy = useMutation({
    mutationFn: async (params: { content: string; channel: string; ai_goal?: string }) => {
      const { data, error } = await supabase
        .from('client_messages')
        .insert([{
          project_id: projectId,
          content: params.content,
          channel: params.channel,
          ai_goal: params.ai_goal,
          status: 'sent',
          sent_at: new Date().toISOString(),
          created_by: user?.id,
        }])
        .select()
        .single();
      if (error) throw error;

      await supabase.from('client_message_events').insert({
        message_id: data.id,
        event: 'copied',
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-messages', projectId] }),
  });

  return { messages, isLoading, saveDraft, logCopyEvent, logQuickCopy };
}
