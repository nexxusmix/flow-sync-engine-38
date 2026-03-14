import { useState, useEffect } from "react";
import { Task, TASK_COLUMNS, TASK_CATEGORIES } from "@/hooks/useTasksUnified";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  CheckSquare, Square, MoreHorizontal, Trash2, 
  Edit, Calendar, GripVertical, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

function TaskCard({ task, onEdit, onToggle, onDelete, isDragging }: TaskCardProps) {
  const isCompleted = task.status === 'done';
  
  const categoryInfo = TASK_CATEGORIES.find(c => c.key === task.category);

  return (
    <motion.div
      className={cn(
        "glass-card rounded-lg p-3 cursor-grab active:cursor-grabbing",
        "border border-transparent hover:border-primary/20 transition-all group",
        isDragging && "opacity-50 ring-2 ring-primary",
        isCompleted && "opacity-60"
      )}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      draggable
      onDragStart={(e: any) => {
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <div className="opacity-0 group-hover:opacity-50 transition-opacity cursor-grab mt-0.5">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>

        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className="flex-shrink-0 mt-0.5"
        >
          {isCompleted ? (
            <CheckSquare className="w-4 h-4 text-primary" />
          ) : (
            <Square className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium text-foreground leading-tight",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>

          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Category Badge */}
            {categoryInfo && (
              <Badge 
                variant="secondary" 
                className={cn("text-[9px] px-1.5 py-0 text-primary-foreground", categoryInfo.color)}
              >
                {categoryInfo.label}
              </Badge>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <>
                {task.tags.slice(0, 2).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 2 && (
                  <span className="text-[9px] text-muted-foreground">+{task.tags.length - 2}</span>
                )}
              </>
            )}

            {/* Due date */}
            {task.due_date && (
              <span className={cn(
                "text-[10px] flex items-center gap-1",
                new Date(task.due_date) < new Date() && task.status !== 'done'
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}>
                <Calendar className="w-3 h-3" />
                {format(new Date(task.due_date), 'dd MMM', { locale: ptBR })}
              </span>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(task.id)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

interface TaskColumnComponentProps {
  column: typeof TASK_COLUMNS[number];
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDrop: (taskId: string, newStatus: Task['status']) => void;
}

function TaskColumnComponent({ column, tasks, onEditTask, onToggle, onDelete, onDrop }: TaskColumnComponentProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDrop(taskId, column.key);
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col min-w-0 w-full rounded-xl p-3 transition-colors",
        column.color,
        isDragOver && "ring-2 ring-primary/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-medium text-foreground truncate">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded flex-shrink-0">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-[calc(100vh-340px)]">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-xs">Nenhuma tarefa</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TasksBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onMoveTask?: (taskId: string, newStatus: Task['status']) => void;
  onToggleComplete?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function TasksBoard({ tasks, onEditTask, onMoveTask, onToggleComplete, onDeleteTask }: TasksBoardProps) {
  const isMobile = useIsMobile();
  const [mobileColumn, setMobileColumn] = useState<Task['status']>(() => {
    try { return (localStorage.getItem('tasks:selectedColumn') as Task['status']) || 'today'; } catch { return 'today'; }
  });

  useEffect(() => {
    try { localStorage.setItem('tasks:selectedColumn', mobileColumn); } catch {}
  }, [mobileColumn]);

  const handleDrop = (taskId: string, newStatus: Task['status']) => {
    onMoveTask?.(taskId, newStatus);
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(t => t.status === status);
  };

  if (isMobile) {
    return (
      <div className="w-full min-w-0">
        {/* Mobile column selector */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none pb-1">
          {TASK_COLUMNS.map((col) => (
            <button
              key={col.key}
              onClick={() => setMobileColumn(col.key)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                mobileColumn === col.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {col.title} ({getTasksByStatus(col.key).length})
            </button>
          ))}
        </div>
        {/* Single column view */}
        {TASK_COLUMNS.filter(c => c.key === mobileColumn).map((column) => (
          <TaskColumnComponent
            key={column.key}
            column={column}
            tasks={getTasksByStatus(column.key)}
            onEditTask={onEditTask}
            onToggle={onToggleComplete || (() => {})}
            onDelete={onDeleteTask || (() => {})}
            onDrop={handleDrop}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 w-full min-w-0">
      {TASK_COLUMNS.map((column) => (
        <TaskColumnComponent
          key={column.key}
          column={column}
          tasks={getTasksByStatus(column.key)}
          onEditTask={onEditTask}
          onToggle={onToggleComplete || (() => {})}
          onDelete={onDeleteTask || (() => {})}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
