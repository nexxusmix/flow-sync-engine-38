import { useMemo } from 'react';
import { useProjects, ProjectWithStages } from '@/hooks/useProjects';
import { subMonths, subDays, parseISO, isWithinInterval, startOfDay, endOfDay, isBefore } from 'date-fns';

export type PeriodType = '1m' | '3m' | '6m' | '1y';

export interface Report360Metrics {
  delivered: number;
  open: number;
  delayed: number;
  onTimePercentage: number;
  totalValue: number;
  avgHealthScore: number;
}

export interface MonthlyData {
  month: string;
  delivered: number;
  open: number;
  delayed: number;
}

export function useReport360Metrics(period: PeriodType = '1m') {
  const { projects, isLoading } = useProjects();
  
  const dateRange = useMemo(() => {
    const today = startOfDay(new Date());
    let startDate: Date;
    
    switch (period) {
      case '1m':
        startDate = subMonths(today, 1);
        break;
      case '3m':
        startDate = subMonths(today, 3);
        break;
      case '6m':
        startDate = subMonths(today, 6);
        break;
      case '1y':
        startDate = subMonths(today, 12);
        break;
      default:
        startDate = subMonths(today, 1);
    }
    
    return { startDate, endDate: endOfDay(today) };
  }, [period]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const createdAt = parseISO(p.created_at);
      return isWithinInterval(createdAt, { start: dateRange.startDate, end: dateRange.endDate }) || 
        (p.status === 'active' && isBefore(createdAt, dateRange.startDate));
    });
  }, [projects, dateRange]);

  const metrics = useMemo((): Report360Metrics => {
    const today = new Date();
    
    const delivered = filteredProjects.filter(p => p.status === 'completed').length;
    const open = filteredProjects.filter(p => p.status === 'active').length;
    
    // Delayed = active projects with due_date in the past
    const delayed = filteredProjects.filter(p => {
      if (p.status !== 'active' || !p.due_date) return false;
      return isBefore(parseISO(p.due_date), today);
    }).length;
    
    const totalCompleted = delivered;
    const onTimeDelivered = filteredProjects.filter(p => {
      if (p.status !== 'completed') return false;
      // Assuming on-time if completed (no specific delivery tracking)
      return true;
    }).length;
    
    const onTimePercentage = totalCompleted > 0 
      ? Math.round((onTimeDelivered / totalCompleted) * 100)
      : 0;
    
    const totalValue = filteredProjects.reduce((acc, p) => acc + (p.contract_value || 0), 0);
    
    const activeProjects = filteredProjects.filter(p => p.status === 'active');
    const avgHealthScore = activeProjects.length > 0
      ? Math.round(activeProjects.reduce((acc, p) => acc + (p.health_score || 0), 0) / activeProjects.length)
      : 0;
    
    return {
      delivered,
      open,
      delayed,
      onTimePercentage,
      totalValue,
      avgHealthScore,
    };
  }, [filteredProjects]);

  const monthlyData = useMemo((): MonthlyData[] => {
    const monthsCount = period === '1y' ? 12 : period === '6m' ? 6 : period === '3m' ? 3 : 1;
    const data: MonthlyData[] = [];
    const today = new Date();
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthStart = startOfDay(subMonths(today, i));
      const monthEnd = i === 0 ? endOfDay(today) : endOfDay(subMonths(today, i - 1));
      
      const monthProjects = filteredProjects.filter(p => {
        const createdAt = parseISO(p.created_at);
        return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
      });
      
      const monthLabel = monthStart.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      
      data.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        delivered: monthProjects.filter(p => p.status === 'completed').length,
        open: monthProjects.filter(p => p.status === 'active').length,
        delayed: monthProjects.filter(p => {
          if (p.status !== 'active' || !p.due_date) return false;
          return isBefore(parseISO(p.due_date), today);
        }).length,
      });
    }
    
    return data;
  }, [filteredProjects, period]);

  const statusDistribution = useMemo(() => {
    const counts = {
      active: filteredProjects.filter(p => p.status === 'active').length,
      completed: filteredProjects.filter(p => p.status === 'completed').length,
      paused: filteredProjects.filter(p => p.status === 'paused').length,
      archived: filteredProjects.filter(p => p.status === 'archived').length,
    };
    
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({ status, count }));
  }, [filteredProjects]);

  return {
    metrics,
    monthlyData,
    statusDistribution,
    filteredProjects,
    isLoading,
    period,
    dateRange,
  };
}
