import { useState, useMemo } from 'react';
import { useTaskDependencies } from '@/hooks/useTaskDependencies';
import { Task } from '@/hooks/useTasksUnified';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2, X, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskDependenciesPanelProps {
  taskId: string;
  allTasks: Task[];
}

export function TaskDependenciesPanel({ taskId, allTasks }: TaskDependenciesPanelProps) {
  const { dependencies, addDependency, removeDependency } = useTaskDependencies(taskId);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const dependsOnIds = useMemo(() => new Set(dependencies.map(d => d.depends_on_task_id)), [dependencies]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allTasks
      .filter(t => t.id !== taskId && !dependsOnIds.has(t.id))
      .filter(t => t.title.toLowerCase().includes(q))
      .slice(0, 5);
  }, [search, allTasks, taskId, dependsOnIds]);

  const depTasks = useMemo(() => {
    return dependencies.map(d => ({
      ...d,
      task: allTasks.find(t => t.id === d.depends_on_task_id),
    }));
  }, [dependencies, allTasks]);

  const hasUnresolved = depTasks.some(d => d.task && d.task.status !== 'done');

  return (
    <div>
      <Label className="text-xs flex items-center gap-1 mb-2">
        <Link2 className="w-3 h-3" /> Depende de
        {hasUnresolved && (
          <span className="text-[9px] text-destructive flex items-center gap-0.5 ml-1">
            <AlertTriangle className="w-2.5 h-2.5" /> bloqueada
          </span>
        )}
      </Label>

      {depTasks.length > 0 && (
        <div className="space-y-1 mb-2">
          {depTasks.map(d => (
            <div key={d.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/30 text-xs">
              {d.task?.status === 'done' ? (
                <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0" />
              )}
              <span className={cn("flex-1 truncate", d.task?.status === 'done' && "line-through text-muted-foreground")}>
                {d.task?.title || 'Tarefa removida'}
              </span>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => removeDependency.mutate(d.id)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {showSearch ? (
        <div className="space-y-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tarefa..."
              className="h-7 text-xs pl-7"
              autoFocus
            />
          </div>
          {searchResults.map(t => (
            <button
              key={t.id}
              onClick={() => {
                addDependency.mutate({ taskId, dependsOnId: t.id });
                setSearch('');
                setShowSearch(false);
              }}
              className="w-full text-left p-1.5 rounded-lg text-xs hover:bg-muted/50 transition-colors truncate"
            >
              {t.title}
            </button>
          ))}
          <Button variant="ghost" size="sm" className="h-6 text-[10px] w-full" onClick={() => { setShowSearch(false); setSearch(''); }}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 w-full" onClick={() => setShowSearch(true)}>
          <Link2 className="w-3 h-3" /> Adicionar dependência
        </Button>
      )}
    </div>
  );
}
