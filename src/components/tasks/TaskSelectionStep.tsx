import { useState, useMemo } from 'react';
import { Check, Brain, Minus, Search, ArrowUpDown, AlertTriangle, GripVertical, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { isPast, parseISO, isToday, format } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/hooks/useTasksUnified';

const CATEGORY_LABELS: Record<string, string> = {
  pessoal: 'Pessoal',
  operacao: 'Operação',
  projeto: 'Projeto',
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  normal: 'bg-blue-400',
  low: 'bg-slate-500',
};

type StatusFilter = 'all' | 'today' | 'week' | 'urgent';
type Step = 'select' | 'reorder';

const ESTIMATED_MINUTES: Record<string, number> = {
  urgent: 45,
  high: 35,
  normal: 25,
  low: 15,
};

function estimateTotal(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + (ESTIMATED_MINUTES[t.priority] || 25), 0);
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `~${m}min`;
  return m > 0 ? `~${h}h ${m}min` : `~${h}h`;
}

interface TaskSelectionStepProps {
  tasks: Task[];
  onConfirm: (orderedIds: string[]) => void;
}

/* ── Sortable item ─────────────────────────────────────── */
function SortableTask({ task, index }: { task: Task; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const priorityColor = PRIORITY_DOT[task.priority] || PRIORITY_DOT.normal;
  const overdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && task.status !== 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-card/50 border border-border/30 transition-shadow",
        isDragging && "shadow-lg shadow-primary/10 z-50 opacity-90"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground">
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground/50 w-4 text-right shrink-0">{index + 1}</span>
      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", priorityColor)} />
      <span className="flex-1 text-[12px] text-foreground/80 font-medium truncate">{task.title}</span>
      <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">{CATEGORY_LABELS[task.category] || task.category}</span>
      {task.due_date && (
        <span className={cn("text-[9px] font-mono flex items-center gap-0.5 shrink-0", overdue ? "text-red-400" : "text-muted-foreground")}>
          {overdue && <AlertTriangle className="w-2.5 h-2.5" />}
          {format(parseISO(task.due_date), 'dd/MM')}
        </span>
      )}
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */
export function TaskSelectionStep({ tasks, onConfirm }: TaskSelectionStepProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(tasks.map(t => t.id)));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [step, setStep] = useState<Step>('select');
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (statusFilter === 'today') result = result.filter(t => t.status === 'today');
    else if (statusFilter === 'week') result = result.filter(t => t.status === 'week');
    else if (statusFilter === 'urgent') {
      result = result.filter(t =>
        t.priority === 'urgent' || t.priority === 'high' ||
        (t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)))
      );
    }
    return result;
  }, [tasks, searchQuery, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filteredTasks) {
      const cat = t.category || 'pessoal';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    return map;
  }, [filteredTasks]);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = (ids: string[], select: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => select ? next.add(id) : next.delete(id));
      return next;
    });
  };

  const invertSelection = () => {
    setSelectedIds(prev => {
      const next = new Set<string>();
      tasks.forEach(t => { if (!prev.has(t.id)) next.add(t.id); });
      return next;
    });
  };

  const goToReorder = () => {
    const selected = tasks.filter(t => selectedIds.has(t.id));
    setOrderedTasks(selected);
    setStep('reorder');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedTasks(prev => {
        const oldIndex = prev.findIndex(t => t.id === active.id);
        const newIndex = prev.findIndex(t => t.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const allFilteredIds = filteredTasks.map(t => t.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id));
  const noneSelected = !allFilteredIds.some(id => selectedIds.has(id));

  const isOverdue = (task: Task) =>
    task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && task.status !== 'done';

  const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'today', label: 'Hoje' },
    { key: 'week', label: 'Semana' },
    { key: 'urgent', label: 'Urgentes' },
  ];

  /* ── Reorder step ──────────────────────────────────────── */
  if (step === 'reorder') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setStep('select')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-mono">
            Ordenar execução · {orderedTasks.length} tarefas
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Arraste para definir a ordem de execução. A primeira tarefa será executada primeiro.
        </p>

        <div className="space-y-1 max-h-[45vh] overflow-y-auto pr-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {orderedTasks.map((task, idx) => (
                <SortableTask key={task.id} task={task} index={idx} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <Button
          onClick={() => onConfirm(orderedTasks.map(t => t.id))}
          className="w-full gap-2"
        >
          <Brain className="w-4 h-4" />
          Gerar Plano ({orderedTasks.length} {orderedTasks.length === 1 ? 'tarefa' : 'tarefas'}) · {formatTime(estimateTotal(orderedTasks))}
        </Button>
      </div>
    );
  }

  /* ── Select step ───────────────────────────────────────── */
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar tarefas..."
          className="pl-8 h-8 text-xs bg-background/50 border-border/50"
        />
      </div>

      {/* Status filters */}
      <div className="flex gap-1.5">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              "text-[10px] font-mono px-2.5 py-1 rounded-md transition-all",
              statusFilter === f.key
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Header controls */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-mono">
          {selectedIds.size}/{tasks.length} selecionadas
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => toggleAll(allFilteredIds, true)}
            className={cn("text-[10px] font-mono px-2 py-1 rounded transition-colors", allSelected ? "text-muted-foreground" : "text-primary hover:bg-primary/10")}
          >
            Todos
          </button>
          <button
            onClick={invertSelection}
            className="text-[10px] font-mono px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Inverter seleção"
          >
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => toggleAll(allFilteredIds, false)}
            className={cn("text-[10px] font-mono px-2 py-1 rounded transition-colors", noneSelected ? "text-muted-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
        {filteredTasks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6 font-mono">Nenhuma tarefa encontrada</p>
        )}
        {Array.from(grouped.entries()).map(([cat, catTasks]) => {
          const catIds = catTasks.map(t => t.id);
          const catSelectedCount = catIds.filter(id => selectedIds.has(id)).length;
          const catAllSelected = catSelectedCount === catIds.length;
          const catSomeSelected = catSelectedCount > 0;

          return (
            <div key={cat}>
              <button
                onClick={() => toggleAll(catIds, !catAllSelected)}
                className="flex items-center gap-2 mb-1.5 group cursor-pointer w-full"
              >
                <div className={cn(
                  "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all",
                  catAllSelected ? "bg-primary border-primary" :
                  catSomeSelected ? "border-primary/50 bg-primary/20" :
                  "border-muted-foreground/40 group-hover:border-muted-foreground"
                )}>
                  {catAllSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                  {!catAllSelected && catSomeSelected && <Minus className="w-2.5 h-2.5 text-primary" />}
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
                  {CATEGORY_LABELS[cat] || cat}
                </span>
                <span className="text-[9px] text-muted-foreground/60 font-mono ml-auto">
                  {catSelectedCount}/{catIds.length}
                </span>
              </button>

              <div className="space-y-0.5 pl-1">
                {catTasks.map(task => {
                  const checked = selectedIds.has(task.id);
                  const overdue = isOverdue(task);
                  const priorityColor = PRIORITY_DOT[task.priority] || PRIORITY_DOT.normal;

                  return (
                    <button
                      key={task.id}
                      onClick={() => toggle(task.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150",
                        checked ? "bg-primary/[0.06]" : "opacity-40 hover:opacity-60"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all duration-150",
                        checked ? "bg-primary border-primary" : "border-muted-foreground/40"
                      )}>
                        {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", priorityColor)} />
                      <span className="flex-1 text-[12px] text-foreground/80 font-medium truncate">{task.title}</span>
                      {task.due_date && (
                        <span className={cn(
                          "text-[9px] font-mono flex items-center gap-0.5 shrink-0",
                          overdue ? "text-red-400" : "text-muted-foreground"
                        )}>
                          {overdue && <AlertTriangle className="w-2.5 h-2.5" />}
                          {format(parseISO(task.due_date), 'dd/MM')}
                        </span>
                      )}
                      {!task.due_date && task.tags?.length > 0 && (
                        <span className="text-[9px] text-muted-foreground/60 font-mono truncate max-w-[100px]">
                          {task.tags.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Next: reorder step */}
      <Button
        onClick={goToReorder}
        disabled={selectedIds.size === 0}
        className="w-full gap-2"
      >
        <Brain className="w-4 h-4" />
        Ordenar e Gerar ({selectedIds.size} {selectedIds.size === 1 ? 'tarefa' : 'tarefas'}) · {formatTime(estimateTotal(tasks.filter(t => selectedIds.has(t.id))))}
      </Button>
    </div>
  );
}
