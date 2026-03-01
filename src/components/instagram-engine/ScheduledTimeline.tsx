import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Play, Image, Layers, BookOpen } from 'lucide-react';

interface ScheduledTimelineProps {
  posts: InstagramPost[];
}

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  reel: <Play className="w-3 h-3" />,
  carousel: <Layers className="w-3 h-3" />,
  single: <Image className="w-3 h-3" />,
  story: <BookOpen className="w-3 h-3" />,
  story_sequence: <BookOpen className="w-3 h-3" />,
};

export function ScheduledTimeline({ posts }: ScheduledTimelineProps) {
  const now = new Date();
  const scheduled = posts
    .filter(p => p.scheduled_at && isAfter(new Date(p.scheduled_at), now))
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
    .slice(0, 8);

  if (scheduled.length === 0) {
    return (
      <Card className="glass-card p-5 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Próximos Agendados</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-4">Nenhum post agendado. Agende posts no calendário!</p>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-5 border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">Próximos Agendados</h3>
        <Badge variant="secondary" className="text-[9px] ml-auto">{scheduled.length}</Badge>
      </div>

      <div className="relative space-y-0">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/50" />

        {scheduled.map((post, i) => {
          const pillar = PILLARS.find(p => p.key === post.pillar);
          const formatInfo = FORMATS.find(f => f.key === post.format);
          const scheduledDate = new Date(post.scheduled_at!);
          const countdown = formatDistanceToNow(scheduledDate, { locale: ptBR, addSuffix: true });

          return (
            <div key={post.id} className="relative pl-9 pb-4 last:pb-0">
              {/* Timeline dot */}
              <div
                className="absolute left-[11px] top-1.5 w-[9px] h-[9px] rounded-full border-2 border-background"
                style={{ backgroundColor: pillar?.color || 'hsl(var(--primary))' }}
              />

              <div className="bg-muted/30 hover:bg-muted/50 rounded-lg p-3 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{post.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(scheduledDate, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-[10px] text-primary mt-0.5">{countdown}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {formatInfo && (
                      <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground">
                        {FORMAT_ICONS[post.format] || <Image className="w-3 h-3" />}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hook preview */}
                {post.hook && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-1 italic">"{post.hook}"</p>
                )}

                <div className="flex gap-1 mt-1.5">
                  {pillar && <Badge variant="outline" className="text-[8px] py-0" style={{ borderColor: pillar.color, color: pillar.color }}>{pillar.label}</Badge>}
                  {formatInfo && <Badge variant="secondary" className="text-[8px] py-0">{formatInfo.label}</Badge>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
