import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useCallback } from 'react';
import type { Task } from '@/hooks/useTasksUnified';

export interface ExecutionPlan {
  id: string;
  task_id: string;
  estimate_min: number | null;
  estimate_max: number | null;
  energy_level: 'baixa' | 'media' | 'alta' | null;
  next_action: string | null;
  micro_steps: string[];
  work_mode: 'deep_work' | 'admin' | 'criativo' | 'comunicacao' | null;
  break_pattern: string | null;
  definition_of_done: string[];
  cognitive_load: number | null;
  suggested_time_slot: string | null;
  user_notes: string | null;
  pinned: boolean;
  emergency_mode: boolean;
  created_at: string;
  updated_at: string;
}

export function useExecutionPlans() {
  const qc = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['execution-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_execution_plans')
        .select('*');
      if (error) throw error;
      return (data || []) as ExecutionPlan[];
    },
    staleTime: 30_000,
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('execution-plans-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_execution_plans' }, (payload) => {
        qc.setQueryData<ExecutionPlan[]>(['execution-plans'], (old) => {
          if (!old) return old;
          if (payload.eventType === 'INSERT') {
            const n = payload.new as ExecutionPlan;
            return old.find(p => p.id === n.id) ? old : [...old, n];
          }
          if (payload.eventType === 'UPDATE') {
            const u = payload.new as ExecutionPlan;
            return old.map(p => p.id === u.id ? u : p);
          }
          if (payload.eventType === 'DELETE') {
            return old.filter(p => p.id !== (payload.old as any).id);
          }
          return old;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const generateMutation = useMutation({
    mutationFn: async (task: Task & { is_overdue?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('generate-execution-plan', {
        body: { task },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return { taskId: task.id, plan: data.plan };
    },
    onSuccess: async ({ taskId, plan }) => {
      // Upsert into DB
      const { error } = await supabase
        .from('task_execution_plans')
        .upsert({
          task_id: taskId,
          estimate_min: plan.estimate_min,
          estimate_max: plan.estimate_max,
          energy_level: plan.energy_level,
          next_action: plan.next_action,
          micro_steps: plan.micro_steps,
          work_mode: plan.work_mode,
          break_pattern: plan.break_pattern,
          definition_of_done: plan.definition_of_done,
          cognitive_load: plan.cognitive_load,
          suggested_time_slot: plan.suggested_time_slot || null,
          emergency_mode: plan.emergency_mode || false,
        }, { onConflict: 'task_id' });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['execution-plans'] });
      toast.success('Plano de execução gerado!');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao gerar plano');
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<ExecutionPlan> }) => {
      const { error } = await supabase
        .from('task_execution_plans')
        .update(updates)
        .eq('task_id', taskId);
      if (error) throw error;
    },
    onMutate: async ({ taskId, updates }) => {
      await qc.cancelQueries({ queryKey: ['execution-plans'] });
      const prev = qc.getQueryData<ExecutionPlan[]>(['execution-plans']);
      qc.setQueryData<ExecutionPlan[]>(['execution-plans'], (old) =>
        old ? old.map(p => p.task_id === taskId ? { ...p, ...updates } : p) : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['execution-plans'], ctx.prev);
    },
  });

  const getPlanForTask = useCallback(
    (taskId: string) => plans.find(p => p.task_id === taskId) || null,
    [plans]
  );

  return {
    plans,
    isLoading,
    getPlanForTask,
    generatePlan: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    updatePlan: (taskId: string, updates: Partial<ExecutionPlan>) =>
      updatePlan.mutate({ taskId, updates }),
    togglePin: (taskId: string) => {
      const plan = getPlanForTask(taskId);
      if (plan) updatePlan.mutate({ taskId, updates: { pinned: !plan.pinned } });
    },
  };
}
