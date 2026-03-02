import { useMemo, useState, useRef } from "react";
import { Task } from "@/hooks/useTasksUnified";
import { useAllDependencies } from "@/hooks/useTaskDependencies";
import {
  differenceInDays, addDays, startOfDay, parseISO, format, isToday, isPast,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertTriangle } from "lucide-react";

interface TaskGanttViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-primary/30",
  week: "bg-primary/60",
  today: "bg-muted-foreground/60",
  done: "bg-primary/60",
};

const PRIORITY_BORDER: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-400",
  normal: "border-l-transparent",
  low: "border-l-transparent",
};

export function TaskGanttView({ tasks, onEditTask }: TaskGanttViewProps) {
  const { data: allDeps = [] } = useAllDependencies();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dayWidth, setDayWidth] = useState(40);
  const [offsetDays, setOffsetDays] = useState(-7);

  // Only show tasks with due_date (or start_date)
  const ganttTasks = useMemo(() => {
    return tasks
      .filter(t => t.due_date)
      .sort((a, b) => {
        const aStart = (a as any).start_date || a.due_date!;
        const bStart = (b as any).start_date || b.due_date!;
        return new Date(aStart).getTime() - new Date(bStart).getTime();
      });
  }, [tasks]);

  const today = startOfDay(new Date());
  const totalDays = 60;
  const startDate = addDays(today, offsetDays);

  const dayColumns = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => addDays(startDate, i));
  }, [startDate, totalDays]);

  // Build dependency lines
  const depLines = useMemo(() => {
    const lines: Array<{ fromIdx: number; toIdx: number; fromDay: number; toDay: number }> = [];
    allDeps.forEach(dep => {
      const fromIdx = ganttTasks.findIndex(t => t.id === dep.depends_on_task_id);
      const toIdx = ganttTasks.findIndex(t => t.id === dep.task_id);
      if (fromIdx === -1 || toIdx === -1) return;
      const fromTask = ganttTasks[fromIdx];
      const toTask = ganttTasks[toIdx];
      const fromDay = differenceInDays(parseISO(fromTask.due_date!), startDate);
      const toDay = differenceInDays(parseISO((toTask as any).start_date || toTask.due_date!), startDate);
      lines.push({ fromIdx, toIdx, fromDay, toDay });
    });
    return lines;
  }, [allDeps, ganttTasks, startDate]);

  const handleZoomIn = () => setDayWidth(w => Math.min(w + 10, 80));
  const handleZoomOut = () => setDayWidth(w => Math.max(w - 10, 20));
  const handlePrev = () => setOffsetDays(o => o - 14);
  const handleNext = () => setOffsetDays(o => o + 14);
  const handleToday = () => setOffsetDays(-7);

  const rowHeight = 36;
  const headerHeight = 56;
  const labelWidth = 200;

  if (ganttTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Nenhuma tarefa com prazo definido</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Adicione datas às tarefas para visualizar no Gantt</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePrev} className="h-7 w-7 p-0">
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleToday} className="h-7 text-xs">
          Hoje
        </Button>
        <Button variant="outline" size="sm" onClick={handleNext} className="h-7 w-7 p-0">
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleZoomOut} className="h-7 w-7 p-0">
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomIn} className="h-7 w-7 p-0">
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Chart */}
      <div className="border border-border/50 rounded-xl overflow-hidden bg-card/30">
        <div className="flex">
          {/* Left labels */}
          <div className="flex-shrink-0 border-r border-border/30" style={{ width: labelWidth }}>
            <div className="h-[56px] border-b border-border/30 flex items-end px-3 pb-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-light">Tarefa</span>
            </div>
            {ganttTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center px-3 cursor-pointer hover:bg-muted/20 transition-colors border-b border-border/10"
                style={{ height: rowHeight }}
                onClick={() => onEditTask(task)}
              >
                <span className="text-xs text-foreground truncate">{task.title}</span>
              </div>
            ))}
          </div>

          {/* Right chart area */}
          <div ref={scrollRef} className="flex-1 overflow-x-auto">
            <div style={{ width: totalDays * dayWidth, position: "relative" }}>
              {/* Header days */}
              <div className="flex border-b border-border/30" style={{ height: headerHeight }}>
                {dayColumns.map((day, i) => {
                  const isTodayCol = isToday(day);
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex-shrink-0 flex flex-col items-center justify-end pb-1 border-r border-border/10",
                        isTodayCol && "bg-primary/5",
                        isWeekend && "bg-muted/20"
                      )}
                      style={{ width: dayWidth }}
                    >
                      <span className="text-[9px] text-muted-foreground/60 uppercase">
                        {format(day, "EEE", { locale: ptBR })}
                      </span>
                      <span className={cn(
                        "text-[11px] font-medium",
                        isTodayCol ? "text-primary" : "text-muted-foreground"
                      )}>
                        {format(day, "dd")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Rows */}
              {ganttTasks.map((task) => {
                const taskStart = parseISO((task as any).start_date || task.due_date!);
                const taskEnd = parseISO(task.due_date!);
                const startDay = differenceInDays(taskStart, startDate);
                const duration = Math.max(differenceInDays(taskEnd, taskStart), 1);
                const left = startDay * dayWidth;
                const width = duration * dayWidth;
                const isOverdue = task.status !== "done" && isPast(taskEnd) && !isToday(taskEnd);

                return (
                  <div
                    key={task.id}
                    className="relative border-b border-border/5"
                    style={{ height: rowHeight }}
                  >
                    {/* Weekend background stripes */}
                    {dayColumns.map((day, i) => (
                      (day.getDay() === 0 || day.getDay() === 6) && (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 bg-muted/10"
                          style={{ left: i * dayWidth, width: dayWidth }}
                        />
                      )
                    ))}

                    {/* Today line */}
                    {(() => {
                      const todayOffset = differenceInDays(today, startDate);
                      if (todayOffset >= 0 && todayOffset < totalDays) {
                        return (
                          <div
                            className="absolute top-0 bottom-0 w-px bg-primary/40 z-10"
                            style={{ left: todayOffset * dayWidth + dayWidth / 2 }}
                          />
                        );
                      }
                      return null;
                    })()}

                    {/* Bar */}
                    {left + width > 0 && left < totalDays * dayWidth && (
                      <div
                        className={cn(
                          "absolute top-1.5 rounded-md cursor-pointer transition-all hover:brightness-110 border-l-[3px]",
                          STATUS_COLORS[task.status],
                          PRIORITY_BORDER[task.priority || "normal"],
                          isOverdue && "ring-1 ring-red-500/40"
                        )}
                        style={{
                          left: Math.max(left, 0),
                          width: Math.min(width, totalDays * dayWidth - Math.max(left, 0)),
                          height: rowHeight - 12,
                        }}
                        onClick={() => onEditTask(task)}
                        title={`${task.title} · ${format(taskStart, "dd/MM")} → ${format(taskEnd, "dd/MM")}`}
                      >
                        <span className="text-[9px] text-white/90 font-medium px-1.5 truncate block leading-[22px]">
                          {width > 60 ? task.title : ""}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Dependency lines (SVG overlay) */}
              {depLines.length > 0 && (
                <svg
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{
                    width: totalDays * dayWidth,
                    height: headerHeight + ganttTasks.length * rowHeight,
                  }}
                >
                  {depLines.map((line, i) => {
                    const x1 = line.fromDay * dayWidth + dayWidth;
                    const y1 = headerHeight + line.fromIdx * rowHeight + rowHeight / 2;
                    const x2 = line.toDay * dayWidth;
                    const y2 = headerHeight + line.toIdx * rowHeight + rowHeight / 2;
                    const midX = (x1 + x2) / 2;
                    return (
                      <path
                        key={i}
                        d={`M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`}
                        fill="none"
                        stroke="hsl(var(--primary) / 0.3)"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        markerEnd="url(#arrow)"
                      />
                    );
                  })}
                  <defs>
                    <marker id="arrow" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M0,0 L6,3 L0,6 Z" fill="hsl(var(--primary) / 0.4)" />
                    </marker>
                  </defs>
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/50 text-center">
        {ganttTasks.length} tarefa{ganttTasks.length !== 1 ? "s" : ""} com prazo · Clique na barra para editar
      </p>
    </div>
  );
}
