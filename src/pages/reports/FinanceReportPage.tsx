import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useFinancialStore } from '@/stores/financialStore';
import { useFinancialReportMetrics, FinancialPeriod } from '@/hooks/useFinancialReportMetrics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useExportPdf } from '@/hooks/useExportPdf';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck,
  FileDown, Loader2, Clock, CheckCircle, XCircle, ArrowUpRight,
} from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '12m', label: 'Últimos 12 meses' },
];

export default function FinanceReportPage() {
  const { fetchRevenues, fetchExpenses, fetchContracts } = useFinancialStore();
  const [period, setPeriod] = useState<FinancialPeriod>('6m');
  const [isExporting, setIsExporting] = useState(false);

  const {
    metrics,
    monthlyFlow,
    cashflowProjection,
    milestoneAging,
    recentActivity,
  } = useFinancialReportMetrics(period);

  useEffect(() => {
    fetchRevenues();
    fetchExpenses();
    fetchContracts();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const { exportFinance, isExporting: isExportingPdf } = useExportPdf();

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportFinance(period);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const isHealthy = metrics.marginPercentage >= 20 && metrics.overdueRevenues === 0;
  const isPositiveProjection = metrics.projected30Days >= metrics.currentBalance;

  return (
    <DashboardLayout title="Relatório Financeiro">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em] mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Relatório Executivo Mensal
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Relatório <span className="italic font-light opacity-60">Financeiro & Capacidade</span>
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Visão consolidada do fluxo de caixa, saúde operacional e projeção de entregas.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v) => setPeriod(v as FinancialPeriod)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={handleExportPDF} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Date badge */}
        <div className="flex justify-end">
          <Card className="glass-card px-4 py-2 inline-flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Data de emissão</span>
            <span className="font-bold">{format(new Date(), "dd 'de' MMM. 'de' yyyy", { locale: ptBR })}</span>
          </Card>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Balance */}
          <Card className="glass-card p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Wallet className="w-5 h-5 text-emerald-500" />
              </div>
              <Badge className={`text-xs ${isHealthy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                {isHealthy ? 'ESTÁVEL' : 'ATENÇÃO'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Saldo em Caixa</p>
            <h3 className="text-3xl font-bold">{formatCurrency(metrics.currentBalance)}</h3>
            <p className="text-xs mt-2 text-muted-foreground">Recebido - Pago (Liquidez)</p>
          </Card>

          {/* Pending Revenue */}
          <Card className="glass-card p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              {metrics.pendingRevenue > 0 && (
                <Badge className="bg-primary/10 text-primary text-xs">
                  {metrics.overdueRevenues > 0 ? `${metrics.overdueRevenues} vencidas` : 'A vencer'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Receita Pendente</p>
            <h3 className="text-3xl font-bold text-primary">{formatCurrency(metrics.pendingRevenue)}</h3>
            <p className="text-xs mt-2 text-muted-foreground">{metrics.pendingMilestones} parcelas pendentes</p>
          </Card>

          {/* Expenses */}
          <Card className="glass-card p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Despesas Pagas</p>
            <h3 className="text-3xl font-bold">{formatCurrency(metrics.totalExpenses)}</h3>
            <p className="text-xs mt-2 text-muted-foreground">Total do período</p>
          </Card>

          {/* Net Margin */}
          <Card className="glass-card p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${metrics.marginPercentage >= 20 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                <span className={`text-xs font-bold ${metrics.marginPercentage >= 20 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {metrics.marginPercentage >= 20 ? '100% HEALTH' : 'ATENÇÃO'}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Margem Líquida</p>
            <h3 className="text-3xl font-bold">{metrics.marginPercentage}%</h3>
            <p className="text-xs mt-2 text-muted-foreground">
              {metrics.marginPercentage >= 28 ? 'Acima da meta de 28%' : 'Meta: 28%'}
            </p>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue vs Expense Chart */}
          <Card className="glass-card p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-bold">Receita x Despesa</h4>
                <p className="text-sm text-muted-foreground">Histórico de fluxo dos últimos meses</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Despesa" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Cash Projection Chart */}
          <Card className="glass-card p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-bold">Projeção de Caixa</h4>
                <p className="text-sm text-muted-foreground">Estimativa para os próximos 30 dias</p>
              </div>
              <Badge className={`${isPositiveProjection ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {isPositiveProjection ? 'PREVISÃO POSITIVA' : 'ATENÇÃO'}
              </Badge>
            </div>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflowProjection}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Saldo"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#balanceGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {/* Projected value overlay */}
              <div className="absolute top-4 right-4 text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Saldo Estimado</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(metrics.projected30Days)}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground uppercase">Probabilidade</p>
                <p className="font-semibold">94% Assertividade</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground uppercase">Crescimento</p>
                <p className={`font-semibold ${isPositiveProjection ? 'text-emerald-500' : 'text-destructive'}`}>
                  {isPositiveProjection ? '+' : ''}{Math.round(((metrics.projected30Days - metrics.currentBalance) / Math.max(metrics.currentBalance, 1)) * 100)}% Previsto
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Milestone Aging */}
          <Card className="glass-card p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Aging de Recebíveis
            </h4>
            <div className="space-y-3">
              {milestoneAging.map((item, i) => (
                <div 
                  key={item.range}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    i === 0 ? 'bg-emerald-500/10' :
                    i === 1 ? 'bg-amber-500/10' :
                    i === 2 ? 'bg-orange-500/10' : 'bg-destructive/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${
                      i === 0 ? 'text-emerald-500' :
                      i === 1 ? 'text-amber-500' :
                      i === 2 ? 'text-orange-500' : 'text-destructive'
                    }`}>
                      {item.range}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {item.count} {item.count === 1 ? 'item' : 'itens'}
                    </Badge>
                  </div>
                  <span className="font-semibold">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="glass-card p-6">
            <h4 className="text-lg font-bold mb-4">Atividade Recente</h4>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      item.type === 'revenue' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.type === 'revenue' ? 'Pagamento Recebido' : 'Despesa Paga'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <span className={`font-semibold text-sm ${
                      item.type === 'revenue' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {item.type === 'revenue' ? '+' : '-'}{formatCurrency(item.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-muted-foreground text-sm">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Alerts */}
        {(metrics.blockedProjects > 0 || metrics.overdueRevenues > 0) && (
          <Card className="glass-card p-6 border-l-4 border-l-destructive">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
              <div>
                <h4 className="font-bold text-destructive mb-1">Alerta de Inadimplência</h4>
                <p className="text-sm text-muted-foreground">
                  {metrics.overdueRevenues > 0 && (
                    <span>
                      Existem <strong>{metrics.overdueRevenues} receitas vencidas</strong> totalizando {formatCurrency(metrics.overdueAmount)}.
                    </span>
                  )}
                  {metrics.blockedProjects > 0 && (
                    <span className="ml-1">
                      <strong>{metrics.blockedProjects} projeto(s) bloqueado(s)</strong> por inadimplência.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>RELATÓRIO CERTIFICADO SQUADENGINE™</span>
          </div>
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} SQUADHUB MANAGEMENT</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
