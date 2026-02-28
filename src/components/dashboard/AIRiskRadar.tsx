import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Shield, AlertTriangle, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ExecutiveActionBlock } from './ExecutiveActionBlock';

export interface AIInsights {
  executive_summary: string;
  risk_radar: Array<{
    type: string;
    severity: 'red' | 'yellow' | 'green';
    title: string;
    description: string;
    metric?: string;
  }>;
  action_items: Array<{
    priority: number;
    title: string;
    reason: string;
    impact_area: string;
  }>;
  bottlenecks?: Array<{
    area: string;
    description: string;
    avg_days_stuck?: number;
  }>;
}

interface AIRiskRadarProps {
  metrics: any;
  projects: any[];
  tasks: any[];
  deals: any[];
  revenues: any[];
}

const CACHE_KEY = 'squad_executive_insights';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

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

const severityConfig = {
  red: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', label: 'Crítico' },
  yellow: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Atenção' },
  green: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'OK' },
};

const typeLabels: Record<string, string> = {
  prazo: '⏰ Prazo',
  financeiro: '💰 Financeiro',
  sobrecarga: '🔥 Sobrecarga',
  pipeline: '📊 Pipeline',
  gargalo: '🚧 Gargalo',
};

export function AIRiskRadar({ metrics, projects, tasks, deals, revenues }: AIRiskRadarProps) {
  const [insights, setInsights] = useState<AIInsights | null>(getCached);
  const [loading, setLoading] = useState(false);

  const generateInsights = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-executive-insights', {
        body: { metrics, projects, tasks, revenues, deals },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setInsights(data);
      setCache(data);
      toast.success('Análise executiva gerada');
    } catch (e: any) {
      console.error('AI insights error:', e);
      toast.error(e.message || 'Erro ao gerar análise IA');
    } finally {
      setLoading(false);
    }
  }, [metrics, projects, tasks, deals, revenues]);

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-medium text-primary uppercase tracking-widest">Radar de Riscos IA</h2>
        </div>
        <Button onClick={generateInsights} disabled={loading} variant="outline" size="sm" className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : insights ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Analisando...' : insights ? 'Atualizar Análise' : 'Gerar Análise IA'}
        </Button>
      </div>

      <AnimatePresence>
        {insights && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Executive Summary */}
            <Card className="glass-card p-4 border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{insights.executive_summary}</p>
              </div>
            </Card>

            {/* Risk Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {insights.risk_radar
                .sort((a, b) => {
                  const order = { red: 0, yellow: 1, green: 2 };
                  return order[a.severity] - order[b.severity];
                })
                .map((risk, i) => {
                  const config = severityConfig[risk.severity];
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className={`p-4 border ${config.border} ${config.bg}`}>
                        <div className="flex items-start gap-2">
                          <Icon className={`w-4 h-4 ${config.color} mt-0.5 flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-muted-foreground">{typeLabels[risk.type] || risk.type}</span>
                            </div>
                            <h4 className="text-sm font-medium text-foreground">{risk.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{risk.description}</p>
                            {risk.metric && (
                              <p className={`text-xs font-medium ${config.color} mt-1`}>{risk.metric}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
            </div>

            {/* Action Items */}
            {insights.action_items && insights.action_items.length > 0 && (
              <ExecutiveActionBlock actions={insights.action_items} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
