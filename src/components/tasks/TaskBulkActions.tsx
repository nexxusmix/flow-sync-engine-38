import { useState } from "react";
import { Task, TASK_COLUMNS, TASK_CATEGORIES } from "@/hooks/useTasksUnified";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Trash2, ArrowRight, FolderOpen, Calendar, Sparkles, Type,
  Loader2, X, Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TaskBulkActionsProps {
  selectedIds: Set<string>;
  tasks: Task[];
  onClearSelection: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

export function TaskBulkActions({
  selectedIds,
  tasks,
  onClearSelection,
  onUpdate,
  onDelete,
}: TaskBulkActionsProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<any[] | null>(null);
  const count = selectedIds.size;

  if (count === 0) return null;

  const selectedTasks = tasks.filter((t) => selectedIds.has(t.id));

  const bulkMove = (status: Task["status"]) => {
    selectedTasks.forEach((t) => {
      const updates: any = { status };
      if (status === "done" && t.status !== "done") updates.completed_at = new Date().toISOString();
      else if (status !== "done" && t.status === "done") updates.completed_at = null;
      onUpdate(t.id, updates);
    });
    toast.success(`${count} tarefas movidas`);
    onClearSelection();
  };

  const bulkCategory = (cat: Task["category"]) => {
    selectedTasks.forEach((t) => onUpdate(t.id, { category: cat }));
    toast.success(`Categoria alterada em ${count} tarefas`);
    onClearSelection();
  };

  const bulkPriority = (priority: string) => {
    selectedTasks.forEach((t) => onUpdate(t.id, { priority } as any));
    toast.success(`Prioridade alterada em ${count} tarefas`);
    onClearSelection();
  };

  const bulkDueDate = (date: string) => {
    selectedTasks.forEach((t) => onUpdate(t.id, { due_date: date || null }));
    toast.success(`Prazo definido em ${count} tarefas`);
    onClearSelection();
  };

  const bulkDelete = () => {
    selectedTasks.forEach((t) => onDelete(t.id));
    toast.success(`${count} tarefas excluídas`);
    onClearSelection();
  };

  const bulkAiRefine = async (action: 'grammar' | 'refine') => {
    setAiLoading(true);
    try {
      let updated = 0;
      for (const task of selectedTasks) {
        const text = task.description || task.title;
        const { data, error } = await supabase.functions.invoke('refine-task-ai', {
          body: { action, text },
        });
        if (!error && data?.result && !data.raw) {
          onUpdate(task.id, { description: data.result, ai_refined: true } as any);
          updated++;
        }
      }
      toast.success(`${updated} tarefas refinadas`);
    } catch (err: any) {
      toast.error(err.message || 'Erro');
    } finally {
      setAiLoading(false);
      onClearSelection();
    }
  };

  const bulkOptimizeAll = async () => {
    setAiLoading(true);
    try {
      const taskPayload = selectedTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
      }));
      const { data, error } = await supabase.functions.invoke('refine-task-ai', {
        body: { action: 'optimize_all', tasks: taskPayload },
      });
      if (error) throw error;
      if (data?.result && Array.isArray(data.result)) {
        setAiPreview(data.result);
      } else {
        toast.error('Resposta inesperada da IA');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro');
    } finally {
      setAiLoading(false);
    }
  };

  const applyOptimization = () => {
    if (!aiPreview) return;
    aiPreview.forEach((item) => {
      const updates: any = {
        title: item.title,
        description: item.description,
        priority: item.priority || 'normal',
        category: item.category || 'operacao',
        ai_refined: true,
      };
      onUpdate(item.id, updates);
    });
    toast.success(`${aiPreview.length} tarefas otimizadas`);
    setAiPreview(null);
    onClearSelection();
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-xl rounded-xl px-4 py-3 flex items-center gap-2 flex-wrap max-w-[95vw]"
        >
          <span className="text-xs font-medium text-foreground whitespace-nowrap">
            {count} selecionada{count > 1 ? 's' : ''}
          </span>

          {/* Move */}
          <Select onValueChange={(v) => bulkMove(v as Task['status'])}>
            <SelectTrigger className="h-7 w-[100px] text-[10px]"><ArrowRight className="w-3 h-3 mr-1" />Mover</SelectTrigger>
            <SelectContent>{TASK_COLUMNS.map(c => <SelectItem key={c.key} value={c.key}>{c.title}</SelectItem>)}</SelectContent>
          </Select>

          {/* Category */}
          <Select onValueChange={(v) => bulkCategory(v as Task['category'])}>
            <SelectTrigger className="h-7 w-[110px] text-[10px]"><FolderOpen className="w-3 h-3 mr-1" />Categoria</SelectTrigger>
            <SelectContent>{TASK_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
          </Select>

          {/* Priority */}
          <Select onValueChange={bulkPriority}>
            <SelectTrigger className="h-7 w-[100px] text-[10px]">Prioridade</SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>

          {/* AI */}
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" disabled={aiLoading} onClick={() => bulkAiRefine('grammar')}>
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Type className="w-3 h-3" />}
            Gramática
          </Button>

          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" disabled={aiLoading} onClick={bulkOptimizeAll}>
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Otimizar Todas
          </Button>

          {/* Delete */}
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 text-destructive" onClick={bulkDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>

          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClearSelection}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </motion.div>
      </AnimatePresence>

      {/* AI Preview Dialog */}
      <Dialog open={!!aiPreview} onOpenChange={() => setAiPreview(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Preview da Otimização
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {aiPreview?.map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                <div className="flex gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{item.priority}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted">{item.category}</span>
                  {item.flagged && <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">⚠ Revisar</span>}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiPreview(null)}>Cancelar</Button>
            <Button onClick={applyOptimization}>
              <Check className="w-4 h-4 mr-1" /> Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
