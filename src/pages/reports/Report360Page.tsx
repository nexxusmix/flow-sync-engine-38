import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReport360Metrics, PeriodType } from '@/hooks/useReport360Metrics';
import { useExportPdf } from '@/hooks/useExportPdf';
import { TasksPendingSection } from '@/components/reports/TasksPendingSection';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  CheckCircle2, FolderOpen, AlertTriangle, TrendingUp,
  DollarSign, Activity, Loader2, FileDown
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: '1m', label: '1 Mês' },
  { value: '3m', label: '3 Meses' },
  { value: '6m', label: '6 Meses' },
  { value: '1y', label: '1 Ano' },
];

const STATUS_COLORS = {
  active: 'hsl(var(--primary))',
  completed: 'hsl(142, 76%, 36%)',
  paused: 'hsl(45, 93%, 47%)',
  archived: 'hsl(var(--muted-foreground))',
};

const STATUS_LABELS = {
  active: 'Em Andamento',
  completed: 'Concluídos',
  paused: 'Pausados',
  archived: 'Arquivados',
};

export default function Report360Page() {
  const [period, setPeriod] = useState<PeriodType>('3m');
  const { metrics, monthlyData, statusDistribution, isLoading, dateRange } = useReport360Metrics(period);
  const { isExporting, exportReport360 } = useExportPdf();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const pieData = statusDistribution.map(item => ({
    name: STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status,
    value: item.count,
    fill: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.active,
  }));

  if (isLoading) {
    return (
      <DashboardLayout title="Relatório 360°">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Relatório 360°">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Relatório 360°</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(dateRange.startDate, "dd MMM yyyy", { locale: ptBR })} — {format(dateRange.endDate, "dd MMM yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PERIOD_OPTIONS.map(option => (
              <Button
                key={option.value}
                variant={period === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(option.value)}
              >
                {option.label}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReport360(period)}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.delivered}</p>
                <p className="text-xs text-muted-foreground">Entregues</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.open}</p>
                <p className="text-xs text-muted-foreground">Abertos</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.delayed}</p>
                <p className="text-xs text-muted-foreground">Atrasados</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.onTimePercentage}%</p>
                <p className="text-xs text-muted-foreground">No Prazo</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.avgHealthScore}%</p>
                <p className="text-xs text-muted-foreground">Saúde Média</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(metrics.totalValue)}</p>
                <p className="text-xs text-muted-foreground">Valor Total</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Evolution */}
          <Card className="glass-card p-6 lg:col-span-2">
            <h3 className="text-sm font-medium text-foreground mb-4">Evolução por Mês</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="delivered" name="Entregues" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="open" name="Abertos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="delayed" name="Atrasados" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados para o período selecionado
              </div>
            )}
          </Card>

          {/* Status Distribution */}
          <Card className="glass-card p-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Distribuição por Status</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-4 justify-center">
                  {pieData.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                Sem projetos
              </div>
            )}
          </Card>
        </div>

        {/* Tasks Pending Section */}
        <TasksPendingSection />

        {/* Summary */}
        <Card className="glass-card p-6">
          <h3 className="text-sm font-medium text-foreground mb-4">Resumo do Período</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{metrics.delivered + metrics.open}</p>
              <p className="text-sm text-muted-foreground mt-1">Total de Projetos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-500">{metrics.delivered}</p>
              <p className="text-sm text-muted-foreground mt-1">Finalizados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{metrics.open}</p>
              <p className="text-sm text-muted-foreground mt-1">Em Andamento</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">{metrics.delayed}</p>
              <p className="text-sm text-muted-foreground mt-1">Com Atraso</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
