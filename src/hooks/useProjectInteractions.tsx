/**
 * Hook for managing project interactions (meetings, messages, alignments)
 * With Supabase CRUD and realtime subscriptions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  ProjectInteraction,
  InteractionAsset,
  InteractionSummary,
  ProjectActionItem,
  CreateInteractionInput,
  CreateActionItemInput,
} from "@/types/meetings";

// ============ INTERACTIONS ============

export function useProjectInteractions(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['project-interactions', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_interactions')
        .select(`
          *,
          assets:project_interaction_assets(*),
          summary:project_interaction_summaries(*)
        `)
        .eq('project_id', projectId)
        .order('occurred_at', { ascending: false });

      if (error) throw error;

      // Transform summary from array to single object
      return (data || []).map(interaction => ({
        ...interaction,
        summary: interaction.summary?.[0] || null,
      })) as ProjectInteraction[];
    },
    enabled: !!projectId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`interactions-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_interactions',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-interactions', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInteractionInput) => {
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('project_interactions')
        .insert({
          ...input,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-interactions', data.project_id] });
      toast.success('Interação registrada!');
    },
    onError: (error) => {
      console.error('Error creating interaction:', error);
      toast.error('Erro ao registrar interação');
    },
  });
}

export function useUpdateInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectInteraction> & { id: string }) => {
      const { data, error } = await supabase
        .from('project_interactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-interactions', data.project_id] });
      toast.success('Interação atualizada!');
    },
    onError: (error) => {
      console.error('Error updating interaction:', error);
      toast.error('Erro ao atualizar interação');
    },
  });
}

export function useDeleteInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_interactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-interactions', projectId] });
      toast.success('Interação removida!');
    },
    onError: (error) => {
      console.error('Error deleting interaction:', error);
      toast.error('Erro ao remover interação');
    },
  });
}

// ============ ASSETS ============

export function useAddInteractionAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      interactionId,
      projectId,
      type,
      file,
      url,
      filename,
    }: {
      interactionId: string;
      projectId: string;
      type: 'file' | 'link';
      file?: File;
      url?: string;
      filename?: string;
    }) => {
      let storagePath: string | null = null;
      let publicUrl: string | null = url || null;

      if (type === 'file' && file) {
        const fileName = `${Date.now()}-${file.name}`;
        const path = `interactions/${interactionId}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(path, file);

        if (uploadError) throw uploadError;

        storagePath = uploadData.path;
        const { data: urlData } = supabase.storage
          .from('project-files')
          .getPublicUrl(uploadData.path);
        publicUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('project_interaction_assets')
        .insert({
          interaction_id: interactionId,
          type,
          storage_path: storagePath,
          url: publicUrl,
          filename: filename || file?.name,
          file_size: file?.size,
          mime_type: file?.type,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-interactions', projectId] });
      toast.success('Anexo adicionado!');
    },
    onError: (error) => {
      console.error('Error adding asset:', error);
      toast.error('Erro ao adicionar anexo');
    },
  });
}

// ============ ACTION ITEMS ============

export function useProjectActionItems(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['project-action-items', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_action_items')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as ProjectActionItem[];
    },
    enabled: !!projectId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`action-items-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_action_items',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-action-items', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
}

export function useCreateActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateActionItemInput) => {
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('project_action_items')
        .insert({
          ...input,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-action-items', data.project_id] });
      toast.success('Ação criada!');
    },
    onError: (error) => {
      console.error('Error creating action item:', error);
      toast.error('Erro ao criar ação');
    },
  });
}

export function useUpdateActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectActionItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('project_action_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-action-items', data.project_id] });
    },
    onError: (error) => {
      console.error('Error updating action item:', error);
      toast.error('Erro ao atualizar ação');
    },
  });
}

export function useDeleteActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_action_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-action-items', projectId] });
      toast.success('Ação removida!');
    },
    onError: (error) => {
      console.error('Error deleting action item:', error);
      toast.error('Erro ao remover ação');
    },
  });
}

// ============ AI SUMMARY ============

export function useGenerateInteractionSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      interactionId,
      projectId,
      createTasks,
    }: {
      interactionId: string;
      projectId: string;
      createTasks: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-interaction-summary', {
        body: { interactionId, projectId, createTasks },
      });

      if (error) throw error;
      return { data, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-interactions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-action-items', projectId] });
      toast.success('Resumo gerado com IA!');
    },
    onError: (error) => {
      console.error('Error generating summary:', error);
      toast.error('Erro ao gerar resumo');
    },
  });
}
