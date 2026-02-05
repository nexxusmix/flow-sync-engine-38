import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useFinancialStore } from '@/stores/financialStore';
import { useMarketingStore } from '@/stores/marketingStore';
import { differenceInDays, parseISO } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: 'delivery' | 'payment' | 'stage' | 'meeting' | 'content' | 'milestone';
  projectId?: string;
  projectName?: string;
  clientName?: string;
  severity: 'normal' | 'risk' | 'critical';
  color: string;
  amount?: number;
  description?: string;
  status?: string;
}

const TYPE_COLORS: Record<CalendarEvent['type'], string> = {
  delivery: '#22c55e',   // green
  payment: '#f59e0b',    // amber
  stage: '#3b82f6',      // blue
  meeting: '#8b5cf6',    // purple
  content: '#ec4899',    // pink
  milestone: '#f59e0b',  // amber
};

export function useCalendarEvents() {
  const { projects } = useProjects();
  const { revenues, contracts } = useFinancialStore();
  const { contentItems } = useMarketingStore();

  const events = useMemo(() => {
    const today = new Date();
    const allEvents: CalendarEvent[] = [];

    // 1. Events from Projects (deliveries and stages)
    projects.forEach(project => {
      // Project delivery date
      if (project.due_date) {
        const deliveryDate = parseISO(project.due_date);
        const daysUntil = differenceInDays(deliveryDate, today);
        
        let severity: CalendarEvent['severity'] = 'normal';
        if (daysUntil < 0) severity = 'critical';
        else if (daysUntil <= 3) severity = 'critical';
        else if (daysUntil <= 7) severity = 'risk';

        allEvents.push({
          id: `proj-delivery-${project.id}`,
          title: `Entrega: ${project.name}`,
          date: project.due_date,
          type: 'delivery',
          projectId: project.id,
          projectName: project.name,
          clientName: project.client_name || undefined,
          severity,
          color: TYPE_COLORS.delivery,
          status: project.status,
        });
      }

      // Project stages with planned dates
      project.stages?.forEach(stage => {
        if (stage.planned_start && stage.status !== 'completed') {
          const stageDate = parseISO(stage.planned_start);
          const daysUntil = differenceInDays(stageDate, today);
          
          let severity: CalendarEvent['severity'] = 'normal';
          if (daysUntil < 0) severity = 'critical';
          else if (daysUntil <= 3) severity = 'risk';

          allEvents.push({
            id: `stage-${project.id}-${stage.id}`,
            title: `${stage.title} - ${project.name}`,
            date: stage.planned_start,
            type: 'stage',
            projectId: project.id,
            projectName: project.name,
            severity,
            color: TYPE_COLORS.stage,
            status: stage.status,
          });
        }
      });
    });

    // 2. Events from Financial (payments)
    revenues.forEach(revenue => {
      if (revenue.status !== 'received' && revenue.due_date) {
        const dueDate = parseISO(revenue.due_date);
        const daysUntil = differenceInDays(dueDate, today);
        
        let severity: CalendarEvent['severity'] = 'normal';
        if (daysUntil < 0) severity = 'critical';
        else if (daysUntil <= 3) severity = 'risk';

        // Try to find project name from contracts
        const contract = contracts.find(c => c.project_id === revenue.project_id);

        allEvents.push({
          id: `revenue-${revenue.id}`,
          title: `💰 ${revenue.description}`,
          date: revenue.due_date,
          type: 'payment',
          projectId: revenue.project_id,
          projectName: contract?.project_name,
          clientName: contract?.client_name,
          severity,
          color: TYPE_COLORS.payment,
          amount: revenue.amount,
          status: revenue.status,
        });
      }
    });

    // Contract milestones (from nested relation)
    contracts.forEach(contract => {
      contract.milestones?.forEach(milestone => {
        if (milestone.status !== 'paid' && milestone.due_date) {
          const dueDate = parseISO(milestone.due_date);
          const daysUntil = differenceInDays(dueDate, today);
          
          let severity: CalendarEvent['severity'] = 'normal';
          if (daysUntil < 0) severity = 'critical';
          else if (daysUntil <= 3) severity = 'risk';

          allEvents.push({
            id: `milestone-${milestone.id}`,
            title: `📋 ${milestone.title}`,
            date: milestone.due_date,
            type: 'milestone',
            projectId: contract.project_id,
            projectName: contract.project_name,
            severity,
            color: TYPE_COLORS.milestone,
            amount: milestone.amount,
            status: milestone.status,
          });
        }
      });
    });

    // 3. Events from Marketing (scheduled content)
    contentItems.forEach(item => {
      if (item.scheduled_at && item.status !== 'published') {
        const scheduledDate = parseISO(item.scheduled_at);
        const daysUntil = differenceInDays(scheduledDate, today);
        
        let severity: CalendarEvent['severity'] = 'normal';
        if (daysUntil < 0) severity = 'risk';
        else if (daysUntil <= 1) severity = 'risk';

        allEvents.push({
          id: `content-${item.id}`,
          title: `📱 ${item.title}`,
          date: item.scheduled_at.split('T')[0],
          type: 'content',
          severity,
          color: TYPE_COLORS.content,
          description: item.channel ? `Canal: ${item.channel}` : undefined,
          status: item.status,
        });
      }
    });

    // Sort by date
    return allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [projects, revenues, contracts, contentItems]);

  // Group events by date for calendar view
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      const dateKey = event.date.split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [events]);

  // Get events for a specific month
  const getEventsForMonth = (year: number, month: number) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  };

  // Get upcoming events (next N days)
  const getUpcomingEvents = (days: number = 30) => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      return eventDate >= today && eventDate <= futureDate;
    });
  };

  // Stats
  const stats = useMemo(() => {
    const upcoming = getUpcomingEvents(30);
    return {
      total: events.length,
      upcoming: upcoming.length,
      critical: events.filter(e => e.severity === 'critical').length,
      risk: events.filter(e => e.severity === 'risk').length,
      deliveries: events.filter(e => e.type === 'delivery').length,
      payments: events.filter(e => e.type === 'payment' || e.type === 'milestone').length,
      stages: events.filter(e => e.type === 'stage').length,
      content: events.filter(e => e.type === 'content').length,
    };
  }, [events]);

  return {
    events,
    eventsByDate,
    getEventsForMonth,
    getUpcomingEvents,
    stats,
  };
}
