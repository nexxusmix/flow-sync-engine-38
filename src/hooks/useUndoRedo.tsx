import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// ─── Types ──────────────────────────────────────────────
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE';

export interface ActionLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action_type: ActionType;
  before_snapshot: Record<string, any> | null;
  after_snapshot: Record<string, any> | null;
  created_at: string;
  undone_at: string | null;
  group_id: string;
}

interface UndoableAction {
  entityType: string;
  entityId: string;
  actionType: ActionType;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  description: string;
  tableName: string;
  queryKeys?: string[][];
  groupId?: string;
}

// ─── Singleton stack (shared across hook instances) ─────
let undoStack: ActionLogEntry[] = [];
let redoStack: ActionLogEntry[] = [];
let listeners: Array<() => void> = [];

function notify() {
  listeners.forEach(fn => fn());
}

// ─── Entity type → Supabase table mapping ──────────────
const TABLE_MAP: Record<string, string> = {
  task: 'tasks',
  project: 'projects',
  revenue: 'revenues',
  expense: 'expenses',
  content_item: 'content_items',
  content_idea: 'content_ideas',
  campaign: 'campaigns',
  contract: 'contracts',
  calendar_event: 'calendar_events',
  prospect_target: 'prospect_targets',
  prospect_opportunity: 'prospect_opportunities',
};

// ─── Entity type → React Query keys to invalidate ──────
const QUERY_KEY_MAP: Record<string, string[][]> = {
  task: [['tasks']],
  project: [['projects'], ['dashboard-metrics']],
  revenue: [['revenues'], ['financial']],
  expense: [['expenses'], ['financial']],
  content_item: [['content-items']],
  content_idea: [['content-ideas']],
  campaign: [['campaigns']],
  calendar_event: [['calendar-events']],
};

// ─── Hook ───────────────────────────────────────────────
export function useUndoRedo() {
  const qc = useQueryClient();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const listener = () => {};
    listeners.push(listener);
    return () => {
      mountedRef.current = false;
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  // ── Log and push to undo stack ────────────────────────
  const logAction = useCallback(async (action: UndoableAction) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('action_log')
        .insert({
          user_id: userData.user.id,
          entity_type: action.entityType,
          entity_id: action.entityId,
          action_type: action.actionType,
          before_snapshot: action.before,
          after_snapshot: action.after,
          group_id: action.groupId || crypto.randomUUID(),
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to log action:', error);
        return;
      }

      const entry = data as ActionLogEntry;
      undoStack.push(entry);
      // Clear redo on new action
      redoStack.length = 0;
      notify();

      // Toast with undo button
      toast(action.description, {
        duration: 7000,
        action: {
          label: 'Desfazer',
          onClick: () => performUndo(entry, action.queryKeys),
        },
      });
    } catch (err) {
      console.error('logAction error:', err);
    }
  }, []);

  // ── Perform Undo ──────────────────────────────────────
  const performUndo = useCallback(async (
    entry?: ActionLogEntry,
    queryKeysOverride?: string[][]
  ) => {
    const target = entry || undoStack.pop();
    if (!target) {
      toast.info('Nada para desfazer');
      return;
    }

    // Remove from undo stack if not already removed
    undoStack = undoStack.filter(e => e.id !== target.id);

    const table = TABLE_MAP[target.entity_type];
    if (!table) {
      toast.error('Tipo de entidade não suportado para undo');
      return;
    }

    try {
      let success = false;
      const tbl = table as any;

      if (target.action_type === 'CREATE') {
        const { error } = await supabase.from(tbl).delete().eq('id', target.entity_id);
        success = !error;
      } else if (target.action_type === 'UPDATE' || target.action_type === 'MOVE') {
        if (target.before_snapshot) {
          const { id, created_at, user_id, ...safeFields } = target.before_snapshot;
          const { error } = await supabase.from(tbl).update(safeFields).eq('id', target.entity_id);
          success = !error;
        }
      } else if (target.action_type === 'DELETE') {
        if (target.before_snapshot) {
          const { error } = await supabase.from(tbl).insert(target.before_snapshot);
          success = !error;
        }
      }

      if (success) {
        // Mark as undone in DB
        await supabase
          .from('action_log')
          .update({ undone_at: new Date().toISOString() })
          .eq('id', target.id);

        redoStack.push(target);
        notify();

        // Invalidate queries
        const keys = queryKeysOverride || QUERY_KEY_MAP[target.entity_type] || [];
        keys.forEach(key => qc.invalidateQueries({ queryKey: key }));

        toast('Ação desfeita', {
          duration: 5000,
          action: {
            label: 'Refazer',
            onClick: () => performRedo(target, queryKeysOverride),
          },
        });
      } else {
        toast.error('Não foi possível desfazer. O item pode ter sido alterado.');
      }
    } catch (err) {
      console.error('Undo error:', err);
      toast.error('Erro ao desfazer ação');
    }
  }, [qc]);

  // ── Perform Redo ──────────────────────────────────────
  const performRedo = useCallback(async (
    entry?: ActionLogEntry,
    queryKeysOverride?: string[][]
  ) => {
    const target = entry || redoStack.pop();
    if (!target) {
      toast.info('Nada para refazer');
      return;
    }

    redoStack = redoStack.filter(e => e.id !== target.id);

    const table = TABLE_MAP[target.entity_type];
    if (!table) return;

    try {
      let success = false;
      const tbl = table as any;

      if (target.action_type === 'CREATE') {
        if (target.after_snapshot) {
          const { error } = await supabase.from(tbl).insert(target.after_snapshot);
          success = !error;
        }
      } else if (target.action_type === 'UPDATE' || target.action_type === 'MOVE') {
        if (target.after_snapshot) {
          const { id, created_at, user_id, ...safeFields } = target.after_snapshot;
          const { error } = await supabase.from(tbl).update(safeFields).eq('id', target.entity_id);
          success = !error;
        }
      } else if (target.action_type === 'DELETE') {
        const { error } = await supabase.from(tbl).delete().eq('id', target.entity_id);
        success = !error;
      }

      if (success) {
        // Clear undone marker
        await supabase
          .from('action_log')
          .update({ undone_at: null })
          .eq('id', target.id);

        undoStack.push(target);
        notify();

        const keys = queryKeysOverride || QUERY_KEY_MAP[target.entity_type] || [];
        keys.forEach(key => qc.invalidateQueries({ queryKey: key }));

        toast('Ação refeita', { duration: 3000 });
      } else {
        toast.error('Não foi possível refazer. O item pode ter sido alterado.');
      }
    } catch (err) {
      console.error('Redo error:', err);
      toast.error('Erro ao refazer ação');
    }
  }, [qc]);

  // ── Public API ────────────────────────────────────────
  return {
    logAction,
    undo: () => performUndo(),
    redo: () => performRedo(),
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
