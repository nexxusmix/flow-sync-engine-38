import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Task, TASK_COLUMNS, TASK_CATEGORIES } from "@/hooks/useTasksUnified";
import { useChecklistCounts } from "@/hooks/useTaskChecklist";
import { useCommentCounts } from "@/hooks/useTaskComments";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CheckSquare, Square, MoreHorizontal, Trash2, Edit,
  Calendar, Search, Sparkles, X, Loader2, GripVertical,
  AlertTriangle, Flame, ArrowUp, Minus, ArrowDown, Clock, ListChecks, MessageCircle, Repeat
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
import { format, parseISO, isPast, isToday } from "date-fns";
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

const PRIORITY_CONFIG: Record<string, { icon: typeof Flame; label: string; className: string; order: number }> = {
  urgent: { icon: Flame, label: 'Urgente', className: 'text-red-400', order: 0 },
  high: { icon: ArrowUp, label: 'Alta', className: 'text-orange-400', order: 1 },
  normal: { icon: Minus, label: 'Normal', className: 'text-muted-foreground/40', order: 2 },
  low: { icon: ArrowDown, label: 'Baixa', className: 'text-muted-foreground/30', order: 3 },
};

type StatusFilter = Task['status'] | 'all';
type CategoryFilter = Task['category'] | 'all';
type GroupBy = 'none' | 'status' | 'category' | 'priority' | 'due';

