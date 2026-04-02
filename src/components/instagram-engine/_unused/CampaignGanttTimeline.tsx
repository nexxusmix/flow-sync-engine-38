import { useMemo, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InstagramPost, FORMATS, PILLARS, POST_STATUSES } from '@/hooks/useInstagramEngine';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInDays, addDays, startOfDay, isToday, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  posts: InstagramPost[];
  startDate: string | null;
  endDate: string | null;
}

function getPillarColor(pillar: string | null): string {
  const p = PILLARS.find(pl => pl.key === pillar);
  return p?.color || 'hsl(var(--muted-foreground))';
}

function getStatusInfo(status: string) {
  return POST_STATUSES.find(s => s.key === status) || { label: status, color: 'bg-muted text-muted-foreground' };
}

export function CampaignGanttTimeline({ posts, startDate, endDate }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1); // 1 = normal, 0.5 = zoomed out, 2 = zoomed in
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);

  const dayWidth = 40 * zoom;
  const rowHeight = 36;

  const { start, end, totalDays, days } = useMemo(() => {
    const s = startDate ? startOfDay(new Date(startDate)) : startOfDay(new Date());
    const e = endDate ? startOfDay(new Date(endDate)) : addDays(s, 30);
    const total = Math.max(differenceInDays(e, s) + 1, 7);
    const daysArr = Array.from({ length: total }, (_, i) => addDays(s, i));
    return { start: s, end: e, totalDays: total, days: daysArr };
  }, [startDate, endDate]);

  // Position posts on the timeline
  const positionedPosts = useMemo(() => {
    return posts.map(post => {
      const postDate = post.scheduled_at ? startOfDay(new Date(post.scheduled_at)) : startOfDay(new Date(post.created_at));
      const dayOffset = Math.max(differenceInDays(postDate, start), 0);
      const duration = post.format === 'story_sequence' ? 1 : post.format === 'carousel' ? 2 : 1;
      return { ...post, dayOffset, duration, postDate };
    }).sort((a, b) => a.dayOffset - b.dayOffset);
  }, [posts, start]);

  // Track rows to avoid overlapping
  const rows = useMemo(() => {
    const rowEnds: number[] = [];
    return positionedPosts.map(p => {
      let row = 0;
      for (let i = 0; i < rowEnds.length; i++) {
        if (p.dayOffset >= rowEnds[i]) {
          row = i;
          rowEnds[i] = p.dayOffset + p.duration;
          return { ...p, row };
        }
      }
      row = rowEnds.length;
      rowEnds.push(p.dayOffset + p.duration);
      return { ...p, row };
    });
  }, [positionedPosts]);

  const maxRow = Math.max(0, ...rows.map(r => r.row)) + 1;
  const todayOffset = differenceInDays(startOfDay(new Date()), start);

  const handleScrollToToday = () => {
    if (scrollRef.current && todayOffset >= 0) {
      scrollRef.current.scrollLeft = todayOffset * dayWidth - scrollRef.current.clientWidth / 2;
    }
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">Timeline Gantt</h4>
          <Badge variant="outline" className="text-[9px]">{posts.length} posts</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[9px] text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setZoom(z => Math.min(2, z + 0.25))}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="outline" className="text-[9px] h-7 ml-2" onClick={handleScrollToToday}>
            Hoje
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <Card className="glass-card overflow-hidden">
        <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden">
          <div style={{ width: totalDays * dayWidth, minHeight: maxRow * rowHeight + 56 }} className="relative">
            {/* Header: day labels */}
            <div className="flex border-b border-border/20 sticky top-0 z-10 bg-card/90 backdrop-blur-sm">
              {days.map((day, i) => {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const today = isToday(day);
                return (
                  <div
                    key={i}
                    style={{ width: dayWidth, minWidth: dayWidth }}
                    className={`text-center py-1.5 border-r border-border/10 shrink-0 ${
                      today ? 'bg-primary/10' : isWeekend ? 'bg-muted/15' : ''
                    }`}
                  >
                    <p className="text-[8px] text-muted-foreground uppercase">{format(day, 'EEE', { locale: ptBR })}</p>
                    <p className={`text-[10px] font-medium ${today ? 'text-primary' : 'text-foreground'}`}>
                      {format(day, 'dd')}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Today indicator line */}
            {todayOffset >= 0 && todayOffset <= totalDays && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: todayOffset * dayWidth + dayWidth / 2 }}
              >
                <div className="w-0.5 h-full bg-primary/60" />
                <div className="absolute -top-0.5 -left-1 w-2.5 h-2.5 bg-primary rounded-full" />
              </motion.div>
            )}

            {/* Posts as bars */}
            <div className="relative" style={{ height: maxRow * rowHeight, marginTop: 4 }}>
              <TooltipProvider delayDuration={200}>
                {rows.map((post, i) => {
                  const pillarColor = getPillarColor(post.pillar);
                  const statusInfo = getStatusInfo(post.status);
                  const fmtInfo = FORMATS.find(f => f.key === post.format);
                  const isHovered = hoveredPost === post.id;

                  return (
                    <Tooltip key={post.id}>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, scaleX: 0, originX: 0 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          className={`absolute rounded-md cursor-pointer transition-all duration-200 overflow-hidden ${
                            isHovered ? 'shadow-lg ring-1 ring-primary/30 z-30' : 'z-10'
                          }`}
                          style={{
                            left: post.dayOffset * dayWidth + 2,
                            top: post.row * rowHeight + 2,
                            width: Math.max(post.duration * dayWidth - 4, dayWidth - 4),
                            height: rowHeight - 4,
                          }}
                          onMouseEnter={() => setHoveredPost(post.id)}
                          onMouseLeave={() => setHoveredPost(null)}
                        >
                          {/* Background gradient */}
                          <div
                            className="absolute inset-0 opacity-20"
                            style={{ background: `linear-gradient(135deg, ${pillarColor}, transparent)` }}
                          />
                          <div className="relative h-full flex items-center gap-1.5 px-2 bg-card/80 backdrop-blur-sm border border-border/30 rounded-md">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pillarColor }} />
                            <span className="text-[9px] font-medium text-foreground truncate flex-1">{post.title}</span>
                            {post.ai_generated && <span className="text-[8px] text-primary">⚡</span>}
                          </div>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px] p-3">
                        <p className="text-xs font-semibold text-foreground mb-1">{post.title}</p>
                        <div className="flex flex-wrap gap-1 mb-1">
                          <Badge variant="outline" className="text-[8px]">{fmtInfo?.label || post.format}</Badge>
                          <Badge className={`${statusInfo.color} text-[8px]`}>{statusInfo.label}</Badge>
                        </div>
                        {post.hook && <p className="text-[9px] text-muted-foreground line-clamp-2">🪝 {post.hook}</p>}
                        <p className="text-[9px] text-muted-foreground mt-1">
                          📅 {format(post.postDate, "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {PILLARS.map(p => (
          <span key={p.key} className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
