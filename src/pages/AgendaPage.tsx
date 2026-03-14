import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useCalendar, DBCalendarEvent } from "@/hooks/useCalendar";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { AgendaMonthView } from "@/components/agenda/AgendaMonthView";
import { AgendaWeekView } from "@/components/agenda/AgendaWeekView";
import { AgendaDayView } from "@/components/agenda/AgendaDayView";
import { EventFormDialog } from "@/components/agenda/EventFormDialog";
import { ReminderConfig } from "@/components/agenda/ReminderConfig";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, Plus, ChevronLeft, ChevronRight, RefreshCw, 
  CalendarDays, LayoutGrid, List, Filter
} from "lucide-react";
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

type ViewMode = "month" | "week" | "day";
type SourceFilter = "all" | "manual" | "project" | "marketing" | "task" | "google";

export default function AgendaPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DBCalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { events: dbEvents, createEvent, updateEvent, deleteEvent, isLoading, refetch, isCreating } = useCalendar(currentDate);
  const { events: derivedEvents } = useCalendarEvents();

  // Merge DB events + derived events (projects/marketing/financial)
  const allEvents = useMemo(() => {
    const merged: Array<{
      id: string;
      title: string;
      start: string;
      end: string;
      allDay: boolean;
      type: string;
      source: string;
      color: string;
      description?: string;
      projectId?: string;
      dbEvent?: DBCalendarEvent;
    }> = [];

    // DB events
    dbEvents.forEach(e => {
      const eventSource = (e as any).source || "manual";
      merged.push({
        id: e.id,
        title: e.title,
        start: e.start_at,
        end: e.end_at,
        allDay: e.all_day || false,
        type: e.event_type || "meeting",
        source: eventSource,
        color: eventSource === "google" ? "#4285f4" : (e.color || "#3b82f6"),
        description: e.description || undefined,
        projectId: e.project_id || undefined,
        dbEvent: e,
      });
    });

    // Derived events (unique by id to avoid dupes)
    const dbIds = new Set(dbEvents.map(e => e.id));
    derivedEvents.forEach(e => {
      if (dbIds.has(e.id)) return;
      merged.push({
        id: e.id,
        title: e.title,
        start: e.date,
        end: e.endDate || e.date,
        allDay: true,
        type: e.type,
        source: e.type === "content" ? "marketing" : e.type === "delivery" || e.type === "stage" ? "project" : "task",
        color: e.color,
        description: e.description,
        projectId: e.projectId,
      });
    });

    // Filter by source
    if (sourceFilter !== "all") {
      return merged.filter(e => e.source === sourceFilter);
    }
    return merged;
  }, [dbEvents, derivedEvents, sourceFilter]);

  const navigate_ = (direction: "prev" | "next") => {
    if (viewMode === "month") {
      setCurrentDate(d => direction === "next" ? addMonths(d, 1) : subMonths(d, 1));
    } else if (viewMode === "week") {
      setCurrentDate(d => direction === "next" ? addWeeks(d, 1) : subWeeks(d, 1));
    } else {
      setCurrentDate(d => direction === "next" ? addDays(d, 1) : subDays(d, 1));
    }
  };

  const headerLabel = () => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy", { locale: ptBR });
    if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, "d MMM", { locale: ptBR })} — ${format(weekEnd, "d MMM yyyy", { locale: ptBR })}`;
    }
    return format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: ptBR });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEventClick = (event: typeof allEvents[0]) => {
    if (event.dbEvent) {
      setEditingEvent(event.dbEvent);
      setSelectedDate(null);
      setShowEventForm(true);
    }
  };

  const handleCreateEvent = (input: any) => {
    createEvent(input);
    setShowEventForm(false);
  };

  const handleUpdateEvent = (id: string, data: any) => {
    updateEvent({ id, data });
    setShowEventForm(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
    setShowEventForm(false);
    setEditingEvent(null);
  };

  return (
    <DashboardLayout title="Agenda">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              Agenda
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Todos os eventos unificados em um só lugar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                const { data, error } = await (await import("@/integrations/supabase/client")).supabase.functions.invoke("google-calendar-sync", { body: { action: "sync" } });
                if (error) throw error;
                refetch();
                (await import("sonner")).toast.success("Google Calendar sincronizado!");
              } catch {
                (await import("sonner")).toast.error("Erro ao sincronizar. Verifique a conexão em Integrações.");
              }
            }}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Sincronizar Google
            </Button>
            <Button size="sm" onClick={() => { setEditingEvent(null); setSelectedDate(new Date()); setShowEventForm(true); }}>
              <Plus className="w-4 h-4 mr-1" />
              Novo Evento
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card className="bg-card/50">
          <CardContent className="p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate_("prev")}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hoje
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate_("next")}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium capitalize min-w-[180px] text-center">
                {headerLabel()}
              </span>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-3">
              <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fontes</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="project">Projetos</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>

              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList className="h-8">
                  <TabsTrigger value="month" className="text-xs px-2 h-6">
                    <LayoutGrid className="w-3 h-3 mr-1" /> Mês
                  </TabsTrigger>
                  <TabsTrigger value="week" className="text-xs px-2 h-6">
                    <CalendarDays className="w-3 h-3 mr-1" /> Semana
                  </TabsTrigger>
                  <TabsTrigger value="day" className="text-xs px-2 h-6">
                    <List className="w-3 h-3 mr-1" /> Dia
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        <motion.div
          key={viewMode + currentDate.toISOString()}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === "month" && (
            <AgendaMonthView
              currentDate={currentDate}
              events={allEvents}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
          {viewMode === "week" && (
            <AgendaWeekView
              currentDate={currentDate}
              events={allEvents}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
          {viewMode === "day" && (
            <AgendaDayView
              currentDate={currentDate}
              events={allEvents}
              onEventClick={handleEventClick}
            />
          )}
        </motion.div>

        {/* Event Form Dialog */}
        <EventFormDialog
          open={showEventForm}
          onOpenChange={setShowEventForm}
          editingEvent={editingEvent}
          defaultDate={selectedDate}
          onCreate={handleCreateEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          isCreating={isCreating}
        />
      </div>
    </DashboardLayout>
  );
}
