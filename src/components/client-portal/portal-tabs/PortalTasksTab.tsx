/**
 * PortalTasksTab - Aba Tarefas do portal do cliente
 * 
 * Exibe tarefas visíveis para o cliente
 */

import { memo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CheckSquare, 
  Square, 
  Clock, 
  Calendar,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: string;
  due_date?: string | null;
  assignee_name?: string | null;
  priority?: string | null;
  category?: string | null;
}

interface PortalTasksTabProps {
  tasks?: Task[];
}

function PortalTasksTabComponent({ tasks = [] }: PortalTasksTabProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckSquare className="w-4 h-4 text-primary" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Square className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done':
        return 'Concluída';
      case 'in_progress':
        return 'Em andamento';
      default:
        return 'A fazer';
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-[10px]">Urgente</Badge>;
      case 'high':
        return <Badge className="bg-muted-foreground text-[10px]">Alta</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-[10px]">Baixa</Badge>;
      default:
        return null;
    }
  };

  // Group tasks by status
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  if (tasks.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <CheckSquare className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Nenhuma tarefa visível</h3>
        <p className="text-sm text-muted-foreground">
          As tarefas do projeto aparecerão aqui quando compartilhadas.
        </p>
      </div>
    );
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getStatusIcon(task.status)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={cn(
              "font-medium text-sm",
              task.status === 'done' && "line-through text-muted-foreground"
            )}>
              {task.title}
            </span>
            {getPriorityBadge(task.priority)}
          </div>
          
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            )}
            {task.assignee_name && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {task.assignee_name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{todoTasks.length}</p>
          <p className="text-[10px] text-muted-foreground">A fazer</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{inProgressTasks.length}</p>
          <p className="text-[10px] text-muted-foreground">Em andamento</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{doneTasks.length}</p>
          <p className="text-[10px] text-muted-foreground">Concluídas</p>
        </div>
      </div>

      {/* In Progress Tasks */}
      {inProgressTasks.length > 0 && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Em Andamento
          </h3>
          <div className="space-y-2">
            {inProgressTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* To Do Tasks */}
      {todoTasks.length > 0 && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Square className="w-4 h-4 text-muted-foreground" />
            A Fazer
          </h3>
          <div className="space-y-2">
            {todoTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Done Tasks */}
      {doneTasks.length > 0 && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-500" />
            Concluídas
          </h3>
          <div className="space-y-2">
            {doneTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const PortalTasksTab = memo(PortalTasksTabComponent);
