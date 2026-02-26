import { useMemo } from "react";
import { startOfWeek, addDays, format, isSameDay, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AgendaEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  type: string;
  source: string;
  description?: string;
  dbEvent?: any;
}

interface Props {
  currentDate: Date;
  events: AgendaEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: AgendaEvent) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 - 22:00

export function AgendaWeekView({ currentDate, events, onDateClick, onEventClick }: Props) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return events.filter(e => e.start.startsWith(dayStr));
  };

  const allDayEvents = (day: Date) => getEventsForDay(day).filter(e => e.allDay);
  const timedEvents = (day: Date) => getEventsForDay(day).filter(e => !e.allDay);

  const getHourPosition = (timeStr: string) => {
    try {
      const d = parseISO(timeStr);
      return d.getHours() + d.getMinutes() / 60;
    } catch { return 8; }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-muted/50 border-b border-border">
        <div className="border-r border-border" />
        {weekDays.map(day => (
          <div
            key={day.toISOString()}
            className={cn(
              "text-center py-2 border-r border-border cursor-pointer hover:bg-muted/30",
              isToday(day) && "bg-primary/10"
            )}
            onClick={() => onDateClick(day)}
          >
            <div className="text-[10px] text-muted-foreground uppercase">
              {format(day, "EEE", { locale: ptBR })}
            </div>
            <div className={cn(
              "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mx-auto",
              isToday(day) && "bg-primary text-primary-foreground"
            )}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* All-day events */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
        <div className="text-[10px] text-muted-foreground p-1 border-r border-border flex items-center justify-center">
          dia todo
        </div>
        {weekDays.map(day => {
          const dayAllDay = allDayEvents(day);
          return (
            <div key={day.toISOString()} className="p-1 border-r border-border min-h-[40px] space-y-0.5">
              {dayAllDay.slice(0, 2).map(event => (
                <div
                  key={event.id}
                  className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: event.color + "20", color: event.color }}
                  onClick={() => onEventClick(event)}
                >
                  {event.title}
                </div>
              ))}
              {dayAllDay.length > 2 && (
                <div className="text-[10px] text-muted-foreground">+{dayAllDay.length - 2}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] max-h-[500px] overflow-y-auto">
        {HOURS.map(hour => (
          <div key={hour} className="contents">
            <div className="text-[10px] text-muted-foreground text-right pr-2 py-1 border-r border-border h-[50px] flex items-start justify-end">
              {String(hour).padStart(2, "0")}:00
            </div>
            {weekDays.map(day => {
              const dayTimed = timedEvents(day);
              const hourEvents = dayTimed.filter(e => {
                const h = getHourPosition(e.start);
                return Math.floor(h) === hour;
              });

              return (
                <div
                  key={day.toISOString() + hour}
                  className="border-r border-b border-border h-[50px] relative cursor-pointer hover:bg-muted/20"
                  onClick={() => onDateClick(day)}
                >
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className="absolute inset-x-0.5 text-[10px] px-1 py-0.5 rounded cursor-pointer hover:opacity-80 z-10"
                      style={{
                        backgroundColor: event.color + "30",
                        color: event.color,
                        borderLeft: `2px solid ${event.color}`,
                        top: `${((getHourPosition(event.start) % 1) * 100)}%`,
                      }}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
