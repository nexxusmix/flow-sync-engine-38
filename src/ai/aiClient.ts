import { supabase } from "@/integrations/supabase/client";
import { AiGenerateOptions, AiGenerateResult } from "./types";
import { getAiAction } from "./actions";
import type { Json } from "@/integrations/supabase/types";
import { DEFAULT_WORKSPACE_ID } from "@/constants/workspace";

// ============================================
// Unified AI Client
// All AI operations go through this client
// ============================================

/**
 * Main AI client - handles all AI generation requests
 * Logs to ai_runs table and calls the appropriate edge function
 */
export async function runAiAction<T = unknown>(
  options: AiGenerateOptions
): Promise<AiGenerateResult<T>> {
  const startTime = Date.now();
  let runId: string | undefined;

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Validate action exists
    const action = getAiAction(options.actionKey);
    if (!action) {
      return { success: false, error: `Ação desconhecida: ${options.actionKey}` };
    }

    // Create ai_run record (pending)
    const { data: runRecord, error: insertError } = await supabase
      .from('ai_runs')
      .insert([{
        user_id: user.id,
        workspace_id: DEFAULT_WORKSPACE_ID,
        action_key: options.actionKey,
        entity_type: options.entityType,
        entity_id: options.entityId || null,
        input_json: options.input as Json,
        status: 'pending',
      }])
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to create ai_run record:', insertError);
      // Continue anyway - logging failure shouldn't block the action
    } else {
      runId = runRecord?.id;
    }

    // Call the Vercel AI proxy (primary) with fallback to Supabase edge function
    let data: any = null;
    let error: any = null;

    try {
      const res = await fetch('/api/ai-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: options.actionKey,
          input: options.input,
          entityType: options.entityType,
          entityId: options.entityId,
        }),
      });
      if (res.ok) {
        data = await res.json();
      } else {
        throw new Error(`Vercel AI proxy: ${res.status}`);
      }
    } catch (vercelErr) {
      console.warn('Vercel AI proxy failed, falling back to Supabase:', vercelErr);
      const fallback = await supabase.functions.invoke('ai-run', {
        body: {
          actionKey: options.actionKey,
          input: options.input,
          entityType: options.entityType,
          entityId: options.entityId,
        },
      });
      data = fallback.data;
      error = fallback.error;
    }

    const durationMs = Date.now() - startTime;

    // Handle errors
    if (error) {
      console.error('ai-run edge function error:', error);
      await updateAiRun(runId, 'error', null, error.message, durationMs);
      return { 
        success: false, 
        error: error.message || 'Erro ao executar ação de IA',
        runId,
        durationMs,
      };
    }

    // Check for API errors (rate limit, payment required, etc.)
    if (data?.error) {
      await updateAiRun(runId, 'error', null, data.error, durationMs);
      return {
        success: false,
        error: data.error,
        runId,
        durationMs,
      };
    }

    // Success!
    await updateAiRun(runId, 'success', data, null, durationMs);
    return {
      success: true,
      data: data as T,
      runId,
      durationMs,
    };

  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('runAiAction exception:', err);
    await updateAiRun(runId, 'error', null, errorMessage, durationMs);
    return {
      success: false,
      error: errorMessage,
      runId,
      durationMs,
    };
  }
}

/**
 * Update ai_run record with result
 */
async function updateAiRun(
  runId: string | undefined,
  status: 'success' | 'error',
  outputJson: unknown,
  errorMessage: string | null,
  durationMs: number
): Promise<void> {
  if (!runId) return;

  try {
    await supabase
      .from('ai_runs')
      .update({
        status,
        output_json: outputJson as Json,
        error_message: errorMessage,
        duration_ms: durationMs,
      })
      .eq('id', runId);
  } catch (err) {
    console.error('Failed to update ai_run:', err);
  }
}

/**
 * Get AI run history for an entity
 */
export async function getAiRunHistory(
  entityType: string,
  entityId: string,
  limit: number = 10
): Promise<AiGenerateResult<{ runs: unknown[] }>> {
  try {
    const { data, error } = await supabase
      .from('ai_runs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { runs: data || [] } };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro ao buscar histórico' 
    };
  }
}

/**
 * Get recent AI runs for the current user
 */
export async function getRecentAiRuns(limit: number = 20): Promise<AiGenerateResult<{ runs: unknown[] }>> {
  try {
    const { data, error } = await supabase
      .from('ai_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { runs: data || [] } };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro ao buscar histórico' 
    };
  }
}
