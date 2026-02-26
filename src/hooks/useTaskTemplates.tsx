import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TaskTemplate {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  tags: string[];
  checklist_items: { title: string }[];
  created_at: string;
  updated_at: string;
}

export function useTaskTemplates() {
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['task-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as TaskTemplate[]) || [];
    },
    staleTime: 30_000,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<TaskTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('task_templates')
        .insert([{ ...template, user_id: userData.user.id }] as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success('Template criado!');
    },
    onError: () => toast.error('Erro ao criar template'),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success('Template excluído');
    },
    onError: () => toast.error('Erro ao excluir template'),
  });

  return { templates, isLoading, createTemplate, deleteTemplate };
}
