import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw, Brain, Target, AlertTriangle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrencyBRL } from '@/utils/format';
import type { ExecutiveMetrics } from '@/hooks/useExecutiveDashboard';
import type { AIInsights } from '@/components/dashboard/AIRiskRadar';

interface Props {
  metrics: ExecutiveMetrics;
  extras: {
    clientHealth: Array<{ client_name: string; alerts: string[]; avgHealthScore: number; overdueRevenue: number }>;
    automationStats: { failureCount: number; totalExecutions: number };
    aiStats: { totalRuns: number; successRate: number };
    pendingInboxCount: number;
  };
}

const CACHE_KEY = 'cc_copilot_insights';
const CACHE_TTL = 30 * 60 * 1000;

function getCached(): AIInsights | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCache(data: AIInsights) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
}

export function CCCopilot({ metrics, extras }: Props) {
  const [insights, setInsights] = useState<AIInsights | null>(getCached);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const clientsAtRisk = extras.clientHealth.filter(c => c.alerts.length > 0);
      const enrichedMetrics = {
        ...metrics,
        clientsAtRiskCount: clientsAtRisk.length,
        clientsAtRiskNames: clientsAtRisk.slice(0, 5).map(c => c.client_name),
        automationFailures: extras.automationStats.failureCount,
        automationTotal: extras.automationStats.totalExecutions,
        aiRunsTotal: extras.aiStats.totalRuns,
        pendingInboxCount: extras.pendingInboxCount,
        totalOverdueByClient: clientsAtRisk.reduce((s, c) => s + c.overdueRevenue, 0),
      };

      const { data, error } = await supabase.functions.invoke('generate-executive-insights', {
        body: {
          metrics: enrichedMetrics,
          projects: metrics.rawProjects || [],
          tasks: metrics.rawTasks || [],
          revenues: metrics.rawRevenues || [],
          deals: metrics.rawDeals || [],
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setInsights(data);
      setCache(data);
      toast.success('Análise do Copiloto gerada');
    } catch (e: any) {
      console.error('Copilot error:', e);
      toast.error(e.message || 'Erro ao gerar análise');
    } finally {
      setLoading(false);
    }
  }, [metrics, extras]);

  // Quick context cards
  const quickInsights = [
    {
      icon: Target,
      label: 'Produtividade',
      value: `${metrics.productivityScore}/100`,
      detail: metrics.productivityScore >= 80 ? 'Operação saudável' : metrics.productivityScore >= 50 ? 'Pontos de atenção' : 'Ação urgente necessária',
      color: metrics.productivityScore >= 80 ? 'text-primary' : metrics.productivityScore >= 50 ? 'text-yellow-500' : 'text-destructive',
    },
    {
      icon: AlertTriangle,
      label: 'Clientes em Risco',
      value: String(extras.clientHealth.filter(c => c.alerts.length > 0).length),
      detail: extras.clientHealth.filter(c => c.alerts.length > 0).slice(0, 2).map(c => c.client_name).join(', ') || 'Nenhum',
      color: extras.clientHealth.some(c => c.alerts.length > 0) ? 'text-destructive' : 'text-primary',
    },
    {
      icon: TrendingUp,
      label: 'Cash Runway',
      value: metrics.cashRunwayMonths === Infinity ? '∞' : `${metrics.cashRunwayMonths.toFixed(1)} meses`,
      detail: metrics.cashRunwayMonths < 3 ? 'Fôlego financeiro curto' : 'Fôlego adequado',
      color: metrics.cashRunwayMonths < 3 ? 'text-destructive' : 'text-primary',
    },
  ];

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <Card className="glass-card p-6 border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Copiloto da Operação</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Análise inteligente com resumo executivo, riscos detectados e recomendações de ação.
              </p>
            </div>
          </div>
          <Button onClick={generate} disabled={loading} variant="outline" size="sm" className="gap-2 flex-shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : insights ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Analisando...' : insights ? 'Atualizar Análise' : 'Gerar Análise IA'}
          </Button>
        </div>
      </Card>

      {/* Quick Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {quickInsights.map(q => (
          <Card key={q.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <q.icon className={`w-4 h-4 ${q.color}`} />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{q.label}</p>
            </div>
            <p className={`text-xl font-semibold ${q.color}`}>{q.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{q.detail}</p>
          </Card>
        ))}
      </div>

      {/* AI Generated Insights */}
      <AnimatePresence>
        {insights && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Executive Summary */}
            <Card className="glass-card p-5 border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-medium text-primary uppercase tracking-widest mb-2">Resumo Executivo</h4>
                  <p className="text-sm text-foreground leading-relaxed">{insights.executive_summary}</p>
                </div>
              </div>
            </Card>

            {/* Risks */}
            {insights.risk_radar && insights.risk_radar.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Riscos Detectados
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.risk_radar.map((risk, i) => {
                    const borderColor = risk.severity === 'red' ? 'border-destructive/30 bg-destructive/5' :
                      risk.severity === 'yellow' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-primary/20 bg-primary/5';
                    const textColor = risk.severity === 'red' ? 'text-destructive' :
                      risk.severity === 'yellow' ? 'text-yellow-500' : 'text-primary';
                    return (
                      <Card key={i} className={`p-4 border ${borderColor}`}>
                        <h5 className="text-sm font-medium text-foreground">{risk.title}</h5>
                        <p className="text-xs text-muted-foreground mt-1">{risk.description}</p>
                        {risk.metric && <p className={`text-xs font-medium ${textColor} mt-1`}>{risk.metric}</p>}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            {insights.action_items && insights.action_items.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  O Que Fazer Agora
                </h4>
                <div className="space-y-2">
                  {insights.action_items.sort((a, b) => a.priority - b.priority).map((action, i) => (
                    <Card key={i} className="glass-card p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{action.priority}</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-foreground">{action.title}</h5>
                          <p className="text-xs text-muted-foreground mt-0.5">{action.reason}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
