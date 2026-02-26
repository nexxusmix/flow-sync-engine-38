import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import {
  startOfMonth, endOfMonth, subMonths, format, parseISO,
  differenceInDays, isWithinInterval, startOfDay, subDays, isSameDay, getDay, getHours, addDays
} from 'date-fns';

export interface ExecutiveMetrics {
  // Financial
  revenueCurrentMonth: number;
  revenuePrevMonth: number;
  revenueDelta: number;
  expenseCurrentMonth: number;
  expensePrevMonth: number;
  expenseDelta: number;
  balanceCurrent: number;
  pendingRevenue: number;
  // Projects
  projectsActive: number;
  projectsCompleted: number;
  projectsAtRisk: number;
  projectsBlocked: number;
  avgHealthScore: number;
  // CRM
  dealsActive: number;
  pipelineValue: number;
  forecast: number;
  wonDeals: number;
  wonValue: number;
  conversionRate: number;
  // Tasks
  tasksTotal: number;
  tasksPending: number;
  tasksCompletedThisMonth: number;
  tasksCompletedPrevMonth: number;
  tasksDelta: number;
  avgCompletionDays: number;
  velocityPerDay: number;
  // Content
  contentTotal: number;
  contentPublished: number;
  // Productivity
  productivityScore: number;
  burndownData: { date: string; remaining: number; ideal: number }[];
  completionTrend: { date: string; count: number }[];
  revenueByMonth: { month: string; revenue: number; expense: number }[];
  tasksByCategory: { name: string; value: number; fill: string }[];
  dealsByStage: { stage: string; count: number; value: number }[];
  heatmap: { day: number; hour: number; count: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  pessoal: 'hsl(280, 60%, 50%)',
  operacao: 'hsl(210, 80%, 50%)',
  projeto: 'hsl(30, 80%, 50%)',
};

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  qualificacao: 'Qualificação',
  diagnostico: 'Diagnóstico',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  fechado: 'Fechado',
  onboarding: 'Onboarding',
  pos_venda: 'Pós-Venda',
};

