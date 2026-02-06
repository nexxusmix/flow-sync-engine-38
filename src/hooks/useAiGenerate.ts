import { useState, useCallback } from 'react';
import { runAiAction, getAiRunHistory } from '@/ai/aiClient';
import { getAiAction } from '@/ai/actions';
import { AiActionStatus, AiGenerateResult, AiRunRecord } from '@/ai/types';

interface UseAiGenerateOptions {
  actionKey: string;
  entityType: string;
  entityId?: string;
  onSuccess?: (result: unknown) => void;
  onError?: (error: string) => void;
}

interface UseAiGenerateReturn {
  status: AiActionStatus;
  result: unknown | null;
  error: string | null;
  history: AiRunRecord[];
  isLoading: boolean;
  generate: (input: Record<string, unknown>) => Promise<AiGenerateResult>;
  fetchHistory: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for AI generation with state management
 * Provides loading states, error handling, and history
 */
export function useAiGenerate(options: UseAiGenerateOptions): UseAiGenerateReturn {
  const { actionKey, entityType, entityId, onSuccess, onError } = options;

  const [status, setStatus] = useState<AiActionStatus>('idle');
  const [result, setResult] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AiRunRecord[]>([]);

  const generate = useCallback(async (input: Record<string, unknown>): Promise<AiGenerateResult> => {
    setStatus('loading');
    setError(null);

    const aiResult = await runAiAction({
      actionKey,
      entityType,
      entityId,
      input,
    });

    if (aiResult.success) {
      setStatus('success');
      setResult(aiResult.data);
      onSuccess?.(aiResult.data);
    } else {
      setStatus('error');
      setError(aiResult.error || 'Erro desconhecido');
      onError?.(aiResult.error || 'Erro desconhecido');
    }

    return aiResult;
  }, [actionKey, entityType, entityId, onSuccess, onError]);

  const fetchHistory = useCallback(async () => {
    if (!entityId) return;

    const historyResult = await getAiRunHistory(entityType, entityId);
    if (historyResult.success && historyResult.data) {
      setHistory((historyResult.data as { runs: AiRunRecord[] }).runs);
    }
  }, [entityType, entityId]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    result,
    error,
    history,
    isLoading: status === 'loading',
    generate,
    fetchHistory,
    reset,
  };
}

/**
 * Get action metadata for UI display
 */
export function useAiActionMeta(actionKey: string) {
  const action = getAiAction(actionKey);
  return {
    title: action?.title || actionKey,
    description: action?.description || '',
    fieldLabels: action?.fieldLabels || {},
  };
}
