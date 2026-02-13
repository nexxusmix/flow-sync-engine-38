import { useState, useMemo } from "react";
import { Task, TASK_COLUMNS, TASK_CATEGORIES } from "@/hooks/useTasksUnified";
import {
  CheckSquare, Square, MoreHorizontal, Trash2, Edit,
  Calendar, ArrowUpDown, Search, ArrowRight, Plus,
  Inbox, CalendarDays, Sun, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

// Column card configuration
const COLUMN_CONFIG: Record<string, {
  icon: typeof Inbox;
  description: string;
  cta: string;
  gradient: string;
  accentColor: string;
  numberBorder: string;
}> = {
  backlog: {
    icon: Inbox,
    description: "Organize ideias e pendências antes de priorizar.",
    cta: "Ver tarefas",
    gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
    accentColor: "text-violet-400",
    numberBorder: "border-violet-500/30",
  },
  week: {
    icon: CalendarDays,
    description: "Planeje entregas e prioridades da semana.",
    cta: "Planejar semana",
    gradient: "from-blue-500/10 via-cyan-500/5 to-transparent",
    accentColor: "text-blue-400",
    numberBorder: "border-blue-500/30",
  },
  today: {
    icon: Sun,
    description: "Foco total no que precisa acontecer hoje.",
    cta: "Adicionar tarefa",
    gradient: "from-amber-500/10 via-yellow-500/5 to-transparent",
    accentColor: "text-amber-400",
    numberBorder: "border-amber-500/30",
  },
  done: {
    icon: CheckCircle2,
    description: "Histórico de entregas e progresso.",
    cta: "Revisar concluídas",
    gradient: "from-emerald-500/10 via-green-500/5 to-transparent",
    accentColor: "text-emerald-400",
    numberBorder: "border-emerald-500/30",
  },
};

export function TasksBoardView({ tasks, onEditTask, onToggleComplete, onDeleteTask }: TasksBoardViewProps) {
  const toggleComplete = onToggleComplete || (() => {});
  const deleteTask = onDeleteTask || (() => {});
  const [expandedColumn, setExpandedColumn] = useState<Task["status"] | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"created" | "due_date" | "title">("created");

  // Counts per status
  const counts = useMemo(() => {
    const c: Record<string, number> = { backlog: 0, week: 0, today: 0, done: 0 };
    tasks.forEach((t) => c[t.status]++);
    return c;
  }, [tasks]);

  // Tasks for expanded column
  const expandedTasks = useMemo(() => {
    if (!expandedColumn) return [];
    let list = tasks.filter((t) => t.status === expandedColumn);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }
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
  }, [tasks, expandedColumn, search, sortBy]);

  // Preview tasks (top 4 per column)
  const getPreviewTasks = (status: Task["status"]) =>
    tasks.filter((t) => t.status === status).slice(0, 4);

  // Overdue count for a column
  const getOverdueCount = (status: Task["status"]) =>
    tasks.filter(
      (t) => t.status === status && t.due_date && isPast(parseISO(t.due_date)) && t.status !== "done"
    ).length;

  return (
    <div className="space-y-6">
      {/* Premium Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {TASK_COLUMNS.map((col, index) => {
          const config = COLUMN_CONFIG[col.key];
          const Icon = config.icon;
          const count = counts[col.key];
          const preview = getPreviewTasks(col.key);
          const overdueCount = getOverdueCount(col.key);
          const isExpanded = expandedColumn === col.key;

          return (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 120, damping: 20 }}
              onClick={() => setExpandedColumn(isExpanded ? null : col.key)}
              className={cn(
                "group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300",
                "border border-white/[0.06] hover:border-white/[0.12]",
                "bg-[#0a0a0a]/80 backdrop-blur-xl",
                "hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)]",
                isExpanded && "ring-1 ring-primary/30 border-primary/20"
              )}
            >
              {/* Image/Header area */}
              <div className={cn(
                "relative h-36 overflow-hidden bg-gradient-to-br",
                config.gradient
              )}>
                {/* Decorative pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* Subtle glow */}
                <div className={cn(
                  "absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-30",
                  col.key === 'backlog' && "bg-violet-500",
                  col.key === 'week' && "bg-blue-500",
                  col.key === 'today' && "bg-amber-500",
                  col.key === 'done' && "bg-emerald-500",
                )} />

                {/* Column label */}
                <div className="absolute top-3 left-4">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-[10px] font-light uppercase tracking-widest px-2.5 py-1 rounded-full",
                    "bg-white/[0.06] backdrop-blur-sm border border-white/[0.06]",
                    config.accentColor
                  )}>
                    <Icon className="w-3 h-3" />
                    {col.title}
                  </span>
                </div>

                {/* Mini task previews inside header */}
                <div className="absolute bottom-3 left-4 right-14 space-y-1">
                  {preview.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] backdrop-blur-sm border border-white/[0.04] truncate"
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0",
                        task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done'
                          ? "bg-destructive"
                          : task.status === 'done' ? "bg-emerald-400" : "bg-white/30"
                      )} />
                      <span className="text-[11px] text-white/60 truncate font-light">
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Number circle */}
                <div className={cn(
                  "absolute bottom-3 right-4 w-12 h-12 rounded-full flex items-center justify-center",
                  "bg-white/[0.04] backdrop-blur-sm border-2 transition-all",
                  config.numberBorder,
                  "group-hover:scale-105",
                  overdueCount > 0 && col.key !== 'done' && "animate-pulse"
                )}>
                  <span className={cn(
                    "text-lg font-medium",
                    config.accentColor
                  )}>
                    {count}
                  </span>
                </div>
              </div>

              {/* Content area */}
              <div className="p-5">
                <h3 className="text-base font-medium text-foreground group-hover:text-white transition-colors">
                  {col.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-light">
                  {config.description}
                </p>

                {/* Mini task list preview */}
                {preview.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {preview.slice(0, 3).map((task) => {
                      const categoryInfo = TASK_CATEGORIES.find((c) => c.key === task.category);
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 group/task"
                          onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleComplete(task.id); }}
                            className="flex-shrink-0"
                          >
                            {task.status === 'done' ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/task:text-foreground transition-colors" />
                            )}
                          </button>
                          <span className={cn(
                            "text-xs truncate flex-1 font-light",
                            task.status === 'done' ? "line-through text-muted-foreground/50" : "text-foreground/70 group-hover/task:text-foreground"
                          )}>
                            {task.title}
                          </span>
                          {categoryInfo && (
                            <span className={cn(
                              "text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0",
                              categoryInfo.color, "text-primary-foreground"
                            )}>
                              {categoryInfo.label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {count > 3 && (
                      <span className="text-[10px] text-muted-foreground/50 font-light pl-5">
                        +{count - 3} mais
                      </span>
                    )}
                  </div>
                )}

                {/* CTA */}
                <div className="mt-4 flex items-center justify-between">
                  <button
                    className={cn(
                      "text-xs font-light flex items-center gap-1 transition-colors",
                      config.accentColor, "opacity-60 group-hover:opacity-100"
                    )}
                  >
                    {config.cta}
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  {overdueCount > 0 && col.key !== 'done' && (
                    <span className="text-[10px] text-destructive/80 font-light">
                      {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Expanded Column Detail */}
      <AnimatePresence>
        {expandedColumn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/60 backdrop-blur-xl p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium text-foreground">
                    {TASK_COLUMNS.find(c => c.key === expandedColumn)?.title}
                  </h3>
                  <span className="text-xs text-muted-foreground bg-white/[0.04] px-2 py-0.5 rounded-full">
                    {expandedTasks.length} tarefa{expandedTasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar…"
                      className="pl-8 h-8 text-xs bg-white/[0.02] border-white/[0.06]"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground">
                        <ArrowUpDown className="w-3 h-3" />
                        Ordenar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortBy("created")}>Mais recentes</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("due_date")}>Por prazo</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("title")}>Alfabética</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => setExpandedColumn(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>

              {/* Task list */}
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {expandedTasks.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <p className="text-sm font-light">
                        {search ? "Nenhuma tarefa encontrada" : "Nenhuma tarefa nesta coluna"}
                      </p>
                    </motion.div>
                  ) : (
                    expandedTasks.map((task) => (
                      <ExpandedTaskRow
                        key={task.id}
                        task={task}
                        onEdit={() => onEditTask(task)}
                        onToggle={() => toggleComplete(task.id)}
                        onDelete={() => deleteTask(task.id)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Expanded task row ────────────────────────────────────
interface ExpandedTaskRowProps {
  task: Task;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

function ExpandedTaskRow({ task, onEdit, onToggle, onDelete }: ExpandedTaskRowProps) {
  const isCompleted = task.status === "done";
  const categoryInfo = TASK_CATEGORIES.find((c) => c.key === task.category);
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isCompleted;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent",
        "bg-white/[0.02] hover:bg-white/[0.04] transition-all group",
        isCompleted && "opacity-50"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="flex-shrink-0"
      >
        {isCompleted ? (
          <CheckSquare className="w-4.5 h-4.5 text-emerald-500" />
        ) : (
          <Square className="w-4.5 h-4.5 text-muted-foreground/40 hover:text-foreground transition-colors" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <p className={cn(
          "text-sm font-medium text-foreground truncate",
          isCompleted && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground/60 truncate mt-0.5 max-w-md font-light">
            {task.description}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        {categoryInfo && (
          <Badge
            variant="secondary"
            className={cn("text-[9px] px-1.5 py-0 text-primary-foreground", categoryInfo.color)}
          >
            {categoryInfo.label}
          </Badge>
        )}
        {task.tags?.slice(0, 2).map((tag, i) => (
          <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0 border-white/[0.06]">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Due date */}
      {task.due_date && (
        <span className={cn(
          "text-[10px] flex items-center gap-1 flex-shrink-0 whitespace-nowrap font-light",
          isOverdue ? "text-destructive" : "text-muted-foreground/60"
        )}>
          <Calendar className="w-3 h-3" />
          {format(parseISO(task.due_date), "dd MMM", { locale: ptBR })}
        </span>
      )}

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
