import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, POST_STATUSES, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { format, isSameDay, parseISO, startOfDay, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronRight, Play, Image, Layers, BookOpen, Megaphone, Clock } from 'lucide-react';

interface CampaignTimelineProps {
  posts: InstagramPost[];
  startDate?: string | null;
  endDate?: string | null;
}

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  reel: <Play className="w-3.5 h-3.5" />,
  carousel: <Layers className="w-3.5 h-3.5" />,
  single: <Image className="w-3.5 h-3.5" />,
  story: <BookOpen className="w-3.5 h-3.5" />,
  story_sequence: <BookOpen className="w-3.5 h-3.5" />,
};

export function CampaignTimeline({ posts, startDate, endDate }: CampaignTimelineProps) {
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  // Group posts by date
  const { dateGroups, unscheduled } = useMemo(() => {
    const scheduled = posts.filter(p => p.scheduled_at);
    const unscheduled = posts.filter(p => !p.scheduled_at);

    const groups: Record<string, InstagramPost[]> = {};
    scheduled
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
      .forEach(p => {
        const dateKey = format(new Date(p.scheduled_at!), 'yyyy-MM-dd');
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(p);
      });

    return { dateGroups: groups, unscheduled };
  }, [posts]);

  const sortedDates = Object.keys(dateGroups).sort();

  // Calculate campaign span for the visual bar
  const campaignStart = startDate ? parseISO(startDate) : (sortedDates[0] ? parseISO(sortedDates[0]) : new Date());
  const campaignEnd = endDate ? parseISO(endDate) : (sortedDates.length ? parseISO(sortedDates[sortedDates.length - 1]) : addDays(new Date(), 14));
  const totalDays = Math.max(differenceInDays(campaignEnd, campaignStart), 1);

  if (posts.length === 0) {
    return (
      <Card className="glass-card p-6 text-center">
        <p className="text-xs text-muted-foreground">Nenhum post vinculado a esta campanha.</p>
        <p className="text-[10px] text-muted-foreground mt-1">Gere posts com IA ou vincule no Calendário.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual roadmap bar */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Roadmap Visual</span>
          <span className="text-[10px] text-muted-foreground">
            {format(campaignStart, "dd MMM", { locale: ptBR })} → {format(campaignEnd, "dd MMM", { locale: ptBR })}
          </span>
        </div>
        <div className="relative h-10 bg-muted/20 rounded-lg overflow-hidden border border-border/30">
          {/* Today marker */}
          {(() => {
            const todayOffset = differenceInDays(startOfDay(new Date()), campaignStart);
            if (todayOffset >= 0 && todayOffset <= totalDays) {
              const pct = (todayOffset / totalDays) * 100;
              return (
                <div className="absolute top-0 bottom-0 w-px bg-primary z-10" style={{ left: `${pct}%` }}>
                  <div className="absolute -top-0.5 -translate-x-1/2 text-[8px] text-primary font-bold">HOJE</div>
                </div>
              );
            }
            return null;
          })()}

          {/* Post dots */}
          {sortedDates.map(dateKey => {
            const dayOffset = differenceInDays(parseISO(dateKey), campaignStart);
            const pct = Math.min(Math.max((dayOffset / totalDays) * 100, 1), 99);
            const dayPosts = dateGroups[dateKey];
            const pillar = PILLARS.find(pl => pl.key === dayPosts[0]?.pillar);

            return (
              <div
                key={dateKey}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 cursor-default group"
                style={{ left: `${pct}%` }}
                title={`${format(parseISO(dateKey), "EEEE dd/MM", { locale: ptBR })} — ${dayPosts.length} post(s)`}
              >
                {dayPosts.map((p, i) => {
                  const pl = PILLARS.find(x => x.key === p.pillar);
                  return (
                    <div
                      key={p.id}
                      className="w-3 h-3 rounded-full border-2 border-background shadow-sm transition-transform group-hover:scale-125"
                      style={{ backgroundColor: pl?.color || 'hsl(var(--primary))', marginTop: i > 0 ? '-2px' : '0' }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-2">
          {PILLARS.filter(pl => posts.some(p => p.pillar === pl.key)).map(pl => (
            <div key={pl.key} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pl.color }} />
              <span className="text-[9px] text-muted-foreground">{pl.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Timeline list */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border/40" />

        <div className="space-y-1">
          {sortedDates.map((dateKey) => {
            const dayPosts = dateGroups[dateKey];
            const date = parseISO(dateKey);
            const isToday = isSameDay(date, new Date());
            const dayName = format(date, "EEEE", { locale: ptBR });
            const dateStr = format(date, "dd 'de' MMMM", { locale: ptBR });

            return (
              <div key={dateKey}>
                {/* Date header */}
                <div className="flex items-center gap-3 py-2 relative z-10">
                  <div className={`w-[10px] h-[10px] rounded-full border-2 shrink-0 ${isToday ? 'bg-primary border-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]' : 'bg-background border-muted-foreground/40'}`} style={{ marginLeft: '14px' }} />
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold capitalize ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {dayName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                    {isToday && <Badge className="bg-primary/15 text-primary text-[8px] py-0">Hoje</Badge>}
                    <Badge variant="secondary" className="text-[8px] py-0">{dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}</Badge>
                  </div>
                </div>

                {/* Posts for this date */}
                <div className="ml-[38px] space-y-2 pb-3">
                  {dayPosts.map(post => {
                    const s = POST_STATUSES.find(st => st.key === post.status);
                    const f = FORMATS.find(fm => fm.key === post.format);
                    const pl = PILLARS.find(pi => pi.key === post.pillar);
                    const isExpanded = expandedPost === post.id;
                    const time = post.scheduled_at ? format(new Date(post.scheduled_at), "HH:mm") : null;
                    const isAd = (post as any).is_ad;

                    return (
                      <Card
                        key={post.id}
                        className={`glass-card overflow-hidden transition-all cursor-pointer hover:border-primary/20 ${isExpanded ? 'border-primary/30' : ''}`}
                        onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                      >
                        {/* Pillar color accent */}
                        <div className="h-0.5" style={{ backgroundColor: pl?.color || 'hsl(var(--primary))' }} />

                        <div className="p-3">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 text-primary">
                              {FORMAT_ICONS[post.format] || <Image className="w-3.5 h-3.5" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                                {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {time && (
                                  <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                                    <Clock className="w-2.5 h-2.5" /> {time}
                                  </span>
                                )}
                                {s && <Badge className={`${s.color} text-[8px] py-0`}>{s.label}</Badge>}
                                {f && <Badge variant="secondary" className="text-[8px] py-0">{f.label}</Badge>}
                                {pl && <Badge variant="outline" className="text-[8px] py-0" style={{ borderColor: pl.color, color: pl.color }}>{pl.label}</Badge>}
                                {isAd && <Badge className="bg-muted text-muted-foreground text-[8px] py-0"><Megaphone className="w-2.5 h-2.5 mr-0.5" />Ad</Badge>}
                              </div>
                            </div>

                            {post.thumbnail_url && (
                              <img src={post.thumbnail_url} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
                            )}
                          </div>

                          {/* Hook preview (always visible) */}
                          {post.hook && !isExpanded && (
                            <p className="text-[10px] text-muted-foreground mt-2 line-clamp-1 italic pl-[42px]">🎯 "{post.hook}"</p>
                          )}

                          {/* Expanded content */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-border/30 space-y-3 text-xs">
                              {post.hook && (
                                <div>
                                  <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Hook</span>
                                  <p className="text-foreground mt-0.5">🎯 {post.hook}</p>
                                </div>
                              )}
                              {post.script && (
                                <div>
                                  <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Roteiro</span>
                                  <p className="text-foreground/80 mt-0.5 whitespace-pre-line line-clamp-6">{post.script}</p>
                                </div>
                              )}
                              {post.caption_short && (
                                <div>
                                  <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Legenda Curta</span>
                                  <p className="text-foreground/80 mt-0.5">{post.caption_short}</p>
                                </div>
                              )}
                              {post.cta && (
                                <div>
                                  <span className="text-[9px] text-muted-foreground uppercase tracking-wide">CTA</span>
                                  <p className="text-foreground/80 mt-0.5">{post.cta}</p>
                                </div>
                              )}
                              {post.hashtags?.length > 0 && (
                                <div>
                                  <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Hashtags</span>
                                  <p className="text-primary/70 mt-0.5 text-[10px]">{post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}</p>
                                </div>
                              )}
                              {post.cover_suggestion && (
                                <div>
                                  <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Sugestão de Capa</span>
                                  <p className="text-foreground/80 mt-0.5">{post.cover_suggestion}</p>
                                </div>
                              )}
                              {post.carousel_slides?.length > 0 && (
                                <div>
                                  <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Slides ({post.carousel_slides.length})</span>
                                  <div className="flex gap-2 mt-1 overflow-x-auto pb-1">
                                    {post.carousel_slides.map((slide: any, i: number) => (
                                      <div key={i} className="min-w-[120px] max-w-[140px] bg-muted/30 rounded-lg p-2 shrink-0">
                                        <p className="text-[9px] font-semibold text-foreground truncate">{slide.title}</p>
                                        <p className="text-[8px] text-muted-foreground line-clamp-3 mt-0.5">{slide.body}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {post.checklist?.length > 0 && (
                                <div>
                                  <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Checklist</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {post.checklist.map((item: any, i: number) => (
                                      <Badge key={i} variant="outline" className="text-[8px] py-0">
                                        {item.task || item}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled posts */}
      {unscheduled.length > 0 && (
        <div>
          <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Sem Data Agendada ({unscheduled.length})</h5>
          <div className="space-y-2">
            {unscheduled.map(post => {
              const f = FORMATS.find(fm => fm.key === post.format);
              const pl = PILLARS.find(pi => pi.key === post.pillar);
              return (
                <Card key={post.id} className="glass-card p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-muted/50 flex items-center justify-center text-muted-foreground">
                      {FORMAT_ICONS[post.format] || <Image className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{post.title}</p>
                      <div className="flex gap-1 mt-0.5">
                        {f && <Badge variant="secondary" className="text-[8px] py-0">{f.label}</Badge>}
                        {pl && <Badge variant="outline" className="text-[8px] py-0" style={{ borderColor: pl.color, color: pl.color }}>{pl.label}</Badge>}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
