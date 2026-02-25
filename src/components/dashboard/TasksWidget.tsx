import { useTasksUnified } from "@/hooks/useTasksUnified";
import { Link } from "react-router-dom";
import { CheckSquare, AlertTriangle, Clock, ArrowRight, Flame, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseISO, isPast, isToday } from "date-fns";

const PRIORITY_ICON: Record<string, { icon: typeof Flame; className: string }> = {
  urgent: { icon: Flame, className: "text-red-400" },
  high: { icon: ArrowUp, className: "text-orange-400" },
};

export function TasksWidget() {
  const { tasks } = useTasksUnified();

  const pending = tasks.filter(t => t.status !== "done");
  const overdue = pending.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)));
  const todayTasks = pending.filter(t => t.status === "today" || (t.due_date && isToday(parseISO(t.due_date))));

  // Top 5 most urgent
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
    .slice(0, 5);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">Tarefas</h3>
        </div>
        <Link to="/tarefas" className="text-[10px] uppercase tracking-widest text-primary/70 hover:text-primary flex items-center gap-1 transition-colors">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Counters */}
      <div className="flex gap-4">
        {overdue.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-destructive/80">
            <AlertTriangle className="w-3.5 h-3.5" />
            {overdue.length} atrasada{overdue.length > 1 ? "s" : ""}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-amber-500/80">
          <Clock className="w-3.5 h-3.5" />
          {todayTasks.length} hoje
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
          {pending.length} pendentes
        </div>
      </div>

      {/* Top tasks */}
      <div className="space-y-1">
        {topTasks.map(t => {
          const pcfg = PRIORITY_ICON[t.priority];
          const PIcon = pcfg?.icon;
          const isOverdue = t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date));

          return (
            <Link
              key={t.id}
              to="/tarefas"
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg transition-colors",
                "hover:bg-white/[0.04] cursor-pointer"
              )}
            >
              {PIcon ? (
                <PIcon className={cn("w-3 h-3 shrink-0", pcfg.className)} />
              ) : (
                <div className="w-3 h-3 rounded-full bg-muted-foreground/20 shrink-0" />
              )}
              <span className={cn("text-xs flex-1 truncate", isOverdue && "text-destructive/80")}>
                {t.title}
              </span>
              {t.due_date && (
                <span className={cn(
                  "text-[9px] shrink-0",
                  isOverdue ? "text-destructive/60" : "text-muted-foreground/40"
                )}>
                  {new Date(t.due_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
              )}
            </Link>
          );
        })}
        {topTasks.length === 0 && (
          <p className="text-xs text-muted-foreground/40 text-center py-3">Nenhuma tarefa pendente 🎉</p>
        )}
      </div>
    </div>
  );
}
