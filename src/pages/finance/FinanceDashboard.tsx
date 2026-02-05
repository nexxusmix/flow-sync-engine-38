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

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendValue,
  color = "primary"
}: { 
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card p-6 hover:border-primary/20 transition-all">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <h3 className="text-2xl font-semibold text-foreground mt-1">{value}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${
                trend === 'up' ? 'text-emerald-500' : 'text-red-500'
              }`}>
                {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trendValue}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-${color}/10`}>
            <Icon className={`w-5 h-5 text-${color}`} />
          </div>
        </div>
      </Card>
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

  // Fetch data on mount
  useEffect(() => {
    fetchRevenues();
    fetchExpenses();
    fetchContracts();
  }, []);

  // Realtime sync - refetch when data changes
  const handleRevenueChange = useCallback(() => {
    fetchRevenues();
  }, [fetchRevenues]);

  const handleExpenseChange = useCallback(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleContractChange = useCallback(() => {
    fetchContracts();
  }, [fetchContracts]);

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

  // Generate monthly chart data
  const getMonthlyData = () => {
    const months: { [key: string]: { revenue: number; expense: number; name: string } } = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { 
        revenue: 0, 
        expense: 0,
        name: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      };
    }
    
    revenues.forEach(r => {
      if (r.status === 'received' && r.received_date) {
        const key = r.received_date.substring(0, 7);
        if (months[key]) {
          months[key].revenue += Number(r.amount);
        }
      }
    });
    
    expenses.forEach(e => {
      if (e.status === 'paid' && e.paid_date) {
        const key = e.paid_date.substring(0, 7);
        if (months[key]) {
          months[key].expense += Number(e.amount);
        }
      }
    });
    
    return Object.values(months);
  };

  const monthlyData = getMonthlyData();

  // Cashflow projection
  const getCashflowProjection = () => {
    const projection: { date: string; balance: number; name: string }[] = [];
    let balance = stats.currentBalance;
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      // Add revenues due on this date
      revenues.forEach(r => {
        if (r.status === 'pending' && r.due_date === dateStr) {
          balance += Number(r.amount);
        }
      });
      
      // Subtract expenses due on this date
      expenses.forEach(e => {
        if (e.status === 'pending' && e.due_date === dateStr) {
          balance -= Number(e.amount);
        }
      });
      
      if (i % 5 === 0 || i === 29) {
        projection.push({
          date: dateStr,
          balance,
          name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        });
      }
    }
    
    return projection;
  };

  const cashflowProjection = getCashflowProjection();

  return (
    <DashboardLayout title="Financeiro">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Dashboard Financeiro</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visão geral do fluxo de caixa e saúde financeira
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/financeiro/receitas')}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Receitas
            </Button>
            <Button variant="outline" onClick={() => navigate('/financeiro/despesas')}>
              <TrendingDown className="w-4 h-4 mr-2" />
              Despesas
            </Button>
            <Button onClick={() => navigate('/financeiro/contratos')}>
              <Receipt className="w-4 h-4 mr-2" />
              Contratos
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Caixa Atual"
            value={formatCurrency(stats.currentBalance)}
            subtitle="Recebido - Pago"
            icon={Wallet}
            color="primary"
          />
          <StatCard
            title="Receitas Pendentes"
            value={formatCurrency(stats.pendingRevenue)}
            subtitle={`${stats.overdueRevenues} vencidas`}
            icon={TrendingUp}
            color="emerald-500"
          />
          <StatCard
            title="Despesas Pendentes"
            value={formatCurrency(stats.pendingExpenses)}
            subtitle={`${stats.overdueExpenses} vencidas`}
            icon={TrendingDown}
            color="red-500"
          />
          <StatCard
            title="Projeção 30 dias"
            value={formatCurrency(stats.projectedBalance30Days)}
            subtitle="Saldo previsto"
            icon={Calendar}
            trend={stats.projectedBalance30Days >= stats.currentBalance ? 'up' : 'down'}
            trendValue={`${((stats.projectedBalance30Days - stats.currentBalance) / Math.max(stats.currentBalance, 1) * 100).toFixed(0)}%`}
            color="cyan-500"
          />
          <StatCard
            title="Projetos Bloqueados"
            value={String(stats.blockedProjects)}
            subtitle="Pendência financeira"
            icon={AlertTriangle}
            color="amber-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue vs Expense */}
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-medium text-foreground">Receita x Despesa</h3>
                <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
              </div>
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Receita" />
                  <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Cashflow Projection */}
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-medium text-foreground">Projeção de Caixa</h3>
                <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
              </div>
              <DollarSign className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashflowProjection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    name="Saldo"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Projects Financial Status */}
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-medium text-foreground">Status Financeiro por Projeto</h3>
              <p className="text-xs text-muted-foreground">{projectFinancials.length} projetos com movimentação</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/financeiro/projetos')}>
              Ver todos
            </Button>
          </div>
          
          <div className="space-y-4">
            {projectFinancials.slice(0, 5).map((project) => {
              const statusConfig = FINANCIAL_STATUS_CONFIG[project.status];
              const progress = project.contracted_value > 0 
                ? (project.received / project.contracted_value) * 100 
                : 0;
              
              return (
                <div key={project.project_id} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                      <div>
                        <h4 className="text-sm font-medium text-foreground">{project.project_name}</h4>
                        {project.client_name && (
                          <p className="text-xs text-muted-foreground">{project.client_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{formatCurrency(project.received)}</p>
                      <p className="text-xs text-muted-foreground">de {formatCurrency(project.contracted_value)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Progress value={progress} className="flex-1 h-1.5" />
                    <span className={`text-xs font-medium ${statusConfig.textColor}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {projectFinancials.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum projeto com movimentação financeira</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Cashflow */}
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-medium text-foreground">Movimentações Recentes</h3>
              <p className="text-xs text-muted-foreground">Últimas entradas e saídas</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/financeiro/caixa')}>
              Ver caixa
            </Button>
          </div>
          
          <div className="space-y-3">
            {cashflow.slice(0, 8).map((entry) => (
              <div 
                key={entry.id} 
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    entry.type === 'revenue' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  }`}>
                    {entry.type === 'revenue' ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    entry.type === 'revenue' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {entry.type === 'revenue' ? '+' : '-'}{formatCurrency(entry.amount)}
                  </p>
                  {entry.running_balance !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      Saldo: {formatCurrency(entry.running_balance)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {cashflow.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhuma movimentação registrada</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
