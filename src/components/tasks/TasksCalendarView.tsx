import { useState, useMemo } from "react";
import { Task } from "@/hooks/useTasksUnified";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday,
  isPast,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TasksCalendarViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onCreateTask?: (date: string) => void;
}

const PRIORITY_DOTS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  normal: "bg-muted-foreground/40",
  low: "bg-muted-foreground/20",
};

export function TasksCalendarView({ tasks, onEditTask, onCreateTask }: TasksCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!t.due_date) return;
      const key = t.due_date.split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return tasksByDate[key] || [];
  }, [selectedDay, tasksByDate]);

  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-sm font-medium capitalize tracking-wide">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-px">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-[10px] uppercase tracking-widest text-muted-foreground font-light py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-white/[0.03] rounded-xl overflow-hidden border border-white/[0.06]">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const isTodayDay = isToday(day);
          const hasOverdue = dayTasks.some(
            (t) => t.status !== "done" && isPast(parseISO(t.due_date!)) && !isToday(parseISO(t.due_date!))
          );

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "relative min-h-[80px] md:min-h-[100px] p-1.5 text-left transition-all",
                "bg-white/[0.01] hover:bg-white/[0.04]",
                !isCurrentMonth && "opacity-30",
                isSelected && "bg-primary/10 ring-1 ring-primary/30",
                isTodayDay && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-light",
                  isTodayDay && "font-semibold text-primary",
                  hasOverdue && "text-destructive",
                )}
              >
                {format(day, "d")}
              </span>

              {/* Task dots */}
              <div className="flex flex-wrap gap-0.5 mt-1">
                {dayTasks.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      t.status === "done" ? "bg-emerald-500" : PRIORITY_DOTS[t.priority || "normal"],
                    )}
                  />
                ))}
                {dayTasks.length > 4 && (
                  <span className="text-[8px] text-muted-foreground/50">+{dayTasks.length - 4}</span>
                )}
              </div>

              {/* Task titles (desktop only) */}
              <div className="hidden md:block space-y-0.5 mt-1">
                {dayTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask(t);
                    }}
                    className={cn(
                      "text-[9px] leading-tight truncate px-1 py-0.5 rounded cursor-pointer transition-colors",
                      t.status === "done"
                        ? "line-through text-muted-foreground/40"
                        : "text-foreground/80 hover:bg-white/[0.08]",
                    )}
                  >
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[8px] text-muted-foreground/40 px-1">+{dayTasks.length - 3} mais</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium capitalize">
                {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </h3>
              <div className="flex items-center gap-2">
                {onCreateTask && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => onCreateTask(format(selectedDay, "yyyy-MM-dd"))}
                  >
                    <Plus className="w-3 h-3" /> Nova tarefa
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedDay(null)}>
                  ×
                </Button>
              </div>
            </div>

            {selectedDayTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 font-light">Nenhuma tarefa para este dia</p>
            ) : (
              <div className="space-y-1.5">
                {selectedDayTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onEditTask(t)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors",
                      "bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04]",
                      t.status === "done" && "opacity-50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        t.status === "done" ? "bg-emerald-500" : PRIORITY_DOTS[t.priority || "normal"],
                      )}
                    />
                    <span className={cn("text-sm flex-1", t.status === "done" && "line-through text-muted-foreground")}>
                      {t.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                      {t.status === "done" ? "✓" : t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
