import { useState, useMemo, useCallback, useRef } from "react";
import { Task, TASK_COLUMNS, TASK_CATEGORIES } from "@/hooks/useTasksUnified";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CheckSquare, Square, MoreHorizontal, Trash2, Edit,
  Calendar, Search, Sparkles, X, Loader2, GripVertical
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TasksBoardViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onToggleComplete?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onMoveTask?: (taskId: string, newStatus: Task['status']) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

const STATUS_BADGES: Record<Task['status'], { label: string; className: string }> = {
  backlog: { label: 'Backlog', className: 'border-violet-500/25 text-violet-400' },
  week: { label: 'Semana', className: 'border-blue-500/25 text-blue-400' },
  today: { label: 'Hoje', className: 'border-amber-500/25 text-amber-400' },
  done: { label: 'Concluído', className: 'border-emerald-500/25 text-emerald-400' },
};

const CATEGORY_BADGES: Record<Task['category'], { label: string; className: string }> = {
  operacao: { label: 'Operação', className: 'border-blue-500/20 text-blue-400' },
  pessoal: { label: 'Pessoal', className: 'border-purple-500/20 text-purple-400' },
  projeto: { label: 'Projeto', className: 'border-orange-500/20 text-orange-400' },
};

type StatusFilter = Task['status'] | 'all';
type CategoryFilter = Task['category'] | 'all';

