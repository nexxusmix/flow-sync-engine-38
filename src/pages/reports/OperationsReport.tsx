import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings, ArrowLeft, Download, Clock, MessageSquare, CheckSquare, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface OpsMetrics {
  projectsByStage: { stage: string; count: number }[];
  delayedCount: number;
  avgDelayDays: number;
  openComments: number;
  pendingApprovals: number;
}

export default function OperationsReport() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<OpsMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch content items as proxy for projects workflow
      const { data: contentItems } = await supabase
        .from('content_items')
        .select('id, status');

      const items = contentItems || [];

      // Group by status
      const stageMap = new Map<string, number>();
      items.forEach(item => {
        const stage = item.status || 'briefing';
        stageMap.set(stage, (stageMap.get(stage) || 0) + 1);
      });

      const projectsByStage = Array.from(stageMap.entries()).map(([stage, count]) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        count,
      }));

      // Fetch comments
      const { data: comments } = await supabase
        .from('content_comments')
        .select('id');

      setMetrics({
        projectsByStage,
        delayedCount: 0,
        avgDelayDays: 0,
        openComments: comments?.length || 0,
        pendingApprovals: items.filter(i => i.status === 'approval').length,
      });
    } catch (error) {
      console.error("Error loading ops metrics:", error);
      toast.error("Erro ao carregar métricas de operação");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Relatório de Operação">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Relatório de Operação">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/relatorios')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Operação</h1>
              <p className="text-sm text-muted-foreground">Projetos, prazos, revisões e capacidade</p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                   <Clock className="w-5 h-5 text-destructive" />
                 </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.delayedCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Projetos Atrasados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                   <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                 </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.avgDelayDays || 0}</p>
                  <p className="text-xs text-muted-foreground">Média Atraso (dias)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                   <MessageSquare className="w-5 h-5 text-primary" />
                 </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.openComments || 0}</p>
                  <p className="text-xs text-muted-foreground">Comentários Abertos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                   <CheckSquare className="w-5 h-5 text-primary" />
                 </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.pendingApprovals || 0}</p>
                  <p className="text-xs text-muted-foreground">Aprovações Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects by Stage */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Projetos por Etapa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.projectsByStage && metrics.projectsByStage.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.projectsByStage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum projeto em andamento
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bottlenecks */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Gargalos por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.projectsByStage && metrics.projectsByStage.length > 0 ? (
              <div className="space-y-3">
                {metrics.projectsByStage
                  .sort((a, b) => b.count - a.count)
                  .map((stage, index) => {
                    const maxCount = metrics.projectsByStage[0]?.count || 1;
                    const percentage = (stage.count / maxCount) * 100;
                    const isBottleneck = percentage > 50 && index < 2;
                    
                    return (
                      <div key={stage.stage} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-24">{stage.stage}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-foreground">{stage.count} itens</span>
                            {isBottleneck && (
                             <Badge variant="outline" className="text-muted-foreground border-border text-[9px]">
                                Gargalo
                              </Badge>
                            )}
                          </div>
                          <Progress value={percentage} className="h-1.5" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum gargalo identificado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
