import { useMemo } from 'react';
import { useFinancialStore } from '@/stores/financialStore';
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type FinancialPeriod = '30d' | '3m' | '6m' | '12m';

export interface FinancialReportMetrics {
  // Main KPIs
  currentBalance: number;
  pendingRevenue: number;
  totalExpenses: number;
  netMargin: number;
  marginPercentage: number;
  
  // Health indicators
  overdueRevenues: number;
  overdueAmount: number;
  blockedProjects: number;
  
  // Projections
  projected30Days: number;
  projected60Days: number;
  projected90Days: number;
  
  // Activity counts
  pendingMilestones: number;
  recentPayments: number;
}

export interface MonthlyFlowData {
  month: string;
  revenue: number;
  expense: number;
}

export interface CashflowProjectionPoint {
  date: string;
  balance: number;
}

export interface MilestoneAgingData {
  range: string;
  count: number;
  value: number;
}

export function useFinancialReportMetrics(period: FinancialPeriod = '6m') {
  const { revenues, expenses, contracts } = useFinancialStore();

  const periodMonths = useMemo(() => {
    switch (period) {
      case '30d': return 1;
      case '3m': return 3;
      case '6m': return 6;
      case '12m': return 12;
      default: return 6;
    }
  }, [period]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Main metrics
  const metrics = useMemo((): FinancialReportMetrics => {
    const receivedRevenue = revenues
      .filter(r => r.status === 'received')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const paidExpenses = expenses
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const currentBalance = receivedRevenue - paidExpenses;

    const pendingRevenue = revenues
      .filter(r => r.status === 'pending' || r.status === 'overdue')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const overdueRevs = revenues.filter(r => 
      (r.status === 'overdue') || (r.status === 'pending' && r.due_date < todayStr)
    );

    const overdueAmount = overdueRevs.reduce((sum, r) => sum + Number(r.amount), 0);

    // Margin calculation
    const totalReceived = receivedRevenue;
    const marginPercentage = totalReceived > 0 
      ? Math.round(((totalReceived - paidExpenses) / totalReceived) * 100)
      : 0;

    // Projections
    const days30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const days60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const days90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const projected30 = currentBalance + 
      revenues.filter(r => r.status === 'pending' && r.due_date <= days30).reduce((s, r) => s + Number(r.amount), 0) -
      expenses.filter(e => e.status === 'pending' && e.due_date <= days30).reduce((s, e) => s + Number(e.amount), 0);

    const projected60 = currentBalance + 
      revenues.filter(r => r.status === 'pending' && r.due_date <= days60).reduce((s, r) => s + Number(r.amount), 0) -
      expenses.filter(e => e.status === 'pending' && e.due_date <= days60).reduce((s, e) => s + Number(e.amount), 0);

    const projected90 = currentBalance + 
      revenues.filter(r => r.status === 'pending' && r.due_date <= days90).reduce((s, r) => s + Number(r.amount), 0) -
      expenses.filter(e => e.status === 'pending' && e.due_date <= days90).reduce((s, e) => s + Number(e.amount), 0);

    // Blocked projects (with overdue payments)
    const blockedProjectIds = new Set(overdueRevs.map(r => r.project_id).filter(Boolean));

    // Milestones pending
    const allMilestones = contracts.flatMap(c => c.milestones || []);
    const pendingMilestones = allMilestones.filter(m => m.status !== 'paid').length;

    // Recent payments (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentPayments = revenues.filter(r => 
      r.status === 'received' && r.received_date && r.received_date >= thirtyDaysAgo
    ).length;

    return {
      currentBalance,
      pendingRevenue,
      totalExpenses: paidExpenses,
      netMargin: currentBalance,
      marginPercentage,
      overdueRevenues: overdueRevs.length,
      overdueAmount,
      blockedProjects: blockedProjectIds.size,
      projected30Days: projected30,
      projected60Days: projected60,
      projected90Days: projected90,
      pendingMilestones,
      recentPayments,
    };
  }, [revenues, expenses, contracts, todayStr]);

  // Monthly flow data (Revenue vs Expense by month)
  const monthlyFlow = useMemo((): MonthlyFlowData[] => {
    const data: MonthlyFlowData[] = [];

    for (let i = periodMonths - 1; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, 'MMM', { locale: ptBR });

      const monthRevenue = revenues
        .filter(r => {
          if (r.status !== 'received' || !r.received_date) return false;
          const date = parseISO(r.received_date);
          return isWithinInterval(date, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, r) => sum + Number(r.amount), 0);

      const monthExpense = expenses
        .filter(e => {
          if (e.status !== 'paid' || !e.paid_date) return false;
          const date = parseISO(e.paid_date);
          return isWithinInterval(date, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, e) => sum + Number(e.amount), 0);

      data.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        revenue: monthRevenue,
        expense: monthExpense,
      });
    }

    return data;
  }, [revenues, expenses, periodMonths]);

  // Cashflow projection (next 30 days)
  const cashflowProjection = useMemo((): CashflowProjectionPoint[] => {
    const points: CashflowProjectionPoint[] = [];
    let runningBalance = metrics.currentBalance;

    for (let i = 0; i <= 30; i += 5) {
      const targetDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const targetStr = targetDate.toISOString().split('T')[0];

      // Add expected revenues up to this date
      const expectedRevenue = revenues
        .filter(r => r.status === 'pending' && r.due_date <= targetStr)
        .reduce((sum, r) => sum + Number(r.amount), 0);

      // Subtract expected expenses up to this date
      const expectedExpense = expenses
        .filter(e => e.status === 'pending' && e.due_date <= targetStr)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const projectedBalance = runningBalance + expectedRevenue - expectedExpense;

      points.push({
        date: format(targetDate, 'dd/MM'),
        balance: projectedBalance,
      });
    }

    return points;
  }, [revenues, expenses, metrics.currentBalance]);

  // Milestone aging (for receivables)
  const milestoneAging = useMemo((): MilestoneAgingData[] => {
    const pendingRevs = revenues.filter(r => r.status === 'pending' || r.status === 'overdue');
    
    const ranges = [
      { range: 'A vencer', filter: (r: any) => r.due_date >= todayStr },
      { range: '1-7 dias', filter: (r: any) => {
        const days = Math.floor((new Date(todayStr).getTime() - new Date(r.due_date).getTime()) / (1000 * 60 * 60 * 24));
        return days >= 1 && days <= 7;
      }},
      { range: '8-30 dias', filter: (r: any) => {
        const days = Math.floor((new Date(todayStr).getTime() - new Date(r.due_date).getTime()) / (1000 * 60 * 60 * 24));
        return days >= 8 && days <= 30;
      }},
      { range: '+30 dias', filter: (r: any) => {
        const days = Math.floor((new Date(todayStr).getTime() - new Date(r.due_date).getTime()) / (1000 * 60 * 60 * 24));
        return days > 30;
      }},
    ];

    return ranges.map(({ range, filter }) => {
      const filtered = pendingRevs.filter(filter);
      return {
        range,
        count: filtered.length,
        value: filtered.reduce((sum, r) => sum + Number(r.amount), 0),
      };
    });
  }, [revenues, todayStr]);

  // Recent activity (last payments received/expenses paid)
  const recentActivity = useMemo(() => {
    const items: Array<{ type: 'revenue' | 'expense'; description: string; amount: number; date: string }> = [];

    revenues
      .filter(r => r.status === 'received' && r.received_date)
      .sort((a, b) => new Date(b.received_date!).getTime() - new Date(a.received_date!).getTime())
      .slice(0, 5)
      .forEach(r => {
        items.push({
          type: 'revenue',
          description: r.description,
          amount: Number(r.amount),
          date: r.received_date!,
        });
      });

    expenses
      .filter(e => e.status === 'paid' && e.paid_date)
      .sort((a, b) => new Date(b.paid_date!).getTime() - new Date(a.paid_date!).getTime())
      .slice(0, 3)
      .forEach(e => {
        items.push({
          type: 'expense',
          description: e.description,
          amount: Number(e.amount),
          date: e.paid_date!,
        });
      });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [revenues, expenses]);

  return {
    metrics,
    monthlyFlow,
    cashflowProjection,
    milestoneAging,
    recentActivity,
    period,
  };
}
