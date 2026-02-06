import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { differenceInDays, parseISO, addDays, format } from 'date-fns';

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
  
  // Financial metrics (from existing tables)
  monthlyRevenue: number;
  pendingPayments: number;
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
      const thirtyDaysFromNow = addDays(now, 30);

      // Fetch projects - don't throw on error, use empty array
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .neq('status', 'archived');

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
      }

      // Fetch project stages to calculate at-risk
      const { data: stages, error: stagesError } = await supabase
        .from('project_stages')
        .select('*');

      if (stagesError) {
        console.error('Error fetching stages:', stagesError);
      }

      // Fetch deals
      const { data: deals, error: dealsError } = await supabase
        .from('prospect_opportunities')
        .select('*');

      if (dealsError) {
        console.error('Error fetching deals:', dealsError);
      }

      // Fetch calendar events for next 30 days
      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_at', now.toISOString())
        .lte('start_at', thirtyDaysFromNow.toISOString())
        .order('start_at', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
      }

      // Fetch revenues for current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: revenues, error: revenuesError } = await supabase
        .from('revenues')
        .select('*')
        .gte('due_date', format(startOfMonth, 'yyyy-MM-dd'))
        .lte('due_date', format(endOfMonth, 'yyyy-MM-dd'));

      if (revenuesError) {
        console.error('Error fetching revenues:', revenuesError);
      }

      // Fetch contracts for pipeline value
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('status', 'active');

      if (contractsError) {
        console.error('Error fetching contracts:', contractsError);
      }

      // Calculate metrics - use empty arrays as fallback
      const activeProjects = (projects || []).filter(p => p.status === 'active');
      const completedProjects = (projects || []).filter(p => p.status === 'completed');
      const blockedProjects = (projects || []).filter(p => p.has_payment_block);

      // Calculate at-risk projects (stages with planned_end < today and status != done)
      const projectStagesMap = (stages || []).reduce((acc, stage) => {
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

      // Deal metrics by stage
      const dealStages = ['lead', 'qualificacao', 'diagnostico', 'proposta', 'negociacao', 'fechado', 'onboarding', 'posvenda'];
      const dealsByStage = dealStages.reduce((acc, stage) => {
        const stageDeals = (deals || []).filter(d => d.stage === stage);
        acc[stage] = {
          count: stageDeals.length,
          value: stageDeals.reduce((sum, d) => sum + (d.estimated_value || 0), 0),
        };
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      const totalPipelineValue = (deals || []).reduce((acc, d) => acc + (d.estimated_value || 0), 0);
      const forecast = (deals || [])
        .filter(d => d.stage !== 'lost' && d.probability)
        .reduce((acc, d) => acc + ((d.estimated_value || 0) * (d.probability || 0) / 100), 0);

      // Calculate overdue items
      const overdueEvents = (events || []).filter(e => {
        const eventDate = parseISO(e.start_at);
        return differenceInDays(now, eventDate) > 0;
      });

      // Monthly revenue
      const monthlyRevenue = (revenues || [])
        .filter(r => r.status === 'received')
        .reduce((acc, r) => acc + (r.amount || 0), 0);

      const pendingPayments = (revenues || [])
        .filter(r => r.status === 'pending')
        .reduce((acc, r) => acc + (r.amount || 0), 0);

      // Active contracts pipeline value
      const contractsPipelineValue = (contracts || [])
        .reduce((acc, c) => acc + (c.total_value || 0), 0);

      // Active projects pipeline value (for projects without contracts)
      const projectsWithContracts = new Set((contracts || []).map(c => c.project_id));
      const projectsPipelineValue = activeProjects
        .filter(p => !projectsWithContracts.has(p.id))
        .reduce((acc, p) => acc + (p.contract_value || 0), 0);

      // Total pipeline = contracts + projects without contracts
      const activePipelineValue = contractsPipelineValue + projectsPipelineValue;

      // Projects by stage
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

      // Timeline events
      const timeline30Days: TimelineEvent[] = (events || []).map(event => {
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

      // Recent projects (sorted by updated_at)
      const recentProjects = [...(projects || [])]
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
          totalDeals: (deals || []).length,
          totalPipelineValue,
          activePipelineValue,
          forecast,
          dealsByStage,
          upcomingDeadlines: (events || []).filter(e => e.event_type === 'deadline' || e.event_type === 'delivery').length,
          eventsNext30Days: (events || []).length,
          overdueItems: overdueEvents.length,
          monthlyRevenue,
          pendingPayments,
        },
        projectsByStage,
        timeline30Days,
        recentProjects,
      };
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });

  // Only show loading when user exists and query is loading initial data
  return {
    ...query,
    isLoading: !!user && query.isLoading,
  };
}
