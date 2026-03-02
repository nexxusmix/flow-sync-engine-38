import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstagramCampaign, InstagramPost, useInstagramAI, useCreatePost, PILLARS, FORMATS } from '@/hooks/useInstagramEngine';
import { CalendarPlus, Sparkles, Loader2, CheckCircle, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, format, startOfWeek, nextMonday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

export function CampaignAutoPlanner({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const createPost = useCreatePost();
  const [weeks, setWeeks] = useState('1');
  const [postsPerWeek, setPostsPerWeek] = useState('5');
  const [plan, setPlan] = useState<any[] | null>(null);
  const [creating, setCreating] = useState(false);

  const publishedCount = posts.filter(p => p.status === 'published').length;
  const pillarsUsed = [...new Set(posts.map(p => p.pillar).filter(Boolean))];
  const formatsUsed = [...new Set(posts.map(p => p.format).filter(Boolean))];

  const handleGenerate = async () => {
    try {
      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Gere um plano editorial para ${weeks} semana(s) com ${postsPerWeek} posts por semana para a campanha "${campaign.name}".

Contexto:
- Objetivo: ${campaign.objective || 'engajamento'}
- Público: ${campaign.target_audience || 'geral'}
- Pilares já usados: ${pillarsUsed.join(', ') || 'nenhum'}
- Formatos já usados: ${formatsUsed.join(', ') || 'nenhum'}
- Posts publicados: ${publishedCount}

Distribua os posts em dias da semana (seg-sex) com horários otimizados.
Varie pilares e formatos para diversidade.

Retorne JSON com array "plan" onde cada item tem:
- day_offset (int, 0 = próxima segunda)
- time (string HH:MM)
- title (string)
- format (reel|carousel|single|story)
- pillar (autoridade|portfolio|bastidores|social_proof|educacao|venda)
- hook (string)
- objective (string curto)`,
          format: 'plan',
        },
      });

      const items = Array.isArray(result) ? result : result?.plan || [];
      setPlan(items);
      toast.success(`Plano gerado com ${items.length} posts!`);
    } catch {
      // handled
    }
  };

  const handleCreateAll = async () => {
    if (!plan || plan.length === 0) return;
    setCreating(true);
    const monday = nextMonday(new Date());
    let created = 0;

    for (const item of plan) {
      try {
        const scheduledDate = addDays(monday, item.day_offset || 0);
        const [h, m] = (item.time || '10:00').split(':');
        scheduledDate.setHours(parseInt(h) || 10, parseInt(m) || 0);

        await createPost.mutateAsync({
          title: item.title || 'Post Planejado',
          format: item.format || 'reel',
          pillar: item.pillar || null,
          objective: item.objective || null,
          status: 'planned',
          hook: item.hook || null,
          scheduled_at: scheduledDate.toISOString(),
          campaign_id: campaign.id,
          ai_generated: true,
          position: posts.length + created,
        } as any);
        created++;
      } catch {
        // continue
      }
    }

    toast.success(`${created} posts criados e agendados!`);
    setCreating(false);
    setPlan(null);
  };

  const monday = nextMonday(new Date());

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <CalendarPlus className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Auto-Planner Semanal IA</h3>
      </div>

      {/* Config */}
      <Card className="p-4 bg-card/50 border-border/30">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Semanas</label>
            <Select value={weeks} onValueChange={setWeeks}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 semana</SelectItem>
                <SelectItem value="2">2 semanas</SelectItem>
                <SelectItem value="3">3 semanas</SelectItem>
                <SelectItem value="4">4 semanas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Posts/Semana</label>
            <Select value={postsPerWeek} onValueChange={setPostsPerWeek}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 posts</SelectItem>
                <SelectItem value="5">5 posts</SelectItem>
                <SelectItem value="7">7 posts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-1.5 text-xs h-8" onClick={handleGenerate} disabled={ai.isPending}>
            {ai.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Gerar Plano
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Início: {format(monday, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </Card>

      {/* Plan preview */}
      {plan && plan.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground">Prévia do Plano ({plan.length} posts)</h4>
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleCreateAll} disabled={creating}>
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Criar Todos
            </Button>
          </div>

          <div className="grid gap-2">
            {plan.map((item, i) => {
              const date = addDays(monday, item.day_offset || 0);
              const formatLabel = FORMATS.find(f => f.key === item.format)?.label || item.format;
              const pillarLabel = PILLARS.find(p => p.key === item.pillar)?.label || item.pillar;

              return (
                <Card key={i} className="p-3 bg-card/30 border-border/20">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[50px]">
                      <div className="text-[10px] text-muted-foreground uppercase">
                        {format(date, 'EEE', { locale: ptBR })}
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        {format(date, 'dd')}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px]">{formatLabel}</Badge>
                        {pillarLabel && <Badge variant="outline" className="text-[9px]">{pillarLabel}</Badge>}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {item.time || '10:00'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {item.hook && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 pl-[62px]">🎯 {item.hook}</p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {!plan && (
        <Card className="p-8 bg-card/30 border-border/20 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Configure e gere um plano editorial completo com IA</p>
        </Card>
      )}
    </div>
  );
}
