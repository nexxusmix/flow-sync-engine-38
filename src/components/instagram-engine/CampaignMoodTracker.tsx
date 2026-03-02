import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost, useInstagramAI } from '@/hooks/useInstagramEngine';
import { Thermometer, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

export function CampaignMoodTracker({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const [analysis, setAnalysis] = useState<any>(null);

  // Sort posts by date for timeline
  const sortedPosts = useMemo(() =>
    [...posts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  [posts]);

  const handleAnalyze = async () => {
    const postsSample = sortedPosts.slice(0, 30).map((p, i) => ({
      index: i + 1,
      title: p.title,
      hook: p.hook?.slice(0, 80),
      caption: (p.caption_short || p.caption_long?.slice(0, 100) || ''),
      format: p.format,
      date: p.scheduled_at || p.created_at,
    }));

    try {
      const res = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Analise o SENTIMENTO e TOM de todos os posts da campanha "${campaign.name}" ao longo do tempo.

Objetivo: ${campaign.objective || 'geral'}
Público: ${campaign.target_audience || 'geral'}

Posts em ordem cronológica:
${JSON.stringify(postsSample, null, 1)}

Retorne JSON com:
- overall_mood: string (ex: "otimista com picos de urgência")
- mood_score: número 1-10 (1=muito negativo, 5=neutro, 10=muito positivo)
- consistency_score: número 0-100 (quão consistente o tom é)
- timeline: array de objetos (1 por post analisado), cada com:
  - index: número do post
  - sentiment: "positive"|"negative"|"neutral"|"urgent"|"inspirational"|"educational"
  - emotion: emoção dominante (ex: "empolgação", "confiança", "medo de perder")
  - intensity: 1-10
  - tone_word: 1 palavra resumindo o tom
- mood_shifts: array de 2-4 momentos onde o tom muda significativamente, cada com {from_index, to_index, description}
- monotony_alerts: array de alertas se o tom está monótono (posts consecutivos com mesmo sentimento)
- tone_distribution: objeto com percentuais {positive, negative, neutral, urgent}
- recommendations: array de 3-4 recomendações de tom
- ideal_tone_arc: string descrevendo o arco de tom ideal para este tipo de campanha`,
          format: 'mood_tracker',
        },
      });
      setAnalysis(res);
      toast.success('Análise de sentimento gerada! 🎭');
    } catch { /* handled */ }
  };

  const sentimentColors: Record<string, string> = {
    positive: 'bg-primary',
    negative: 'bg-destructive',
    neutral: 'bg-muted-foreground',
    urgent: 'bg-muted-foreground',
    inspirational: 'bg-primary/70',
    educational: 'bg-primary/50',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Campaign Mood Tracker</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleAnalyze} disabled={ai.isPending}>
          {ai.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Analisar Sentimento
        </Button>
      </div>

      {!analysis && (
        <Card className="p-8 bg-card/30 border-border/20 text-center">
          <Thermometer className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Rastreie a evolução do tom e sentimento da campanha ao longo dos posts</p>
        </Card>
      )}

      {analysis && (
        <div className="space-y-4">
          {/* Overall mood */}
          <Card className="p-4 bg-primary/5 border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-semibold text-foreground">{analysis.overall_mood}</h4>
                <p className="text-[9px] text-muted-foreground mt-0.5">Consistência: {analysis.consistency_score}/100</p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${(analysis.mood_score || 5) >= 7 ? 'text-primary' : (analysis.mood_score || 5) >= 4 ? 'text-muted-foreground' : 'text-destructive'}`}>
                  {analysis.mood_score}/10
                </div>
                <div className="text-[8px] text-muted-foreground">mood score</div>
              </div>
            </div>
            {analysis.ideal_tone_arc && (
              <div className="p-2 bg-background/40 rounded text-[9px] text-foreground mt-2">🎭 Arco ideal: {analysis.ideal_tone_arc}</div>
            )}
          </Card>

          {/* Tone distribution */}
          {analysis.tone_distribution && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">📊 Distribuição de Tom</h4>
              <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                {Object.entries(analysis.tone_distribution).map(([key, pct]) => (
                  <div
                    key={key}
                    className={`${sentimentColors[key] || 'bg-muted'} transition-all`}
                    style={{ width: `${pct as number}%` }}
                    title={`${key}: ${pct}%`}
                  />
                ))}
              </div>
              <div className="flex gap-3 mt-2 flex-wrap">
                {Object.entries(analysis.tone_distribution).map(([key, pct]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${sentimentColors[key] || 'bg-muted'}`} />
                    <span className="text-[8px] text-muted-foreground">{key}: {pct as number}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Sentiment timeline (visual) */}
          {Array.isArray(analysis.timeline) && analysis.timeline.length > 0 && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">🌡️ Temperatura Emocional</h4>
              <svg viewBox={`0 0 ${Math.max(300, analysis.timeline.length * 30)} 120`} className="w-full h-24" preserveAspectRatio="none">
                {/* Grid */}
                <line x1="0" y1="60" x2={analysis.timeline.length * 30} y2="60" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4" opacity="0.3" />
                {/* Bars */}
                {analysis.timeline.map((t: any, i: number) => {
                  const height = (t.intensity / 10) * 100;
                  const color = t.sentiment === 'positive' ? 'hsl(var(--primary))' :
                    t.sentiment === 'negative' ? 'hsl(var(--destructive))' :
                    t.sentiment === 'urgent' ? 'hsl(var(--muted-foreground))' :
                    'hsl(var(--primary))';
                  return (
                    <g key={i}>
                      <rect
                        x={i * 30 + 5}
                        y={110 - height}
                        width="20"
                        height={height}
                        fill={color}
                        opacity="0.6"
                        rx="2"
                      />
                      <text x={i * 30 + 15} y={118} textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))">{t.index}</text>
                    </g>
                  );
                })}
              </svg>

              {/* Timeline labels */}
              <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
                {analysis.timeline.map((t: any, i: number) => (
                  <Badge key={i} variant="outline" className="text-[7px] shrink-0 gap-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${sentimentColors[t.sentiment] || 'bg-muted'}`} />
                    {t.tone_word}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Mood shifts */}
          {Array.isArray(analysis.mood_shifts) && analysis.mood_shifts.length > 0 && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">🔄 Mudanças de Tom</h4>
              <div className="space-y-2">
                {analysis.mood_shifts.map((s: any, i: number) => (
                  <div key={i} className="p-2 bg-background/40 rounded text-[10px] text-muted-foreground">
                    Posts {s.from_index}→{s.to_index}: {s.description}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Monotony alerts */}
          {Array.isArray(analysis.monotony_alerts) && analysis.monotony_alerts.length > 0 && (
            <Card className="p-4 bg-card/50 border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-xs font-semibold text-muted-foreground">Alertas de Monotonia</h4>
              </div>
              <div className="space-y-1">
                {analysis.monotony_alerts.map((a: any, i: number) => (
                  <div key={i} className="text-[10px] text-muted-foreground">⚠️ {typeof a === 'string' ? a : a.description || JSON.stringify(a)}</div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {Array.isArray(analysis.recommendations) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">💡 Recomendações de Tom</h4>
              <div className="space-y-1.5">
                {analysis.recommendations.map((r: string, i: number) => (
                  <div key={i} className="text-[10px] text-muted-foreground flex items-start gap-2">
                    <span className="text-primary font-bold">{i + 1}.</span> {r}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Button variant="outline" className="w-full text-xs" onClick={handleAnalyze} disabled={ai.isPending}>
            Reanalisar
          </Button>
        </div>
      )}
    </div>
  );
}
