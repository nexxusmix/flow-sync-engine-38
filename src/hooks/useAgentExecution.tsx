import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { 
  AgentRun, 
  ExecutionPlan, 
  ExecutionResult, 
  AttachmentInfo 
} from '@/types/agent';
import type { Json } from '@/integrations/supabase/types';

const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

export function useAgentExecution() {
  const { user } = useAuth();
  const [currentRun, setCurrentRun] = useState<AgentRun | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Create a new agent run
  const createRun = useCallback(async (
    inputText: string,
    attachments: AttachmentInfo[] = [],
    context: Record<string, unknown> = {}
  ): Promise<string | null> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('agent_runs')
        .insert({
          user_id: user.id,
          workspace_id: DEFAULT_WORKSPACE_ID,
          input_text: inputText,
          attachments: attachments as unknown as Json,
          context_json: context as Json,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentRun(data as unknown as AgentRun);
      return data.id;
    } catch (err) {
      console.error('Failed to create agent run:', err);
      toast.error('Erro ao iniciar execução');
      return null;
    }
  }, [user]);

  // Update run with plan
  const updateRunPlan = useCallback(async (
    runId: string,
    plan: ExecutionPlan
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agent_runs')
        .update({
          plan_json: plan as unknown as Json,
          status: plan.needs_confirmation ? 'needs_confirmation' : 'planning',
          risk_level: plan.risk_level,
        })
        .eq('id', runId);

      if (error) throw error;

      setCurrentRun(prev => prev ? { ...prev, plan_json: plan, status: plan.needs_confirmation ? 'needs_confirmation' : 'planning' } : null);
      return true;
    } catch (err) {
      console.error('Failed to update run plan:', err);
      return false;
    }
  }, []);

  // Execute the plan
  const executePlan = useCallback(async (
    runId: string,
    plan: ExecutionPlan
  ): Promise<ExecutionResult | null> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return null;
    }

    setIsExecuting(true);

    try {
      const { data, error } = await supabase.functions.invoke('polo-ai-execute', {
        body: {
          runId,
          plan,
          userId: user.id,
          workspaceId: DEFAULT_WORKSPACE_ID,
        },
      });

      if (error) throw error;

      // Refresh current run
      const { data: updatedRun } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('id', runId)
        .single();

      if (updatedRun) {
        setCurrentRun(updatedRun as unknown as AgentRun);
      }

      return data as ExecutionResult;
    } catch (err) {
      console.error('Execution failed:', err);
      toast.error('Erro na execução');
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [user]);

  // Confirm and execute high-risk plan
  const confirmAndExecute = useCallback(async (runId: string): Promise<ExecutionResult | null> => {
    if (!currentRun?.plan_json) {
      toast.error('Nenhum plano para executar');
      return null;
    }

    // Mark as confirmed
    await supabase
      .from('agent_runs')
      .update({ confirmed_at: new Date().toISOString() })
      .eq('id', runId);

    return executePlan(runId, currentRun.plan_json);
  }, [currentRun, executePlan]);

  // Get run history
  const getRunHistory = useCallback(async (limit = 20): Promise<AgentRun[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as unknown as AgentRun[];
    } catch (err) {
      console.error('Failed to fetch run history:', err);
      return [];
    }
  }, [user]);

  // Get actions for a run
  const getRunActions = useCallback(async (runId: string) => {
    try {
      const { data, error } = await supabase
        .from('agent_actions')
        .select('*')
        .eq('run_id', runId)
        .order('step_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to fetch run actions:', err);
      return [];
    }
  }, []);

  return {
    currentRun,
    isExecuting,
    createRun,
    updateRunPlan,
    executePlan,
    confirmAndExecute,
    getRunHistory,
    getRunActions,
    setCurrentRun,
  };
}
