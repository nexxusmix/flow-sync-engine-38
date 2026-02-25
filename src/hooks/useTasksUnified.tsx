import { useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import {
  startOfDay, parseISO, isToday, isPast, addDays, isSameDay,
  isWithinInterval, differenceInDays, subDays, format, getDay, getHours
} from 'date-fns';

export type TaskStatus = 'backlog' | 'week' | 'today' | 'done';
export type TaskCategory = 'pessoal' | 'operacao' | 'projeto';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  category: TaskCategory;
  tags: string[];
  due_date: string | null;
  completed_at: string | null;
  position: number;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface TaskColumn {
  key: TaskStatus;
  title: string;
  color: string;
}

export const TASK_COLUMNS: TaskColumn[] = [
  { key: 'backlog', title: 'Backlog', color: 'bg-muted' },
  { key: 'week', title: 'Esta Semana', color: 'bg-blue-500/10' },
  { key: 'today', title: 'Hoje', color: 'bg-yellow-500/10' },
  { key: 'done', title: 'Concluído', color: 'bg-green-500/10' },
];

export const TASK_CATEGORIES = [
  { key: 'operacao' as const, label: 'Operação', color: 'bg-blue-500' },
  { key: 'pessoal' as const, label: 'Pessoal', color: 'bg-purple-500' },
  { key: 'projeto' as const, label: 'Projeto', color: 'bg-orange-500' },
] as const;

// ─── Fetch ──────────────────────────────────────────────
async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Task[]) || [];
}

