import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useExportPdf } from "@/hooks/useExportPdf";
import {
  Users, ArrowLeft, Download, TrendingUp, Target, AlertTriangle,
  Clock, Loader2, Zap, BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from "recharts";

const COLORS = [
  'hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))'
];

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  qualification: 'Qualificação',
  diagnosis: 'Diagnóstico',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  closed: 'Fechado',
  onboarding: 'Onboarding',
  post_sale: 'Pós-Venda',
};

interface CRMMetrics {
  totalDeals: number;
  totalValue: number;
  wonDeals: number;
  wonValue: number;
  lostDeals: number;
  avgLeadScore: number;
  staleDeals: number;
  avgCycleDays: number;
  funnelData: { stage: string; count: number; value: number }[];
  temperatureData: { name: string; count: number }[];
  scoreDistribution: { range: string; count: number }[];
  conversionByStage: { stage: string; rate: number }[];
}

export default function CRMReport() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<CRMMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { isExporting, exportFinance } = useExportPdf();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: deals } = await supabase
        .from('crm_deals')
        .select('*');

      const allDeals = deals || [];
      const totalValue = allDeals.reduce((s, d) => s + Number(d.value || 0), 0);
      const wonDeals = allDeals.filter(d => d.stage_key === 'closed');
      const lostDeals = allDeals.filter(d => d.stage_key === 'lost');
      const scoredDeals = allDeals.filter(d => d.lead_score != null && d.lead_score > 0);
      const avgScore = scoredDeals.length > 0
        ? Math.round(scoredDeals.reduce((s, d) => s + (d.lead_score || 0), 0) / scoredDeals.length)
        : 0;

      const staleDeals = allDeals.filter(d => (d.stale_days || 0) > 3).length;

      // Funnel data
      const stageMap = new Map<string, { count: number; value: number }>();
      allDeals.forEach(d => {
        const stage = d.stage_key || 'lead';
        const current = stageMap.get(stage) || { count: 0, value: 0 };
        stageMap.set(stage, {
          count: current.count + 1,
          value: current.value + Number(d.value || 0),
        });
      });

      const stageOrder = ['lead', 'qualification', 'diagnosis', 'proposal', 'negotiation', 'closed', 'onboarding', 'post_sale'];
      const funnelData = stageOrder
        .filter(s => stageMap.has(s))
        .map(s => ({
          stage: STAGE_LABELS[s] || s,
          count: stageMap.get(s)!.count,
          value: stageMap.get(s)!.value,
        }));

      // Temperature distribution
      const tempMap = new Map<string, number>();
      allDeals.forEach(d => {
        const temp = d.temperature || 'warm';
        tempMap.set(temp, (tempMap.get(temp) || 0) + 1);
      });
      const tempLabels: Record<string, string> = { hot: 'Quente', warm: 'Morno', cold: 'Frio' };
      const temperatureData = ['hot', 'warm', 'cold']
        .filter(t => tempMap.has(t))
        .map(t => ({ name: tempLabels[t] || t, count: tempMap.get(t) || 0 }));

      // Lead score distribution
      const scoreRanges = [
        { range: '0-25', min: 0, max: 25 },
        { range: '26-50', min: 26, max: 50 },
        { range: '51-75', min: 51, max: 75 },
        { range: '76-100', min: 76, max: 100 },
      ];
      const scoreDistribution = scoreRanges.map(r => ({
        range: r.range,
        count: scoredDeals.filter(d => (d.lead_score || 0) >= r.min && (d.lead_score || 0) <= r.max).length,
      }));

      // Conversion by stage (simplified)
      let remaining = allDeals.length;
      const conversionByStage = stageOrder.filter(s => stageMap.has(s)).map(s => {
        const count = stageMap.get(s)!.count;
        const rate = remaining > 0 ? Math.round((count / remaining) * 100) : 0;
        remaining -= count;
        return { stage: STAGE_LABELS[s] || s, rate };
      });

      setMetrics({
        totalDeals: allDeals.length,
        totalValue,
        wonDeals: wonDeals.length,
        wonValue: wonDeals.reduce((s, d) => s + Number(d.value || 0), 0),
        lostDeals: lostDeals.length,
        avgLeadScore: avgScore,
        staleDeals,
        avgCycleDays: 0,
        funnelData,
        temperatureData,
        scoreDistribution,
        conversionByStage,
      });
    } catch (error) {
      console.error("Error loading CRM metrics:", error);
      toast.error("Erro ao carregar métricas do CRM");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) {
    return (
      <DashboardLayout title="Relatório CRM">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Relatório CRM">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/relatorios')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">CRM / Pipeline</h1>
              <p className="text-sm text-muted-foreground">Conversão, lead scoring e saúde do pipeline</p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled={isExporting} onClick={() => exportFinance("6m")}>
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {isExporting ? "Gerando..." : "Exportar PDF"}
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.totalDeals || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Deals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.wonDeals || 0}</p>
                  <p className="text-xs text-muted-foreground">Ganhos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.avgLeadScore || 0}</p>
                  <p className="text-xs text-muted-foreground">Score Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.staleDeals || 0}</p>
                  <p className="text-xs text-muted-foreground">Estagnados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(metrics?.totalValue || 0)}</p>
                  <p className="text-xs text-muted-foreground">Valor Pipeline</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Won value card */}
        <Card className="glass-card p-6 bg-gradient-to-r from-emerald-500/5 to-emerald-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total Ganho</p>
              <p className="text-4xl font-light tracking-tight text-emerald-500">
                {formatCurrency(metrics?.wonValue || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Deals perdidos</p>
              <p className="text-xl font-semibold text-foreground">{metrics?.lostDeals || 0}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline Funnel */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Funil por Etapa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.funnelData && metrics.funnelData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.funnelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis dataKey="stage" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                      <Tooltip
                        formatter={(value: number, name: string) =>
                          name === 'value' ? formatCurrency(value) : value
                        }
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Deals" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum deal no pipeline
                </p>
              )}
            </CardContent>
          </Card>

          {/* Lead Score Distribution */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Distribuição de Lead Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.scoreDistribution && metrics.scoreDistribution.some(s => s.count > 0) ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Deals">
                        {metrics.scoreDistribution.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum deal com lead score
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Temperatura dos Deals</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.temperatureData && metrics.temperatureData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.temperatureData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="name"
                        label={({ name, count }) => `${name}: ${count}`}
                      >
                        <Cell fill="hsl(0, 72%, 51%)" />
                        <Cell fill="hsl(38, 92%, 50%)" />
                        <Cell fill="hsl(210, 79%, 46%)" />
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
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
              )}
            </CardContent>
          </Card>

          {/* Value per Stage */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Valor por Etapa</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.funnelData && metrics.funnelData.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {metrics.funnelData.map((stage, i) => (
                    <div key={stage.stage} className="p-3 rounded-lg bg-muted/30 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{stage.stage}</p>
                      <p className="text-lg font-semibold text-foreground">{formatCurrency(stage.value)}</p>
                      <p className="text-xs text-muted-foreground">{stage.count} deals</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}