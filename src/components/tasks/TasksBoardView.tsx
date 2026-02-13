import { useState, useMemo } from "react";
import { Task, TASK_COLUMNS, TASK_CATEGORIES } from "@/hooks/useTasksUnified";
import {
  CheckSquare, Square, MoreHorizontal, Trash2, Edit,
  Calendar, Tag, ArrowUpDown, Search
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

type SortKey = "created" | "due_date" | "title";

interface TasksBoardViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onToggleComplete?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
}

export function TasksBoardView({ tasks, onEditTask, onToggleComplete, onDeleteTask }: TasksBoardViewProps) {
  const toggleComplete = onToggleComplete || (() => {});
  const deleteTask = onDeleteTask || (() => {});
  const [activeStatus, setActiveStatus] = useState<Task["status"]>("today");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("created");

  // Counts per status
  const counts = useMemo(() => {
    const c: Record<string, number> = { backlog: 0, week: 0, today: 0, done: 0 };
    tasks.forEach((t) => c[t.status]++);
    return c;
  }, [tasks]);

  // Filtered + sorted tasks
  const filteredTasks = useMemo(() => {
    let list = tasks.filter((t) => t.status === activeStatus);
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
  }, [tasks, activeStatus, search, sortBy]);

  return (
    <div className="space-y-4">
      {/* Status filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {TASK_COLUMNS.map((col) => (
          <button
            key={col.key}
            onClick={() => setActiveStatus(col.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
              activeStatus === col.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {col.title}
            <span
              className={cn(
                "min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold",
                activeStatus === col.key
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background/60 text-muted-foreground"
              )}
            >
              {counts[col.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + sort bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tarefas…"
            className="pl-8 h-8 text-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <ArrowUpDown className="w-3 h-3" />
              <span className="hidden sm:inline">Ordenar</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy("created")}>
              Mais recentes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("due_date")}>
              Por prazo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("title")}>
              Alfabética
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Task list */}
      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <p className="text-sm">
                {search ? "Nenhuma tarefa encontrada" : "Nenhuma tarefa nesta coluna"}
              </p>
            </motion.div>
          ) : (
            filteredTasks.map((task) => (
              <TaskRow
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
  );
}

// ─── Individual row ────────────────────────────────────
interface TaskRowProps {
  task: Task;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

function TaskRow({ task, onEdit, onToggle, onDelete }: TaskRowProps) {
  const isCompleted = task.status === "done";
  const categoryInfo = TASK_CATEGORIES.find((c) => c.key === task.category);
  const isOverdue =
    task.due_date && isPast(parseISO(task.due_date)) && !isCompleted;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent",
        "bg-card hover:bg-muted/40 transition-colors group",
        isCompleted && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="flex-shrink-0 p-0.5"
      >
        {isCompleted ? (
          <CheckSquare className="w-5 h-5 text-green-500" />
        ) : (
          <Square className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        )}
      </button>

      {/* Main content — clickable to edit */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={onEdit}
      >
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium text-foreground truncate",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-md">
            {task.description}
          </p>
        )}
      </div>

      {/* Meta badges */}
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
          <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Due date */}
      {task.due_date && (
        <span
          className={cn(
            "text-[10px] flex items-center gap-1 flex-shrink-0 whitespace-nowrap",
            isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
          )}
        >
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
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 md:opacity-100 flex-shrink-0"
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
