import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Package,
  DollarSign,
  Layers,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  getDay,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const EVENT_ICONS: Record<CalendarEvent['type'], React.ReactNode> = {
  delivery: <Package className="w-3 h-3" />,
  payment: <DollarSign className="w-3 h-3" />,
  stage: <Layers className="w-3 h-3" />,
  meeting: <CalendarIcon className="w-3 h-3" />,
  content: <FileText className="w-3 h-3" />,
  milestone: <DollarSign className="w-3 h-3" />,
};

const SEVERITY_STYLES: Record<CalendarEvent['severity'], string> = {
  normal: 'bg-muted/50 text-foreground border-border/50',
  risk: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
};

interface EventItemProps {
  event: CalendarEvent;
  compact?: boolean;
}

function EventItem({ event, compact = false }: EventItemProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (compact) {
    return (
      <div 
        className={cn(
          "w-2 h-2 rounded-full cursor-pointer",
          event.severity === 'critical' && "bg-destructive",
          event.severity === 'risk' && "bg-amber-500",
          event.severity === 'normal' && "bg-primary"
        )}
        title={event.title}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-2 rounded-lg border text-xs cursor-pointer hover:shadow-md transition-all",
        SEVERITY_STYLES[event.severity]
      )}
    >
      <div className="flex items-start gap-2">
        <span style={{ color: event.color }}>{EVENT_ICONS[event.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{event.title}</p>
          {event.projectName && (
            <p className="text-muted-foreground text-[10px] truncate">{event.projectName}</p>
          )}
          {event.amount && (
            <p className="text-[10px] font-medium mt-1">{formatCurrency(event.amount)}</p>
          )}
        </div>
        {event.severity === 'critical' && (
          <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0" />
        )}
      </div>
    </motion.div>
  );
}

export function ProjectsCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { eventsByDate, getEventsForMonth, stats } = useCalendarEvents();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get padding days for the calendar grid
  const startPadding = getDay(monthStart);
  const paddingDays = Array(startPadding).fill(null);

  const monthEvents = getEventsForMonth(
    currentMonth.getFullYear(), 
    currentMonth.getMonth()
  );

  const selectedDateEvents = selectedDate 
    ? eventsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Calendário de Projetos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="gap-1">
              <Package className="w-3 h-3" /> {stats.deliveries} entregas
            </Badge>
            <Badge variant="outline" className="gap-1">
              <DollarSign className="w-3 h-3" /> {stats.payments} pagamentos
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Layers className="w-3 h-3" /> {stats.stages} etapas
            </Badge>
            {stats.critical > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" /> {stats.critical} críticos
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Padding days */}
            {paddingDays.map((_, index) => (
              <div key={`pad-${index}`} className="aspect-square" />
            ))}

            {/* Actual days */}
            {daysInMonth.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDate[dateKey] || [];
              const hasEvents = dayEvents.length > 0;
              const hasCritical = dayEvents.some(e => e.severity === 'critical');
              const hasRisk = dayEvents.some(e => e.severity === 'risk');
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <motion.button
                  key={dateKey}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "aspect-square p-1 rounded-lg border transition-all relative flex flex-col items-center justify-start",
                    isToday(day) && "border-primary",
                    isSelected && "bg-primary/10 border-primary",
                    !isSelected && "border-transparent hover:border-border hover:bg-muted/30",
                    hasCritical && !isSelected && "bg-destructive/5",
                    hasRisk && !hasCritical && !isSelected && "bg-amber-500/5"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={cn(
                    "text-xs font-medium",
                    isToday(day) && "text-primary",
                    !isSameMonth(day, currentMonth) && "text-muted-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {hasEvents && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full">
                      {dayEvents.slice(0, 3).map(event => (
                        <EventItem key={event.id} event={event} compact />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Events / Upcoming */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {selectedDate 
              ? format(selectedDate, "d 'de' MMMM", { locale: ptBR })
              : 'Próximos Eventos'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-2">
            <AnimatePresence mode="wait">
              {selectedDate ? (
                <motion.div
                  key={selectedDate.toISOString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map(event => (
                      <EventItem key={event.id} event={event} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum evento neste dia
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="upcoming"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {monthEvents.slice(0, 10).map(event => (
                    <EventItem key={event.id} event={event} />
                  ))}
                  {monthEvents.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum evento este mês
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
