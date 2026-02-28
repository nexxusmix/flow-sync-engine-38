import { useState, useId, useEffect } from "react";
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
  Check, X, RefreshCw, ArrowLeft, Loader2, Sparkles, Pencil, GripVertical, PackageOpen,
} from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PreviewTask extends GeneratedTask {
  selected: boolean;
  _id: string;
}

interface TaskAIPreviewPanelProps {
  tasks: GeneratedTask[];
  isRegenerating: boolean;
  isConfirming?: boolean;
  onConfirm: (tasks: GeneratedTask[]) => void;
  onRegenerate: () => void;
  onBack: () => void;
}

function SortableTaskCard({
  task,
  index,
  isEditing,
  onToggleSelect,
  onEdit,
  onCloseEdit,
  onUpdate,
  onRemove,
  getCategoryLabel,
  getColumnLabel,
}: {
  task: PreviewTask;
  index: number;
  isEditing: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onCloseEdit: () => void;
  onUpdate: (updates: Partial<GeneratedTask>) => void;
  onRemove: () => void;
  getCategoryLabel: (key: string) => string;
  getColumnLabel: (key: string) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border p-3 transition-colors ${
        task.selected ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30 opacity-60'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          tabIndex={-1}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <Checkbox
          checked={task.selected}
          onCheckedChange={onToggleSelect}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0 space-y-2">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={task.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="text-sm h-8"
                autoFocus
              />
              <Textarea
                value={task.description || ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Descrição..."
                rows={2}
                className="text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <Select value={task.category} onValueChange={(v) => onUpdate({ category: v as Task['category'] })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={task.status} onValueChange={(v) => onUpdate({ status: v as Task['status'] })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_COLUMNS.map(c => <SelectItem key={c.key} value={c.key}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={task.tags?.join(', ') || ''}
                onChange={(e) => onUpdate({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                placeholder="Tags (vírgula)"
                className="text-xs h-7"
              />
              <Button variant="outline" size="sm" className="h-6 text-xs" onClick={onCloseEdit}>
                Fechar edição
              </Button>
            </div>
          ) : (
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
          {!isEditing && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
              <Pencil className="w-3 h-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onRemove}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TaskAIPreviewPanel({
  tasks: initialTasks,
  isRegenerating,
  isConfirming = false,
  onConfirm,
  onRegenerate,
  onBack,
}: TaskAIPreviewPanelProps) {
  const prefix = useId();
  const [previewTasks, setPreviewTasks] = useState<PreviewTask[]>(
    initialTasks.map((t, i) => ({ ...t, selected: true, _id: `${prefix}-${i}` }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sync when parent regenerates tasks
  useEffect(() => {
    setPreviewTasks(initialTasks.map((t, i) => ({ ...t, selected: true, _id: `${prefix}-${i}` })));
    setEditingId(null);
  }, [initialTasks, prefix]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const selectedCount = previewTasks.filter(t => t.selected).length;

  const toggleSelect = (id: string) => {
    setPreviewTasks(prev => prev.map(t => t._id === id ? { ...t, selected: !t.selected } : t));
  };

  const toggleAll = () => {
    const allSelected = previewTasks.every(t => t.selected);
    setPreviewTasks(prev => prev.map(t => ({ ...t, selected: !allSelected })));
  };

  const removeTask = (id: string) => {
    setPreviewTasks(prev => prev.filter(t => t._id !== id));
    if (editingId === id) setEditingId(null);
  };

  const updateTask = (id: string, updates: Partial<GeneratedTask>) => {
    setPreviewTasks(prev => prev.map(t => t._id === id ? { ...t, ...updates } : t));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPreviewTasks(prev => {
      const oldIndex = prev.findIndex(t => t._id === active.id);
      const newIndex = prev.findIndex(t => t._id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleConfirm = () => {
    const selected = previewTasks
      .filter(t => t.selected)
      .map(({ selected, _id, ...rest }, index) => ({ ...rest, position: index }));
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

      {/* Sortable task cards */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={previewTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {previewTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <PackageOpen className="w-8 h-8" />
                <p className="text-sm">Nenhuma tarefa na lista.</p>
                <Button variant="outline" size="sm" onClick={onRegenerate} disabled={isRegenerating} className="gap-1.5 mt-1">
                  {isRegenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Gerar novamente
                </Button>
              </div>
            ) : previewTasks.map((task, index) => (
              <SortableTaskCard
                key={task._id}
                task={task}
                index={index}
                isEditing={editingId === task._id}
                onToggleSelect={() => toggleSelect(task._id)}
                onEdit={() => setEditingId(task._id)}
                onCloseEdit={() => setEditingId(null)}
                onUpdate={(updates) => updateTask(task._id, updates)}
                onRemove={() => removeTask(task._id)}
                getCategoryLabel={getCategoryLabel}
                getColumnLabel={getColumnLabel}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
        <Button size="sm" onClick={handleConfirm} disabled={selectedCount === 0 || isConfirming} className="gap-1.5">
          {isConfirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {isConfirming ? 'Salvando...' : `Confirmar ${selectedCount > 0 ? `(${selectedCount})` : ''}`}
        </Button>
      </div>
    </div>
  );
}
