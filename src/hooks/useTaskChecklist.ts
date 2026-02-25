import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChecklistItem {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

export function useTaskChecklist(taskId: string | null) {
  const qc = useQueryClient();
  const queryKey = ['task-checklist', taskId];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from('task_checklist_items')
        .select('*')
        .eq('task_id', taskId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!taskId,
  });

  // Realtime
  useEffect(() => {
    if (!taskId) return;
    const channel = supabase
      .channel(`checklist-${taskId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'task_checklist_items',
        filter: `task_id=eq.${taskId}`,
      }, () => {
        qc.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId, qc]);

  const addItem = useMutation({
    mutationFn: async (title: string) => {
      if (!taskId) throw new Error('No task');
      const maxPos = items.length > 0 ? Math.max(...items.map(i => i.position)) + 1 : 0;
      const { data, error } = await supabase
        .from('task_checklist_items')
        .insert({ task_id: taskId, title, position: maxPos, is_completed: false })
        .select()
        .single();
      if (error) throw error;
      return data as ChecklistItem;
    },
    onMutate: async (title) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ChecklistItem[]>(queryKey);
      const optimistic: ChecklistItem = {
        id: `temp-${Date.now()}`,
        task_id: taskId!,
        title,
        is_completed: false,
        position: (prev?.length ?? 0),
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<ChecklistItem[]>(queryKey, old => [...(old || []), optimistic]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toast.error('Erro ao adicionar item');
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const toggleItem = useMutation({
    mutationFn: async (itemId: string) => {
      const item = items.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');
      const { error } = await supabase
        .from('task_checklist_items')
        .update({ is_completed: !item.is_completed })
        .eq('id', itemId);
      if (error) throw error;
    },
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ChecklistItem[]>(queryKey);
      qc.setQueryData<ChecklistItem[]>(queryKey, old =>
        old?.map(i => i.id === itemId ? { ...i, is_completed: !i.is_completed } : i)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const updateTitle = useMutation({
    mutationFn: async ({ itemId, title }: { itemId: string; title: string }) => {
      const { error } = await supabase
        .from('task_checklist_items')
        .update({ title })
        .eq('id', itemId);
      if (error) throw error;
    },
    onMutate: async ({ itemId, title }) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ChecklistItem[]>(queryKey);
      qc.setQueryData<ChecklistItem[]>(queryKey, old =>
        old?.map(i => i.id === itemId ? { ...i, title } : i)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('task_checklist_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ChecklistItem[]>(queryKey);
      qc.setQueryData<ChecklistItem[]>(queryKey, old => old?.filter(i => i.id !== itemId));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const moveItem = useMutation({
    mutationFn: async ({ itemId, direction }: { itemId: string; direction: 'up' | 'down' }) => {
      const idx = items.findIndex(i => i.id === itemId);
      if (idx < 0) return;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= items.length) return;
      
      const updates = [
        { id: items[idx].id, position: items[swapIdx].position },
        { id: items[swapIdx].id, position: items[idx].position },
      ];
      for (const u of updates) {
        const { error } = await supabase
          .from('task_checklist_items')
          .update({ position: u.position })
          .eq('id', u.id);
        if (error) throw error;
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const completed = items.filter(i => i.is_completed).length;
  const total = items.length;

  return {
    items,
    isLoading,
    completed,
    total,
    addItem: (title: string) => addItem.mutate(title),
    toggleItem: (id: string) => toggleItem.mutate(id),
    updateTitle: (itemId: string, title: string) => updateTitle.mutate({ itemId, title }),
    deleteItem: (id: string) => deleteItem.mutate(id),
    moveItem: (itemId: string, direction: 'up' | 'down') => moveItem.mutate({ itemId, direction }),
  };
}

// Lightweight hook to fetch counts for multiple tasks (for board indicators)
export function useChecklistCounts(taskIds: string[]) {
  return useQuery({
    queryKey: ['checklist-counts', taskIds.sort().join(',')],
    queryFn: async () => {
      if (taskIds.length === 0) return {};
      const { data, error } = await supabase
        .from('task_checklist_items')
        .select('task_id, is_completed')
        .in('task_id', taskIds);
      if (error) throw error;
      
      const counts: Record<string, { completed: number; total: number }> = {};
      (data || []).forEach((item: any) => {
        if (!counts[item.task_id]) counts[item.task_id] = { completed: 0, total: 0 };
        counts[item.task_id].total++;
        if (item.is_completed) counts[item.task_id].completed++;
      });
      return counts;
    },
    enabled: taskIds.length > 0,
    staleTime: 30_000,
  });
}
