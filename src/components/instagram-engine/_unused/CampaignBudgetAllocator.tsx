import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { InstagramCampaign, InstagramPost, useInstagramAI, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { DollarSign, Sparkles, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

export function CampaignBudgetAllocator({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const [budget, setBudget] = useState(campaign.budget?.toString() || '');
  const [result, setResult] = useState<any>(null);

  const stats = useMemo(() => {
    const formatDist = FORMATS.map(f => ({ key: f.key, label: f.label, count: posts.filter(p => p.format === f.key).length })).filter(f => f.count > 0);
    const pillarDist = PILLARS.map(p => ({ key: p.key, label: p.label, count: posts.filter(x => x.pillar === p.key).length })).filter(p => p.count > 0);
    return { formatDist, pillarDist };
  }, [posts]);

  const handleAnalyze = async () => {
    const budgetNum = parseFloat(budget);
    if (!budgetNum || budgetNum <= 0) { toast.error('Defina a verba total'); return; }

    try {
      const res = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Faça uma análise completa de alocação de BUDGET para a campanha "${campaign.name}".

Verba total: R$ ${budgetNum.toFixed(2)}
Objetivo: ${campaign.objective || 'geral'}
Público: ${campaign.target_audience || 'geral'}
Total posts: ${posts.length}
Formatos: ${stats.formatDist.map(f => `${f.label}: ${f.count}`).join(', ')}
Pilares: ${stats.pillarDist.map(p => `${p.label}: ${p.count}`).join(', ')}

Retorne JSON com:
- total_budget: número
- format_allocation: array de {format, label, percentage, amount, reason}
- pillar_allocation: array de {pillar, label, percentage, amount, reason}
- scenarios: array de 3 cenários, cada com {name: "conservador"|"moderado"|"agressivo", description, total_spend, expected_reach, expected_engagement, expected_roi_percentage, key_actions: string[]}
- optimization_tips: array de 4-5 dicas de otimização
- waste_alerts: array de 2-3 alertas de desperdício potencial
- roi_projection: objeto {best_case, worst_case, most_likely} (em reais)
- cost_per_post: número (custo médio por post)
- recommended_boost_posts: array de 2-3 {title, reason, suggested_budget} (posts que mais merecem impulsionamento)`,
          format: 'budget_allocator',
        },
      });
      setResult(res);
      toast.success('Alocação de budget gerada! 💰');
    } catch { /* handled */ }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Budget Allocator & ROI Predictor</h3>
        </div>
      </div>

      {/* Budget input */}
      <Card className="p-4 bg-card/50 border-border/30">
        <label className="text-[10px] text-muted-foreground font-medium mb-2 block">💰 Verba Total da Campanha (R$)</label>
        <div className="flex gap-2">
          <Input value={budget} onChange={e => setBudget(e.target.value)} type="number" placeholder="5000" className="text-xs" />
          <Button className="gap-1.5 text-xs shrink-0" onClick={handleAnalyze} disabled={ai.isPending}>
            {ai.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Analisar
          </Button>
        </div>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Cost per post */}
          {result.cost_per_post && (
            <Card className="p-4 bg-card/50 border-border/30 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Custo médio por post</div>
              <div className="text-lg font-bold text-foreground">R$ {result.cost_per_post.toFixed(2)}</div>
            </Card>
          )}

          {/* Format allocation */}
          {Array.isArray(result.format_allocation) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">📐 Alocação por Formato</h4>
              <div className="space-y-2">
                {result.format_allocation.map((f: any) => (
                  <div key={f.format}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[8px] w-20 justify-center">{f.label || f.format}</Badge>
                      <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${f.percentage}%` }} />
                      </div>
                      <span className="text-[9px] font-medium text-foreground w-20 text-right">R$ {f.amount?.toFixed(0)}</span>
                      <span className="text-[8px] text-muted-foreground w-8">{f.percentage}%</span>
                    </div>
                    {f.reason && <p className="text-[8px] text-muted-foreground/60 ml-[88px]">{f.reason}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Scenarios */}
          {Array.isArray(result.scenarios) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">🎯 Cenários de Investimento</h4>
              <div className="grid md:grid-cols-3 gap-3">
                {result.scenarios.map((s: any) => (
                  <div key={s.name} className={`p-3 rounded-lg border ${
                    s.name === 'agressivo' ? 'bg-destructive/5 border-destructive/20' :
                    s.name === 'moderado' ? 'bg-muted border-border' :
                    'bg-primary/5 border-primary/20'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Badge className={`text-[7px] ${
                        s.name === 'agressivo' ? 'bg-destructive/10 text-destructive' :
                        s.name === 'moderado' ? 'bg-muted text-muted-foreground' :
                        'bg-primary/10 text-primary'
                      }`}>{s.name}</Badge>
                    </div>
                    <p className="text-[9px] text-muted-foreground mb-2">{s.description}</p>
                    <div className="space-y-1 text-[9px]">
                      <div className="flex justify-between"><span className="text-muted-foreground">Investimento:</span><span className="text-foreground font-medium">R$ {s.total_spend?.toFixed(0)}</span></div>
                      {s.expected_reach && <div className="flex justify-between"><span className="text-muted-foreground">Alcance:</span><span className="text-foreground">{s.expected_reach}</span></div>}
                      {s.expected_roi_percentage && <div className="flex justify-between"><span className="text-muted-foreground">ROI estimado:</span><span className="text-primary font-medium">{s.expected_roi_percentage}%</span></div>}
                    </div>
                    {Array.isArray(s.key_actions) && (
                      <div className="mt-2 pt-2 border-t border-border/20">
                        {s.key_actions.map((a: string, i: number) => (
                          <div key={i} className="text-[8px] text-muted-foreground/60">• {a}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ROI Projection */}
          {result.roi_projection && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">📊 Projeção de Retorno</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-destructive/5 rounded-lg">
                  <div className="text-[9px] text-destructive mb-1">Pessimista</div>
                  <div className="text-sm font-bold text-foreground">R$ {result.roi_projection.worst_case}</div>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg">
                  <div className="text-[9px] text-primary mb-1">Provável</div>
                  <div className="text-sm font-bold text-foreground">R$ {result.roi_projection.most_likely}</div>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="text-[9px] text-primary mb-1">Otimista</div>
                  <div className="text-sm font-bold text-foreground">R$ {result.roi_projection.best_case}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Waste alerts */}
          {Array.isArray(result.waste_alerts) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-xs font-semibold text-muted-foreground">Alertas de Desperdício</h4>
              </div>
              <div className="space-y-1">
                {result.waste_alerts.map((a: string, i: number) => (
                  <div key={i} className="text-[10px] text-muted-foreground">⚠️ {a}</div>
                ))}
              </div>
            </Card>
          )}

          {/* Optimization tips */}
          {Array.isArray(result.optimization_tips) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-2">💡 Dicas de Otimização</h4>
              <div className="space-y-1">
                {result.optimization_tips.map((t: string, i: number) => (
                  <div key={i} className="text-[10px] text-muted-foreground">{i + 1}. {t}</div>
                ))}
              </div>
            </Card>
          )}

          {/* Boost recommendations */}
          {Array.isArray(result.recommended_boost_posts) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">🚀 Posts para Impulsionar</h4>
              <div className="space-y-2">
                {result.recommended_boost_posts.map((p: any, i: number) => (
                  <div key={i} className="p-2 bg-background/40 rounded flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-medium text-foreground">{p.title}</span>
                      <p className="text-[8px] text-muted-foreground">{p.reason}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary text-[8px]">R$ {p.suggested_budget}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
