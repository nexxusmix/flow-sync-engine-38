import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
}

export function useTaskDependencies(taskId?: string) {
  const qc = useQueryClient();

  const { data: dependencies = [], isLoading } = useQuery({
    queryKey: ['task-dependencies', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*')
        .eq('task_id', taskId);
      if (error) throw error;
      return (data as unknown as TaskDependency[]) || [];
    },
    enabled: !!taskId,
  });

  const addDependency = useMutation({
    mutationFn: async ({ taskId, dependsOnId }: { taskId: string; dependsOnId: string }) => {
      const { data, error } = await supabase
        .from('task_dependencies')
        .insert([{ task_id: taskId, depends_on_task_id: dependsOnId }] as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-dependencies'] });
      toast.success('Dependência adicionada');
    },
    onError: (err: any) => {
      if (err.message?.includes('unique_dependency')) {
        toast.error('Dependência já existe');
      } else if (err.message?.includes('no_self_dependency')) {
        toast.error('Tarefa não pode depender de si mesma');
      } else {
        toast.error('Erro ao adicionar dependência');
      }
    },
  });

  const removeDependency = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_dependencies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-dependencies'] });
      toast.success('Dependência removida');
    },
    onError: () => toast.error('Erro ao remover dependência'),
  });

  return { dependencies, isLoading, addDependency, removeDependency };
}

// Hook to check if a task has unresolved dependencies
export function useAllDependencies() {
  return useQuery({
    queryKey: ['task-dependencies-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*');
      if (error) throw error;
      return (data as unknown as TaskDependency[]) || [];
    },
    staleTime: 30_000,
  });
}
