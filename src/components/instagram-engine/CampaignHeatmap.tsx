import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { useProfileSnapshots } from '@/hooks/useInstagramEngine';
import { motion } from 'framer-motion';
import { Flame, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { parseISO, getDay, getHours } from 'date-fns';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CampaignHeatmap({ campaign, posts }: Props) {
  const { data: snapshots } = useProfileSnapshots();

  const heatmapData = useMemo(() => {
    // Build a 7x24 grid counting posts per slot
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    const publishedPosts = posts.filter(p => p.published_at || p.scheduled_at);

    publishedPosts.forEach(p => {
      try {
        const date = parseISO(p.published_at || p.scheduled_at!);
        const day = getDay(date);
        const hour = getHours(date);
        grid[day][hour]++;
      } catch {}
    });

    // Find max for normalization
    const maxVal = Math.max(...grid.flat(), 1);

    // Best slots (top 5)
    const slots: { day: number; hour: number; count: number }[] = [];
    grid.forEach((row, day) => row.forEach((count, hour) => {
      if (count > 0) slots.push({ day, hour, count });
    }));
    slots.sort((a, b) => b.count - a.count);

    // Suggested optimal slots based on common Instagram data + user data
    const optimalDefaults = [
      { day: 1, hour: 9 }, { day: 1, hour: 12 }, { day: 1, hour: 18 },
      { day: 3, hour: 9 }, { day: 3, hour: 17 },
      { day: 5, hour: 10 }, { day: 5, hour: 19 },
    ];
    const suggestions = slots.length >= 3 ? slots.slice(0, 5) : optimalDefaults.map(s => ({ ...s, count: 0 }));

    return { grid, maxVal, bestSlots: slots.slice(0, 5), suggestions, totalPublished: publishedPosts.length };
  }, [posts]);

  const getHeatColor = (value: number, max: number) => {
    if (value === 0) return 'bg-muted/5';
    const intensity = value / max;
    if (intensity > 0.75) return 'bg-primary/80';
    if (intensity > 0.5) return 'bg-primary/50';
    if (intensity > 0.25) return 'bg-primary/30';
    return 'bg-primary/15';
  };

  const formatHour = (h: number) => `${h.toString().padStart(2, '0')}h`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Flame className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Mapa de Calor Semanal</h4>
          <p className="text-[10px] text-muted-foreground">
            {heatmapData.totalPublished} posts mapeados · Melhores horários para engajamento
          </p>
        </div>
      </div>

      {/* Heatmap grid */}
      <Card className="glass-card p-4 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour headers */}
          <div className="flex items-center gap-px mb-1">
            <div className="w-10 shrink-0" />
            {HOURS.filter(h => h % 2 === 0).map(h => (
              <div key={h} className="flex-1 text-center text-[7px] text-muted-foreground" style={{ minWidth: '20px' }}>
                {formatHour(h)}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-px mb-px">
              <div className="w-10 shrink-0 text-[8px] text-muted-foreground font-medium">{day}</div>
              {HOURS.map(hour => {
                const val = heatmapData.grid[dayIdx][hour];
                const isBest = heatmapData.bestSlots.some(s => s.day === dayIdx && s.hour === hour);
                return (
                  <motion.div
                    key={hour}
                    className={`flex-1 h-5 rounded-[2px] ${getHeatColor(val, heatmapData.maxVal)} ${isBest ? 'ring-1 ring-primary/50' : ''} transition-all cursor-default`}
                    style={{ minWidth: '20px' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (dayIdx * 24 + hour) * 0.002 }}
                    title={`${day} ${formatHour(hour)} — ${val} post${val !== 1 ? 's' : ''}`}
                  >
                    {val > 0 && (
                      <span className="text-[6px] text-foreground/70 flex items-center justify-center h-full">{val}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-[7px] text-muted-foreground">Menos</span>
            <div className="flex gap-0.5">
              {['bg-muted/5', 'bg-primary/15', 'bg-primary/30', 'bg-primary/50', 'bg-primary/80'].map((c, i) => (
                <div key={i} className={`w-4 h-3 rounded-[2px] ${c}`} />
              ))}
            </div>
            <span className="text-[7px] text-muted-foreground">Mais</span>
          </div>
        </div>
      </Card>

      {/* Best slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-semibold text-foreground">Top 5 Horários</span>
          </div>
          {heatmapData.bestSlots.length === 0 ? (
            <p className="text-[9px] text-muted-foreground">Publique mais posts para gerar dados</p>
          ) : (
            <div className="space-y-1.5">
              {heatmapData.bestSlots.map((slot, i) => (
                <motion.div key={i} className="flex items-center gap-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                  <Badge className="bg-primary/15 text-primary text-[8px] w-5 h-5 flex items-center justify-center p-0">{i + 1}</Badge>
                  <span className="text-[10px] text-foreground flex-1">{DAYS[slot.day]} às {formatHour(slot.hour)}</span>
                  <Badge variant="outline" className="text-[7px]">{slot.count} posts</Badge>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-semibold text-foreground">Slots Sugeridos</span>
          </div>
          <div className="space-y-1.5">
            {heatmapData.suggestions.map((slot, i) => (
              <motion.div key={i} className="flex items-center gap-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                <Clock className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-foreground">{DAYS[slot.day]} às {formatHour(slot.hour)}</span>
                {slot.count > 0 && <Badge variant="outline" className="text-[7px]">{slot.count}x usado</Badge>}
              </motion.div>
            ))}
          </div>
          <p className="text-[8px] text-muted-foreground mt-2">Baseado no histórico + melhores práticas do Instagram</p>
        </Card>
      </div>
    </div>
  );
}
