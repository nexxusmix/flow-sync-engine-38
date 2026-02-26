import { useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useExecutiveDashboard } from '@/hooks/useExecutiveDashboard';
import { formatCurrencyBRL } from '@/utils/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Loader2, Download, TrendingUp, TrendingDown, DollarSign, Briefcase,
  ListTodo, Target, BarChart3, Activity, Zap, Users, CheckCircle2,
  AlertTriangle, Clock, Timer, Flame, FileText
} from 'lucide-react';
import { ActivityFeed } from '@/components/workspace/ActivityFeed';
import { useWorkspacePresence } from '@/hooks/useWorkspacePresence';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export default function ExecutiveDashboardPage() {
  const { data, isLoading } = useExecutiveDashboard();
  const { onlineUsers } = useWorkspacePresence();
  const printRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = useCallback(() => {
    if (!printRef.current || !data) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head>
        <title>Dashboard Executivo — SQUAD Hub</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #000; color: #fff; font-family: 'Space Grotesk', sans-serif; padding: 40px; }
          .pdf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #222; }
          .pdf-header h1 { font-size: 28px; font-weight: 300; letter-spacing: -1px; text-transform: uppercase; }
          .pdf-header .date { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 2px; }
          .pdf-section { margin-bottom: 32px; }
          .pdf-section h2 { font-size: 12px; font-weight: 400; color: #009CCA; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 16px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
          .kpi-card { background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; }
          .kpi-card .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .kpi-card .value { font-size: 24px; font-weight: 600; color: #fff; }
          .kpi-card .delta { font-size: 11px; margin-top: 4px; }
          .delta-up { color: #22c55e; }
          .delta-down { color: #ef4444; }
          .score-ring { width: 120px; height: 120px; border-radius: 50%; border: 4px solid #009CCA; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
          .score-ring .score { font-size: 32px; font-weight: 700; color: #009CCA; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #222; font-size: 10px; color: #444; text-align: center; text-transform: uppercase; letter-spacing: 2px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head><body>
        <div class="pdf-header">
          <h1>Dashboard <span style="font-weight:300;color:#666">Executivo</span></h1>
          <div class="date">${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</div>
        </div>
        <div class="pdf-section">
          <h2>Indicadores Financeiros</h2>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="label">Receita do Mês</div>
              <div class="value">${formatCurrencyBRL(data.revenueCurrentMonth)}</div>
              <div class="delta ${data.revenueDelta >= 0 ? 'delta-up' : 'delta-down'}">${data.revenueDelta >= 0 ? '↑' : '↓'} ${Math.abs(data.revenueDelta).toFixed(1)}% vs mês anterior</div>
            </div>
            <div class="kpi-card">
              <div class="label">Despesas do Mês</div>
              <div class="value">${formatCurrencyBRL(data.expenseCurrentMonth)}</div>
              <div class="delta ${data.expenseDelta <= 0 ? 'delta-up' : 'delta-down'}">${data.expenseDelta >= 0 ? '↑' : '↓'} ${Math.abs(data.expenseDelta).toFixed(1)}%</div>
            </div>
            <div class="kpi-card">
              <div class="label">Saldo Atual</div>
              <div class="value">${formatCurrencyBRL(data.balanceCurrent)}</div>
            </div>
            <div class="kpi-card">
              <div class="label">A Receber</div>
              <div class="value">${formatCurrencyBRL(data.pendingRevenue)}</div>
            </div>
          </div>
        </div>
        <div class="pdf-section">
          <h2>Operações</h2>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="label">Projetos Ativos</div>
              <div class="value">${data.projectsActive}</div>
            </div>
            <div class="kpi-card">
              <div class="label">Em Risco</div>
              <div class="value" style="color:#ef4444">${data.projectsAtRisk}</div>
            </div>
            <div class="kpi-card">
              <div class="label">Tarefas Concluídas</div>
              <div class="value">${data.tasksCompletedThisMonth}</div>
              <div class="delta ${data.tasksDelta >= 0 ? 'delta-up' : 'delta-down'}">${data.tasksDelta >= 0 ? '↑' : '↓'} ${Math.abs(data.tasksDelta).toFixed(1)}% vs anterior</div>
            </div>
            <div class="kpi-card">
              <div class="label">Produtividade</div>
              <div class="value" style="color:#009CCA">${data.productivityScore}/100</div>
            </div>
          </div>
        </div>
        <div class="pdf-section">
          <h2>Comercial</h2>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="label">Pipeline</div>
              <div class="value">${formatCurrencyBRL(data.pipelineValue)}</div>
            </div>
            <div class="kpi-card">
              <div class="label">Forecast</div>
              <div class="value">${formatCurrencyBRL(data.forecast)}</div>
            </div>
            <div class="kpi-card">
              <div class="label">Deals Fechados</div>
              <div class="value">${data.wonDeals}</div>
            </div>
            <div class="kpi-card">
              <div class="label">Taxa de Conversão</div>
              <div class="value">${data.conversionRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
        <div class="footer">SQUAD Hub — Dashboard Executivo — Gerado automaticamente</div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  }, [data]);

  if (isLoading || !data) {
    return (
      <DashboardLayout title="Dashboard Executivo">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const maxHeat = Math.max(...data.heatmap.map(h => h.count), 1);

  return (
    <DashboardLayout title="Dashboard Executivo">
      <motion.div
        ref={printRef}
        className="space-y-8 max-w-[1600px] mx-auto"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-light uppercase tracking-tighter text-foreground">
              Executive <span className="text-muted-foreground">Dashboard</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
        </motion.div>

        {/* Productivity Score Ring */}
        <motion.div variants={fadeUp}>
          <Card className="glass-card p-6 flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeDasharray={`${(data.productivityScore / 100) * 327} 327`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{data.productivityScore}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Score</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <MiniStat icon={Zap} label="Velocity" value={`${data.velocityPerDay.toFixed(1)}/dia`} />
              <MiniStat icon={Timer} label="Tempo Médio" value={`${data.avgCompletionDays.toFixed(1)}d`} />
              <MiniStat icon={Activity} label="Health Médio" value={`${data.avgHealthScore}%`} />
              <MiniStat icon={Target} label="Conversão" value={`${data.conversionRate.toFixed(1)}%`} />
            </div>
          </Card>
        </motion.div>

        {/* Financial KPIs */}
        <motion.div variants={fadeUp}>
          <SectionTitle icon={DollarSign} label="Financeiro" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Receita do Mês" value={formatCurrencyBRL(data.revenueCurrentMonth)} delta={data.revenueDelta} prevValue={formatCurrencyBRL(data.revenuePrevMonth)} />
            <KPICard label="Despesas do Mês" value={formatCurrencyBRL(data.expenseCurrentMonth)} delta={-data.expenseDelta} prevValue={formatCurrencyBRL(data.expensePrevMonth)} />
            <KPICard label="Saldo Atual" value={formatCurrencyBRL(data.balanceCurrent)} />
            <KPICard label="A Receber" value={formatCurrencyBRL(data.pendingRevenue)} accent />
          </div>
        </motion.div>

        {/* Revenue vs Expense Chart */}
        <motion.div variants={fadeUp}>
          <Card className="glass-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Receita vs Despesa (6 meses)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrencyBRL(v)} />
                <Legend />
                <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Operations KPIs */}
        <motion.div variants={fadeUp}>
          <SectionTitle icon={Briefcase} label="Operações" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard label="Projetos Ativos" value={String(data.projectsActive)} icon={Briefcase} />
            <KPICard label="Concluídos" value={String(data.projectsCompleted)} icon={CheckCircle2} />
            <KPICard label="Em Risco" value={String(data.projectsAtRisk)} icon={AlertTriangle} danger={data.projectsAtRisk > 0} />
            <KPICard label="Bloqueados" value={String(data.projectsBlocked)} icon={Clock} danger={data.projectsBlocked > 0} />
            <KPICard label="Conteúdos" value={`${data.contentPublished}/${data.contentTotal}`} icon={FileText} />
          </div>
        </motion.div>

        {/* Tasks KPIs + Burndown */}
        <motion.div variants={fadeUp}>
          <SectionTitle icon={ListTodo} label="Tarefas" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KPICard label="Total" value={String(data.tasksTotal)} />
            <KPICard label="Pendentes" value={String(data.tasksPending)} />
            <KPICard label="Concluídas (mês)" value={String(data.tasksCompletedThisMonth)} delta={data.tasksDelta} prevValue={String(data.tasksCompletedPrevMonth)} />
            <KPICard label="Velocity" value={`${data.velocityPerDay.toFixed(1)}/dia`} icon={Flame} />
          </div>
        </motion.div>

        {/* Charts Row */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={stagger}>
          {/* Burndown */}
          <motion.div variants={fadeUp}>
            <Card className="glass-card p-5">
              <h3 className="text-sm font-medium text-foreground mb-4">Burndown (14 dias)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.burndownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={2} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="ideal" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} name="Ideal" />
                  <Line type="monotone" dataKey="remaining" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Real" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Completion Trend */}
          <motion.div variants={fadeUp}>
            <Card className="glass-card p-5">
              <h3 className="text-sm font-medium text-foreground mb-4">Conclusões / Dia (30 dias)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.completionTrend}>
                  <defs>
                    <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#execGrad)" strokeWidth={2} name="Concluídas" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </motion.div>

        {/* CRM KPIs */}
        <motion.div variants={fadeUp}>
          <SectionTitle icon={Users} label="Comercial" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KPICard label="Pipeline" value={formatCurrencyBRL(data.pipelineValue)} />
            <KPICard label="Forecast" value={formatCurrencyBRL(data.forecast)} />
            <KPICard label="Deals Fechados" value={String(data.wonDeals)} icon={Target} />
            <KPICard label="Valor Fechado" value={formatCurrencyBRL(data.wonValue)} />
          </div>
        </motion.div>

        {/* Deals Funnel + Tasks by Category */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={stagger}>
          <motion.div variants={fadeUp}>
            <Card className="glass-card p-5">
              <h3 className="text-sm font-medium text-foreground mb-4">Funil de Vendas</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.dealsByStage} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="stage" width={90} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => name === 'value' ? formatCurrencyBRL(v) : v} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Deals" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="glass-card p-5">
              <h3 className="text-sm font-medium text-foreground mb-4">Tarefas por Categoria</h3>
              {data.tasksByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.tasksByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" animationDuration={800}>
                      {data.tasksByCategory.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
              )}
              <div className="flex flex-wrap gap-3 justify-center mt-1">
                {data.tasksByCategory.map(c => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.fill }} />
                    <span className="text-xs text-muted-foreground">{c.name} ({c.value})</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Heatmap */}
        <motion.div variants={fadeUp}>
          <Card className="glass-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Heatmap de Produtividade</h3>
            <div className="overflow-x-auto">
              <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `auto repeat(16, 1fr)` }}>
                <div />
                {Array.from({ length: 16 }, (_, i) => (
                  <div key={i} className="text-[9px] text-muted-foreground text-center w-7">{i + 6}h</div>
                ))}
                {DAY_LABELS.map((label, dayIdx) => (
                  <div key={`row-${dayIdx}`} className="contents">
                    <div className="text-[10px] text-muted-foreground pr-2 flex items-center">{label}</div>
                    {Array.from({ length: 16 }, (_, hourOffset) => {
                      const hour = hourOffset + 6;
                      const cell = data.heatmap.find(h => h.day === dayIdx && h.hour === hour);
                      const intensity = cell ? cell.count / maxHeat : 0;
                      return (
                        <div
                          key={`${dayIdx}-${hour}`}
                          className="w-7 h-5 rounded-sm"
                          style={{
                            backgroundColor: intensity > 0
                              ? `hsla(var(--primary), ${0.15 + intensity * 0.7})`
                              : 'hsl(var(--muted))',
                          }}
                          title={`${label} ${hour}h — ${cell?.count || 0}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Activity Feed + Online Users */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4" variants={stagger}>
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <Card className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Atividade Recente</h3>
              </div>
              <ActivityFeed limit={15} />
            </Card>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Card className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-medium text-foreground">Online Agora</h3>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full">
                  {onlineUsers.length}
                </span>
              </div>
              <div className="space-y-2">
                {onlineUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Ninguém online</p>
                ) : (
                  onlineUsers.map((u) => (
                    <div key={u.user_id} className="flex items-center gap-3 p-2 rounded-lg">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {(u.full_name || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                      </div>
                      <span className="text-sm text-foreground truncate">{u.full_name || "Anônimo"}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}

// ── Sub-components ──

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-primary" />
      <h2 className="text-xs font-medium text-primary uppercase tracking-widest">{label}</h2>
    </div>
  );
}

function KPICard({ label, value, delta, prevValue, icon: Icon, danger, accent }: {
  label: string; value: string; delta?: number; prevValue?: string; icon?: any; danger?: boolean; accent?: boolean;
}) {
  return (
    <Card className={`glass-card p-4 ${danger ? 'border-destructive/30' : ''} ${accent ? 'border-primary/30' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-xl font-semibold ${danger ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
          {delta !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {delta >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              <span className={`text-[10px] ${delta >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {Math.abs(delta).toFixed(1)}%
              </span>
              {prevValue && (
                <span className="text-[10px] text-muted-foreground ml-1">vs {prevValue}</span>
              )}
            </div>
          )}
        </div>
        {Icon && <Icon className={`w-5 h-5 ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />}
      </div>
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
