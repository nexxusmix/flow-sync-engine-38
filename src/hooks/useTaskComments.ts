import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
}

export function useTaskComments(taskId: string | null) {
  const qc = useQueryClient();
  const queryKey = ['task-comments', taskId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          id, task_id, user_id, content, created_at,
          profiles!task_comments_user_id_fkey ( full_name, avatar_url )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      if (error) {
        // Fallback without join if FK doesn't exist
        const { data: fallback, error: err2 } = await supabase
          .from('task_comments')
          .select('*')
          .eq('task_id', taskId)
          .order('created_at', { ascending: true });
        if (err2) throw err2;
        return (fallback || []).map((c: any) => ({
          ...c,
          author_name: null,
          author_avatar: null,
        })) as TaskComment[];
      }
      return (data || []).map((c: any) => ({
        id: c.id,
        task_id: c.task_id,
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at,
        author_name: c.profiles?.full_name || null,
        author_avatar: c.profiles?.avatar_url || null,
      })) as TaskComment[];
    },
    enabled: !!taskId,
  });

  // Realtime
  useEffect(() => {
    if (!taskId) return;
    const channel = supabase
      .channel(`comments-${taskId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'task_comments',
        filter: `task_id=eq.${taskId}`,
      }, () => {
        qc.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId, qc]);

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!taskId) throw new Error('No task');
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('task_comments')
        .insert({ task_id: taskId, user_id: userData.user.id, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      // Also invalidate comment counts for board indicator
      qc.invalidateQueries({ queryKey: ['comment-counts'] });
    },
    onError: () => toast.error('Erro ao adicionar comentário'),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
    },
    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<TaskComment[]>(queryKey);
      qc.setQueryData<TaskComment[]>(queryKey, old => old?.filter(c => c.id !== commentId));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toast.error('Erro ao excluir comentário');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['comment-counts'] });
    },
  });

  return {
    comments,
    isLoading,
    addComment: (content: string) => addComment.mutate(content),
    deleteComment: (id: string) => deleteComment.mutate(id),
    isAdding: addComment.isPending,
  };
}

// Lightweight hook for comment counts on board cards
export function useCommentCounts(taskIds: string[]) {
  return useQuery({
    queryKey: ['comment-counts', taskIds.sort().join(',')],
    queryFn: async () => {
      if (taskIds.length === 0) return {};
      const { data, error } = await supabase
        .from('task_comments')
        .select('task_id')
        .in('task_id', taskIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((item: any) => {
        counts[item.task_id] = (counts[item.task_id] || 0) + 1;
      });
      return counts;
    },
    enabled: taskIds.length > 0,
    staleTime: 30_000,
  });
}
