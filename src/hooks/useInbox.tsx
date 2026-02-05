import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type InboxChannel = 'instagram' | 'whatsapp' | 'email';
export type InboxDirection = 'in' | 'out';
export type InboxStatus = 'open' | 'pending' | 'closed';

export interface InboxThread {
  id: string;
  workspace_id: string;
  channel: InboxChannel;
  external_thread_id: string | null;
  contact_name: string;
  contact_handle: string | null;
  contact_avatar_url: string | null;
  last_message_at: string | null;
  status: InboxStatus;
  assigned_to: string | null;
  created_at: string;
}

export interface InboxMessage {
  id: string;
  thread_id: string;
  direction: InboxDirection;
  text: string;
  media_url: string | null;
  sent_at: string;
  meta: Record<string, unknown>;
}

interface UseInboxFilters {
  channel?: InboxChannel;
  status?: InboxStatus;
  assignedTo?: string;
  search?: string;
}

export function useInbox(filters?: UseInboxFilters) {
  const queryClient = useQueryClient();

  const { data: threads, isLoading: threadsLoading, error: threadsError } = useQuery({
    queryKey: ['inbox-threads', filters],
    queryFn: async () => {
      let query = supabase
        .from('inbox_threads')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (filters?.channel) {
        query = query.eq('channel', filters.channel);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters?.search) {
        query = query.ilike('contact_name', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InboxThread[];
    },
  });

  const useThreadMessages = (threadId: string | null) => {
    return useQuery({
      queryKey: ['inbox-messages', threadId],
      queryFn: async () => {
        if (!threadId) return [];
        
        const { data, error } = await supabase
          .from('inbox_messages')
          .select('*')
          .eq('thread_id', threadId)
          .order('sent_at', { ascending: true });

        if (error) throw error;
        return data as InboxMessage[];
      },
      enabled: !!threadId,
    });
  };

  const sendMessage = useMutation({
    mutationFn: async ({ threadId, text, direction = 'out' }: { 
      threadId: string; 
      text: string; 
      direction?: InboxDirection;
    }) => {
      const { data, error } = await supabase
        .from('inbox_messages')
        .insert({
          thread_id: threadId,
          text,
          direction,
        })
        .select()
        .single();

      if (error) throw error;

      // Update thread's last_message_at
      await supabase
        .from('inbox_threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', threadId);

      // Log event
      await supabase.from('event_logs').insert({
        action: 'message_sent',
        entity_type: 'inbox_message',
        entity_id: data.id,
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inbox-messages', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['inbox-threads'] });
    },
  });

  const updateThreadStatus = useMutation({
    mutationFn: async ({ threadId, status }: { threadId: string; status: InboxStatus }) => {
      const { data, error } = await supabase
        .from('inbox_threads')
        .update({ status })
        .eq('id', threadId)
        .select()
        .single();

      if (error) throw error;

      // Log event
      await supabase.from('event_logs').insert({
        action: status === 'closed' ? 'thread_closed' : 'thread_status_updated',
        entity_type: 'inbox_thread',
        entity_id: threadId,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-threads'] });
    },
  });

  const assignThread = useMutation({
    mutationFn: async ({ threadId, assignedTo }: { threadId: string; assignedTo: string | null }) => {
      const { data, error } = await supabase
        .from('inbox_threads')
        .update({ assigned_to: assignedTo })
        .eq('id', threadId)
        .select()
        .single();

      if (error) throw error;

      // Log event
      await supabase.from('event_logs').insert({
        action: 'thread_assigned',
        entity_type: 'inbox_thread',
        entity_id: threadId,
        payload: { assigned_to: assignedTo },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-threads'] });
    },
  });

  return {
    threads,
    threadsLoading,
    threadsError,
    useThreadMessages,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
    updateThreadStatus: updateThreadStatus.mutate,
    assignThread: assignThread.mutate,
  };
}
