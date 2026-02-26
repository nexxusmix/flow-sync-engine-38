import { useState, useMemo } from 'react';
import { Check, Brain, Minus, Search, ArrowUpDown, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { isPast, parseISO, isToday, format } from 'date-fns';
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

interface TaskSelectionStepProps {
  tasks: Task[];
  onConfirm: (selectedIds: Set<string>) => void;
}

export function TaskSelectionStep({ tasks, onConfirm }: TaskSelectionStepProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(tasks.map(t => t.id)));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    if (statusFilter === 'today') {
      result = result.filter(t => t.status === 'today');
    } else if (statusFilter === 'week') {
      result = result.filter(t => t.status === 'week');
    } else if (statusFilter === 'urgent') {
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

                      {/* Priority dot */}
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", priorityColor)} />

                      <span className="flex-1 text-[12px] text-foreground/80 font-medium truncate">{task.title}</span>

                      {/* Due date */}
                      {task.due_date && (
                        <span className={cn(
                          "text-[9px] font-mono flex items-center gap-0.5 shrink-0",
                          overdue ? "text-red-400" : "text-muted-foreground"
                        )}>
                          {overdue && <AlertTriangle className="w-2.5 h-2.5" />}
                          {format(parseISO(task.due_date), 'dd/MM')}
                        </span>
                      )}

                      {/* Tags */}
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

      {/* Confirm */}
      <Button
        onClick={() => onConfirm(selectedIds)}
        disabled={selectedIds.size === 0}
        className="w-full gap-2"
      >
        <Brain className="w-4 h-4" />
        Gerar Plano ({selectedIds.size} {selectedIds.size === 1 ? 'tarefa' : 'tarefas'})
      </Button>
    </div>
  );
}
