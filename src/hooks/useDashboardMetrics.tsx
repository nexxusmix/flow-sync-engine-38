import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { differenceInDays, parseISO, addDays, format, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Dashboard Metrics Hook
 * 
 * IMPORTANT: This hook aligns with the financial calculations in financialStore.ts
 * to ensure consistency between Overview and Financial dashboards.
 * 
 * Data Sources:
 * - monthlyRevenue: revenues table (status = 'received', received_date in current month)
 * - pendingPayments: revenues table (status = 'pending' OR 'overdue', OR pending with due_date < today)
 * - totalPipelineValue: prospect_opportunities table (estimated_value sum)
 * - totalProjectsActive: projects table (status = 'active')
 * - projectsAtRisk: projects with overdue stages
 * - projectsBlocked: projects with has_payment_block = true
 */

export interface DashboardMetrics {
  // Project metrics
  totalProjectsActive: number;
  projectsAtRisk: number;
  projectsBlocked: number;
  projectsCompleted: number;
  
  // CRM metrics
  totalDeals: number;
  totalPipelineValue: number;
  activePipelineValue: number;
  forecast: number;
  dealsByStage: Record<string, { count: number; value: number }>;
  
  // Calendar metrics
  upcomingDeadlines: number;
  eventsNext30Days: number;
  overdueItems: number;
  
  // Financial metrics - aligned with financialStore.getStats()
  // Source: revenues table with same logic as FinanceDashboard
  monthlyRevenue: number;        // Received revenue in current month
  pendingPayments: number;       // Pending + overdue revenues
  currentBalance: number;        // Total received - total paid
  projectedBalance30Days: number; // Projected balance in 30 days
}

export interface ProjectsByStage {
  stage: string;
  stageName: string;
  count: number;
  projects: Array<{
    id: string;
    name: string;
    client_name: string;
    health_score: number;
    status: string;
    owner_name: string | null;
  }>;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  type: 'deadline' | 'delivery' | 'meeting' | 'milestone' | 'task';
  project_id?: string | null;
  color?: string | null;
  daysUntil: number;
  severity: 'critical' | 'risk' | 'normal';
}

export function useDashboardMetrics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async (): Promise<{
      metrics: DashboardMetrics;
      projectsByStage: ProjectsByStage[];
      timeline30Days: TimelineEvent[];
      recentProjects: Array<{
        id: string;
        name: string;
        client_name: string;
        stage_current: string;
        health_score: number;
        contract_value: number;
        status: string;
      }>;
    }> => {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const thirtyDaysFromNow = addDays(now, 30);
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Fetch all required data in parallel for performance
      const [
        projectsResult,
        stagesResult,
        dealsResult,
        eventsResult,
        revenuesResult,
        expensesResult,
        contractsResult,
      ] = await Promise.all([
        supabase.from('projects').select('*').neq('status', 'archived'),
        supabase.from('project_stages').select('*'),
        supabase.from('prospect_opportunities').select('*'),
        supabase.from('calendar_events')
          .select('*')
          .gte('start_at', now.toISOString())
          .lte('start_at', thirtyDaysFromNow.toISOString())
          .order('start_at', { ascending: true }),
        // Fetch ALL revenues (not just current month) for accurate calculations
        supabase.from('revenues').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('contracts').select('*').eq('status', 'active'),
      ]);

      // Log errors but continue with empty arrays
      if (projectsResult.error) console.error('Error fetching projects:', projectsResult.error);
      if (stagesResult.error) console.error('Error fetching stages:', stagesResult.error);
      if (dealsResult.error) console.error('Error fetching deals:', dealsResult.error);
      if (eventsResult.error) console.error('Error fetching events:', eventsResult.error);
      if (revenuesResult.error) console.error('Error fetching revenues:', revenuesResult.error);
      if (expensesResult.error) console.error('Error fetching expenses:', expensesResult.error);
      if (contractsResult.error) console.error('Error fetching contracts:', contractsResult.error);

      const projects = projectsResult.data || [];
      const stages = stagesResult.data || [];
      const deals = dealsResult.data || [];
      const events = eventsResult.data || [];
      const revenues = revenuesResult.data || [];
      const expenses = expensesResult.data || [];
      const contracts = contractsResult.data || [];

      // === PROJECT METRICS ===
      const activeProjects = projects.filter(p => p.status === 'active');
      const completedProjects = projects.filter(p => p.status === 'completed');
      const blockedProjects = projects.filter(p => p.has_payment_block);

      // Calculate at-risk projects (stages with planned_end < today and status != done)
      const projectStagesMap = stages.reduce((acc, stage) => {
        if (!acc[stage.project_id]) acc[stage.project_id] = [];
        acc[stage.project_id].push(stage);
        return acc;
      }, {} as Record<string, typeof stages>);

      const atRiskProjects = activeProjects.filter(project => {
        const projectStages = projectStagesMap[project.id] || [];
        return projectStages.some(stage => {
          if (!stage.planned_end || stage.status === 'done') return false;
          const plannedEnd = parseISO(stage.planned_end);
          return differenceInDays(now, plannedEnd) > 0;
        });
      });

      // === CRM METRICS ===
      const dealStages = ['lead', 'qualificacao', 'diagnostico', 'proposta', 'negociacao', 'fechado', 'onboarding', 'posvenda'];
      const dealsByStage = dealStages.reduce((acc, stage) => {
        const stageDeals = deals.filter(d => d.stage === stage);
        acc[stage] = {
          count: stageDeals.length,
          value: stageDeals.reduce((sum, d) => sum + (d.estimated_value || 0), 0),
        };
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      const totalPipelineValue = deals.reduce((acc, d) => acc + (d.estimated_value || 0), 0);
      const forecast = deals
        .filter(d => d.stage !== 'lost' && d.probability)
        .reduce((acc, d) => acc + ((d.estimated_value || 0) * (d.probability || 0) / 100), 0);

      // === FINANCIAL METRICS (aligned with financialStore.getStats) ===
      // Apply auto-overdue logic to pending revenues (same as financialStore)
      const processedRevenues = revenues.map(r => ({
        ...r,
        status: r.status === 'pending' && r.due_date < today ? 'overdue' : r.status,
      }));

      const processedExpenses = expenses.map(e => ({
        ...e,
        status: e.status === 'pending' && e.due_date < today ? 'overdue' : e.status,
      }));

      // Monthly revenue: received in current month (by received_date, not due_date)
      const monthStartStr = format(monthStart, 'yyyy-MM-dd');
      const monthEndStr = format(monthEnd, 'yyyy-MM-dd');
      
      const monthlyRevenue = processedRevenues
        .filter(r => 
          r.status === 'received' && 
          r.received_date && 
          r.received_date >= monthStartStr && 
          r.received_date <= monthEndStr
        )
        .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

      // Pending payments: pending + overdue (same logic as financialStore)
      const pendingPayments = processedRevenues
        .filter(r => r.status === 'pending' || r.status === 'overdue')
        .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

      // Current balance: total received - total paid (same as financialStore)
      const totalReceived = processedRevenues
        .filter(r => r.status === 'received')
        .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      
      const totalPaid = processedExpenses
        .filter(e => e.status === 'paid')
        .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      
      const currentBalance = totalReceived - totalPaid;

      // Projected balance 30 days (same logic as financialStore)
      const thirtyDaysFromNowStr = format(thirtyDaysFromNow, 'yyyy-MM-dd');
      
      const projected30Revenue = processedRevenues
        .filter(r => (r.status === 'pending' || r.status === 'received') && r.due_date <= thirtyDaysFromNowStr)
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

      const projected30Expenses = processedExpenses
        .filter(e => (e.status === 'pending' || e.status === 'paid') && e.due_date <= thirtyDaysFromNowStr)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const projectedBalance30Days = (totalReceived + projected30Revenue) - (totalPaid + projected30Expenses);

      // === CALENDAR METRICS ===
      const overdueEvents = events.filter(e => {
        const eventDate = parseISO(e.start_at);
        return differenceInDays(now, eventDate) > 0;
      });

      // Active contracts pipeline value
      const contractsPipelineValue = contracts.reduce((acc, c) => acc + (c.total_value || 0), 0);

      // Active projects pipeline value (for projects without contracts)
      const projectsWithContracts = new Set(contracts.map(c => c.project_id));
      const projectsPipelineValue = activeProjects
        .filter(p => !projectsWithContracts.has(p.id))
        .reduce((acc, p) => acc + (p.contract_value || 0), 0);

      const activePipelineValue = contractsPipelineValue + projectsPipelineValue;

      // === PROJECTS BY STAGE ===
      const stageNames: Record<string, string> = {
        briefing: 'Briefing',
        roteiro: 'Roteiro',
        pre_producao: 'Pré-Produção',
        captacao: 'Captação',
        edicao: 'Edição',
        revisao: 'Revisão',
        aprovacao: 'Aprovação',
        entrega: 'Entrega',
        pos_venda: 'Pós-Venda',
      };

      const projectsByStage: ProjectsByStage[] = Object.keys(stageNames).map(stage => ({
        stage,
        stageName: stageNames[stage],
        count: activeProjects.filter(p => p.stage_current === stage).length,
        projects: activeProjects
          .filter(p => p.stage_current === stage)
          .map(p => ({
            id: p.id,
            name: p.name,
            client_name: p.client_name,
            health_score: p.health_score,
            status: p.status,
            owner_name: p.owner_name,
          })),
      }));

      // === TIMELINE EVENTS ===
      const timeline30Days: TimelineEvent[] = events.map(event => {
        const eventDate = parseISO(event.start_at);
        const daysUntil = differenceInDays(eventDate, now);
        
        let severity: 'critical' | 'risk' | 'normal' = 'normal';
        if (daysUntil < 0) severity = 'critical';
        else if (daysUntil <= 3) severity = 'critical';
        else if (daysUntil <= 7) severity = 'risk';

        return {
          id: event.id,
          title: event.title,
          date: event.start_at,
          type: (event.event_type || 'task') as TimelineEvent['type'],
          project_id: event.project_id,
          color: event.color,
          daysUntil,
          severity,
        };
      });

      // === RECENT PROJECTS ===
      const recentProjects = [...projects]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 8)
        .map(p => ({
          id: p.id,
          name: p.name,
          client_name: p.client_name,
          stage_current: p.stage_current,
          health_score: p.health_score,
          contract_value: p.contract_value,
          status: p.status,
        }));

      return {
        metrics: {
          totalProjectsActive: activeProjects.length,
          projectsAtRisk: atRiskProjects.length,
          projectsBlocked: blockedProjects.length,
          projectsCompleted: completedProjects.length,
          totalDeals: deals.length,
          totalPipelineValue,
          activePipelineValue,
          forecast,
          dealsByStage,
          upcomingDeadlines: events.filter(e => e.event_type === 'deadline' || e.event_type === 'delivery').length,
          eventsNext30Days: events.length,
          overdueItems: overdueEvents.length,
          // Financial metrics aligned with financialStore
          monthlyRevenue,
          pendingPayments,
          currentBalance,
          projectedBalance30Days,
        },
        projectsByStage,
        timeline30Days,
        recentProjects,
      };
    },
    enabled: !!user,
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchInterval: 60000, // Refetch every minute
  });

  // Only show loading when user exists and query is loading initial data
  return {
    ...query,
    isLoading: !!user && query.isLoading,
  };
}
