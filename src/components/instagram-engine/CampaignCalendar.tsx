import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, POST_STATUSES, FORMATS, PILLARS, useUpdatePost } from '@/hooks/useInstagramEngine';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  posts: InstagramPost[];
  startDate?: string | null;
  endDate?: string | null;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function CampaignCalendar({ posts, startDate, endDate }: Props) {
  const updatePost = useUpdatePost();
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (startDate) return startOfMonth(new Date(startDate));
    const firstScheduled = posts.find(p => p.scheduled_at);
    return startOfMonth(firstScheduled ? new Date(firstScheduled.scheduled_at!) : new Date());
  });

  const [dragPostId, setDragPostId] = useState<string | null>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const postsByDate = useMemo(() => {
    const map: Record<string, InstagramPost[]> = {};
    posts.forEach(p => {
      const dateStr = p.scheduled_at || p.created_at;
      if (dateStr) {
        const key = format(new Date(dateStr), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(p);
      }
    });
    return map;
  }, [posts]);

  // Gap detection
  const gaps = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allDays = eachDayOfInterval({ start, end });
    const scheduledDates = new Set(
      posts.filter(p => p.scheduled_at).map(p => format(new Date(p.scheduled_at!), 'yyyy-MM-dd'))
    );
    const gapDays: string[] = [];
    let consecutiveEmpty = 0;
    allDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      if (!scheduledDates.has(key)) {
        consecutiveEmpty++;
        if (consecutiveEmpty >= 3) gapDays.push(key);
      } else {
        consecutiveEmpty = 0;
      }
    });
    return gapDays;
  }, [posts, startDate, endDate]);

  const handleDrop = (date: Date, postId: string) => {
    const newDate = new Date(date);
    newDate.setHours(12, 0, 0, 0);
    updatePost.mutate({ id: postId, scheduled_at: newDate.toISOString(), status: 'scheduled' } as any);
  };

  const isInCampaignRange = (day: Date) => {
    if (!startDate || !endDate) return true;
    const s = new Date(startDate);
    const e = new Date(endDate);
    return day >= s && day <= e;
  };

  const unscheduledPosts = posts.filter(p => !p.scheduled_at);

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h4 className="text-sm font-semibold text-foreground capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h4>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Gap warning */}
      {gaps.length > 0 && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-[11px] text-amber-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{gaps.length} dias em gaps de cobertura (3+ dias sem conteúdo)</span>
        </div>
      )}

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border/20 rounded-xl overflow-hidden">
        {WEEKDAYS.map(d => (
          <div key={d} className="bg-muted/20 text-center py-1.5 text-[10px] font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {calendarDays.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dayPosts = postsByDate[key] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const inRange = isInCampaignRange(day);
          const isGap = gaps.includes(key);

          return (
            <div
              key={key}
              className={`min-h-[80px] p-1 transition-colors ${
                !isCurrentMonth ? 'bg-muted/5 opacity-40' :
                isGap ? 'bg-amber-500/5' :
                inRange ? 'bg-card/50' : 'bg-muted/10'
              }`}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const postId = e.dataTransfer.getData('postId');
                if (postId) handleDrop(day, postId);
              }}
            >
              <div className={`text-[10px] mb-0.5 ${isToday ? 'bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center font-bold' : 'text-muted-foreground'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayPosts.slice(0, 3).map(p => {
                  const fmt = FORMATS.find(f => f.key === p.format);
                  const st = POST_STATUSES.find(s => s.key === p.status);
                  const pillar = PILLARS.find(pl => pl.key === p.pillar);
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('postId', p.id);
                        setDragPostId(p.id);
                      }}
                      onDragEnd={() => setDragPostId(null)}
                      className={`text-[9px] px-1 py-0.5 rounded cursor-grab active:cursor-grabbing truncate border transition-all ${
                        dragPostId === p.id ? 'opacity-50' : ''
                      } ${st?.color || 'bg-muted/30'} border-border/20 hover:border-primary/30`}
                      title={p.title}
                    >
                      <div className="flex items-center gap-0.5">
                        {pillar && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: pillar.color }} />}
                        <span className="truncate">{p.title}</span>
                      </div>
                    </div>
                  );
                })}
                {dayPosts.length > 3 && (
                  <span className="text-[8px] text-muted-foreground">+{dayPosts.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unscheduled posts sidebar */}
      {unscheduledPosts.length > 0 && (
        <Card className="glass-card p-3">
          <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
            Posts sem data ({unscheduledPosts.length})
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {unscheduledPosts.map(p => {
              const fmt = FORMATS.find(f => f.key === p.format);
              return (
                <div
                  key={p.id}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('postId', p.id);
                    setDragPostId(p.id);
                  }}
                  onDragEnd={() => setDragPostId(null)}
                  className="text-[10px] px-2 py-1 rounded-md bg-muted/20 border border-border/30 cursor-grab hover:border-primary/30 transition-colors"
                >
                  {fmt && <Badge variant="outline" className="text-[8px] h-3.5 px-1 mr-1">{fmt.label}</Badge>}
                  {p.title}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
