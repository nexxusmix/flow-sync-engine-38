import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, useInstagramAI, useCreatePost } from '@/hooks/useInstagramEngine';
import { CalendarHeart, Sparkles, Loader2, CheckCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: InstagramCampaign;
}

export function CampaignSeasonal({ campaign }: Props) {
  const ai = useInstagramAI();
  const createPost = useCreatePost();
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      const res = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Identifique oportunidades SAZONAIS para a campanha "${campaign.name}" nos próximos 60 dias a partir de ${today}.

Público: ${campaign.target_audience || 'geral'}
Objetivo: ${campaign.objective || 'geral'}

Retorne JSON com:
- upcoming_dates: array de 8-12 datas, cada com:
  - date: "YYYY-MM-DD"
  - name: nome do evento/data (ex: "Dia das Mães", "Black Friday", "Copa do Mundo")
  - type: "feriado"|"comercial"|"cultural"|"trending"|"micro_momento"
  - relevance_score: 1-10 (relevância para o público)
  - days_until: número de dias até a data
  - suggested_posts: array de 2-3 objetos {title, format, hook, pillar}
  - activation_window: objeto {start_days_before, peak_day, end_days_after}
  - copy_angle: string com ângulo sugerido de copywriting
- seasonal_trends: array de 3-5 tendências sazonais do momento
- micro_moments: array de 3 micro-momentos culturais detectados (não são datas fixas, são tendências efêmeras)
- calendar_strategy: string com a estratégia sazonal recomendada`,
          format: 'seasonal',
        },
      });
      setResult(res);
      toast.success('Calendário sazonal gerado! 📅');
    } catch { /* handled */ }
  };

  const handleCreatePosts = async (date: any) => {
    let saved = 0;
    for (const post of (date.suggested_posts || [])) {
      try {
        await createPost.mutateAsync({
          title: post.title,
          format: post.format,
          hook: post.hook,
          pillar: post.pillar,
          status: 'planned',
          campaign_id: campaign.id,
          scheduled_at: date.date,
          ai_generated: true,
        });
        saved++;
      } catch { /* continue */ }
    }
    toast.success(`${saved} posts criados para ${date.name}!`);
  };

  const typeColors: Record<string, string> = {
    feriado: 'bg-muted text-muted-foreground',
    comercial: 'bg-primary/10 text-primary',
    cultural: 'bg-primary/10 text-primary/70',
    trending: 'bg-muted text-muted-foreground',
    micro_momento: 'bg-primary/10 text-primary',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarHeart className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Campanha Sazonal Inteligente</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleGenerate} disabled={ai.isPending}>
          {ai.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Detectar Oportunidades
        </Button>
      </div>

      {!result && (
        <Card className="p-8 bg-card/30 border-border/20 text-center">
          <CalendarHeart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Detecte datas comemorativas, tendências sazonais e micro-momentos para os próximos 60 dias</p>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          {result.calendar_strategy && (
            <Card className="p-4 bg-primary/5 border-primary/10">
              <p className="text-[10px] text-foreground">📋 {result.calendar_strategy}</p>
            </Card>
          )}

          {/* Upcoming dates */}
          {Array.isArray(result.upcoming_dates) && (
            <div className="space-y-3">
              {result.upcoming_dates.map((d: any, i: number) => (
                <Card key={i} className="p-4 bg-card/50 border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-[8px] ${typeColors[d.type] || 'bg-muted/20 text-muted-foreground'}`}>{d.type}</Badge>
                    <span className="text-xs font-semibold text-foreground">{d.name}</span>
                    <span className="text-[9px] text-muted-foreground ml-auto">
                      {d.date && format(new Date(d.date + 'T12:00:00'), 'dd MMM', { locale: ptBR })}
                    </span>
                    <Badge variant="outline" className="text-[8px]">
                      {d.days_until != null ? (d.days_until <= 0 ? 'Hoje!' : `${d.days_until}d`) : ''}
                    </Badge>
                  </div>

                  {/* Relevance bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] text-muted-foreground">Relevância:</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, j) => (
                        <div key={j} className={`w-2 h-2 rounded-full ${j < (d.relevance_score || 0) ? 'bg-primary/60' : 'bg-muted/20'}`} />
                      ))}
                    </div>
                  </div>

                  {d.copy_angle && <p className="text-[9px] text-primary/80 mb-2">✍️ {d.copy_angle}</p>}

                  {/* Activation window */}
                  {d.activation_window && (
                    <div className="text-[8px] text-muted-foreground mb-2">
                      ⏱️ Ativar {d.activation_window.start_days_before}d antes · Pico no dia · Encerrar {d.activation_window.end_days_after}d depois
                    </div>
                  )}

                  {/* Suggested posts */}
                  {Array.isArray(d.suggested_posts) && d.suggested_posts.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {d.suggested_posts.map((p: any, j: number) => (
                        <div key={j} className="flex items-center gap-2 p-1.5 bg-background/40 rounded text-[9px]">
                          <Badge variant="outline" className="text-[7px]">{p.format}</Badge>
                          <span className="text-foreground truncate flex-1">{p.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button size="sm" variant="outline" className="w-full text-[10px] h-7 gap-1" onClick={() => handleCreatePosts(d)} disabled={createPost.isPending}>
                    <CheckCircle className="w-3 h-3" /> Criar Posts
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {/* Micro moments */}
          {Array.isArray(result.micro_moments) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-3">⚡ Micro-Momentos Culturais</h4>
              <div className="space-y-2">
                {result.micro_moments.map((m: any, i: number) => (
                  <div key={i} className="p-2 bg-background/40 rounded text-[10px] text-muted-foreground">💡 {typeof m === 'string' ? m : m.description || m.title || JSON.stringify(m)}</div>
                ))}
              </div>
            </Card>
          )}

          {/* Seasonal trends */}
          {Array.isArray(result.seasonal_trends) && (
            <Card className="p-4 bg-card/50 border-border/30">
              <h4 className="text-xs font-semibold text-foreground mb-2">📈 Tendências Sazonais</h4>
              <div className="flex flex-wrap gap-1.5">
                {result.seasonal_trends.map((t: any, i: number) => (
                  <Badge key={i} className="bg-primary/10 text-primary text-[8px]">{typeof t === 'string' ? t : t.name || t.title}</Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
