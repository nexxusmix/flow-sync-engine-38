import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost, useInstagramAI, PILLARS, FORMATS } from '@/hooks/useInstagramEngine';
import { Search, Sparkles, Loader2, AlertTriangle, CheckCircle, TrendingUp, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface Gap {
  type: 'pillar' | 'format' | 'topic';
  label: string;
  severity: 'critical' | 'moderate' | 'opportunity';
  detail: string;
}

export function CampaignContentGapAnalyzer({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const [aiGaps, setAiGaps] = useState<any>(null);

  // Local gap detection
  const localGaps = useMemo(() => {
    const gaps: Gap[] = [];
    const pillarsUsed = new Set(posts.map(p => p.pillar).filter(Boolean));
    const formatsUsed = new Set(posts.map(p => p.format).filter(Boolean));
    const pillarCounts: Record<string, number> = {};
    const formatCounts: Record<string, number> = {};

    posts.forEach(p => {
      if (p.pillar) pillarCounts[p.pillar] = (pillarCounts[p.pillar] || 0) + 1;
      if (p.format) formatCounts[p.format] = (formatCounts[p.format] || 0) + 1;
    });

    // Missing pillars
    PILLARS.forEach(p => {
      if (!pillarsUsed.has(p.key)) {
        gaps.push({ type: 'pillar', label: `Pilar "${p.label}" ausente`, severity: 'critical', detail: `Nenhum post usa o pilar ${p.label}. Diversidade de pilares melhora engajamento.` });
      }
    });

    // Underused formats
    FORMATS.forEach(f => {
      if (!formatsUsed.has(f.key)) {
        gaps.push({ type: 'format', label: `Formato "${f.label}" não explorado`, severity: 'moderate', detail: `O formato ${f.label} não aparece na campanha. Diversificar formatos alcança audiências diferentes.` });
      }
    });

    // Over-concentration
    const totalPosts = posts.length || 1;
    Object.entries(pillarCounts).forEach(([key, count]) => {
      const pct = (count / totalPosts) * 100;
      if (pct > 50) {
        const label = PILLARS.find(p => p.key === key)?.label || key;
        gaps.push({ type: 'pillar', label: `Concentração excessiva em "${label}"`, severity: 'moderate', detail: `${pct.toFixed(0)}% dos posts usam o pilar ${label}. Ideal: máx 35%.` });
      }
    });

    // No CTA in most posts
    const noCta = posts.filter(p => !p.cta).length;
    if (noCta > totalPosts * 0.5 && totalPosts > 2) {
      gaps.push({ type: 'topic', label: 'Maioria dos posts sem CTA', severity: 'critical', detail: `${noCta}/${totalPosts} posts não têm CTA definido.` });
    }

    // No hooks
    const noHook = posts.filter(p => !p.hook).length;
    if (noHook > totalPosts * 0.4 && totalPosts > 2) {
      gaps.push({ type: 'topic', label: 'Posts sem hook', severity: 'moderate', detail: `${noHook}/${totalPosts} posts sem hook. Hooks aumentam retenção em 3x.` });
    }

    return gaps;
  }, [posts]);

  const handleAIAnalysis = async () => {
    try {
      const postsSummary = posts.slice(0, 20).map(p =>
        `[${p.format}|${p.pillar}] ${p.title} — hook: ${p.hook || 'N/A'}`
      ).join('\n');

      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Analise a estratégia de conteúdo da campanha "${campaign.name}" e identifique lacunas.

Posts atuais:
${postsSummary}

Público: ${campaign.target_audience || 'geral'}
Objetivo: ${campaign.objective || 'engajamento'}

Retorne JSON com:
- content_gaps: array de lacunas (cada uma com: topic, severity: "critical"|"moderate"|"opportunity", description, suggested_fix)
- missing_angles: array de ângulos de conteúdo que faltam (string)
- competitor_insights: array de 3 observações sobre o que concorrentes fazem que falta aqui
- quick_wins: array de 3 ações rápidas para tapar as lacunas
- coverage_score: 0-100 (quanto da estratégia está coberta)`,
          format: 'analysis',
        },
      });
      setAiGaps(result);
      toast.success('Análise de lacunas gerada!');
    } catch {
      // handled
    }
  };

  const getSeverityIcon = (s: string) => {
    switch (s) {
      case 'critical': return <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />;
      case 'moderate': return <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
      default: return <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0" />;
    }
  };

  const getSeverityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-destructive/10 text-destructive';
      case 'moderate': return 'bg-muted text-muted-foreground';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Content Gap Analyzer</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleAIAnalysis} disabled={ai.isPending}>
          {ai.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Análise Profunda IA
        </Button>
      </div>

      {/* Local gaps */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground">🔍 Lacunas Detectadas ({localGaps.length})</h4>
        {localGaps.length === 0 ? (
          <Card className="p-4 bg-card/50 border-border/30 text-center">
            <CheckCircle className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Nenhuma lacuna crítica detectada!</p>
          </Card>
        ) : (
          localGaps.map((gap, i) => (
            <Card key={i} className="p-3 bg-card/50 border-border/30">
              <div className="flex items-start gap-2">
                {getSeverityIcon(gap.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{gap.label}</span>
                    <Badge variant="outline" className={`text-[8px] ${getSeverityColor(gap.severity)}`}>{gap.severity}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{gap.detail}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* AI analysis */}
      {aiGaps && (
        <div className="space-y-4">
          {/* Coverage score */}
          {aiGaps.coverage_score !== undefined && (
            <Card className="p-4 bg-card/50 border-border/30 text-center">
              <div className="text-3xl font-bold text-foreground">{aiGaps.coverage_score}</div>
              <div className="text-[10px] text-muted-foreground">Cobertura Estratégica /100</div>
              <div className="w-full h-2 bg-muted/20 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${aiGaps.coverage_score}%` }} />
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* AI gaps */}
            {Array.isArray(aiGaps.content_gaps) && (
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className="text-xs font-semibold text-foreground mb-2">🎯 Lacunas de Conteúdo</h4>
                <div className="space-y-2">
                  {aiGaps.content_gaps.map((g: any, i: number) => (
                    <div key={i}>
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(g.severity)}
                        <span className="text-[11px] font-medium text-foreground">{g.topic}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 pl-5">{g.description}</p>
                      {g.suggested_fix && <p className="text-[10px] text-primary/70 pl-5">💡 {g.suggested_fix}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick wins + missing angles */}
            <Card className="p-4 bg-card/50 border-border/30">
              {Array.isArray(aiGaps.quick_wins) && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-emerald-400 mb-1.5">⚡ Quick Wins</h4>
                  <ul className="space-y-1">
                    {aiGaps.quick_wins.map((w: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground">• {w}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(aiGaps.missing_angles) && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-amber-400 mb-1.5">📐 Ângulos Faltantes</h4>
                  <div className="flex flex-wrap gap-1">
                    {aiGaps.missing_angles.map((a: string, i: number) => (
                      <Badge key={i} className="bg-amber-400/10 text-amber-400 text-[9px]">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(aiGaps.competitor_insights) && (
                <div>
                  <h4 className="text-xs font-semibold text-blue-400 mb-1.5">👀 Insights Competitivos</h4>
                  <ul className="space-y-1">
                    {aiGaps.competitor_insights.map((c: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground">• {c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
