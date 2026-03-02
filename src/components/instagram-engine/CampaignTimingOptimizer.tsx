import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost, useInstagramAI, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { Clock, Sparkles, Loader2, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, getDay, getHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7-22

export function CampaignTimingOptimizer({ campaign, posts }: Props) {
  const ai = useInstagramAI();
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  // Build heatmap from scheduled/published posts
  const heatmap = useMemo(() => {
    const grid: Record<string, number> = {};
    posts.forEach(p => {
      const dateStr = p.published_at || p.scheduled_at;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const day = getDay(d);
      const hour = getHours(d);
      const key = `${day}-${hour}`;
      grid[key] = (grid[key] || 0) + 1;
    });
    return grid;
  }, [posts]);

  const maxCount = Math.max(1, ...Object.values(heatmap));

  // Format/pillar timing patterns
  const patterns = useMemo(() => {
    const byFormat: Record<string, { days: number[]; hours: number[] }> = {};
    posts.forEach(p => {
      const dateStr = p.published_at || p.scheduled_at;
      if (!dateStr || !p.format) return;
      if (!byFormat[p.format]) byFormat[p.format] = { days: [], hours: [] };
      const d = new Date(dateStr);
      byFormat[p.format].days.push(getDay(d));
      byFormat[p.format].hours.push(getHours(d));
    });
    return Object.entries(byFormat).map(([fmt, data]) => {
      const avgDay = data.days.length ? Math.round(data.days.reduce((a, b) => a + b, 0) / data.days.length) : 0;
      const avgHour = data.hours.length ? Math.round(data.hours.reduce((a, b) => a + b, 0) / data.hours.length) : 10;
      return { format: fmt, label: FORMATS.find(f => f.key === fmt)?.label || fmt, avgDay: DAYS[avgDay], avgHour, count: data.days.length };
    });
  }, [posts]);

  const handleAIOptimize = async () => {
    try {
      const scheduledPosts = posts.filter(p => p.scheduled_at || p.published_at).slice(0, 20);
      const postData = scheduledPosts.map(p => ({
        format: p.format,
        pillar: p.pillar,
        day: p.published_at || p.scheduled_at ? format(new Date((p.published_at || p.scheduled_at)!), 'EEEE HH:mm', { locale: ptBR }) : 'N/A',
        status: p.status,
      }));

      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Analise os horários de publicação desta campanha "${campaign.name}" e otimize.

Posts agendados/publicados:
${JSON.stringify(postData, null, 2)}

Público: ${campaign.target_audience || 'geral'}

Retorne JSON com:
- best_days: array de 3 melhores dias da semana (ex: ["Terça", "Quinta", "Sábado"])
- best_hours: array de 3 melhores horários (ex: ["10:00", "18:30", "20:00"])
- frequency_recommendation: string com frequência ideal (ex: "5x por semana")
- format_timing: objeto mapeando formato -> melhor horário (ex: {"reel": "19:00", "carousel": "10:00"})
- avoid_times: array de horários a evitar
- reasoning: string com explicação da estratégia
- weekly_schedule: array de 7 objetos {day, posts_count, best_time, format_suggestion}`,
          format: 'timing',
        },
      });
      setAiSuggestions(result);
      toast.success('Otimização de timing gerada!');
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Timing Optimizer</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleAIOptimize} disabled={ai.isPending}>
          {ai.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Otimizar com IA
        </Button>
      </div>

      {/* Heatmap */}
      <Card className="p-4 bg-card/50 border-border/30">
        <h4 className="text-xs font-semibold text-foreground mb-3">🗓️ Mapa de Calor — Horários de Publicação</h4>
        <div className="overflow-x-auto">
          <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `40px repeat(${HOURS.length}, 1fr)` }}>
            {/* Header */}
            <div />
            {HOURS.map(h => (
              <div key={h} className="text-[8px] text-muted-foreground text-center w-6">{h}h</div>
            ))}
            {/* Rows */}
            {DAYS.map((day, di) => (
              <>
                <div key={`label-${di}`} className="text-[9px] text-muted-foreground flex items-center">{day}</div>
                {HOURS.map(h => {
                  const count = heatmap[`${di}-${h}`] || 0;
                  const intensity = count / maxCount;
                  return (
                    <div
                      key={`${di}-${h}`}
                      className="w-6 h-5 rounded-sm transition-colors"
                      style={{ backgroundColor: count > 0 ? `hsl(var(--primary) / ${0.15 + intensity * 0.7})` : 'hsl(var(--muted) / 0.1)' }}
                      title={`${day} ${h}h: ${count} post(s)`}
                    />
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </Card>

      {/* Format patterns */}
      {patterns.length > 0 && (
        <Card className="p-4 bg-card/50 border-border/30">
          <h4 className="text-xs font-semibold text-foreground mb-3">📊 Padrões por Formato</h4>
          <div className="space-y-2">
            {patterns.map(p => (
              <div key={p.format} className="flex items-center gap-3">
                <Badge variant="outline" className="text-[9px] min-w-[70px] justify-center">{p.label}</Badge>
                <span className="text-[10px] text-muted-foreground">Média: {p.avgDay} às {p.avgHour}h</span>
                <span className="text-[10px] text-muted-foreground/60">({p.count} posts)</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI suggestions */}
      {aiSuggestions && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 bg-card/50 border-border/30">
            <h4 className="text-xs font-semibold text-emerald-400 mb-2">✅ Melhores Horários</h4>
            {Array.isArray(aiSuggestions.best_days) && (
              <div className="flex flex-wrap gap-1 mb-2">
                {aiSuggestions.best_days.map((d: string) => (
                  <Badge key={d} className="bg-emerald-400/10 text-emerald-400 text-[9px]">{d}</Badge>
                ))}
              </div>
            )}
            {Array.isArray(aiSuggestions.best_hours) && (
              <div className="flex flex-wrap gap-1 mb-2">
                {aiSuggestions.best_hours.map((h: string) => (
                  <Badge key={h} className="bg-primary/10 text-primary text-[9px]">🕐 {h}</Badge>
                ))}
              </div>
            )}
            {aiSuggestions.frequency_recommendation && (
              <p className="text-[10px] text-muted-foreground">📅 {aiSuggestions.frequency_recommendation}</p>
            )}
            {aiSuggestions.format_timing && typeof aiSuggestions.format_timing === 'object' && (
              <div className="mt-2 space-y-1">
                <span className="text-[10px] font-medium text-foreground">Por formato:</span>
                {Object.entries(aiSuggestions.format_timing).map(([fmt, time]) => (
                  <div key={fmt} className="text-[10px] text-muted-foreground">
                    {FORMATS.find(f => f.key === fmt)?.label || fmt}: {String(time)}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 bg-card/50 border-border/30">
            {Array.isArray(aiSuggestions.avoid_times) && aiSuggestions.avoid_times.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-red-400 mb-1.5">🚫 Evitar</h4>
                <div className="flex flex-wrap gap-1">
                  {aiSuggestions.avoid_times.map((t: string, i: number) => (
                    <Badge key={i} className="bg-red-400/10 text-red-400 text-[9px]">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
            {aiSuggestions.reasoning && (
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-1.5">💡 Estratégia</h4>
                <p className="text-[10px] text-muted-foreground">{aiSuggestions.reasoning}</p>
              </div>
            )}
          </Card>

          {/* Weekly schedule */}
          {Array.isArray(aiSuggestions.weekly_schedule) && (
            <Card className="p-4 bg-card/50 border-border/30 md:col-span-2">
              <h4 className="text-xs font-semibold text-foreground mb-3">📋 Grade Semanal Ideal</h4>
              <div className="grid grid-cols-7 gap-2">
                {aiSuggestions.weekly_schedule.map((d: any, i: number) => (
                  <div key={i} className="text-center p-2 bg-background/40 rounded-lg">
                    <div className="text-[10px] font-medium text-foreground">{d.day}</div>
                    <div className="text-lg font-bold text-primary">{d.posts_count || 0}</div>
                    <div className="text-[9px] text-muted-foreground">{d.best_time || '—'}</div>
                    {d.format_suggestion && (
                      <Badge variant="outline" className="text-[7px] mt-1">{d.format_suggestion}</Badge>
                    )}
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
