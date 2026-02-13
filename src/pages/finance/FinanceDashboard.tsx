import { useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useFinancialStore } from "@/stores/financialStore";
import { useRealtimeTable } from "@/hooks/useRealtimeSync";
import { FINANCIAL_STATUS_CONFIG } from "@/types/financial";
import { useNavigate } from "react-router-dom";
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Calendar, Wallet,
  BarChart3, PieChart, Receipt
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// Holographic KPI Card
function HoloStatCard({ 
  label, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendValue,
  delay = 0
}: { 
  label: string;
  value: string;
  subtitle?: string;
  icon: any;
  trend?: 'up' | 'down';
  trendValue?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="holo-kpi rounded-xl scan-effect"
      initial={{ opacity: 0, filter: "blur(16px)", scale: 1.05 }}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
      transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ 
        translateZ: 20,
        rotateX: -2,
        rotateY: 5,
        transition: { duration: 0.6 }
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[hsl(var(--holo-primary))]" />
        </div>
        {trend && trendValue && (
          <span className={trend === 'up' ? 'holo-trend-up' : 'holo-trend-down'}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
      </div>
      
      <div className="holo-kpi-label mb-2">{label}</div>
      <div className="holo-kpi-value data-glow">{value}</div>
      {subtitle && (
        <div className="text-[11px] text-white/30 mt-2 font-mono tracking-wider uppercase">
          {subtitle}
        </div>
      )}
      <div className="holo-kpi-accent" />
    </motion.div>
  );
}

export default function FinancePage() {
  const navigate = useNavigate();
  const { 
    revenues, 
    expenses, 
    fetchRevenues, 
    fetchExpenses,
    fetchContracts,
    getStats,
    getCashflow,
    getProjectFinancials,
  } = useFinancialStore();

  useEffect(() => {
    fetchRevenues();
    fetchExpenses();
    fetchContracts();
  }, []);

  const handleRevenueChange = useCallback(() => { fetchRevenues(); }, [fetchRevenues]);
  const handleExpenseChange = useCallback(() => { fetchExpenses(); }, [fetchExpenses]);
  const handleContractChange = useCallback(() => { fetchContracts(); }, [fetchContracts]);

  useRealtimeTable('revenues', handleRevenueChange, handleRevenueChange, handleRevenueChange);
  useRealtimeTable('expenses', handleExpenseChange, handleExpenseChange, handleExpenseChange);
  useRealtimeTable('contracts', handleContractChange, handleContractChange, handleContractChange);

  const stats = getStats();
  const cashflow = getCashflow();
  const projectFinancials = getProjectFinancials();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const now = new Date();
  const monthRef = now.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
  const yearRef = now.getFullYear();

  // Generate monthly chart data
  const getMonthlyData = () => {
    const months: { [key: string]: { revenue: number; expense: number; name: string } } = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { 
        revenue: 0, expense: 0,
        name: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      };
    }
    revenues.forEach(r => {
      if (r.status === 'received' && r.received_date) {
        const key = r.received_date.substring(0, 7);
        if (months[key]) months[key].revenue += Number(r.amount);
      }
    });
    expenses.forEach(e => {
      if (e.status === 'paid' && e.paid_date) {
        const key = e.paid_date.substring(0, 7);
        if (months[key]) months[key].expense += Number(e.amount);
      }
    });
    return Object.values(months);
  };

  const monthlyData = getMonthlyData();

  const getCashflowProjection = () => {
    const projection: { date: string; balance: number; name: string }[] = [];
    let balance = stats.currentBalance;
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      revenues.forEach(r => {
        if (r.status === 'pending' && r.due_date === dateStr) balance += Number(r.amount);
      });
      expenses.forEach(e => {
        if (e.status === 'pending' && e.due_date === dateStr) balance -= Number(e.amount);
      });
      if (i % 5 === 0 || i === 29) {
        projection.push({
          date: dateStr, balance,
          name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        });
      }
    }
    return projection;
  };

  const cashflowProjection = getCashflowProjection();

  // Status badge mapping
  const getStatusBadge = (entry: { type: string; status?: string }) => {
    if (entry.type === 'revenue') return 'holo-badge-verified';
    return 'holo-badge-active';
  };

  return (
    <DashboardLayout title="Financeiro">
      <div className="holo world-stage space-y-8 max-w-[1600px] 2xl:max-w-[1800px] mx-auto" data-platform="financeiro">
        {/* Ambient glow */}
        <div className="holo-ambient" />

        {/* Section Header */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 holo-appear"
          initial={{ opacity: 0, filter: "blur(16px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <div className="holo-section-label mb-2">Section_03 // Financial_Summary</div>
            <h1 className="holo-section-title text-3xl md:text-4xl tracking-tight">
              RESUMO <span className="highlight">FINANCEIRO</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="holo-timeline-ref">
              Timeline_Ref<br />
              <strong>{monthRef}</strong> / <strong>{yearRef}</strong>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/financeiro/receitas')} className="border-white/10 text-white/50 hover:text-white hover:border-white/20 text-[10px] uppercase tracking-widest">
                Receitas
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/financeiro/despesas')} className="border-white/10 text-white/50 hover:text-white hover:border-white/20 text-[10px] uppercase tracking-widest">
                Despesas
              </Button>
              <Button size="sm" onClick={() => navigate('/financeiro/contratos')} className="bg-[hsl(var(--holo-primary))] hover:bg-[hsl(var(--holo-primary))]/90 text-white text-[10px] uppercase tracking-widest">
                Contratos
              </Button>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <HoloStatCard
            label="Revenue_Total"
            value={formatCurrency(stats.currentBalance)}
            subtitle="Recebido — Pago"
            icon={Wallet}
            delay={0.1}
          />
          <HoloStatCard
            label="Pending_Status"
            value={formatCurrency(stats.pendingRevenue)}
            subtitle={`${stats.overdueRevenues} Operations_Await`}
            icon={TrendingUp}
            delay={0.15}
          />
          <HoloStatCard
            label="Expense_Queue"
            value={formatCurrency(stats.pendingExpenses)}
            subtitle={`${stats.overdueExpenses} Overdue`}
            icon={TrendingDown}
            delay={0.2}
          />
          <HoloStatCard
            label="Projection_30d"
            value={formatCurrency(stats.projectedBalance30Days)}
            subtitle="Saldo Previsto"
            icon={Calendar}
            trend={stats.projectedBalance30Days >= stats.currentBalance ? 'up' : 'down'}
            trendValue={`${((stats.projectedBalance30Days - stats.currentBalance) / Math.max(stats.currentBalance, 1) * 100).toFixed(1)}%`}
            delay={0.25}
          />
          <HoloStatCard
            label="Blocked_Nodes"
            value={String(stats.blockedProjects)}
            subtitle="Pendência Financeira"
            icon={AlertTriangle}
            delay={0.3}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Expense Chart */}
          <motion.div
            className="holo-card rounded-xl p-6"
            initial={{ opacity: 0, filter: "blur(12px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="holo-section-label mb-1">Chart_01</div>
                <h3 className="text-sm text-white/80 font-normal">Receita x Despesa</h3>
                <p className="text-[10px] text-white/30 tracking-wider uppercase mt-0.5">Últimos 6 meses</p>
              </div>
              <BarChart3 className="w-5 h-5 text-white/20" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.9)',
                      border: '0.5px solid rgba(0,156,202,0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="revenue" fill="hsl(193,100%,41%)" radius={[4, 4, 0, 0]} name="Receita" />
                  <Bar dataKey="expense" fill="hsl(0,50%,45%)" radius={[4, 4, 0, 0]} name="Despesa" opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Cashflow Projection Chart */}
          <motion.div
            className="holo-card rounded-xl p-6"
            initial={{ opacity: 0, filter: "blur(12px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="holo-section-label mb-1">Chart_02</div>
                <h3 className="text-sm text-white/80 font-normal">Projeção de Caixa</h3>
                <p className="text-[10px] text-white/30 tracking-wider uppercase mt-0.5">Próximos 30 dias</p>
              </div>
              <DollarSign className="w-5 h-5 text-white/20" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashflowProjection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.9)',
                      border: '0.5px solid rgba(0,156,202,0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="hsl(193,100%,41%)" 
                    strokeWidth={2}
                    dot={false}
                    name="Saldo"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Latest Transactions Table */}
        <motion.div
          className="holo-card rounded-xl p-6 scan-effect"
          initial={{ opacity: 0, filter: "blur(12px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.45 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="holo-section-label mb-1">◈ Latest_Projected_Transactions</div>
            </div>
            <button onClick={() => navigate('/financeiro/caixa')} className="holo-link">
              Full_Log_View
            </button>
          </div>
          
          <table className="holo-table">
            <thead>
              <tr>
                <th>Stamp</th>
                <th>Object_Description</th>
                <th>Status</th>
                <th className="text-right">Value_R$</th>
              </tr>
            </thead>
            <tbody>
              {cashflow.slice(0, 8).map((entry) => {
                const date = new Date(entry.date);
                const dateStr = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                return (
                  <tr key={entry.id}>
                    <td className="font-mono text-white/40">{dateStr}</td>
                    <td className="text-white/70">{entry.description}</td>
                    <td>
                      <span className={`holo-badge ${entry.type === 'revenue' ? 'holo-badge-verified' : 'holo-badge-active'}`}>
                        {entry.type === 'revenue' ? 'VERIFIED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className={`text-right font-mono ${entry.type === 'revenue' ? 'text-white/80' : 'text-red-400/80'}`}>
                      {entry.type === 'expense' ? '- ' : ''}{formatCurrency(entry.amount).replace('R$', '').trim()}
                    </td>
                  </tr>
                );
              })}
              {cashflow.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-white/20">
                    Nenhuma movimentação registrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>

        {/* Projects Financial Status */}
        <motion.div
          className="holo-card rounded-xl p-6"
          initial={{ opacity: 0, filter: "blur(12px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="holo-section-label mb-1">Project_Financial_Status</div>
              <span className="text-[11px] text-white/25 font-mono">{projectFinancials.length} Active_Nodes</span>
            </div>
            <button onClick={() => navigate('/financeiro/projetos')} className="holo-link">
              View_All
            </button>
          </div>
          
          <div className="space-y-4">
            {projectFinancials.slice(0, 5).map((project) => {
              const statusConfig = FINANCIAL_STATUS_CONFIG[project.status];
              const progress = project.contracted_value > 0 
                ? (project.received / project.contracted_value) * 100 
                : 0;
              
              return (
                <div key={project.project_id} className="p-4 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                      <div>
                        <h4 className="text-sm text-white/70 font-normal">{project.project_name}</h4>
                        {project.client_name && (
                          <p className="text-[10px] text-white/25 font-mono tracking-wider">{project.client_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/80 font-mono data-glow">{formatCurrency(project.received)}</p>
                      <p className="text-[10px] text-white/25 font-mono">de {formatCurrency(project.contracted_value)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Progress value={progress} className="flex-1 h-1" />
                    <span className={`holo-badge ${
                      project.status === 'ok' ? 'holo-badge-verified' :
                      project.status === 'blocked' ? 'holo-badge-danger' :
                      'holo-badge-queued'
                    }`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {projectFinancials.length === 0 && (
              <div className="text-center py-8">
                <PieChart className="w-12 h-12 mx-auto mb-3 text-white/10" />
                <p className="text-sm text-white/20 font-mono tracking-wider">No_Active_Financial_Nodes</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="holo-footer flex items-center justify-between px-2">
          <span>Interface_Ver // HUB_OS v4.2.0</span>
          <span>SQUAD_HUB // Financial_Module</span>
        </div>
      </div>
    </DashboardLayout>
  );
}
