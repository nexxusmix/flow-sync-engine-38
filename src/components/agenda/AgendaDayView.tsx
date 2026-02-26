import { useMemo } from "react";
import { format, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Video } from "lucide-react";
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
  onEventClick: (event: AgendaEvent) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  project: "Projeto",
  marketing: "Marketing",
  google: "Google",
  task: "Tarefa",
};

export function AgendaDayView({ currentDate, events, onEventClick }: Props) {
  const dayStr = format(currentDate, "yyyy-MM-dd");
  const dayEvents = useMemo(() => events.filter(e => e.start.startsWith(dayStr)), [events, dayStr]);
  const allDayEvts = dayEvents.filter(e => e.allDay);
  const timedEvts = dayEvents.filter(e => !e.allDay);

  const getHour = (timeStr: string) => {
    try { return parseISO(timeStr).getHours(); } catch { return 8; }
  };

  return (
    <div className="space-y-4">
      {/* All-day events */}
      {allDayEvts.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium mb-1">Dia inteiro</p>
          {allDayEvts.map(event => (
            <Card
              key={event.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              style={{ borderLeft: `3px solid ${event.color}` }}
              onClick={() => onEventClick(event)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {SOURCE_LABELS[event.source] || event.source}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {HOURS.map(hour => {
          const hourEvents = timedEvts.filter(e => getHour(e.start) === hour);
          return (
            <div key={hour} className="flex border-b border-border last:border-b-0 min-h-[60px]">
              <div className="w-16 flex-shrink-0 text-xs text-muted-foreground text-right pr-3 pt-2 border-r border-border">
                {String(hour).padStart(2, "0")}:00
              </div>
              <div className="flex-1 p-1 space-y-1">
                {hourEvents.map(event => (
                  <div
                    key={event.id}
                    className="px-3 py-2 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: event.color + "15", borderLeft: `3px solid ${event.color}` }}
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium" style={{ color: event.color }}>{event.title}</p>
                      <Badge variant="outline" className="text-[9px]">
                        {SOURCE_LABELS[event.source] || event.source}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(parseISO(event.start), "HH:mm")} — {format(parseISO(event.end), "HH:mm")}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-[11px] text-muted-foreground mt-1">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {dayEvents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum evento neste dia</p>
        </div>
      )}
    </div>
  );
}
