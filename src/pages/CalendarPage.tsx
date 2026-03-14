import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectsCalendar } from "@/components/calendar/ProjectsCalendar";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Package,
  DollarSign,
} from "lucide-react";
import { parseISO, differenceInDays } from "date-fns";

export default function CalendarPage() {
  const { getUpcomingEvents, stats } = useCalendarEvents();
  
  const upcomingEvents = getUpcomingEvents(7);
  const criticalEvents = upcomingEvents.filter(e => e.severity === 'critical');
  const riskEvents = upcomingEvents.filter(e => e.severity === 'risk');

  const getDaysLabel = (dateStr: string) => {
    const days = differenceInDays(parseISO(dateStr), new Date());
    if (days < 0) return `${Math.abs(days)}d atrasado`;
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Amanhã';
    return `em ${days}d`;
  };

  return (
    <DashboardLayout title="Calendário Unificado">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              Calendário Unificado
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Visualize entregas, pagamentos e marcos de todos os projetos
            </p>
          </div>
        </div>

        {/* Alert Cards */}
        {(criticalEvents.length > 0 || riskEvents.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      Atenção Imediata ({criticalEvents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[120px]">
                      <div className="space-y-2">
                        {criticalEvents.slice(0, 5).map(event => (
                          <div key={event.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              {event.type === 'delivery' ? (
                                <Package className="w-3 h-3 flex-shrink-0" />
                              ) : (
                                <DollarSign className="w-3 h-3 flex-shrink-0" />
                              )}
                              <span className="truncate">{event.title}</span>
                            </div>
                            <Badge variant="destructive" className="text-[10px] flex-shrink-0">
                              {getDaysLabel(event.date)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {riskEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-border bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Em Risco ({riskEvents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[120px]">
                      <div className="space-y-2">
                        {riskEvents.slice(0, 5).map(event => (
                          <div key={event.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              {event.type === 'delivery' ? (
                                <Package className="w-3 h-3 flex-shrink-0" />
                              ) : (
                                <DollarSign className="w-3 h-3 flex-shrink-0" />
                              )}
                              <span className="truncate">{event.title}</span>
                            </div>
                            <Badge className="bg-muted text-muted-foreground text-[10px] flex-shrink-0">
                              {getDaysLabel(event.date)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.upcoming}</p>
                  <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.deliveries}</p>
                  <p className="text-xs text-muted-foreground">Entregas pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.payments}</p>
                  <p className="text-xs text-muted-foreground">Pagamentos previstos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.critical}</p>
                  <p className="text-xs text-muted-foreground">Itens críticos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Calendar */}
        <ProjectsCalendar />
      </div>
    </DashboardLayout>
  );
}