export function TasksBoardView({ tasks, onEditTask, onToggleComplete, onDeleteTask, onMoveTask }: TasksBoardViewProps) {
  const isMobile = useIsMobile();
  const toggleComplete = onToggleComplete || (() => {});
  const deleteTask = onDeleteTask || (() => {});

  // Fetch checklist counts for all visible tasks
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);
  const { data: checklistCounts = {} } = useChecklistCounts(taskIds);
  const { data: commentCounts = {} } = useCommentCounts(taskIds);

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<Task['status'] | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [globalSearch, setGlobalSearch] = useState("");
  const [aiFilteredIds, setAiFilteredIds] = useState<Set<string> | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [sortBy, setSortBy] = useState<"created" | "due_date" | "title" | "priority">("created");
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // ── Metrics ────────────────────────────────────────────
  const metrics = useMemo(() => {
    const pending = tasks.filter(t => t.status !== 'done').length;
    const overdue = tasks.filter(t =>
      t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)) && t.status !== 'done'
    ).length;
    const dueToday = tasks.filter(t =>
      t.due_date && isToday(parseISO(t.due_date)) && t.status !== 'done'
    ).length;
    const completedToday = tasks.filter(t =>
      t.completed_at && isToday(parseISO(t.completed_at))
    ).length;
    return { pending, overdue, dueToday, completedToday };
  }, [tasks]);

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

  // All unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(t => t.tags?.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [tasks]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  };

  // Filtered + sorted tasks
  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter);
    if (categoryFilter !== 'all') list = list.filter(t => t.category === categoryFilter);

    // Tag filter (AND)
    if (selectedTags.size > 0) {
      list = list.filter(t => {
        if (!t.tags || t.tags.length === 0) return false;
        return Array.from(selectedTags).every(tag => t.tags.includes(tag));
      });
    }

    if (globalSearch.trim() && !aiFilteredIds) {
      const q = globalSearch.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (aiFilteredIds) list = list.filter(t => aiFilteredIds.has(t.id));

    list = [...list].sort((a, b) => {
      if (sortBy === "due_date") {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "priority") {
        const aOrder = PRIORITY_CONFIG[a.priority || 'normal']?.order ?? 2;
        const bOrder = PRIORITY_CONFIG[b.priority || 'normal']?.order ?? 2;
        return aOrder - bOrder;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [tasks, statusFilter, categoryFilter, globalSearch, aiFilteredIds, sortBy, selectedTags]);

  // ── Grouping ───────────────────────────────────────────
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') return [{ label: '', tasks: filteredTasks }];

    const groups: Record<string, Task[]> = {};
    filteredTasks.forEach(task => {
      let key = '';
      if (groupBy === 'status') key = STATUS_BADGES[task.status]?.label || task.status;
      else if (groupBy === 'category') key = CATEGORY_BADGES[task.category]?.label || task.category;
      else if (groupBy === 'priority') key = PRIORITY_CONFIG[task.priority || 'normal']?.label || 'Normal';
      else if (groupBy === 'due') {
        if (!task.due_date) key = 'Sem prazo';
        else if (task.status === 'done') key = 'Concluída';
        else if (isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date))) key = '🔴 Atrasadas';
        else if (isToday(parseISO(task.due_date))) key = '🟡 Vence hoje';
        else key = '🟢 Futuras';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    // Order groups logically
    const order = groupBy === 'due'
      ? ['🔴 Atrasadas', '🟡 Vence hoje', '🟢 Futuras', 'Concluída', 'Sem prazo']
      : groupBy === 'priority'
        ? ['Urgente', 'Alta', 'Normal', 'Baixa']
        : Object.keys(groups);

    return order
      .filter(k => groups[k]?.length > 0)
      .map(label => ({ label, tasks: groups[label] }));
  }, [filteredTasks, groupBy]);

  // ── Keyboard shortcuts ─────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setFocusedIndex(i => Math.min(i + 1, filteredTasks.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'e') {
        if (focusedIndex >= 0 && focusedIndex < filteredTasks.length) {
          e.preventDefault();
          onEditTask(filteredTasks[focusedIndex]);
        }
      } else if (e.key === 'd') {
        if (focusedIndex >= 0 && focusedIndex < filteredTasks.length) {
          e.preventDefault();
          toggleComplete(filteredTasks[focusedIndex].id);
        }
      } else if (e.key === 'Escape') {
        setFocusedIndex(-1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filteredTasks, focusedIndex, onEditTask, toggleComplete]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-task-row]');
    items[focusedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedIndex]);

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

  // Flat index counter for keyboard navigation across groups
  let flatIndex = -1;

  return (
    <div className="space-y-4">
      {/* ── Metrics Bar ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Pendentes', value: metrics.pending, icon: Clock, color: 'text-foreground' },
          { label: 'Atrasadas', value: metrics.overdue, icon: AlertTriangle, color: metrics.overdue > 0 ? 'text-destructive' : 'text-muted-foreground' },
          { label: 'Vence hoje', value: metrics.dueToday, icon: Calendar, color: metrics.dueToday > 0 ? 'text-amber-400' : 'text-muted-foreground' },
          { label: 'Concluídas hoje', value: metrics.completedToday, icon: CheckSquare, color: metrics.completedToday > 0 ? 'text-emerald-400' : 'text-muted-foreground' },
        ].map((m) => (
          <div
            key={m.label}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]"
          >
            <m.icon className={cn("w-4 h-4 flex-shrink-0", m.color)} />
            <div className="min-w-0">
              <p className={cn("text-lg font-medium leading-none", m.color)}>{m.value}</p>
              <p className="text-[10px] text-muted-foreground font-light tracking-wide mt-0.5">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search Bar ──────────────────────────────────── */}
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

      {/* ── Filter Chips ────────────────────────────────── */}
      <div className="space-y-2">
        {/* Status (drop targets) */}
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

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-light flex-shrink-0">Tags</span>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "flex-shrink-0 px-3 py-1 rounded-lg text-[11px] font-light tracking-wide transition-all border",
                  selectedTags.has(tag)
                    ? "bg-primary/15 border-primary/30 text-primary"
                    : "bg-white/[0.02] border-white/[0.06] text-muted-foreground hover:bg-white/[0.05] hover:border-white/[0.1]"
                )}
              >
                #{tag}
              </button>
            ))}
            {selectedTags.size > 0 && (
              <button
                onClick={() => setSelectedTags(new Set())}
                className="text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Results count + Sort + Group ────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-[11px] text-muted-foreground font-light tracking-wide">
          {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-[11px] text-muted-foreground font-light tracking-wide hover:text-foreground transition-colors">
                Agrupar: {groupBy === 'none' ? 'Nenhum' : groupBy === 'status' ? 'Status' : groupBy === 'category' ? 'Categoria' : groupBy === 'priority' ? 'Prioridade' : 'Prazo'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setGroupBy('none')}>Nenhum</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('status')}>Por status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('category')}>Por categoria</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('priority')}>Por prioridade</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('due')}>Por prazo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-[11px] text-muted-foreground font-light tracking-wide hover:text-foreground transition-colors">
                Ordenar: {sortBy === 'created' ? 'Recentes' : sortBy === 'due_date' ? 'Prazo' : sortBy === 'title' ? 'A-Z' : 'Prioridade'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('created')}>Mais recentes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('due_date')}>Por prazo</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('priority')}>Por prioridade</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('title')}>Alfabética</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Task List ───────────────────────────────────── */}
      <div ref={listRef} className="space-y-4">
        {groupedTasks.map((group) => (
          <div key={group.label || '__all'}>
            {/* Group header */}
            {group.label && (
              <div className="flex items-center gap-2 mb-2 mt-1">
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-light">{group.label}</span>
                <span className="text-[9px] text-muted-foreground/50 bg-white/[0.04] px-1.5 py-0.5 rounded">{group.tasks.length}</span>
                <div className="flex-1 h-px bg-white/[0.04]" />
              </div>
            )}

            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {group.tasks.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                    <p className="text-sm text-muted-foreground font-light">Nenhuma tarefa encontrada</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Ajuste os filtros ou crie uma nova tarefa</p>
                  </motion.div>
                ) : (
                  group.tasks.map((task) => {
                    flatIndex++;
                    const currentFlatIndex = flatIndex;
                    const isDone = task.status === 'done';
                    const statusBadge = STATUS_BADGES[task.status];
                    const categoryBadge = CATEGORY_BADGES[task.category];
                    const priorityInfo = PRIORITY_CONFIG[task.priority || 'normal'] || PRIORITY_CONFIG.normal;
                    const PriorityIcon = priorityInfo.icon;
                    const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && !isDone;
                    const isDueToday = task.due_date && isToday(parseISO(task.due_date)) && !isDone;
                    const isFocused = focusedIndex === currentFlatIndex;

                    return (
                      <motion.div
                        key={task.id}
                        data-task-row
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        draggable
                        onDragStart={(e: any) => {
                          setDraggingTaskId(task.id);
                          e.dataTransfer.setData('taskId', task.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => { setDraggingTaskId(null); setDropTargetStatus(null); }}
                        onClick={() => onEditTask(task)}
                        className={cn(
                          "group relative rounded-2xl p-3.5 cursor-grab active:cursor-grabbing transition-all duration-200",
                          "bg-white/[0.02] backdrop-blur-xl border border-white/[0.06]",
                          "hover:bg-white/[0.05] hover:border-white/[0.12]",
                          isDone && "opacity-60",
                          draggingTaskId === task.id && "opacity-40 ring-2 ring-primary/30",
                          isOverdue && "border-destructive/20",
                          isDueToday && "border-amber-500/20",
                          isFocused && "ring-2 ring-primary/40 bg-white/[0.04]"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Drag handle */}
                          <div className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab">
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>

                          {/* Priority indicator */}
                          {(task.priority || 'normal') !== 'normal' && (
                            <div className="flex-shrink-0 mt-0.5">
                              <PriorityIcon className={cn("w-3.5 h-3.5", priorityInfo.className)} />
                            </div>
                          )}

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

                            {/* Second row */}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {task.description && (
                                <p className="text-[11px] text-muted-foreground/60 font-light line-clamp-1 flex-1 min-w-0">
                                  {task.description}
                                </p>
                              )}

                              {task.tags && task.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {task.tags.slice(0, 2).map((tag, i) => (
                                    <span key={i} className="text-[9px] text-muted-foreground/50 font-light">#{tag}</span>
                                  ))}
                                  {task.tags.length > 2 && (
                                    <span className="text-[9px] text-muted-foreground/30">+{task.tags.length - 2}</span>
                                  )}
                                </div>
                              )}

                              {/* Subtask indicator */}
                              {checklistCounts[task.id] && checklistCounts[task.id].total > 0 && (
                                <span className="text-[10px] flex items-center gap-1 flex-shrink-0 font-light text-muted-foreground/50">
                                  <ListChecks className="w-3 h-3" />
                                  {checklistCounts[task.id].completed}/{checklistCounts[task.id].total}
                                </span>
                              )}

                              {/* Comment indicator */}
                              {commentCounts[task.id] && commentCounts[task.id] > 0 && (
                                <span className="text-[10px] flex items-center gap-1 flex-shrink-0 font-light text-muted-foreground/50">
                                  <MessageCircle className="w-3 h-3" />
                                  {commentCounts[task.id]}
                                </span>
                              )}

                              {/* Recurrence indicator */}
                              {(task as any).recurrence_rule && (
                                <span className="text-[10px] flex items-center gap-1 flex-shrink-0 font-light text-blue-400/60">
                                  <Repeat className="w-3 h-3" />
                                </span>
                              )}

                              {task.due_date && (
                                <span className={cn(
                                  "text-[10px] flex items-center gap-1 flex-shrink-0 font-light",
                                  isOverdue ? "text-destructive font-medium" : isDueToday ? "text-amber-400 font-medium" : "text-muted-foreground/50"
                                )}>
                                  {isOverdue && <AlertTriangle className="w-3 h-3" />}
                                  <Calendar className="w-3 h-3" />
                                  {format(parseISO(task.due_date), 'dd MMM', { locale: ptBR })}
                                  {isOverdue && ' (atrasada)'}
                                  {isDueToday && ' (hoje)'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 sm:opacity-100 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => onEditTask(task)}>
                                <Edit className="w-4 h-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
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
        ))}
      </div>

      {/* Keyboard shortcut hint */}
      {!isMobile && (
        <div className="text-center pt-2">
          <p className="text-[10px] text-muted-foreground/30 font-light tracking-wider">
            ↑↓ navegar · Enter editar · D concluir · Esc limpar
          </p>
        </div>
      )}
    </div>
  );
}