export function useExecutiveDashboard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['executive-dashboard'],
    queryFn: async (): Promise<ExecutiveMetrics> => {
      const now = new Date();
      const today = startOfDay(now);
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const prevMonthStart = startOfMonth(subMonths(now, 1));
      const prevMonthEnd = endOfMonth(subMonths(now, 1));

      const [
        projectsRes, dealsRes, revenuesRes, expensesRes,
        tasksRes, contentRes, stagesRes
      ] = await Promise.all([
        supabase.from('projects').select('*').neq('status', 'archived'),
        supabase.from('crm_deals').select('*'),
        supabase.from('revenues').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('content_items').select('id, status, published_at'),
        supabase.from('project_stages').select('*'),
      ]);

      const projects = projectsRes.data || [];
      const deals = dealsRes.data || [];
      const revenues = revenuesRes.data || [];
      const expenses = expensesRes.data || [];
      const tasks = tasksRes.data || [];
      const content = contentRes.data || [];
      const stages = stagesRes.data || [];

      const todayStr = format(now, 'yyyy-MM-dd');
      const cmStart = format(currentMonthStart, 'yyyy-MM-dd');
      const cmEnd = format(currentMonthEnd, 'yyyy-MM-dd');
      const pmStart = format(prevMonthStart, 'yyyy-MM-dd');
      const pmEnd = format(prevMonthEnd, 'yyyy-MM-dd');

      // ── Financial ──
      const processedRevenues = revenues.map(r => ({
        ...r,
        status: r.status === 'pending' && r.due_date < todayStr ? 'overdue' : r.status,
      }));
      const processedExpenses = expenses.map(e => ({
        ...e,
        status: e.status === 'pending' && e.due_date < todayStr ? 'overdue' : e.status,
      }));

      const revenueCurrentMonth = processedRevenues
        .filter(r => r.status === 'received' && r.received_date && r.received_date >= cmStart && r.received_date <= cmEnd)
        .reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const revenuePrevMonth = processedRevenues
        .filter(r => r.status === 'received' && r.received_date && r.received_date >= pmStart && r.received_date <= pmEnd)
        .reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const revenueDelta = revenuePrevMonth > 0 ? ((revenueCurrentMonth - revenuePrevMonth) / revenuePrevMonth) * 100 : 0;

      const expenseCurrentMonth = processedExpenses
        .filter(e => e.status === 'paid' && e.paid_date && e.paid_date >= cmStart && e.paid_date <= cmEnd)
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const expensePrevMonth = processedExpenses
        .filter(e => e.status === 'paid' && e.paid_date && e.paid_date >= pmStart && e.paid_date <= pmEnd)
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const expenseDelta = expensePrevMonth > 0 ? ((expenseCurrentMonth - expensePrevMonth) / expensePrevMonth) * 100 : 0;

      const totalReceived = processedRevenues.filter(r => r.status === 'received').reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const totalPaid = processedExpenses.filter(e => e.status === 'paid').reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const pendingRevenue = processedRevenues.filter(r => r.status === 'pending' || r.status === 'overdue').reduce((s, r) => s + (Number(r.amount) || 0), 0);

      // ── Projects ──
      const active = projects.filter(p => p.status === 'active');
      const completed = projects.filter(p => p.status === 'completed');
      const blocked = projects.filter(p => p.has_payment_block);
      const stagesMap = stages.reduce((acc: any, s: any) => {
        if (!acc[s.project_id]) acc[s.project_id] = [];
        acc[s.project_id].push(s);
        return acc;
      }, {});
      const atRisk = active.filter(p => {
        const ps = stagesMap[p.id] || [];
        return ps.some((s: any) => s.planned_end && s.status !== 'done' && parseISO(s.planned_end) < now);
      });
      const avgHealth = active.length > 0 ? active.reduce((s, p) => s + (p.health_score || 0), 0) / active.length : 0;

      // ── CRM ──
      const activeDeals = deals.filter((d: any) => d.stage_key !== 'lost');
      const wonDeals = deals.filter((d: any) => d.stage_key === 'fechado');
      const totalDeals = deals.length;
      const pipelineValue = activeDeals.reduce((s: number, d: any) => s + (d.value || 0), 0);
      const forecast = activeDeals.filter((d: any) => d.score).reduce((s: number, d: any) => s + ((d.value || 0) * (d.score || 0) / 100), 0);
      const wonValue = wonDeals.reduce((s: number, d: any) => s + (d.value || 0), 0);
      const conversionRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;
      const dealsByStageData = Object.entries(STAGE_LABELS).map(([key, label]) => {
        const stageDeals = deals.filter((d: any) => d.stage_key === key);
        return { stage: label, count: stageDeals.length, value: stageDeals.reduce((s: number, d: any) => s + (d.value || 0), 0) };
      }).filter(d => d.count > 0);

      // ── Tasks ──
      const tasksCompletedThisMonth = tasks.filter((t: any) =>
        t.completed_at && t.completed_at >= cmStart && t.completed_at <= cmEnd + 'T23:59:59'
      ).length;
      const tasksCompletedPrevMonth = tasks.filter((t: any) =>
        t.completed_at && t.completed_at >= pmStart && t.completed_at <= pmEnd + 'T23:59:59'
      ).length;
      const tasksDelta = tasksCompletedPrevMonth > 0
        ? ((tasksCompletedThisMonth - tasksCompletedPrevMonth) / tasksCompletedPrevMonth) * 100 : 0;

      const completedWithDates = tasks.filter((t: any) => t.completed_at && t.created_at);
      const avgCompletionDays = completedWithDates.length > 0
        ? completedWithDates.reduce((s: number, t: any) => s + differenceInDays(parseISO(t.completed_at), parseISO(t.created_at)), 0) / completedWithDates.length
        : 0;

      // Velocity: avg completions per day (last 30 days)
      const thirtyDaysAgo = subDays(today, 30);
      const recentCompletions = tasks.filter((t: any) =>
        t.completed_at && parseISO(t.completed_at) >= thirtyDaysAgo
      ).length;
      const velocityPerDay = recentCompletions / 30;

      // Completion trend (last 30 days)
      const completionTrend: { date: string; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = subDays(today, i);
        const count = tasks.filter((t: any) => t.completed_at && isSameDay(parseISO(t.completed_at), d)).length;
        completionTrend.push({ date: format(d, 'dd/MM'), count });
      }

      // Burndown (active tasks remaining per day, last 14 days)
      const pending14DaysAgo = tasks.filter((t: any) => t.status !== 'done' || (t.completed_at && parseISO(t.completed_at) >= subDays(today, 14))).length;
      const burndownData: { date: string; remaining: number; ideal: number }[] = [];
      for (let i = 14; i >= 0; i--) {
        const d = subDays(today, i);
        const completedBefore = tasks.filter((t: any) =>
          t.completed_at && parseISO(t.completed_at) <= d && parseISO(t.completed_at) >= subDays(today, 14)
        ).length;
        const remaining = pending14DaysAgo - completedBefore;
        const ideal = pending14DaysAgo * (1 - (14 - i) / 14);
        burndownData.push({ date: format(d, 'dd/MM'), remaining: Math.max(0, remaining), ideal: Math.max(0, Math.round(ideal)) });
      }

      // Tasks by category
      const catCounts: Record<string, number> = { pessoal: 0, operacao: 0, projeto: 0 };
      tasks.forEach((t: any) => { if (catCounts[t.category] !== undefined) catCounts[t.category]++; });
      const tasksByCategory = Object.entries(catCounts)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: k === 'operacao' ? 'Operação' : k === 'pessoal' ? 'Pessoal' : 'Projeto', value: v, fill: CATEGORY_COLORS[k] }));

      // Revenue by month (last 6 months)
      const revenueByMonth: { month: string; revenue: number; expense: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = subMonths(now, i);
        const ms = format(startOfMonth(m), 'yyyy-MM-dd');
        const me = format(endOfMonth(m), 'yyyy-MM-dd');
        const rev = processedRevenues.filter(r => r.status === 'received' && r.received_date && r.received_date >= ms && r.received_date <= me)
          .reduce((s, r) => s + (Number(r.amount) || 0), 0);
        const exp = processedExpenses.filter(e => e.status === 'paid' && e.paid_date && e.paid_date >= ms && e.paid_date <= me)
          .reduce((s, e) => s + (Number(e.amount) || 0), 0);
        revenueByMonth.push({ month: format(m, 'MMM').toUpperCase(), revenue: rev, expense: exp });
      }

      // Heatmap
      const heatmapMap: Record<string, number> = {};
      tasks.forEach((t: any) => {
        if (!t.completed_at) return;
        const dt = parseISO(t.completed_at);
        const key = `${getDay(dt)}-${getHours(dt)}`;
        heatmapMap[key] = (heatmapMap[key] || 0) + 1;
      });
      const heatmap: { day: number; hour: number; count: number }[] = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 6; hour < 22; hour++) {
          heatmap.push({ day, hour, count: heatmapMap[`${day}-${hour}`] || 0 });
        }
      }

      // Productivity Score (0-100)
      const taskScore = Math.min(40, (tasksCompletedThisMonth / Math.max(tasks.filter((t: any) => t.status !== 'done').length, 1)) * 40);
      const healthScore = (avgHealth / 100) * 30;
      const revenueScore = revenueDelta > 0 ? Math.min(30, revenueDelta) : Math.max(0, 30 + revenueDelta);
      const productivityScore = Math.round(taskScore + healthScore + revenueScore);

      // Content
      const contentPublished = content.filter((c: any) => c.status === 'published').length;

      return {
        revenueCurrentMonth, revenuePrevMonth, revenueDelta,
        expenseCurrentMonth, expensePrevMonth, expenseDelta,
        balanceCurrent: totalReceived - totalPaid,
        pendingRevenue,
        projectsActive: active.length, projectsCompleted: completed.length,
        projectsAtRisk: atRisk.length, projectsBlocked: blocked.length,
        avgHealthScore: Math.round(avgHealth),
        dealsActive: activeDeals.length, pipelineValue, forecast,
        wonDeals: wonDeals.length, wonValue, conversionRate,
        tasksTotal: tasks.length,
        tasksPending: tasks.filter((t: any) => t.status !== 'done').length,
        tasksCompletedThisMonth, tasksCompletedPrevMonth, tasksDelta,
        avgCompletionDays, velocityPerDay,
        contentTotal: content.length, contentPublished,
        productivityScore: Math.max(0, Math.min(100, productivityScore)),
        burndownData, completionTrend, revenueByMonth, tasksByCategory,
        dealsByStage: dealsByStageData, heatmap,
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}
