import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useReportMetrics } from "@/hooks/useReportMetrics";
import { FinancialMetrics } from "@/types/reports";
import {
  DollarSign, ArrowLeft, Download, TrendingUp, TrendingDown, AlertTriangle,
  Clock, CheckCircle, Ban, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useExportPdf } from "@/hooks/useExportPdf";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";

export default function FinancialReport() {
  const navigate = useNavigate();
  const { fetchFinancialMetrics } = useReportMetrics();
  const { isExporting, exportFinance } = useExportPdf();
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchFinancialMetrics();
      setMetrics(data);
    } catch (error) {
      console.error("Error loading financial metrics:", error);
      toast.error("Erro ao carregar métricas financeiras");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <DashboardLayout title="Relatório Financeiro">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </DashboardLayout>
    );
  }

  const forecastData = [
    { name: '30d', value: metrics?.forecast30 || 0 },
    { name: '60d', value: metrics?.forecast60 || 0 },
    { name: '90d', value: metrics?.forecast90 || 0 },
  ];

  return (
    <DashboardLayout title="Relatório Financeiro">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/relatorios')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Financeiro</h1>
              <p className="text-sm text-muted-foreground">Real vs previsto</p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled={isExporting} onClick={() => exportFinance("6m")}>
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {isExporting ? "Gerando..." : "Exportar PDF"}
          </Button>
        </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">{formatCurrency(metrics?.receivedPeriod || 0)}</p>
                  <p className="text-xs text-muted-foreground">Recebido (mês)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">{formatCurrency(metrics?.pendingReceivable || 0)}</p>
                  <p className="text-xs text-muted-foreground">A receber</p>
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
                  <p className="text-xl font-semibold text-foreground">{formatCurrency(metrics?.overdueReceivable || 0)}</p>
                  <p className="text-xs text-muted-foreground">Em atraso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">{metrics?.blockedProjects || 0}</p>
                  <p className="text-xs text-muted-foreground">Projetos bloqueados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Balance Card */}
        <Card className="glass-card p-6 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo do Período (Receita - Despesa)</p>
              <p className={`text-4xl font-light tracking-tight ${(metrics?.periodBalance || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatCurrency(metrics?.periodBalance || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Despesas pagas</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(metrics?.paidExpenses || 0)}</p>
              <p className="text-sm text-muted-foreground mt-2">Despesas pendentes</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(metrics?.pendingExpenses || 0)}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Forecast */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Forecast 30/60/90 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-emerald-500/10">
                  <p className="text-xs text-muted-foreground">30 dias</p>
                  <p className="text-lg font-semibold text-emerald-500">{formatCurrency(metrics?.forecast30 || 0)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-500/10">
                  <p className="text-xs text-muted-foreground">60 dias</p>
                  <p className="text-lg font-semibold text-blue-500">{formatCurrency(metrics?.forecast60 || 0)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-violet-500/10">
                  <p className="text-xs text-muted-foreground">90 dias</p>
                  <p className="text-lg font-semibold text-violet-500">{formatCurrency(metrics?.forecast90 || 0)}</p>
                </div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecastData}>
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

          {/* Overdue Aging */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Inadimplência por Aging
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.overdueByAging && metrics.overdueByAging.some(a => a.count > 0) ? (
                <div className="space-y-3">
                  {metrics.overdueByAging.map((bucket) => (
                    <div key={bucket.range} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium text-foreground">{bucket.range}</p>
                        <p className="text-xs text-muted-foreground">{bucket.count} parcelas</p>
                      </div>
                      <p className={`font-semibold ${bucket.value > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {formatCurrency(bucket.value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle className="w-12 h-12 text-emerald-500/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma inadimplência 🎉</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
