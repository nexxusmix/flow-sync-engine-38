import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useReportMetrics } from "@/hooks/useReportMetrics";
import { MarketingMetrics } from "@/types/reports";
import {
  Megaphone, ArrowLeft, Download, FileText, Send, Clock, Lightbulb, Target, Loader2
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

const COLORS = ['hsl(195 100% 40%)', 'hsl(195 80% 50%)', 'hsl(195 60% 60%)', 'hsl(195 40% 45%)', 'hsl(200 70% 35%)'];

export default function MarketingReport() {
  const navigate = useNavigate();
  const { fetchMarketingMetrics } = useReportMetrics();
  const { isExporting, exportFinance } = useExportPdf();

  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchMarketingMetrics();
      setMetrics(data);
    } catch (error) {
      console.error("Error loading marketing metrics:", error);
      toast.error("Erro ao carregar métricas de marketing");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Relatório de Marketing">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </DashboardLayout>
    );
  }

  const publishRate = metrics?.producedMonth && metrics.producedMonth > 0
    ? Math.round((metrics.publishedMonth / metrics.producedMonth) * 100)
    : 0;

  return (
    <DashboardLayout title="Relatório de Marketing">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/relatorios')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Marketing</h1>
              <p className="text-sm text-muted-foreground">Produção e consistência</p>
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
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.producedMonth || 0}</p>
                  <p className="text-xs text-muted-foreground">Produzidos (mês)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {metrics?.publishedMonth || 0}
                    <span className="text-sm font-normal text-muted-foreground ml-1">({publishRate}%)</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Publicados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.delayedContent || 0}</p>
                  <p className="text-xs text-muted-foreground">Atrasados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.activeCampaigns || 0}</p>
                  <p className="text-xs text-muted-foreground">Campanhas Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.backlogIdeas || 0}</p>
                  <p className="text-xs text-muted-foreground">Ideias no Backlog</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content by Pillar */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Conteúdos por Pilar</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.contentByPillar && metrics.contentByPillar.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.contentByPillar}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="pillar"
                        label={({ pillar, count }) => `${pillar}: ${count}`}
                      >
                        {metrics.contentByPillar.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum conteúdo com pilar definido
                </p>
              )}
            </CardContent>
          </Card>

          {/* Content by Channel */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Conteúdos por Canal</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.contentByChannel && metrics.contentByChannel.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.contentByChannel} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis dataKey="channel" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                      <Tooltip 
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
                  Nenhum conteúdo com canal definido
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
