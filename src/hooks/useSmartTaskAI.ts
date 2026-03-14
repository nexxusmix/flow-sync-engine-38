import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Task } from '@/hooks/useTasksUnified';

export interface AIActionResult {
  intent: string;
  action_type: 'destructive' | 'organizational' | 'strategic' | 'automation';
  summary: string;
  requires_confirmation: boolean;
  affected_task_ids: string[];
  details?: {
    count: number;
    description: string;
    changes?: Array<{ id: string; field: string; old_value: string; new_value: string }>;
  };
}

interface UndoEntry {
  action: string;
  affected_ids: string[];
  snapshot: Task[];
  timestamp: number;
}

export function useSmartTaskAI(tasks: Task[]) {
  const qc = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [pendingAction, setPendingAction] = useState<AIActionResult | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const undoStackRef = useRef<UndoEntry[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const sendCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;
    setIsProcessing(true);
    setPendingAction(null);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('task-ai-executor', {
        body: {
          tasks: tasks.map(t => ({
            id: t.id, title: t.title, status: t.status, category: t.category,
            due_date: t.due_date, tags: t.tags, updated_at: t.updated_at,
            completed_at: t.completed_at, created_at: t.created_at,
          })),
          command,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setPendingAction(data as AIActionResult);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar comando');
    } finally {
      setIsProcessing(false);
    }
  }, [tasks]);

  const executeAction = useCallback(async (action: AIActionResult) => {
    setIsExecuting(true);
    try {
      // Save snapshot for undo
      const affectedTasks = tasks.filter(t => action.affected_task_ids.includes(t.id));
      undoStackRef.current.push({
        action: action.intent,
        affected_ids: action.affected_task_ids,
        snapshot: JSON.parse(JSON.stringify(affectedTasks)),
        timestamp: Date.now(),
      });
      setCanUndo(true);

      const { data, error } = await supabase.functions.invoke('task-ai-executor', {
        body: { tasks, action },
      });
      if (error) throw error;
      if (!data?.success) { toast.error(data?.summary || 'Erro na execução'); return; }

      setLastResult(data.summary);
      setPendingAction(null);
      toast.success(data.summary);
      qc.invalidateQueries({ queryKey: ['tasks'] });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao executar ação');
    } finally {
      setIsExecuting(false);
    }
  }, [tasks, qc]);

  const confirmAction = useCallback(() => {
    if (pendingAction) executeAction(pendingAction);
  }, [pendingAction, executeAction]);

  const cancelAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  const undoLastAction = useCallback(async () => {
    const entry = undoStackRef.current.pop();
    if (!entry) return;
    setIsExecuting(true);
    try {
      // Restore deleted tasks by re-inserting them
      for (const task of entry.snapshot) {
        const { id, ...rest } = task;
        // Try to upsert - if task was deleted, insert; if modified, update
        const { error } = await supabase.from('tasks').upsert({
          id, user_id: rest.user_id, title: rest.title, description: rest.description,
          status: rest.status, category: rest.category, tags: rest.tags,
          due_date: rest.due_date, completed_at: rest.completed_at, position: rest.position,
        });
        if (error) console.error('Undo error for', id, error);
      }
      toast.success(`Ação "${entry.action}" desfeita com sucesso!`);
      setCanUndo(undoStackRef.current.length > 0);
      qc.invalidateQueries({ queryKey: ['tasks'] });
    } catch (err: any) {
      toast.error('Erro ao desfazer ação');
    } finally {
      setIsExecuting(false);
    }
  }, [qc]);

  const runQuickAction = useCallback(async (intent: string) => {
    // Map quick action to a natural language command
    const commandMap: Record<string, string> = {
      delete_duplicates: 'apagar todas as tarefas duplicadas',
      archive_completed: 'arquivar todas as tarefas concluídas',
      reorganize_priority: 'reorganizar todas as tarefas por prioridade',
      create_week_plan: 'criar um planejamento semanal inteligente',
      auto_optimize_all: 'executar otimização completa de todas as tarefas',
    };
    const cmd = commandMap[intent] || intent;
    await sendCommand(cmd);
  }, [sendCommand]);

  return {
    isProcessing,
    isExecuting,
    pendingAction,
    lastResult,
    canUndo,
    sendCommand,
    confirmAction,
    cancelAction,
    undoLastAction,
    runQuickAction,
  };
}
