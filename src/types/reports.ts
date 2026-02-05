// Report Types for SQUAD Hub

export type ReportType = 'owner' | 'sales' | 'ops' | 'finance' | 'marketing' | 'project' | 'client';

export interface ReportSnapshot {
  id: string;
  workspace_id: string;
  report_type: ReportType;
  scope_id?: string;
  period_start: string;
  period_end: string;
  metrics: Record<string, unknown>;
  generated_by?: string;
  generated_at: string;
}

export interface ReportExport {
  id: string;
  workspace_id: string;
  report_type: string;
  scope_id?: string;
  file_url?: string;
  format: 'pdf';
  created_at: string;
}

// Owner Daily Metrics
export interface OwnerDailyMetrics {
  leadsToday: number;
  opportunitiesActive: number;
  proposalsSent7d: number;
  proposalsConversionRate: number;
  projectsAtRisk: number;
  deliveriesIn7Days: number;
  cashForecast30Days: number;
  overdueCount: number;
  activitiesOverdue: number;
}

// Sales Metrics
export interface SalesMetrics {
  funnelByStage: { stage: string; count: number; value: number }[];
  conversionRates: { from: string; to: string; rate: number }[];
  avgCycleTimeDays: number;
  proposalStats: {
    sent: number;
    viewed: number;
    accepted: number;
    rejected: number;
  };
  lossReasons: { reason: string; count: number }[];
}

// Operations Metrics
export interface OperationsMetrics {
  projectsByStage: { stage: string; count: number }[];
  delayedProjects: { id: string; name: string; daysDelayed: number }[];
  avgDelayDays: number;
  openComments: number;
  pendingApprovals: number;
  bottlenecks: { stage: string; count: number }[];
}

// Financial Metrics
export interface FinancialMetrics {
  receivedPeriod: number;
  pendingReceivable: number;
  overdueReceivable: number;
  paidExpenses: number;
  pendingExpenses: number;
  periodBalance: number;
  forecast30: number;
  forecast60: number;
  forecast90: number;
  blockedProjects: number;
  overdueByAging: { range: string; count: number; value: number }[];
}

// Marketing Metrics
export interface MarketingMetrics {
  producedMonth: number;
  publishedMonth: number;
  delayedContent: number;
  avgPipelineTimeDays: number;
  contentByPillar: { pillar: string; count: number }[];
  contentByChannel: { channel: string; count: number }[];
  activeCampaigns: number;
  backlogIdeas: number;
}

// Project Report
export interface ProjectReportData {
  id: string;
  name: string;
  client: string;
  stage: string;
  daysDelayed: number;
  hasBlocks: boolean;
  nextDelivery?: string;
  financialStatus: 'ok' | 'attention' | 'blocked';
  timeline: { phase: string; planned: string; actual?: string }[];
  openComments: number;
  clientPendencies: number;
}

// Client Report
export interface ClientReportData {
  id: string;
  name: string;
  activeProjects: number;
  projectsInReview: number;
  clientPendencies: number;
  lastUpdate?: string;
  projects: {
    id: string;
    name: string;
    stage: string;
    nextDelivery?: string;
    pendencies: number;
  }[];
}

// Risk Item
export interface RiskItem {
  id: string;
  type: 'delay' | 'financial' | 'no_action' | 'approval';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  projectId?: string;
  clientId?: string;
}

// Action Item
export interface ActionItem {
  id: string;
  type: 'activity' | 'delivery' | 'payment' | 'approval';
  title: string;
  dueDate: string;
  projectId?: string;
  projectName?: string;
  isOverdue: boolean;
}

// Pipeline Forecast
export interface PipelineForecast {
  period: '30' | '60' | '90';
  value: number;
  count: number;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  owner: 'Visão do Dono',
  sales: 'Vendas',
  ops: 'Operação',
  finance: 'Financeiro',
  marketing: 'Marketing',
  project: 'Projeto',
  client: 'Cliente',
};
