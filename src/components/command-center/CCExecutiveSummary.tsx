import { Card } from '@/components/ui/card';
import { Tilt3DCard } from '@/components/ui/tilt-3d-card';
import { motion } from 'framer-motion';
import {
  DollarSign, Briefcase, ListTodo, Target, AlertTriangle, Clock,
  TrendingUp, TrendingDown, Zap, Activity, Inbox, Bot, Shield
} from 'lucide-react';
import { formatCurrencyBRL } from '@/utils/format';
import type { ExecutiveMetrics } from '@/hooks/useExecutiveDashboard';
import { EmergencyBanner } from '@/components/dashboard/EmergencyBanner';

interface Props {
  metrics: ExecutiveMetrics;
  extras: {
    pendingInboxCount: number;
    pendingApprovalCount: number;
    clientHealth: Array<{ alerts: string[] }>;
    automationStats: { failureCount: number };
    aiStats: { totalRuns: number };
  };
}

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };

export function CCExecutiveSummary({ metrics, extras }: Props) {
  const m = metrics;
  const clientsAtRisk = extras.clientHealth.filter(c => c.alerts.length > 0).length;

  const kpis = [
    { label: 'Receita do Mês', value: formatCurrencyBRL(m.revenueCurrentMonth), delta: m.revenueDelta, icon: DollarSign, color: 'text-primary' },
    { label: 'Saldo Atual', value: formatCurrencyBRL(m.balanceCurrent), icon: DollarSign, color: m.balanceCurrent >= 0 ? 'text-primary' : 'text-destructive' },
    { label: 'A Receber', value: formatCurrencyBRL(m.pendingRevenue), icon: TrendingUp, color: 'text-primary' },
    { label: 'Vencido', value: formatCurrencyBRL(m.overdueRevenue), icon: AlertTriangle, color: 'text-destructive', hide: m.overdueRevenue === 0 },
    { label: 'Projetos Ativos', value: String(m.projectsActive), icon: Briefcase, color: 'text-foreground' },
    { label: 'Em Risco', value: String(m.projectsAtRisk), icon: AlertTriangle, color: 'text-destructive', hide: m.projectsAtRisk === 0 },
    { label: 'Bloqueados', value: String(m.projectsBlocked), icon: Clock, color: 'text-destructive', hide: m.projectsBlocked === 0 },
    { label: 'Tarefas Pendentes', value: String(m.tasksPending), icon: ListTodo, color: 'text-foreground' },
    { label: 'Velocity', value: `${m.velocityPerDay.toFixed(1)}/dia`, icon: Zap, color: 'text-primary' },
    { label: 'Produtividade', value: `${m.productivityScore}/100`, icon: Activity, color: 'text-primary' },
    { label: 'Pipeline CRM', value: formatCurrencyBRL(m.pipelineValue), icon: Target, color: 'text-primary' },
    { label: 'Conversão', value: `${m.conversionRate.toFixed(1)}%`, icon: Target, color: 'text-foreground' },
    { label: 'Inbox Pendente', value: String(extras.pendingInboxCount), icon: Inbox, color: extras.pendingInboxCount > 5 ? 'text-destructive' : 'text-foreground' },
    { label: 'Aprovações IA', value: String(extras.pendingApprovalCount), icon: Bot, color: extras.pendingApprovalCount > 0 ? 'text-yellow-500' : 'text-foreground' },
    { label: 'Clientes em Atenção', value: String(clientsAtRisk), icon: Shield, color: clientsAtRisk > 0 ? 'text-destructive' : 'text-primary' },
    { label: 'Falhas Automação', value: String(extras.automationStats.failureCount), icon: AlertTriangle, color: extras.automationStats.failureCount > 0 ? 'text-destructive' : 'text-foreground', hide: extras.automationStats.failureCount === 0 },
  ].filter(k => !k.hide);

  return (
    <motion.div className="space-y-6" variants={stagger} initial="hidden" animate="show">
      <EmergencyBanner
        productivityScore={m.productivityScore}
        velocityPerDay={m.velocityPerDay}
        backlogClearDate={m.backlogClearDate}
        tasksPending={m.tasksPending}
      />

      {/* Productivity Ring + Quick Stats */}
      <motion.div variants={fadeUp}>
        <Card className="glass-card p-6 flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeDasharray={`${(m.productivityScore / 100) * 327} 327`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{m.productivityScore}</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Score</span>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-sm font-medium text-foreground mb-1">Saúde Geral da Operação</h3>
            <p className="text-xs text-muted-foreground">
              {m.productivityScore >= 80 ? 'Operação saudável. Continue monitorando.' :
               m.productivityScore >= 50 ? 'Operação com pontos de atenção. Verifique riscos e gargalos.' :
               'Operação crítica. Ação imediata necessária.'}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* KPI Grid */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" variants={stagger}>
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={fadeUp}>
            <Tilt3DCard intensity={3}>
              <Card className="glass-card p-4 h-full">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                  <kpi.icon className={`w-4 h-4 ${kpi.color} opacity-60`} />
                </div>
                <p className={`text-lg font-semibold ${kpi.color}`}>{kpi.value}</p>
                {kpi.delta !== undefined && (
                  <div className="flex items-center gap-1 mt-1">
                    {kpi.delta >= 0 ? <TrendingUp className="w-3 h-3 text-primary" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
                    <span className={`text-[10px] ${kpi.delta >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {Math.abs(kpi.delta).toFixed(1)}%
                    </span>
                  </div>
                )}
              </Card>
            </Tilt3DCard>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
