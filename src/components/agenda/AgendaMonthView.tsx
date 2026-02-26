import { useMemo } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AgendaEvent {
  id: string;
  title: string;
  start: string;
  color: string;
  source: string;
  dbEvent?: any;
}

interface Props {
  currentDate: Date;
  events: AgendaEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: AgendaEvent) => void;
}

export function AgendaMonthView({ currentDate, events, onDateClick, onEventClick }: Props) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, AgendaEvent[]> = {};
    events.forEach(e => {
      const key = e.start.split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="grid grid-cols-7 bg-muted/50">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2 border-b border-border">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay[key] || [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={key}
              className={cn(
                "min-h-[100px] border-b border-r border-border p-1 cursor-pointer transition-colors hover:bg-muted/30",
                !inMonth && "opacity-40",
                today && "bg-primary/5"
              )}
              onClick={() => onDateClick(day)}
            >
              <div className={cn(
                "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                today && "bg-primary text-primary-foreground"
              )}>
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: event.color + "20", color: event.color, borderLeft: `2px solid ${event.color}` }}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
