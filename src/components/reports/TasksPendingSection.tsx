import { useTasksUnified } from "@/hooks/useTasksUnified";
import { Link } from "react-router-dom";
import { CheckSquare, AlertTriangle, Clock, ArrowRight, Flame, ArrowUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { parseISO, isPast, isToday, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const PRIORITY_ICON: Record<string, { icon: typeof Flame; className: string }> = {
  urgent: { icon: Flame, className: "text-destructive" },
  high: { icon: ArrowUp, className: "text-muted-foreground" },
};

export function TasksPendingSection() {
  const { tasks } = useTasksUnified();

  const pending = tasks.filter(t => t.status !== "done");
  const overdue = pending.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)));
  const todayTasks = pending.filter(t => t.status === "today" || (t.due_date && isToday(parseISO(t.due_date))));

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
  const topTasks = [...pending]
    .sort((a, b) => {
      const pa = priorityOrder[a.priority || "normal"] ?? 2;
      const pb = priorityOrder[b.priority || "normal"] ?? 2;
      if (pa !== pb) return pa - pb;
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    })
    .slice(0, 10);

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Pendências de Tarefas</h3>
        </div>
        <Link
          to="/tarefas"
          className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
        >
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 rounded-lg bg-destructive/5">
          <p className="text-2xl font-bold text-destructive">{overdue.length}</p>
          <p className="text-xs text-muted-foreground">Atrasadas</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted">
          <p className="text-2xl font-bold text-muted-foreground">{todayTasks.length}</p>
          <p className="text-xs text-muted-foreground">Hoje</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <p className="text-2xl font-bold text-foreground">{pending.length}</p>
          <p className="text-xs text-muted-foreground">Total Pendentes</p>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-1">
        {topTasks.map(t => {
          const pcfg = PRIORITY_ICON[t.priority];
          const PIcon = pcfg?.icon;
          const isOverdue = t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date));

          return (
            <div
              key={t.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/20 transition-colors"
            >
              {PIcon ? (
                <PIcon className={cn("w-3.5 h-3.5 shrink-0", pcfg.className)} />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground/20 shrink-0" />
              )}
              <span className={cn("text-xs flex-1 truncate", isOverdue && "text-destructive/80")}>
                {t.title}
              </span>
              {t.due_date && (
                <span className={cn(
                  "text-[10px] shrink-0",
                  isOverdue ? "text-destructive/60" : "text-muted-foreground/50"
                )}>
                  {formatDistanceToNow(parseISO(t.due_date), { locale: ptBR, addSuffix: true })}
                </span>
              )}
            </div>
          );
        })}
        {topTasks.length === 0 && (
          <p className="text-xs text-muted-foreground/40 text-center py-4">Nenhuma tarefa pendente 🎉</p>
        )}
      </div>
    </Card>
  );
}
