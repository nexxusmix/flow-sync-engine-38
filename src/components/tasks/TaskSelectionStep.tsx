import { useState, useMemo } from 'react';
import { Check, Brain, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '@/hooks/useTasksUnified';

const CATEGORY_LABELS: Record<string, string> = {
  pessoal: 'Pessoal',
  operacao: 'Operação',
  projeto: 'Projeto',
};

interface TaskSelectionStepProps {
  tasks: Task[];
  onConfirm: (selectedIds: Set<string>) => void;
}

export function TaskSelectionStep({ tasks, onConfirm }: TaskSelectionStepProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(tasks.map(t => t.id)));

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const cat = t.category || 'pessoal';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    return map;
  }, [tasks]);

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

  const allIds = tasks.map(t => t.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  const noneSelected = !allIds.some(id => selectedIds.has(id));

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-mono">
          Selecionar tarefas · {selectedIds.size}/{tasks.length}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => toggleAll(allIds, true)}
            className={cn("text-[10px] font-mono px-2 py-1 rounded transition-colors", allSelected ? "text-slate-600" : "text-[hsl(var(--primary))] hover:bg-[rgba(0,115,153,0.08)]")}
          >
            Selecionar Todos
          </button>
          <button
            onClick={() => toggleAll(allIds, false)}
            className={cn("text-[10px] font-mono px-2 py-1 rounded transition-colors", noneSelected ? "text-slate-600" : "text-slate-400 hover:bg-white/[0.04]")}
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Task list grouped by category */}
      <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
        {Array.from(grouped.entries()).map(([cat, catTasks]) => {
          const catIds = catTasks.map(t => t.id);
          const catAllSelected = catIds.every(id => selectedIds.has(id));
          const catSomeSelected = catIds.some(id => selectedIds.has(id));

          return (
            <div key={cat}>
              <button
                onClick={() => toggleAll(catIds, !catAllSelected)}
                className="flex items-center gap-2 mb-1.5 group cursor-pointer"
              >
                <div className={cn(
                  "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all",
                  catAllSelected ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]" :
                  catSomeSelected ? "border-[hsl(var(--primary))]/50 bg-[hsl(var(--primary))]/20" :
                  "border-slate-600 group-hover:border-slate-400"
                )}>
                  {catAllSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  {!catAllSelected && catSomeSelected && <Minus className="w-2.5 h-2.5 text-[hsl(var(--primary))]" />}
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-mono">
                  {CATEGORY_LABELS[cat] || cat}
                </span>
              </button>

              <div className="space-y-0.5 pl-1">
                {catTasks.map(task => {
                  const checked = selectedIds.has(task.id);
                  return (
                    <button
                      key={task.id}
                      onClick={() => toggle(task.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all",
                        checked ? "bg-[rgba(0,115,153,0.06)]" : "opacity-50 hover:opacity-70"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all",
                        checked ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]" : "border-slate-600"
                      )}>
                        {checked && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="flex-1 text-[12px] text-white/80 font-medium truncate">{task.title}</span>
                      {task.tags?.length > 0 && (
                        <span className="text-[9px] text-slate-500 font-mono truncate max-w-[120px]">
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

      {/* Confirm button */}
      <Button
        onClick={() => onConfirm(selectedIds)}
        disabled={selectedIds.size === 0}
        className="w-full gap-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white"
      >
        <Brain className="w-4 h-4" />
        Gerar Plano ({selectedIds.size} {selectedIds.size === 1 ? 'tarefa' : 'tarefas'})
      </Button>
    </div>
  );
}
