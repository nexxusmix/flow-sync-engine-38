import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useReportMetrics } from "@/hooks/useReportMetrics";
import { SalesMetrics } from "@/types/reports";
import {
  TrendingUp, ArrowLeft, Download, FileText, Eye, CheckCircle, XCircle, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useExportPdf } from "@/hooks/useExportPdf";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function SalesReport() {
  const navigate = useNavigate();
  const { fetchSalesMetrics } = useReportMetrics();
  const { isExporting, exportFinance } = useExportPdf();

  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchSalesMetrics();
      setMetrics(data);
    } catch (error) {
      console.error("Error loading sales metrics:", error);
      toast.error("Erro ao carregar métricas de vendas");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <DashboardLayout title="Relatório de Vendas">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalProposals = metrics?.proposalStats.sent || 0;
  const proposalViewRate = totalProposals > 0 
    ? Math.round((metrics?.proposalStats.viewed || 0) / totalProposals * 100) 
    : 0;
  const proposalAcceptRate = totalProposals > 0 
    ? Math.round((metrics?.proposalStats.accepted || 0) / totalProposals * 100) 
    : 0;

  return (
    <DashboardLayout title="Relatório de Vendas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/relatorios')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Vendas</h1>
              <p className="text-sm text-muted-foreground">Funil e performance comercial</p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled={isExporting} onClick={() => exportFinance("6m")}>
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {isExporting ? "Gerando..." : "Exportar PDF"}
          </Button>
        </div>

        {/* Proposal Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.proposalStats.sent || 0}</p>
                  <p className="text-xs text-muted-foreground">Propostas Enviadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {metrics?.proposalStats.viewed || 0}
                    <span className="text-sm font-normal text-muted-foreground ml-1">({proposalViewRate}%)</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Visualizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {metrics?.proposalStats.accepted || 0}
                    <span className="text-sm font-normal text-muted-foreground ml-1">({proposalAcceptRate}%)</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Aceitas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.proposalStats.rejected || 0}</p>
                  <p className="text-xs text-muted-foreground">Rejeitadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel by Stage */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Funil por Etapa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.funnelByStage && metrics.funnelByStage.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.funnelByStage} layout="vertical">
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
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma oportunidade no funil
                </p>
              )}
            </CardContent>
          </Card>

          {/* Loss Reasons */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Motivos de Perda (Top 5)</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.lossReasons && metrics.lossReasons.length > 0 ? (
                <div className="space-y-3">
                  {metrics.lossReasons.map((reason, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">#{index + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">{reason.reason}</span>
                          <span className="text-sm text-muted-foreground">{reason.count}</span>
                        </div>
                        <Progress 
                          value={(reason.count / (metrics.lossReasons[0]?.count || 1)) * 100} 
                          className="h-1.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum motivo de perda registrado
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Funnel Value */}
        {metrics?.funnelByStage && metrics.funnelByStage.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Valor por Etapa do Funil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.funnelByStage.map((stage, index) => (
                  <div key={stage.stage} className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground mb-1 capitalize">{stage.stage}</p>
                    <p className="text-xl font-semibold text-foreground">{formatCurrency(stage.value)}</p>
                    <p className="text-xs text-muted-foreground">{stage.count} oportunidades</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
