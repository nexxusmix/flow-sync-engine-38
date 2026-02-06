import { z } from 'zod';

// ============================================
// AI Action System Types
// ============================================

export type AiActionStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AiRunRecord {
  id: string;
  user_id: string;
  workspace_id: string;
  action_key: string;
  entity_type: string | null;
  entity_id: string | null;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown> | null;
  status: 'pending' | 'success' | 'error';
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface AiActionDefinition<TInput = unknown, TOutput = unknown> {
  key: string;
  title: string;
  description: string;
  entityType: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  buildContext: (entity: unknown) => TInput;
  applyResult: (result: TOutput, setter: (data: Partial<TOutput>) => void) => void;
  // Field mapping for preview display
  fieldLabels?: Record<string, string>;
}

export interface AiGenerateOptions {
  actionKey: string;
  entityType: string;
  entityId?: string;
  input: Record<string, unknown>;
}

export interface AiGenerateResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  runId?: string;
  durationMs?: number;
}

// Error types
export interface AiError {
  error: string;
  status?: number;
}

export function isAiError(result: unknown): result is AiError {
  return typeof result === 'object' && result !== null && 'error' in result;
}
