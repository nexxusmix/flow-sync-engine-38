import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, POST_STATUSES, FORMATS } from '@/hooks/useInstagramEngine';
import { History, ArrowRight, Edit3, Plus, Trash2, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  posts: InstagramPost[];
}

interface ChangelogEntry {
  id: string;
  timestamp: string;
  type: 'created' | 'status_change' | 'content_update' | 'review' | 'scheduled' | 'published';
  post: InstagramPost;
  details: string;
  icon: React.ReactNode;
  color: string;
}

export function CampaignChangelog({ posts }: Props) {
  const entries = useMemo(() => {
    const result: ChangelogEntry[] = [];

    posts.forEach(post => {
      const fmt = FORMATS.find(f => f.key === post.format);

      // Post creation
      result.push({
        id: `${post.id}-created`,
        timestamp: post.created_at,
        type: 'created',
        post,
        details: `Post "${post.title}" criado${fmt ? ` (${fmt.label})` : ''}`,
        icon: <Plus className="w-3 h-3" />,
        color: 'text-primary bg-primary/10',
      });

      // Content updates (approximation from updated_at vs created_at)
      if (post.updated_at !== post.created_at) {
        const fields: string[] = [];
        if (post.hook) fields.push('hook');
        if (post.script) fields.push('roteiro');
        if (post.caption_short || post.caption_long) fields.push('legenda');
        if (post.cta) fields.push('CTA');

        result.push({
          id: `${post.id}-updated`,
          timestamp: post.updated_at,
          type: 'content_update',
          post,
          details: `"${post.title}" atualizado${fields.length ? ` — ${fields.join(', ')}` : ''}${post.ai_generated ? ' (IA)' : ''}`,
          icon: <Edit3 className="w-3 h-3" />,
          color: 'text-foreground bg-muted/20',
        });
      }

      // Review status
      const reviewStatus = (post as any).review_status;
      if (reviewStatus === 'approved' && (post as any).reviewed_at) {
        result.push({
          id: `${post.id}-approved`,
          timestamp: (post as any).reviewed_at,
          type: 'review',
          post,
          details: `"${post.title}" aprovado${(post as any).reviewer_notes ? ` — "${(post as any).reviewer_notes}"` : ''}`,
          icon: <CheckCircle2 className="w-3 h-3" />,
          color: 'text-primary bg-primary/10',
        });
      } else if (reviewStatus === 'rejected' && (post as any).reviewed_at) {
        result.push({
          id: `${post.id}-rejected`,
          timestamp: (post as any).reviewed_at,
          type: 'review',
          post,
          details: `"${post.title}" rejeitado — ${(post as any).reviewer_notes || 'sem motivo'}`,
          icon: <XCircle className="w-3 h-3" />,
          color: 'text-destructive bg-destructive/10',
        });
      }

      // Scheduled
      if (post.scheduled_at) {
        result.push({
          id: `${post.id}-scheduled`,
          timestamp: post.scheduled_at,
          type: 'scheduled',
          post,
          details: `"${post.title}" agendado para ${format(new Date(post.scheduled_at), 'dd/MM HH:mm', { locale: ptBR })}`,
          icon: <Eye className="w-3 h-3" />,
          color: 'text-primary bg-primary/10',
        });
      }

      // Published
      if (post.published_at) {
        result.push({
          id: `${post.id}-published`,
          timestamp: post.published_at,
          type: 'published',
          post,
          details: `"${post.title}" publicado no Instagram`,
          icon: <CheckCircle2 className="w-3 h-3" />,
          color: 'text-primary bg-primary/10',
        });
      }
    });

    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posts]);

  if (entries.length === 0) {
    return (
      <Card className="glass-card p-6 text-center">
        <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Nenhuma atividade registrada</p>
      </Card>
    );
  }

  // Group by date
  const grouped = entries.reduce((acc, entry) => {
    const day = format(new Date(entry.timestamp), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {} as Record<string, ChangelogEntry[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Histórico de Atividades</h4>
        <Badge variant="outline" className="text-[9px]">{entries.length} eventos</Badge>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([day, dayEntries]) => (
          <div key={day}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 sticky top-0 bg-background/80 backdrop-blur-sm py-1">
              {format(new Date(day), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            <div className="space-y-1.5 ml-2 border-l border-border/30 pl-4">
              {dayEntries.map(entry => (
                <div key={entry.id} className="flex items-start gap-2.5 relative">
                  <div className={`absolute -left-[22px] w-3.5 h-3.5 rounded-full flex items-center justify-center ${entry.color}`}>
                    {entry.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-foreground">{entry.details}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
