import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useReportMetrics } from "@/hooks/useReportMetrics";
import { supabase } from "@/integrations/supabase/client";
import { OwnerDailyMetrics, RiskItem, ActionItem, PipelineForecast } from "@/types/reports";
import {
  BarChart3, Users, FileText, AlertTriangle, Truck, DollarSign,
  AlertCircle, CheckSquare, ArrowLeft, Download, Save, TrendingUp,
  Calendar, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function OwnerDailyReport() {
  const navigate = useNavigate();
  const { fetchOwnerMetrics, fetchRisks, fetchTodayActions, fetchPipelineForecast } = useReportMetrics();

  const [metrics, setMetrics] = useState<OwnerDailyMetrics | null>(null);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [forecast, setForecast] = useState<PipelineForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, risksData, actionsData, forecastData] = await Promise.all([
        fetchOwnerMetrics(),
        fetchRisks(),
        fetchTodayActions(),
        fetchPipelineForecast(),
      ]);
      setMetrics(metricsData);
      setRisks(risksData);
      setActions(actionsData);
      setForecast(forecastData);
    } catch (error) {
      console.error("Error loading owner metrics:", error);
      toast.error("Erro ao carregar métricas");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!metrics) return;

    const today = new Date();
    const { error } = await supabase.from('report_snapshots').insert([{
      report_type: 'owner',
      period_start: format(today, 'yyyy-MM-dd'),
      period_end: format(today, 'yyyy-MM-dd'),
      metrics: metrics as unknown as Record<string, never>,
    }]);

    if (error) {
      toast.error("Erro ao salvar snapshot");
    } else {
      toast.success("Snapshot salvo!");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const severityColors = {
    high: 'text-red-500 bg-red-500/10 border-red-500/30',
    medium: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    low: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  };

  if (loading) {
    return (
      <DashboardLayout title="Visão do Dono">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Visão do Dono">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/relatorios')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Visão do Dono</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveSnapshot}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Snapshot
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.leadsToday || 0}</p>
                  <p className="text-xs text-muted-foreground">Leads Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.opportunitiesActive || 0}</p>
                  <p className="text-xs text-muted-foreground">Oportunidades</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {metrics?.proposalsSent7d || 0}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      ({metrics?.proposalsConversionRate || 0}%)
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">Propostas 7d</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.deliveriesIn7Days || 0}</p>
                  <p className="text-xs text-muted-foreground">Entregas 7d</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.overdueCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Inadimplentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risks */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                3 coisas que vão te ferrar se você ignorar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {risks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum risco crítico identificado 🎉
                </p>
              ) : (
                <div className="space-y-3">
                  {risks.slice(0, 3).map((risk, index) => (
                    <div
                      key={risk.id}
                      className={`p-3 rounded-lg border ${severityColors[risk.severity]}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg font-bold opacity-50">#{index + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium">{risk.title}</p>
                          <p className="text-sm opacity-80">{risk.description}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px]">
                          {risk.type === 'financial' ? 'Financeiro' : 
                           risk.type === 'delay' ? 'Atraso' :
                           risk.type === 'no_action' ? 'Sem ação' : 'Aprovação'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today Actions */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                Ações do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma ação pendente para hoje
                </p>
              ) : (
                <div className="space-y-2">
                  {actions.map((action) => (
                    <div
                      key={action.id}
                      className="p-2 rounded-lg bg-muted/30 flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{action.title}</p>
                        {action.projectName && (
                          <p className="text-xs text-muted-foreground">{action.projectName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Forecast */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Pipeline de Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {forecast.map((f) => (
                <div key={f.period} className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{f.period} dias</p>
                  <p className="text-2xl font-semibold text-foreground">{formatCurrency(f.value)}</p>
                  <p className="text-xs text-muted-foreground">{f.count} parcelas</p>
                </div>
              ))}
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecast.map(f => ({ name: `${f.period}d`, value: f.value }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Caixa Previsto */}
        <Card className="glass-card p-6 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Caixa Previsto (30 dias)</p>
              <p className="text-4xl font-light text-foreground tracking-tight">
                {formatCurrency(metrics?.cashForecast30Days || 0)}
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
