import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost, useInstagramAI, PILLARS, FORMATS } from '@/hooks/useInstagramEngine';
import { Users, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

export function CampaignAudienceHeatmap({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const [aiResult, setAiResult] = useState<any>(null);

  // Build engagement grid: pillar x format
  const grid = useMemo(() => {
    const cells: Record<string, { count: number; published: number }> = {};
    PILLARS.forEach(p => {
      FORMATS.forEach(f => {
        cells[`${p.key}|${f.key}`] = { count: 0, published: 0 };
      });
    });
    posts.forEach(p => {
      const key = `${p.pillar || 'none'}|${p.format || 'none'}`;
      if (cells[key]) {
        cells[key].count++;
        if (p.status === 'published') cells[key].published++;
      }
    });
    return cells;
  }, [posts]);

  const maxCount = Math.max(1, ...Object.values(grid).map(c => c.count));

  // Dead zones
  const deadZones = useMemo(() => {
    const zones: { pillar: string; format: string }[] = [];
    PILLARS.forEach(p => {
      FORMATS.forEach(f => {
        const cell = grid[`${p.key}|${f.key}`];
        if (!cell || cell.count === 0) {
          zones.push({ pillar: p.key, format: f.key });
        }
      });
    });
    return zones;
  }, [grid]);

  const handleAIAnalysis = async () => {
    try {
      const gridSummary = Object.entries(grid)
        .filter(([_, v]) => v.count > 0)
        .map(([k, v]) => {
          const [pillar, format] = k.split('|');
          return `${PILLARS.find(p => p.key === pillar)?.label || pillar} + ${FORMATS.find(f => f.key === format)?.label || format}: ${v.count} posts (${v.published} publicados)`;
        }).join('\n');

      const deadZonesSummary = deadZones.slice(0, 10).map(z =>
        `${PILLARS.find(p => p.key === z.pillar)?.label || z.pillar} + ${FORMATS.find(f => f.key === z.format)?.label || z.format}`
      ).join(', ');

      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Analise o mapa de engajamento da campanha "${campaign.name}".

Distribuição atual:
${gridSummary}

Zonas mortas (sem conteúdo): ${deadZonesSummary || 'nenhuma'}
Público-alvo: ${campaign.target_audience || 'geral'}
Total de posts: ${posts.length}

Retorne JSON com:
- segments: array de 3-5 segmentos de audiência, cada um com {name, description, preferred_pillars: string[], preferred_formats: string[], engagement_level: "high"|"medium"|"low", recommendation: string}
- dead_zone_actions: array de 3-5 ações para ativar zonas mortas, cada com {pillar, format, suggestion, priority: "high"|"medium"|"low"}
- reactivation_ideas: array de 3 ideias de conteúdo para reativar segmentos inativos, cada com {title, format, pillar, hook, target_segment}
- balance_score: número 0-100 indicando equilíbrio de cobertura
- top_combo: string com a melhor combinação pilar+formato
- weakest_combo: string com a combinação mais fraca`,
          format: 'audience_heatmap',
        },
      });
      setAiResult(result);
      toast.success('Análise de audiência gerada!');
    } catch { /* handled */ }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Audience Heatmap & Engagement Map</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleAIAnalysis} disabled={ai.isPending}>
          {ai.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Analisar com IA
        </Button>
      </div>

      {/* Heatmap grid: Pillar x Format */}
      <Card className="p-4 bg-card/50 border-border/30 overflow-x-auto">
        <h4 className="text-xs font-semibold text-foreground mb-3">🗺️ Cobertura: Pilar × Formato</h4>
        <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `100px repeat(${FORMATS.length}, 1fr)` }}>
          <div />
          {FORMATS.map(f => (
            <div key={f.key} className="text-[8px] text-muted-foreground text-center px-1 min-w-[60px]">{f.label}</div>
          ))}
          {PILLARS.map(p => (
            <>
              <div key={`label-${p.key}`} className="text-[9px] text-muted-foreground flex items-center">{p.label}</div>
              {FORMATS.map(f => {
                const cell = grid[`${p.key}|${f.key}`];
                const intensity = cell ? cell.count / maxCount : 0;
                const isDead = !cell || cell.count === 0;
                return (
                  <div
                    key={`${p.key}-${f.key}`}
                    className={`min-w-[60px] h-10 rounded-md flex items-center justify-center text-[10px] font-medium transition-colors ${isDead ? 'border border-dashed border-muted-foreground/10' : ''}`}
                    style={{ backgroundColor: isDead ? 'transparent' : `hsl(var(--primary) / ${0.1 + intensity * 0.6})` }}
                    title={`${p.label} + ${f.label}: ${cell?.count || 0} posts`}
                  >
                    {cell?.count ? (
                      <span className="text-foreground">{cell.count}</span>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </Card>

      {/* Dead zones */}
      {deadZones.length > 0 && (
        <Card className="p-4 bg-card/50 border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-semibold text-foreground">Zonas Mortas ({deadZones.length})</h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {deadZones.slice(0, 12).map((z, i) => (
              <Badge key={i} variant="outline" className="text-[8px] text-muted-foreground">
                {PILLARS.find(p => p.key === z.pillar)?.label} + {FORMATS.find(f => f.key === z.format)?.label}
              </Badge>
            ))}
            {deadZones.length > 12 && <span className="text-[9px] text-muted-foreground">+{deadZones.length - 12}</span>}
          </div>
        </Card>
      )}

      {/* AI Analysis */}
      {aiResult && (
        <div className="space-y-4">
          {aiResult.balance_score !== undefined && (
            <Card className="p-4 bg-card/50 border-border/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Equilíbrio de Cobertura</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Melhor combo: <span className="text-emerald-400">{aiResult.top_combo}</span> · 
                    Mais fraco: <span className="text-red-400">{aiResult.weakest_combo}</span>
                  </p>
                </div>
                <div className={`text-2xl font-bold ${aiResult.balance_score >= 70 ? 'text-emerald-400' : aiResult.balance_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {aiResult.balance_score}
                </div>
              </div>
            </Card>
          )}

          {/* Segments */}
          {Array.isArray(aiResult.segments) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">👥 Segmentos de Audiência</h4>
              <div className="space-y-3">
                {aiResult.segments.map((seg: any, i: number) => (
                  <div key={i} className="p-3 bg-background/40 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground">{seg.name}</span>
                      <Badge className={`text-[8px] ${seg.engagement_level === 'high' ? 'bg-emerald-400/10 text-emerald-400' : seg.engagement_level === 'medium' ? 'bg-amber-400/10 text-amber-400' : 'bg-red-400/10 text-red-400'}`}>
                        {seg.engagement_level}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">{seg.description}</p>
                    <div className="flex gap-1 flex-wrap">
                      {seg.preferred_pillars?.map((p: string) => (
                        <Badge key={p} variant="outline" className="text-[7px]">{PILLARS.find(x => x.key === p)?.label || p}</Badge>
                      ))}
                      {seg.preferred_formats?.map((f: string) => (
                        <Badge key={f} variant="outline" className="text-[7px]">{FORMATS.find(x => x.key === f)?.label || f}</Badge>
                      ))}
                    </div>
                    <p className="text-[9px] text-primary/80 mt-1">💡 {seg.recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Dead zone actions */}
          {Array.isArray(aiResult.dead_zone_actions) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">🔥 Ações para Zonas Mortas</h4>
              <div className="space-y-2">
                {aiResult.dead_zone_actions.map((action: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-background/40 rounded">
                    <Badge className={`text-[7px] shrink-0 ${action.priority === 'high' ? 'bg-red-400/10 text-red-400' : 'bg-amber-400/10 text-amber-400'}`}>
                      {action.priority}
                    </Badge>
                    <div>
                      <span className="text-[10px] text-foreground">{action.suggestion}</span>
                      <div className="text-[8px] text-muted-foreground mt-0.5">
                        {PILLARS.find(p => p.key === action.pillar)?.label} + {FORMATS.find(f => f.key === action.format)?.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reactivation ideas */}
          {Array.isArray(aiResult.reactivation_ideas) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">🔄 Ideias para Reativação</h4>
              <div className="space-y-2">
                {aiResult.reactivation_ideas.map((idea: any, i: number) => (
                  <div key={i} className="p-3 bg-background/40 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground">{idea.title}</span>
                      <Badge variant="outline" className="text-[8px]">{FORMATS.find(f => f.key === idea.format)?.label || idea.format}</Badge>
                    </div>
                    {idea.hook && <p className="text-[10px] text-primary/80">🎯 {idea.hook}</p>}
                    {idea.target_segment && <p className="text-[9px] text-muted-foreground mt-0.5">👥 {idea.target_segment}</p>}
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
