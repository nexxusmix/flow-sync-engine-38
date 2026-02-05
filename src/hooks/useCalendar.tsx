import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, addDays, parseISO, isBefore, differenceInDays, format } from 'date-fns';

export interface DBCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean | null;
  event_type: 'meeting' | 'deadline' | 'delivery' | 'task' | 'milestone' | null;
  project_id: string | null;
  deal_id: string | null;
  color: string | null;
  location: string | null;
  meet_url: string | null;
  status: string | null;
  visibility: string | null;
  workspace_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  all_day?: boolean;
  event_type?: 'meeting' | 'deadline' | 'delivery' | 'task' | 'milestone';
  project_id?: string;
  deal_id?: string;
  color?: string;
  location?: string;
  meet_url?: string;
}

export function useCalendar(month?: Date) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Calculate date range for query
  const currentMonth = month || new Date();
  const rangeStart = startOfMonth(currentMonth);
  const rangeEnd = endOfMonth(addDays(currentMonth, 60)); // Get 2 months ahead

  // Fetch events
  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ['calendar-events', format(rangeStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_at', rangeStart.toISOString())
        .lte('start_at', rangeEnd.toISOString())
        .order('start_at', { ascending: true });

      if (error) throw error;
      return (data || []) as DBCalendarEvent[];
    },
    enabled: !!user,
  });

  // Fetch upcoming events (next 7 days)
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['calendar-upcoming'],
    queryFn: async () => {
      const now = new Date();
      const weekFromNow = addDays(now, 7);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_at', now.toISOString())
        .lte('start_at', weekFromNow.toISOString())
        .order('start_at', { ascending: true });

      if (error) throw error;
      return (data || []) as DBCalendarEvent[];
    },
    enabled: !!user,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: input.title,
          description: input.description || null,
          start_at: input.start_at,
          end_at: input.end_at,
          all_day: input.all_day || false,
          event_type: input.event_type || 'meeting',
          project_id: input.project_id || null,
          deal_id: input.deal_id || null,
          color: input.color || '#3b82f6',
          location: input.location || null,
          meet_url: input.meet_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-upcoming'] });
      toast.success('Evento criado!');
    },
    onError: (error) => {
      console.error('Error creating event:', error);
      toast.error('Erro ao criar evento');
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DBCalendarEvent> }) => {
      const { error } = await supabase
        .from('calendar_events')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-upcoming'] });
      toast.success('Evento atualizado!');
    },
    onError: (error) => {
      console.error('Error updating event:', error);
      toast.error('Erro ao atualizar evento');
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-upcoming'] });
      toast.success('Evento excluído!');
    },
    onError: (error) => {
      console.error('Error deleting event:', error);
      toast.error('Erro ao excluir evento');
    },
  });

  // Calculate stats
  const now = new Date();
  const stats = {
    total: events.length,
    upcoming: upcomingEvents.length,
    deliveries: events.filter(e => e.event_type === 'delivery' || e.event_type === 'deadline').length,
    meetings: events.filter(e => e.event_type === 'meeting').length,
    overdue: events.filter(e => {
      const eventDate = parseISO(e.start_at);
      return isBefore(eventDate, now) && e.status !== 'completed';
    }).length,
    critical: upcomingEvents.filter(e => {
      const eventDate = parseISO(e.start_at);
      const daysUntil = differenceInDays(eventDate, now);
      return daysUntil <= 3 && (e.event_type === 'deadline' || e.event_type === 'delivery');
    }).length,
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => e.start_at.startsWith(dateStr));
  };

  // Get events by type
  const getEventsByType = (type: DBCalendarEvent['event_type']) => {
    return events.filter(e => e.event_type === type);
  };

  // Categorize upcoming events by severity
  const categorizedUpcoming = upcomingEvents.map(event => {
    const eventDate = parseISO(event.start_at);
    const daysUntil = differenceInDays(eventDate, now);
    
    let severity: 'critical' | 'risk' | 'normal' = 'normal';
    if (daysUntil < 0) severity = 'critical';
    else if (daysUntil <= 3) severity = 'critical';
    else if (daysUntil <= 7) severity = 'risk';

    return { ...event, severity, daysUntil };
  });

  return {
    events,
    upcomingEvents,
    categorizedUpcoming,
    stats,
    isLoading,
    error,
    refetch,
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    getEventsForDate,
    getEventsByType,
    isCreating: createEventMutation.isPending,
  };
}

// Hook for syncing project deadlines to calendar
export function useSyncProjectToCalendar() {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async ({ projectId, projectName, dueDate, stages }: {
      projectId: string;
      projectName: string;
      dueDate?: string;
      stages?: Array<{ stage_key: string; title: string; planned_end?: string | null }>;
    }) => {
      const events: CreateEventInput[] = [];

      // Main deadline event
      if (dueDate) {
        events.push({
          title: `Entrega: ${projectName}`,
          description: `Data prevista de entrega do projeto`,
          start_at: `${dueDate}T09:00:00`,
          end_at: `${dueDate}T18:00:00`,
          all_day: true,
          event_type: 'deadline',
          project_id: projectId,
          color: '#22c55e',
        });
      }

      // Stage milestones
      if (stages) {
        for (const stage of stages) {
          if (stage.planned_end) {
            events.push({
              title: `${stage.title} - ${projectName}`,
              description: `Etapa do projeto: ${stage.title}`,
              start_at: `${stage.planned_end}T09:00:00`,
              end_at: `${stage.planned_end}T18:00:00`,
              all_day: true,
              event_type: 'milestone',
              project_id: projectId,
              color: '#8b5cf6',
            });
          }
        }
      }

      if (events.length === 0) return;

      // Delete existing events for this project first
      await supabase
        .from('calendar_events')
        .delete()
        .eq('project_id', projectId);

      // Insert new events
      const { error } = await supabase
        .from('calendar_events')
        .insert(events);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  return {
    syncProject: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
  };
}
