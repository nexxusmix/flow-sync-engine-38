import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useExecutiveDashboard, ExecutiveMetrics } from './useExecutiveDashboard';

export interface ClientHealthEntry {
  client_name: string;
  projectCount: number;
  activeProjects: number;
  atRiskProjects: number;
  blockedProjects: number;
  avgHealthScore: number;
  pendingRevenue: number;
  overdueRevenue: number;
  pendingTasks: number;
  lastActivity: string | null;
  alerts: string[];
}

export interface AutomationStats {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  pendingApprovals: number;
  failureRate: number;
  topAutomations: Array<{ name: string; count: number; status: string }>;
}

export interface AIUsageStats {
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  topModules: Array<{ module: string; count: number }>;
  estimatedCost: number;
}

export interface CommandCenterData {
  metrics: ExecutiveMetrics;
  clientHealth: ClientHealthEntry[];
  automationStats: AutomationStats;
  aiStats: AIUsageStats;
  pendingInboxCount: number;
  pendingApprovalCount: number;
}

export function useCommandCenter() {
  const { user } = useAuth();
  const executiveDash = useExecutiveDashboard();

  const extras = useQuery({
    queryKey: ['command-center-extras'],
    queryFn: async () => {
      const [
        automationExecsRes,
        automationApprovalsRes,
        aiRunsRes,
        alertsRes,
        revenuesRes,
        tasksRes,
        projectsRes,
      ] = await Promise.all([
        supabase.from('automation_executions').select('id, status, automation_id, started_at').limit(500),
        supabase.from('automation_approvals').select('id, status').eq('status', 'pending').limit(200),
        supabase.from('ai_runs').select('id, status, duration_ms, action_key, created_at').limit(500),
        supabase.from('alerts').select('id, status, severity').eq('status', 'open').limit(200),
        supabase.from('revenues').select('id, project_id, amount, status, due_date').limit(5000),
        supabase.from('tasks').select('id, project_id, status').limit(5000),
        supabase.from('projects').select('id, name, client_name, status, health_score, has_payment_block, updated_at').neq('status', 'archived').limit(5000),
      ]);

      const automationExecs = automationExecsRes.data || [];
      const pendingApprovals = automationApprovalsRes.data || [];
      const aiRuns = aiRunsRes.data || [];
      const pendingAlerts = alertsRes.data || [];
      const revenues = revenuesRes.data || [];
      const tasks = tasksRes.data || [];
      const projects = projectsRes.data || [];

      // Client health
      const clientMap = new Map<string, typeof projects>();
      projects.forEach(p => {
        const name = p.client_name || 'Sem cliente';
        if (!clientMap.has(name)) clientMap.set(name, []);
        clientMap.get(name)!.push(p);
      });

      const today = new Date().toISOString().slice(0, 10);
      const clientHealth: ClientHealthEntry[] = Array.from(clientMap.entries()).map(([name, projs]) => {
        const active = projs.filter(p => p.status === 'active');
        const atRisk = active.filter(p => (p.health_score || 100) < 60);
        const blocked = projs.filter(p => p.has_payment_block);
        const projectIds = projs.map(p => p.id);
        const clientRevenues = revenues.filter(r => projectIds.includes(r.project_id || ''));
        const pending = clientRevenues.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount || 0), 0);
        const overdue = clientRevenues.filter(r => (r.status === 'overdue' || (r.status === 'pending' && r.due_date < today))).reduce((s, r) => s + Number(r.amount || 0), 0);
        const clientTasks = tasks.filter(t => projectIds.includes(t.project_id || ''));
        const pendingTasks = clientTasks.filter(t => t.status !== 'done').length;
        const avgHealth = active.length > 0 ? Math.round(active.reduce((s, p) => s + (p.health_score || 0), 0) / active.length) : 0;
        const lastActivity = projs.reduce((latest, p) => p.updated_at > (latest || '') ? p.updated_at : latest, null as string | null);

        const alerts: string[] = [];
        if (atRisk.length > 0) alerts.push(`${atRisk.length} projeto(s) em risco`);
        if (blocked.length > 0) alerts.push(`${blocked.length} projeto(s) bloqueado(s)`);
        if (overdue > 0) alerts.push('Receita vencida');
        if (pendingTasks > 10) alerts.push('Alto volume de tarefas pendentes');

        return {
          client_name: name,
          projectCount: projs.length,
          activeProjects: active.length,
          atRiskProjects: atRisk.length,
          blockedProjects: blocked.length,
          avgHealthScore: avgHealth,
          pendingRevenue: pending,
          overdueRevenue: overdue,
          pendingTasks,
          lastActivity,
          alerts,
        };
      }).sort((a, b) => b.alerts.length - a.alerts.length || a.avgHealthScore - b.avgHealthScore);

      // Automation stats
      const successExecs = automationExecs.filter(e => e.status === 'completed');
      const failedExecs = automationExecs.filter(e => e.status === 'failed');
      const automationStats: AutomationStats = {
        totalExecutions: automationExecs.length,
        successCount: successExecs.length,
        failureCount: failedExecs.length,
        pendingApprovals: pendingApprovals.length,
        failureRate: automationExecs.length > 0 ? (failedExecs.length / automationExecs.length) * 100 : 0,
        topAutomations: [],
      };

      // AI stats
      const successRuns = aiRuns.filter(r => r.status === 'success' || r.status === 'completed');
      const moduleCount: Record<string, number> = {};
      aiRuns.forEach(r => {
        const mod = r.action_key?.split('_')[0] || 'other';
        moduleCount[mod] = (moduleCount[mod] || 0) + 1;
      });
      const aiStats: AIUsageStats = {
        totalRuns: aiRuns.length,
        successRate: aiRuns.length > 0 ? (successRuns.length / aiRuns.length) * 100 : 0,
        avgDurationMs: aiRuns.length > 0 ? aiRuns.reduce((s, r) => s + (r.duration_ms || 0), 0) / aiRuns.length : 0,
        topModules: Object.entries(moduleCount).map(([module, count]) => ({ module, count })).sort((a, b) => b.count - a.count).slice(0, 5),
        estimatedCost: 0,
      };

      return {
        clientHealth,
        automationStats,
        aiStats,
        pendingInboxCount: pendingAlerts.length,
        pendingApprovalCount: pendingApprovals.length,
      };
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    metrics: executiveDash.data,
    extras: extras.data,
    isLoading: executiveDash.isLoading || extras.isLoading,
    isError: executiveDash.isError || extras.isError,
    refetch: () => { executiveDash.refetch(); extras.refetch(); },
    dataUpdatedAt: Math.max(executiveDash.dataUpdatedAt || 0, extras.dataUpdatedAt || 0),
  };
}
