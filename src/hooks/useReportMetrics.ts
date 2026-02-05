import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  OwnerDailyMetrics,
  SalesMetrics,
  OperationsMetrics,
  FinancialMetrics,
  MarketingMetrics,
  RiskItem,
  ActionItem,
  PipelineForecast,
} from '@/types/reports';
import { addDays, subDays, startOfMonth, endOfMonth, differenceInDays, format } from 'date-fns';

export function useReportMetrics() {
  const [loading, setLoading] = useState(true);

  const fetchOwnerMetrics = useCallback(async (): Promise<OwnerDailyMetrics> => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const sevenDaysAgo = format(subDays(today, 7), 'yyyy-MM-dd');
    const thirtyDaysFromNow = format(addDays(today, 30), 'yyyy-MM-dd');

    // Fetch all data in parallel
    const [
      prospectsRes,
      opportunitiesRes,
      proposalsRes,
      contractsRes,
      revenuesRes,
      activitiesRes,
    ] = await Promise.all([
      supabase.from('prospects').select('id, created_at').gte('created_at', todayStr),
      supabase.from('prospect_opportunities').select('id, stage').in('stage', ['conversation', 'proposal', 'negotiation']),
      supabase.from('proposals').select('id, status, created_at').gte('created_at', sevenDaysAgo),
      supabase.from('contracts').select('id, end_date, status'),
      supabase.from('revenues').select('id, status, due_date, amount'),
      supabase.from('prospect_activities').select('id, completed, due_at').eq('completed', false),
    ]);

    const prospects = prospectsRes.data || [];
    const opportunities = opportunitiesRes.data || [];
    const proposals = proposalsRes.data || [];
    const revenues = revenuesRes.data || [];
    const activities = activitiesRes.data || [];

    const proposalsSent = proposals.length;
    const proposalsAccepted = proposals.filter(p => p.status === 'accepted').length;
    const conversionRate = proposalsSent > 0 ? (proposalsAccepted / proposalsSent) * 100 : 0;

    const overdueRevenues = revenues.filter(r => 
      r.status === 'pending' && new Date(r.due_date) < today
    );

    const pendingRevenues = revenues.filter(r =>
      r.status === 'pending' && 
      new Date(r.due_date) >= today && 
      new Date(r.due_date) <= addDays(today, 30)
    );

    const overdueActivities = activities.filter(a => 
      a.due_at && new Date(a.due_at) < today
    );

    // Simplified metrics
    return {
      leadsToday: prospects.length,
      opportunitiesActive: opportunities.length,
      proposalsSent7d: proposalsSent,
      proposalsConversionRate: Math.round(conversionRate),
      projectsAtRisk: 0, // Would need projects table with proper fields
      deliveriesIn7Days: 0,
      cashForecast30Days: pendingRevenues.reduce((sum, r) => sum + Number(r.amount), 0),
      overdueCount: overdueRevenues.length,
      activitiesOverdue: overdueActivities.length,
    };
  }, []);

  const fetchSalesMetrics = useCallback(async (): Promise<SalesMetrics> => {
    const [opportunitiesRes, proposalsRes] = await Promise.all([
      supabase.from('prospect_opportunities').select('*'),
      supabase.from('proposals').select('*'),
    ]);

    const opportunities = opportunitiesRes.data || [];
    const proposals = proposalsRes.data || [];

    const stageMap = new Map<string, { count: number; value: number }>();
    opportunities.forEach(o => {
      const stage = o.stage || 'new';
      const current = stageMap.get(stage) || { count: 0, value: 0 };
      stageMap.set(stage, {
        count: current.count + 1,
        value: current.value + Number(o.estimated_value || 0),
      });
    });

    const funnelByStage = Array.from(stageMap.entries()).map(([stage, data]) => ({
      stage,
      ...data,
    }));

    const proposalStats = {
      sent: proposals.filter(p => ['sent', 'viewed', 'accepted', 'rejected'].includes(p.status)).length,
      viewed: proposals.filter(p => p.status === 'viewed').length,
      accepted: proposals.filter(p => p.status === 'accepted').length,
      rejected: proposals.filter(p => p.status === 'rejected').length,
    };

    // Loss reasons from opportunities
    const lossReasons = opportunities
      .filter(o => o.lost_reason)
      .reduce((acc, o) => {
        const existing = acc.find(r => r.reason === o.lost_reason);
        if (existing) existing.count++;
        else acc.push({ reason: o.lost_reason!, count: 1 });
        return acc;
      }, [] as { reason: string; count: number }[])
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      funnelByStage,
      conversionRates: [], // Would need historical data
      avgCycleTimeDays: 0,
      proposalStats,
      lossReasons,
    };
  }, []);

  const fetchFinancialMetrics = useCallback(async (): Promise<FinancialMetrics> => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const [revenuesRes, expensesRes, contractsRes] = await Promise.all([
      supabase.from('revenues').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('contracts').select('id, status'),
    ]);

    const revenues = revenuesRes.data || [];
    const expenses = expensesRes.data || [];
    const contracts = contractsRes.data || [];

    const receivedPeriod = revenues
      .filter(r => r.status === 'received' && r.received_date && new Date(r.received_date) >= monthStart)
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const pendingRevenues = revenues.filter(r => r.status === 'pending');
    const overdueRevenues = pendingRevenues.filter(r => new Date(r.due_date) < today);
    const futureRevenues = pendingRevenues.filter(r => new Date(r.due_date) >= today);

    const paidExpenses = expenses
      .filter(e => e.status === 'paid' && e.paid_date && new Date(e.paid_date) >= monthStart)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const pendingExpenses = expenses
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate forecasts
    const forecast30 = futureRevenues
      .filter(r => new Date(r.due_date) <= addDays(today, 30))
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const forecast60 = futureRevenues
      .filter(r => new Date(r.due_date) <= addDays(today, 60))
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const forecast90 = futureRevenues
      .filter(r => new Date(r.due_date) <= addDays(today, 90))
      .reduce((sum, r) => sum + Number(r.amount), 0);

    // Aging buckets
    const aging = [
      { range: '1-7 dias', min: 1, max: 7 },
      { range: '8-15 dias', min: 8, max: 15 },
      { range: '16-30 dias', min: 16, max: 30 },
      { range: '31+ dias', min: 31, max: 9999 },
    ];

    const overdueByAging = aging.map(bucket => {
      const items = overdueRevenues.filter(r => {
        const days = differenceInDays(today, new Date(r.due_date));
        return days >= bucket.min && days <= bucket.max;
      });
      return {
        range: bucket.range,
        count: items.length,
        value: items.reduce((sum, r) => sum + Number(r.amount), 0),
      };
    });

    const blockedProjects = contracts.filter(c => c.status === 'blocked').length;

    return {
      receivedPeriod,
      pendingReceivable: futureRevenues.reduce((sum, r) => sum + Number(r.amount), 0),
      overdueReceivable: overdueRevenues.reduce((sum, r) => sum + Number(r.amount), 0),
      paidExpenses,
      pendingExpenses,
      periodBalance: receivedPeriod - paidExpenses,
      forecast30,
      forecast60,
      forecast90,
      blockedProjects,
      overdueByAging,
    };
  }, []);

  const fetchMarketingMetrics = useCallback(async (): Promise<MarketingMetrics> => {
    const today = new Date();
    const monthStart = startOfMonth(today);

    const [contentRes, ideasRes, campaignsRes] = await Promise.all([
      supabase.from('content_items').select('*'),
      supabase.from('content_ideas').select('id'),
      supabase.from('campaigns').select('id, status'),
    ]);

    const content = contentRes.data || [];
    const ideas = ideasRes.data || [];
    const campaigns = campaignsRes.data || [];

    const producedMonth = content.filter(c => 
      c.created_at && new Date(c.created_at) >= monthStart
    ).length;

    const publishedMonth = content.filter(c => 
      c.status === 'published' && c.published_at && new Date(c.published_at) >= monthStart
    ).length;

    const delayedContent = content.filter(c => 
      c.due_at && new Date(c.due_at) < today && c.status !== 'published'
    ).length;

    // Content by pillar
    const pillarMap = new Map<string, number>();
    content.forEach(c => {
      const pillar = c.pillar || 'Sem pilar';
      pillarMap.set(pillar, (pillarMap.get(pillar) || 0) + 1);
    });
    const contentByPillar = Array.from(pillarMap.entries()).map(([pillar, count]) => ({ pillar, count }));

    // Content by channel
    const channelMap = new Map<string, number>();
    content.forEach(c => {
      const channel = c.channel || 'Sem canal';
      channelMap.set(channel, (channelMap.get(channel) || 0) + 1);
    });
    const contentByChannel = Array.from(channelMap.entries()).map(([channel, count]) => ({ channel, count }));

    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    return {
      producedMonth,
      publishedMonth,
      delayedContent,
      avgPipelineTimeDays: 0,
      contentByPillar,
      contentByChannel,
      activeCampaigns,
      backlogIdeas: ideas.length,
    };
  }, []);

  const fetchRisks = useCallback(async (): Promise<RiskItem[]> => {
    const today = new Date();
    const risks: RiskItem[] = [];

    // Get overdue revenues
    const { data: overdueRevenues } = await supabase
      .from('revenues')
      .select('id, description, project_id')
      .eq('status', 'pending')
      .lt('due_date', format(today, 'yyyy-MM-dd'))
      .limit(5);

    overdueRevenues?.forEach(r => {
      risks.push({
        id: r.id,
        type: 'financial',
        severity: 'high',
        title: 'Pagamento em atraso',
        description: r.description || 'Receita pendente vencida',
        projectId: r.project_id || undefined,
      });
    });

    // Get overdue activities
    const { data: overdueActivities } = await supabase
      .from('prospect_activities')
      .select('id, title, opportunity_id')
      .eq('completed', false)
      .lt('due_at', today.toISOString())
      .limit(5);

    overdueActivities?.forEach(a => {
      risks.push({
        id: a.id,
        type: 'no_action',
        severity: 'medium',
        title: 'Atividade atrasada',
        description: a.title,
      });
    });

    return risks.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }).slice(0, 5);
  }, []);

  const fetchTodayActions = useCallback(async (): Promise<ActionItem[]> => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const actions: ActionItem[] = [];

    // Get today's activities
    const { data: activities } = await supabase
      .from('prospect_activities')
      .select('id, title, due_at')
      .eq('completed', false)
      .gte('due_at', today.toISOString())
      .lt('due_at', tomorrow.toISOString())
      .limit(10);

    activities?.forEach(a => {
      actions.push({
        id: a.id,
        type: 'activity',
        title: a.title,
        dueDate: a.due_at || '',
        isOverdue: false,
      });
    });

    return actions;
  }, []);

  const fetchPipelineForecast = useCallback(async (): Promise<PipelineForecast[]> => {
    const today = new Date();

    const { data: revenues } = await supabase
      .from('revenues')
      .select('id, amount, due_date')
      .eq('status', 'pending')
      .gte('due_date', format(today, 'yyyy-MM-dd'));

    const revenueList = revenues || [];

    const forecast30Items = revenueList.filter(r => 
      new Date(r.due_date) <= addDays(today, 30)
    );
    const forecast60Items = revenueList.filter(r => 
      new Date(r.due_date) <= addDays(today, 60)
    );
    const forecast90Items = revenueList.filter(r => 
      new Date(r.due_date) <= addDays(today, 90)
    );

    return [
      { period: '30', value: forecast30Items.reduce((s, r) => s + Number(r.amount), 0), count: forecast30Items.length },
      { period: '60', value: forecast60Items.reduce((s, r) => s + Number(r.amount), 0), count: forecast60Items.length },
      { period: '90', value: forecast90Items.reduce((s, r) => s + Number(r.amount), 0), count: forecast90Items.length },
    ];
  }, []);

  return {
    loading,
    setLoading,
    fetchOwnerMetrics,
    fetchSalesMetrics,
    fetchFinancialMetrics,
    fetchMarketingMetrics,
    fetchRisks,
    fetchTodayActions,
    fetchPipelineForecast,
  };
}
