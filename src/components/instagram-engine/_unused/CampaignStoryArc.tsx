import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost, useInstagramAI } from '@/hooks/useInstagramEngine';
import { BookText, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface ArcBeat {
  position: number;
  label: string;
  emotion: string;
  intensity: number;
  mapped_post?: string;
  suggestion?: string;
}

export function CampaignStoryArc({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const [arc, setArc] = useState<any>(null);

  const handleGenerate = async () => {
    const postList = posts.slice(0, 25).map((p, i) => `${i + 1}. "${p.title}" (${p.format}, ${p.pillar}, ${p.status})`).join('\n');

    try {
      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Construa um ARCO NARRATIVO completo para a campanha "${campaign.name}".

Objetivo: ${campaign.objective || 'geral'}
Público: ${campaign.target_audience || 'geral'}

Posts existentes:
${postList || 'Nenhum post ainda'}

Retorne JSON com:
- arc_name: nome criativo do arco (ex: "A Jornada da Transformação")
- arc_description: descrição do arco narrativo em 2-3 frases
- act_structure: array de 3 atos, cada com {name, description, purpose, duration_percentage}
- beats: array de 7-10 beats do arco, cada com:
  - position: número 1-10 (ordem no arco)
  - label: nome do beat (ex: "Gancho Inicial", "Tensão Crescente", "Revelação", "Clímax")
  - emotion: emoção dominante (ex: "curiosidade", "empolgação", "urgência")
  - intensity: 1-10 (nível emocional)
  - mapped_post: título do post existente mapeado (ou null)
  - suggestion: sugestão de post se não houver mapeamento
- emotional_curve: string descrevendo a curva emocional ideal
- narrative_gaps: array de 2-3 lacunas na narrativa atual
- climax_moment: objeto {description, ideal_format, ideal_timing}
- resolution: objeto {description, ideal_cta, ideal_emotion}`,
          format: 'story_arc',
        },
      });
      setArc(result);
      toast.success('Arco narrativo construído! 📖');
    } catch { /* handled */ }
  };

  const maxIntensity = arc?.beats ? Math.max(...arc.beats.map((b: ArcBeat) => b.intensity)) : 10;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookText className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Story Arc Builder</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleGenerate} disabled={ai.isPending}>
          {ai.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Construir Arco
        </Button>
      </div>

      {!arc && (
        <Card className="p-8 bg-card/30 border-border/20 text-center">
          <BookText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Construa um arco narrativo coeso para sua campanha — garanta que cada post conta uma história</p>
        </Card>
      )}

      {arc && (
        <div className="space-y-4">
          {/* Arc title */}
          <Card className="p-5 bg-gradient-to-b from-primary/5 to-transparent border-primary/10">
            <h4 className="text-sm font-bold text-primary mb-1">{arc.arc_name}</h4>
            <p className="text-[10px] text-muted-foreground">{arc.arc_description}</p>
            {arc.emotional_curve && (
              <div className="mt-2 p-2 bg-background/40 rounded text-[9px] text-foreground">🎭 {arc.emotional_curve}</div>
            )}
          </Card>

          {/* Act structure */}
          {Array.isArray(arc.act_structure) && (
            <div className="flex gap-1">
              {arc.act_structure.map((act: any, i: number) => (
                <div key={i} className="flex-1 rounded-lg p-3 bg-card/50 border border-border/30" style={{ flex: act.duration_percentage || 33 }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge className="bg-primary/10 text-primary text-[7px]">Ato {i + 1}</Badge>
                    <span className="text-[9px] font-semibold text-foreground">{act.name}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">{act.description}</p>
                  <p className="text-[8px] text-primary/60 mt-1">{act.purpose}</p>
                </div>
              ))}
            </div>
          )}

          {/* Emotional curve SVG */}
          {Array.isArray(arc.beats) && arc.beats.length > 0 && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">📈 Curva Emocional</h4>
              <div className="relative">
                <svg viewBox="0 0 600 200" className="w-full h-40" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0.25, 0.5, 0.75].map(y => (
                    <line key={y} x1="0" y1={y * 180 + 10} x2="600" y2={y * 180 + 10} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4" opacity="0.3" />
                  ))}
                  {/* Curve */}
                  <polyline
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={arc.beats.map((b: ArcBeat, i: number) => {
                      const x = (i / (arc.beats.length - 1)) * 580 + 10;
                      const y = 190 - (b.intensity / maxIntensity) * 170;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  {/* Area fill */}
                  <polygon
                    fill="hsl(var(--primary))"
                    opacity="0.08"
                    points={`10,190 ${arc.beats.map((b: ArcBeat, i: number) => {
                      const x = (i / (arc.beats.length - 1)) * 580 + 10;
                      const y = 190 - (b.intensity / maxIntensity) * 170;
                      return `${x},${y}`;
                    }).join(' ')} 590,190`}
                  />
                  {/* Dots */}
                  {arc.beats.map((b: ArcBeat, i: number) => {
                    const x = (i / (arc.beats.length - 1)) * 580 + 10;
                    const y = 190 - (b.intensity / maxIntensity) * 170;
                    return <circle key={i} cx={x} cy={y} r="4" fill="hsl(var(--primary))" />;
                  })}
                </svg>
                {/* Labels */}
                <div className="flex justify-between mt-1">
                  {arc.beats.map((b: ArcBeat, i: number) => (
                    <div key={i} className="text-center" style={{ flex: 1 }}>
                      <div className="text-[7px] text-muted-foreground truncate">{b.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Beat timeline */}
          {Array.isArray(arc.beats) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">🎬 Beats do Arco</h4>
              <div className="relative pl-6 space-y-3">
                <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border/30" />
                {arc.beats.map((beat: ArcBeat, i: number) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-6 top-2 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                      beat.intensity >= 8 ? 'bg-red-500/20 text-red-400' : beat.intensity >= 5 ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/20 text-primary'
                    }`}>
                      {beat.position}
                    </div>
                    <div className="p-3 bg-background/40 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">{beat.label}</span>
                        <Badge variant="outline" className="text-[7px]">{beat.emotion}</Badge>
                        <div className="ml-auto flex items-center gap-1">
                          {Array.from({ length: Math.min(beat.intensity, 10) }).map((_, j) => (
                            <div key={j} className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                          ))}
                        </div>
                      </div>
                      {beat.mapped_post ? (
                        <div className="text-[10px] text-emerald-400">✓ Mapeado: "{beat.mapped_post}"</div>
                      ) : beat.suggestion ? (
                        <div className="text-[10px] text-amber-400">💡 Sugestão: {beat.suggestion}</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Gaps + Climax + Resolution */}
          <div className="grid md:grid-cols-3 gap-4">
            {Array.isArray(arc.narrative_gaps) && (
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className="text-xs font-semibold text-amber-400 mb-2">⚠️ Lacunas</h4>
                <div className="space-y-1">
                  {arc.narrative_gaps.map((g: string, i: number) => (
                    <div key={i} className="text-[10px] text-muted-foreground">• {g}</div>
                  ))}
                </div>
              </Card>
            )}
            {arc.climax_moment && (
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className="text-xs font-semibold text-red-400 mb-2">🔥 Clímax</h4>
                <p className="text-[10px] text-muted-foreground">{arc.climax_moment.description}</p>
                <div className="text-[9px] text-muted-foreground/60 mt-1">
                  Formato ideal: {arc.climax_moment.ideal_format}
                </div>
              </Card>
            )}
            {arc.resolution && (
              <Card className="p-4 bg-card/50 border-border/30">
                <h4 className="text-xs font-semibold text-emerald-400 mb-2">✅ Resolução</h4>
                <p className="text-[10px] text-muted-foreground">{arc.resolution.description}</p>
                {arc.resolution.ideal_cta && (
                  <div className="text-[9px] text-primary/80 mt-1">📣 {arc.resolution.ideal_cta}</div>
                )}
              </Card>
            )}
          </div>

          <Button variant="outline" className="w-full text-xs" onClick={handleGenerate} disabled={ai.isPending}>
            Reconstruir Arco
          </Button>
        </div>
      )}
    </div>
  );
}
