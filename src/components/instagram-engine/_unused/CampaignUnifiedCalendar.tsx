import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InstagramPost, InstagramCampaign, FORMATS, PILLARS, POST_STATUSES } from '@/hooks/useInstagramEngine';
import { useInstagramCampaigns, useInstagramPosts } from '@/hooks/useInstagramEngine';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, AlertTriangle, Layers, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface CalendarPost extends InstagramPost {
  campaignName: string;
  campaignColor: string;
}

const CAMPAIGN_COLORS = [
  'hsl(210, 80%, 55%)', 'hsl(340, 70%, 55%)', 'hsl(160, 60%, 45%)',
  'hsl(45, 80%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(15, 75%, 55%)',
  'hsl(195, 70%, 50%)', 'hsl(100, 50%, 45%)',
];

export function CampaignUnifiedCalendar({ campaign: currentCampaign }: Props) {
  const { data: allCampaigns } = useInstagramCampaigns();
  const { data: allPosts } = useInstagramPosts();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [activeCampaigns, setActiveCampaigns] = useState<Set<string>>(new Set(['all']));

  const campaignColorMap = useMemo(() => {
    const map = new Map<string, string>();
    (allCampaigns || []).forEach((c, i) => map.set(c.id, CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length]));
    return map;
  }, [allCampaigns]);

  const calendarPosts = useMemo(() => {
    const items: CalendarPost[] = [];
    (allPosts || []).forEach(post => {
      const dateStr = post.scheduled_at || post.published_at;
      if (!dateStr) return;
      const campName = (allCampaigns || []).find(c => c.id === post.campaign_id)?.name || 'Sem campanha';
      const campColor = post.campaign_id ? campaignColorMap.get(post.campaign_id) || '#666' : '#666';

      if (activeCampaigns.has('all') || (post.campaign_id && activeCampaigns.has(post.campaign_id))) {
        items.push({ ...post, campaignName: campName, campaignColor: campColor });
      }
    });
    return items;
  }, [allPosts, allCampaigns, activeCampaigns, campaignColorMap]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad to start on Sunday
  const startPad = monthStart.getDay();
  const paddedDays = Array(startPad).fill(null).concat(days);

  const getPostsForDay = (day: Date) => calendarPosts.filter(p => {
    const d = p.scheduled_at || p.published_at;
    if (!d) return false;
    try { return isSameDay(parseISO(d), day); } catch { return false; }
  });

  // Detect conflicts (multiple posts same day same campaign)
  const conflicts = useMemo(() => {
    const conflicts: Date[] = [];
    days.forEach(day => {
      const dayPosts = getPostsForDay(day);
      const campaignCounts = new Map<string, number>();
      dayPosts.forEach(p => {
        const cid = p.campaign_id || 'none';
        campaignCounts.set(cid, (campaignCounts.get(cid) || 0) + 1);
      });
      if ([...campaignCounts.values()].some(c => c > 2)) conflicts.push(day);
    });
    return conflicts;
  }, [calendarPosts, days]);

  const toggleCampaign = (id: string) => {
    setActiveCampaigns(prev => {
      const next = new Set(prev);
      if (id === 'all') return new Set(['all']);
      next.delete('all');
      if (next.has(id)) next.delete(id); else next.add(id);
      if (next.size === 0) return new Set(['all']);
      return next;
    });
  };

  const selectedDayPosts = selectedDay ? getPostsForDay(selectedDay) : [];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <CalendarDays className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Calendário Unificado</h4>
          <p className="text-[10px] text-muted-foreground">
            {calendarPosts.length} posts de {(allCampaigns || []).length} campanhas
            {conflicts.length > 0 && <span className="text-muted-foreground ml-2">⚠ {conflicts.length} conflitos</span>}
          </p>
        </div>
      </div>

      {/* Campaign filter */}
      <div className="flex gap-1.5 flex-wrap">
        <Button size="sm" variant={activeCampaigns.has('all') ? 'default' : 'outline'} className="text-[8px] h-6" onClick={() => toggleCampaign('all')}>
          <Layers className="w-3 h-3 mr-1" /> Todas
        </Button>
        {(allCampaigns || []).map(c => (
          <Button key={c.id} size="sm" variant={activeCampaigns.has(c.id) ? 'default' : 'outline'} className="text-[8px] h-6 gap-1" onClick={() => toggleCampaign(c.id)}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: campaignColorMap.get(c.id) }} />
            {c.name.slice(0, 15)}{c.name.length > 15 ? '...' : ''}
          </Button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-[11px] font-semibold text-foreground capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <Card className="glass-card p-3">
        <div className="grid grid-cols-7 gap-px">
          {weekDays.map(d => (
            <div key={d} className="text-center text-[8px] text-muted-foreground py-1 font-medium">{d}</div>
          ))}
          {paddedDays.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} className="min-h-[60px]" />;
            const dayPosts = getPostsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const hasConflict = conflicts.some(c => isSameDay(c, day));

            return (
              <motion.div
                key={day.toISOString()}
                className={`min-h-[60px] p-1 rounded-md cursor-pointer border transition-all ${
                  isSelected ? 'border-primary bg-primary/5' :
                  isToday ? 'border-primary/30 bg-primary/5' :
                  hasConflict ? 'border-border bg-muted/10' :
                  'border-transparent hover:bg-muted/10'
                }`}
                onClick={() => setSelectedDay(day)}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  {hasConflict && <AlertTriangle className="w-2.5 h-2.5 text-muted-foreground" />}
                </div>
                <div className="space-y-0.5 mt-0.5">
                  {dayPosts.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center gap-0.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.campaignColor }} />
                      <span className="text-[7px] text-foreground/70 truncate">{p.title.slice(0, 12)}</span>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[7px] text-muted-foreground">+{dayPosts.length - 3}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Day detail */}
      {selectedDay && selectedDayPosts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card p-4">
            <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
              {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })} · {selectedDayPosts.length} posts
            </h5>
            <div className="space-y-2">
              {selectedDayPosts.map(p => {
                const st = POST_STATUSES.find(s => s.key === p.status);
                return (
                  <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-border/10 last:border-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.campaignColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-foreground truncate">{p.title}</p>
                      <p className="text-[8px] text-muted-foreground">{p.campaignName}</p>
                    </div>
                    {st && <Badge className={`${st.color} text-[7px]`}>{st.label}</Badge>}
                    {p.format && <Badge variant="outline" className="text-[7px]">{FORMATS.find(f => f.key === p.format)?.label}</Badge>}
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(allCampaigns || []).map(c => (
          <div key={c.id} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: campaignColorMap.get(c.id) }} />
            <span className="text-[8px] text-muted-foreground">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
