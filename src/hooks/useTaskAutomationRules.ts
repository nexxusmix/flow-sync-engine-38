import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TaskAutomationRule {
  id: string;
  user_id: string;
  name: string;
  trigger_type: string;
  condition_json: Record<string, any>;
  action_json: Record<string, any>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const TRIGGER_TYPES = [
  { key: 'on_status_change', label: 'Ao mudar status' },
  { key: 'on_create', label: 'Ao criar tarefa' },
  { key: 'on_due_date', label: 'Ao vencer prazo' },
] as const;

export const ACTION_TYPES = [
  { key: 'move_to_status', label: 'Mover para status', params: ['target_status'] },
  { key: 'set_priority', label: 'Definir prioridade', params: ['target_priority'] },
  { key: 'add_tag', label: 'Adicionar tag', params: ['tag'] },
] as const;

export function useTaskAutomationRules() {
  const qc = useQueryClient();
  const queryKey = ['task-automation-rules'];

  const { data: rules = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_automation_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as TaskAutomationRule[]) || [];
    },
  });

  const createRule = useMutation({
    mutationFn: async (rule: Omit<TaskAutomationRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('task_automation_rules')
        .insert([{ ...rule, user_id: userData.user.id }] as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success('Regra criada');
    },
    onError: () => toast.error('Erro ao criar regra'),
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskAutomationRule> }) => {
      const { error } = await supabase
        .from('task_automation_rules')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success('Regra atualizada');
    },
    onError: () => toast.error('Erro ao atualizar regra'),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_automation_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success('Regra excluída');
    },
    onError: () => toast.error('Erro ao excluir regra'),
  });

  const toggleRule = (id: string, enabled: boolean) => {
    updateRule.mutate({ id, updates: { enabled } });
  };

  return {
    rules,
    isLoading,
    createRule: createRule.mutateAsync,
    updateRule: (id: string, updates: Partial<TaskAutomationRule>) => updateRule.mutate({ id, updates }),
    deleteRule: (id: string) => deleteRule.mutate(id),
    toggleRule,
  };
}
