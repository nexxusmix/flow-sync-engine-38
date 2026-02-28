import { useState } from "react";
import { GeneratedTask } from "@/types/tasks";
import { Task, TASK_COLUMNS, TASK_CATEGORIES } from "@/hooks/useTasksUnified";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Check, X, RefreshCw, ArrowLeft, Loader2, Sparkles, Pencil,
} from "lucide-react";

interface PreviewTask extends GeneratedTask {
  selected: boolean;
}

interface TaskAIPreviewPanelProps {
  tasks: GeneratedTask[];
  isRegenerating: boolean;
  onConfirm: (tasks: GeneratedTask[]) => void;
  onRegenerate: () => void;
  onBack: () => void;
}

export function TaskAIPreviewPanel({
  tasks: initialTasks,
  isRegenerating,
  onConfirm,
  onRegenerate,
  onBack,
}: TaskAIPreviewPanelProps) {
  const [previewTasks, setPreviewTasks] = useState<PreviewTask[]>(
    initialTasks.map(t => ({ ...t, selected: true }))
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const selectedCount = previewTasks.filter(t => t.selected).length;

  const toggleSelect = (index: number) => {
    setPreviewTasks(prev => prev.map((t, i) => i === index ? { ...t, selected: !t.selected } : t));
  };

  const toggleAll = () => {
    const allSelected = previewTasks.every(t => t.selected);
    setPreviewTasks(prev => prev.map(t => ({ ...t, selected: !allSelected })));
  };

  const removeTask = (index: number) => {
    setPreviewTasks(prev => prev.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, updates: Partial<GeneratedTask>) => {
    setPreviewTasks(prev => prev.map((t, i) => i === index ? { ...t, ...updates } : t));
  };

  const handleConfirm = () => {
    const selected = previewTasks.filter(t => t.selected).map(({ selected, ...rest }) => rest);
    if (selected.length === 0) return;
    onConfirm(selected);
  };

  const getCategoryLabel = (key: string) => TASK_CATEGORIES.find(c => c.key === key)?.label || key;
  const getColumnLabel = (key: string) => TASK_COLUMNS.find(c => c.key === key)?.title || key;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {previewTasks.length} tarefas geradas
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs h-7">
          {previewTasks.every(t => t.selected) ? 'Desmarcar todas' : 'Selecionar todas'}
        </Button>
      </div>

      {/* Task cards */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {previewTasks.map((task, index) => (
          <div
            key={index}
            className={`rounded-lg border p-3 transition-colors ${
              task.selected ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30 opacity-60'
            }`}
          >
            <div className="flex items-start gap-2">
              <Checkbox
                checked={task.selected}
                onCheckedChange={() => toggleSelect(index)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0 space-y-2">
                {editingIndex === index ? (
                  /* Editing mode */
                  <div className="space-y-2">
                    <Input
                      value={task.title}
                      onChange={(e) => updateTask(index, { title: e.target.value })}
                      className="text-sm h-8"
                      autoFocus
                    />
                    <Textarea
                      value={task.description || ''}
                      onChange={(e) => updateTask(index, { description: e.target.value })}
                      placeholder="Descrição..."
                      rows={2}
                      className="text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={task.category} onValueChange={(v) => updateTask(index, { category: v as Task['category'] })}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TASK_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={task.status} onValueChange={(v) => updateTask(index, { status: v as Task['status'] })}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TASK_COLUMNS.map(c => <SelectItem key={c.key} value={c.key}>{c.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      value={task.tags?.join(', ') || ''}
                      onChange={(e) => updateTask(index, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                      placeholder="Tags (vírgula)"
                      className="text-xs h-7"
                    />
                    <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => setEditingIndex(null)}>
                      Fechar edição
                    </Button>
                  </div>
                ) : (
                  /* View mode */
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px] h-5">{getCategoryLabel(task.category)}</Badge>
                      <Badge variant="outline" className="text-[10px] h-5">{getColumnLabel(task.status)}</Badge>
                      {task.due_date && <Badge variant="outline" className="text-[10px] h-5">📅 {task.due_date}</Badge>}
                      {task.tags?.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] h-5 text-muted-foreground">{tag}</Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-0.5 shrink-0">
                {editingIndex !== index && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingIndex(index)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeTask(index)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </Button>
        <Button variant="outline" size="sm" onClick={onRegenerate} disabled={isRegenerating} className="gap-1.5">
          {isRegenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Regenerar
        </Button>
        <div className="flex-1" />
        <Button size="sm" onClick={handleConfirm} disabled={selectedCount === 0} className="gap-1.5">
          <Check className="w-3.5 h-3.5" />
          Confirmar {selectedCount > 0 ? `(${selectedCount})` : ''}
        </Button>
      </div>
    </div>
  );
}
