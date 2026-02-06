import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import type {
  CreativeWork,
  CreativeBlock,
  CreativeBlockVersion,
  CreativeWorkType,
  CreativeWorkStatus,
  CreativeBlockType,
  CreativeBlockStatus,
  CreativeSource,
} from '@/types/creative-works';

const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

// ============================================
// Creative Works Hook
// ============================================

export function useCreativeWorks() {
  const queryClient = useQueryClient();

  // Fetch all works
  const { data: works, isLoading, error, refetch } = useQuery({
    queryKey: ['creative-works'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_works')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as CreativeWork[];
    },
  });

  // Create work
  const createWork = useMutation({
    mutationFn: async (input: {
      title: string;
      type?: CreativeWorkType;
      client_id?: string | null;
      project_id?: string | null;
      proposal_id?: string | null;
      campaign_id?: string | null;
      brand_kit_id?: string | null;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('creative_works')
        .insert([{
          workspace_id: DEFAULT_WORKSPACE_ID,
          title: input.title,
          type: input.type || 'full_package',
          status: 'draft' as CreativeWorkStatus,
          source: 'manual' as CreativeSource,
          client_id: input.client_id,
          project_id: input.project_id,
          proposal_id: input.proposal_id,
          campaign_id: input.campaign_id,
          brand_kit_id: input.brand_kit_id,
          created_by: user.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as CreativeWork;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-works'] });
      toast.success('Trabalho criativo criado!');
    },
    onError: (error) => {
      console.error('Error creating work:', error);
      toast.error('Erro ao criar trabalho criativo');
    },
  });

  // Update work
  const updateWork = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreativeWork> & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { metadata, ...safeUpdates } = updates;
      const { data, error } = await supabase
        .from('creative_works')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CreativeWork;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-works'] });
    },
  });

  // Delete work
  const deleteWork = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('creative_works')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-works'] });
      toast.success('Trabalho criativo excluído');
    },
    onError: () => {
      toast.error('Erro ao excluir trabalho criativo');
    },
  });

  return {
    works: works || [],
    isLoading,
    error,
    refetch,
    createWork,
    updateWork,
    deleteWork,
  };
}

// ============================================
// Single Creative Work Hook
// ============================================

export function useCreativeWork(workId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch single work
  const { data: work, isLoading: loadingWork } = useQuery({
    queryKey: ['creative-work', workId],
    queryFn: async () => {
      if (!workId) return null;
      
      const { data, error } = await supabase
        .from('creative_works')
        .select('*')
        .eq('id', workId)
        .single();
      
      if (error) throw error;
      return data as CreativeWork;
    },
    enabled: !!workId,
  });

  // Fetch blocks
  const { data: blocks, isLoading: loadingBlocks } = useQuery({
    queryKey: ['creative-blocks', workId],
    queryFn: async () => {
      if (!workId) return [];
      
      const { data, error } = await supabase
        .from('creative_blocks')
        .select('*')
        .eq('work_id', workId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as CreativeBlock[];
    },
    enabled: !!workId,
  });

  // Update work
  const updateWork = useMutation({
    mutationFn: async (updates: Partial<CreativeWork>) => {
      if (!workId) throw new Error('No work ID');
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { metadata, ...safeUpdates } = updates;
      const { data, error } = await supabase
        .from('creative_works')
        .update(safeUpdates)
        .eq('id', workId)
        .select()
        .single();

      if (error) throw error;
      return data as CreativeWork;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-work', workId] });
      queryClient.invalidateQueries({ queryKey: ['creative-works'] });
    },
  });

  // Upsert block (create or update)
  const upsertBlock = useMutation({
    mutationFn: async (input: {
      type: CreativeBlockType;
      content: Record<string, unknown>;
      source?: CreativeSource;
      title?: string;
      status?: CreativeBlockStatus;
      ai_run_id?: string;
    }) => {
      if (!workId) throw new Error('No work ID');
      
      // Check if block exists
      const { data: existing } = await supabase
        .from('creative_blocks')
        .select('id, version')
        .eq('work_id', workId)
        .eq('type', input.type)
        .single();

      if (existing) {
        // Update existing block
        const newVersion = (existing.version || 1) + 1;
        
        // First, save current version to history
        const { data: currentBlock } = await supabase
          .from('creative_blocks')
          .select('content, source, ai_run_id')
          .eq('id', existing.id)
          .single();

        if (currentBlock) {
          const { data: user } = await supabase.auth.getUser();
          await supabase.from('creative_block_versions').insert([{
            block_id: existing.id,
            version: existing.version,
            content: currentBlock.content as Json,
            source: currentBlock.source as 'manual' | 'ai' | 'hybrid',
            ai_run_id: currentBlock.ai_run_id,
            created_by: user.user?.id,
          }]);
        }

        // Update block
        const { data, error } = await supabase
          .from('creative_blocks')
          .update({
            content: input.content as Json,
            source: input.source || 'manual',
            title: input.title,
            status: input.status || 'draft',
            version: newVersion,
            ai_run_id: input.ai_run_id,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as CreativeBlock;
      } else {
        // Create new block
        const blockOrder = blocks?.length || 0;
        
        const { data, error } = await supabase
          .from('creative_blocks')
          .insert([{
            work_id: workId,
            type: input.type,
            content: input.content as Json,
            source: input.source || 'manual',
            title: input.title,
            status: input.status || 'draft',
            version: 1,
            order_index: blockOrder,
            ai_run_id: input.ai_run_id,
          }])
          .select()
          .single();

        if (error) throw error;
        return data as CreativeBlock;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-blocks', workId] });
      toast.success('Bloco salvo com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving block:', error);
      toast.error('Erro ao salvar bloco');
    },
  });

  // Get block by type
  const getBlock = useCallback((type: CreativeBlockType): CreativeBlock | undefined => {
    return blocks?.find(b => b.type === type);
  }, [blocks]);

  return {
    work,
    blocks: blocks || [],
    isLoading: loadingWork || loadingBlocks,
    updateWork,
    upsertBlock,
    getBlock,
  };
}

// ============================================
// Block Versions Hook
// ============================================

export function useBlockVersions(blockId: string | undefined) {
  const { data: versions, isLoading } = useQuery({
    queryKey: ['block-versions', blockId],
    queryFn: async () => {
      if (!blockId) return [];
      
      const { data, error } = await supabase
        .from('creative_block_versions')
        .select('*')
        .eq('block_id', blockId)
        .order('version', { ascending: false });
      
      if (error) throw error;
      return data as CreativeBlockVersion[];
    },
    enabled: !!blockId,
  });

  return {
    versions: versions || [],
    isLoading,
  };
}