// ─── Hook ───────────────────────────────────────────────
export function useTasksUnified() {
  const qc = useQueryClient();
  const { logAction } = useUndoRedo();

  // Single query for all tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 30_000,
  });

  // ── Realtime subscription ──────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          // Optimistic cache update
          qc.setQueryData<Task[]>(['tasks'], (old) => {
            if (!old) return old;
            if (payload.eventType === 'INSERT') {
              const newTask = payload.new as Task;
              if (old.find(t => t.id === newTask.id)) return old;
              return [newTask, ...old];
            }
            if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Task;
              return old.map(t => t.id === updated.id ? updated : t);
            }
            if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as any).id;
              return old.filter(t => t.id !== deletedId);
            }
            return old;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  // ── Mutations (optimistic) ─────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          user_id: userData.user.id,
          title: taskData.title || 'Nova tarefa',
          description: taskData.description || null,
          status: taskData.status || 'backlog',
          category: taskData.category || 'operacao',
          tags: taskData.tags || [],
          due_date: taskData.due_date || null,
          priority: taskData.priority || 'normal',
          position: 0,
        }])
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: (newTask) => {
      qc.setQueryData<Task[]>(['tasks'], (old) =>
        old ? [newTask, ...old] : [newTask]
      );
      logAction({
        entityType: 'task',
        entityId: newTask.id,
        actionType: 'CREATE',
        before: null,
        after: newTask as any,
        description: `Tarefa "${newTask.title}" criada`,
        tableName: 'tasks',
        queryKeys: [['tasks']],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates, before }: { id: string; updates: Partial<Task>; before?: Record<string, any> }) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) throw error;
      return { id, updates, before };
    },
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prev = qc.getQueryData<Task[]>(['tasks']);
      const oldTask = prev?.find(t => t.id === id);
      qc.setQueryData<Task[]>(['tasks'], (old) =>
        old ? old.map(t => t.id === id ? { ...t, ...updates } : t) : old
      );
      return { prev, oldTask };
    },
    onSuccess: (_data, vars, ctx) => {
      if (ctx?.oldTask) {
        logAction({
          entityType: 'task',
          entityId: vars.id,
          actionType: 'UPDATE',
          before: ctx.oldTask as any,
          after: { ...ctx.oldTask, ...vars.updates } as any,
          description: `Tarefa atualizada`,
          tableName: 'tasks',
          queryKeys: [['tasks']],
        });
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks'], ctx.prev);
      toast.error('Erro ao atualizar tarefa');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prev = qc.getQueryData<Task[]>(['tasks']);
      const deletedTask = prev?.find(t => t.id === id);
      qc.setQueryData<Task[]>(['tasks'], (old) =>
        old ? old.filter(t => t.id !== id) : old
      );
      return { prev, deletedTask };
    },
    onSuccess: (_data, id, ctx) => {
      if (ctx?.deletedTask) {
        logAction({
          entityType: 'task',
          entityId: id,
          actionType: 'DELETE',
          before: ctx.deletedTask as any,
          after: null,
          description: `Tarefa "${ctx.deletedTask.title}" excluída`,
          tableName: 'tasks',
          queryKeys: [['tasks']],
        });
      }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks'], ctx.prev);
      toast.error('Erro ao excluir tarefa');
    },
  });

  const createTasksFromAIMutation = useMutation({
    mutationFn: async (aiTasks: Array<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'position' | 'completed_at'>>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      const toInsert = aiTasks.map((t, i) => ({
        user_id: userData.user!.id,
        title: t.title,
        description: t.description || null,
        status: t.status || 'backlog',
        category: t.category || 'operacao',
        tags: t.tags || [],
        due_date: t.due_date || null,
        position: i,
      }));
      const { data, error } = await supabase.from('tasks').insert(toInsert).select();
      if (error) throw error;
      return (data as Task[]) || [];
    },
    onSuccess: (newTasks) => {
      qc.setQueryData<Task[]>(['tasks'], (old) =>
        old ? [...newTasks, ...old] : newTasks
      );
    },
  });

  // ── Convenience actions ────────────────────────────────
  const toggleComplete = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const isCompleting = task.status !== 'done';
    updateMutation.mutate({
      id,
      updates: {
        status: isCompleting ? 'done' : 'backlog',
        completed_at: isCompleting ? new Date().toISOString() : null,
      },
    });
  }, [tasks, updateMutation]);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus, newPosition?: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updates: Partial<Task> = {
      status: newStatus,
      position: newPosition ?? task.position,
    };
    if (newStatus === 'done' && task.status !== 'done') {
      updates.completed_at = new Date().toISOString();
    } else if (newStatus !== 'done' && task.status === 'done') {
      updates.completed_at = null;
    }
    updateMutation.mutate({ id: taskId, updates });
  }, [tasks, updateMutation]);

  // ── Derived data (memoized) ────────────────────────────
  const today = startOfDay(new Date());

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { backlog: [], week: [], today: [], done: [] };
    tasks.forEach(t => map[t.status].push(t));
    return map;
  }, [tasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status !== 'done').length;
    const overdue = tasks.filter(t =>
      t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)) && t.status !== 'done'
    ).length;
    const completedToday = tasks.filter(t =>
      t.completed_at && isToday(parseISO(t.completed_at))
    ).length;
    const dueNext7 = tasks.filter(t =>
      t.due_date && t.status !== 'done' &&
      isWithinInterval(parseISO(t.due_date), { start: today, end: addDays(today, 7) })
    ).length;

    // Completion trend (last 30 days)
    const completionsByDay: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(today, i);
      const count = tasks.filter(t =>
        t.completed_at && isSameDay(parseISO(t.completed_at), d)
      ).length;
      completionsByDay.push({ date: format(d, 'dd/MM'), count });
    }

    // Category distribution
    const byCategory: Record<TaskCategory, number> = { pessoal: 0, operacao: 0, projeto: 0 };
    tasks.forEach(t => byCategory[t.category]++);

    // Tag distribution
    const tagCounts: Record<string, number> = {};
    tasks.forEach(t => t.tags?.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));

    // Avg time to complete (days)
    const completedWithDates = tasks.filter(t => t.completed_at && t.created_at);
    const avgCompletionDays = completedWithDates.length > 0
      ? completedWithDates.reduce((sum, t) => {
          return sum + differenceInDays(parseISO(t.completed_at!), parseISO(t.created_at));
        }, 0) / completedWithDates.length
      : 0;

    // Weekly heatmap (day x created_at hour)
    const heatmap: { day: number; hour: number; count: number }[] = [];
    const heatmapMap: Record<string, number> = {};
    tasks.forEach(t => {
      if (!t.completed_at) return;
      const dt = parseISO(t.completed_at);
      const key = `${getDay(dt)}-${getHours(dt)}`;
      heatmapMap[key] = (heatmapMap[key] || 0) + 1;
    });
    for (let day = 0; day < 7; day++) {
      for (let hour = 6; hour < 22; hour++) {
        heatmap.push({ day, hour, count: heatmapMap[`${day}-${hour}`] || 0 });
      }
    }

    // Top oldest pending
    const oldestPending = tasks
      .filter(t => t.status !== 'done')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 10);

    // Next to expire
    const nextExpiring = tasks
      .filter(t => t.due_date && t.status !== 'done')
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 10);

    // Status by period (7/30/90 days) — stacked bar data
    const statusByPeriod = [7, 30, 90].map(days => {
      const cutoff = subDays(today, days);
      const periodTasks = tasks.filter(t => parseISO(t.created_at) >= cutoff);
      return {
        period: `${days}d`,
        backlog: periodTasks.filter(t => t.status === 'backlog').length,
        week: periodTasks.filter(t => t.status === 'week').length,
        today: periodTasks.filter(t => t.status === 'today').length,
        done: periodTasks.filter(t => t.status === 'done').length,
      };
    });

    return {
      total, pending, overdue, completedToday, dueNext7,
      completionsByDay, byCategory, tagCounts, avgCompletionDays,
      heatmap, oldestPending, nextExpiring, statusByPeriod,
    };
  }, [tasks, today]);

  // Timeline items (next 14 days + overdue)
  const timelineItems = useMemo(() => {
    const days: { date: Date; tasks: Task[] }[] = [];
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const dayTasks = tasks.filter(t =>
        t.due_date && t.status !== 'done' && isSameDay(parseISO(t.due_date), date)
      );
      if (dayTasks.length > 0) days.push({ date, tasks: dayTasks });
    }
    const overdueTasks = tasks.filter(t =>
      t.due_date && t.status !== 'done' && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))
    );
    if (overdueTasks.length > 0) days.unshift({ date: new Date(0), tasks: overdueTasks });
    return days;
  }, [tasks, today]);

  return {
    tasks,
    isLoading,
    byStatus,
    stats,
    timelineItems,
    // Mutations
    createTask: createMutation.mutateAsync,
    updateTask: (id: string, updates: Partial<Task>) => updateMutation.mutate({ id, updates }),
    deleteTask: (id: string) => deleteMutation.mutate(id),
    toggleComplete,
    moveTask,
    createTasksFromAI: createTasksFromAIMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isGenerating: createTasksFromAIMutation.isPending,
  };
}