export function TasksBoardView({ tasks, onEditTask, onToggleComplete, onDeleteTask, onMoveTask }: TasksBoardViewProps) {
  const isMobile = useIsMobile();
  const toggleComplete = onToggleComplete || (() => {});
  const deleteTask = onDeleteTask || (() => {});
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<Task['status'] | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [globalSearch, setGlobalSearch] = useState("");
  const [aiFilteredIds, setAiFilteredIds] = useState<Set<string> | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [sortBy, setSortBy] = useState<"created" | "due_date" | "title">("created");

  // AI search
  const handleAiSearch = useCallback(async () => {
    if (!globalSearch.trim()) return;
    setIsAiSearching(true);
    setAiFilteredIds(null);
    try {
      const tasksSummary = tasks.map(t => ({
        id: t.id, title: t.title, description: t.description,
        status: t.status, category: t.category, tags: t.tags, due_date: t.due_date,
      }));
      const { data, error } = await supabase.functions.invoke('ai-task-search', {
        body: { query: globalSearch, tasks: tasksSummary }
      });
      if (error) throw error;
      if (data?.matchedIds?.length > 0) {
        setAiFilteredIds(new Set(data.matchedIds));
        toast.success(`IA encontrou ${data.matchedIds.length} tarefa(s)`);
      } else {
        setAiFilteredIds(new Set());
        toast.info('IA não encontrou tarefas correspondentes');
      }
    } catch {
      toast.error('Erro na busca com IA');
    } finally {
      setIsAiSearching(false);
    }
  }, [globalSearch, tasks]);

  const clearSearch = useCallback(() => {
    setGlobalSearch("");
    setAiFilteredIds(null);
  }, []);

  // Filtered + sorted tasks
  const filteredTasks = useMemo(() => {
    let list = tasks;

    // Status filter
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter);
    // Category filter
    if (categoryFilter !== 'all') list = list.filter(t => t.category === categoryFilter);

    // Text search
    if (globalSearch.trim() && !aiFilteredIds) {
      const q = globalSearch.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }
    // AI filter
    if (aiFilteredIds) list = list.filter(t => aiFilteredIds.has(t.id));

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === "due_date") {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [tasks, statusFilter, categoryFilter, globalSearch, aiFilteredIds, sortBy]);

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'backlog', label: 'Backlog' },
    { key: 'week', label: 'Semana' },
    { key: 'today', label: 'Hoje' },
    { key: 'done', label: 'Concluído' },
  ];

  const categoryFilters: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'operacao', label: 'Operação' },
    { key: 'pessoal', label: 'Pessoal' },
    { key: 'projeto', label: 'Projeto' },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={globalSearch}
            onChange={(e) => { setGlobalSearch(e.target.value); if (aiFilteredIds) setAiFilteredIds(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && globalSearch.trim()) handleAiSearch(); }}
            placeholder="Buscar tarefas ou perguntar à IA…"
            className="pl-9 pr-9 h-10 text-sm bg-white/[0.02] border-white/[0.08] rounded-xl focus:border-primary/30"
          />
          {globalSearch && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline" size="sm"
          onClick={handleAiSearch}
          disabled={!globalSearch.trim() || isAiSearching}
          className={cn(
            "h-10 gap-2 rounded-xl border-white/[0.08] bg-white/[0.02] text-xs uppercase tracking-wider font-light",
            "hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all",
            aiFilteredIds && "border-primary/30 bg-primary/10 text-primary"
          )}
        >
          {isAiSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isAiSearching ? "Buscando…" : "IA"}
        </Button>
      </div>

      {/* AI filter indicator */}
      {aiFilteredIds && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/15">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-primary font-light">
            Filtro IA ativo · {aiFilteredIds.size} resultado{aiFilteredIds.size !== 1 ? 's' : ''} para "{globalSearch}"
          </span>
          <button onClick={clearSearch} className="ml-auto text-primary/60 hover:text-primary transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Chips */}
      <div className="space-y-2">
        {/* Status */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-light flex-shrink-0">Status</span>
          {statusFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              onDragOver={(e) => {
                if (f.key === 'all' || !draggingTaskId) return;
                e.preventDefault();
                setDropTargetStatus(f.key as Task['status']);
              }}
              onDragLeave={() => setDropTargetStatus(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDropTargetStatus(null);
                if (f.key === 'all' || !draggingTaskId) return;
                const taskId = e.dataTransfer.getData('taskId');
                if (taskId && onMoveTask) {
                  onMoveTask(taskId, f.key as Task['status']);
                  toast.success(`Tarefa movida para ${f.label}`);
                }
              }}
              className={cn(
                "flex-shrink-0 px-3 py-1 rounded-lg text-[11px] font-light tracking-wide transition-all border",
                statusFilter === f.key
                  ? "bg-white/[0.08] border-white/[0.15] text-foreground"
                  : "bg-white/[0.02] border-white/[0.06] text-muted-foreground hover:bg-white/[0.05] hover:border-white/[0.1]",
                dropTargetStatus === f.key && "ring-2 ring-primary/50 bg-primary/10 border-primary/30 scale-105"
              )}
            >
              {f.label}
              {f.key !== 'all' && (
                <span className="ml-1.5 text-[9px] opacity-60">
                  {tasks.filter(t => t.status === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Category */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-light flex-shrink-0">Tipo</span>
          {categoryFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setCategoryFilter(f.key)}
              className={cn(
                "flex-shrink-0 px-3 py-1 rounded-lg text-[11px] font-light tracking-wide transition-all border",
                categoryFilter === f.key
                  ? "bg-white/[0.08] border-white/[0.15] text-foreground"
                  : "bg-white/[0.02] border-white/[0.06] text-muted-foreground hover:bg-white/[0.05] hover:border-white/[0.1]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground font-light tracking-wide">
          {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''} encontrada{filteredTasks.length !== 1 ? 's' : ''}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-[11px] text-muted-foreground font-light tracking-wide hover:text-foreground transition-colors">
              Ordenar: {sortBy === 'created' ? 'Recentes' : sortBy === 'due_date' ? 'Prazo' : 'A-Z'}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy('created')}>Mais recentes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('due_date')}>Por prazo</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('title')}>Alfabética</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Unified Task List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-sm text-muted-foreground font-light">Nenhuma tarefa encontrada</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Ajuste os filtros ou crie uma nova tarefa</p>
            </motion.div>
          ) : (
            filteredTasks.map((task, index) => {
              const isDone = task.status === 'done';
              const statusBadge = STATUS_BADGES[task.status];
              const categoryBadge = CATEGORY_BADGES[task.category];
              const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isDone;

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.02, duration: 0.25 }}
                  draggable
                  onDragStart={(e: any) => {
                    setDraggingTaskId(task.id);
                    e.dataTransfer.setData('taskId', task.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => {
                    setDraggingTaskId(null);
                    setDropTargetStatus(null);
                  }}
                  onClick={() => onEditTask(task)}
                  className={cn(
                    "group relative rounded-2xl p-3.5 cursor-grab active:cursor-grabbing transition-all duration-300",
                    "bg-white/[0.02] backdrop-blur-xl border border-white/[0.06]",
                    "hover:bg-white/[0.05] hover:border-white/[0.12]",
                    isDone && "opacity-60",
                    draggingTaskId === task.id && "opacity-40 ring-2 ring-primary/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Drag handle */}
                    <div className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab">
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>

                    {/* Checkbox */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleComplete(task.id); }}
                      className="flex-shrink-0 mt-0.5"
                    >
                      {isDone ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground/40 hover:text-foreground transition-colors" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className={cn("flex items-start gap-2", isMobile && "flex-col gap-1")}>
                        <p className={cn(
                          "text-sm font-medium text-foreground leading-tight flex-1",
                          isDone && "line-through text-muted-foreground/50"
                        )}>
                          {task.title}
                        </p>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-light uppercase tracking-[0.08em] border",
                            statusBadge.className
                          )}>
                            {statusBadge.label}
                          </span>
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-light uppercase tracking-[0.08em] border",
                            categoryBadge.className
                          )}>
                            {categoryBadge.label}
                          </span>
                        </div>
                      </div>

                      {/* Second row: description + tags + date */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {task.description && (
                          <p className="text-[11px] text-muted-foreground/60 font-light line-clamp-1 flex-1 min-w-0">
                            {task.description}
                          </p>
                        )}

                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {task.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="text-[9px] text-muted-foreground/50 font-light">
                                #{tag}
                              </span>
                            ))}
                            {task.tags.length > 2 && (
                              <span className="text-[9px] text-muted-foreground/30">+{task.tags.length - 2}</span>
                            )}
                          </div>
                        )}

                        {task.due_date && (
                          <span className={cn(
                            "text-[10px] flex items-center gap-1 flex-shrink-0 font-light",
                            isOverdue ? "text-destructive" : "text-muted-foreground/50"
                          )}>
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(task.due_date), 'dd MMM', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost" size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 sm:opacity-100 sm:group-hover:opacity-100 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => onEditTask(task)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
