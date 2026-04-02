import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, InstagramCampaign, POST_STATUSES, FORMATS } from '@/hooks/useInstagramEngine';
import { AlertTriangle, Clock, Target, TrendingDown, CalendarClock, CheckCircle2, Info } from 'lucide-react';
import { differenceInDays, isPast, isFuture, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
  goals?: { title: string; target_value: number; current_value: number; metric_key: string }[];
}

interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  icon: React.ReactNode;
  title: string;
  description: string;
}

const TYPE_STYLES: Record<string, string> = {
  danger: 'border-destructive/30 bg-destructive/5',
  warning: 'border-border bg-muted/50',
  info: 'border-primary/30 bg-primary/5',
  success: 'border-primary/30 bg-primary/5',
};

const TYPE_BADGE: Record<string, string> = {
  danger: 'bg-destructive/15 text-destructive',
  warning: 'bg-muted text-muted-foreground',
  info: 'bg-primary/15 text-primary',
  success: 'bg-primary/15 text-primary',
};

export function CampaignAlerts({ campaign, posts, goals }: Props) {
  const alerts = useMemo(() => {
    const result: Alert[] = [];
    const now = new Date();

    // 1. Campaign ending soon
    if (campaign.end_date) {
      const endDate = new Date(campaign.end_date);
      const daysLeft = differenceInDays(endDate, now);
      if (daysLeft < 0) {
        result.push({
          id: 'campaign-ended',
          type: 'danger',
          icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
          title: 'Campanha encerrada',
          description: `A campanha encerrou há ${Math.abs(daysLeft)} dia(s). Considere finalizá-la ou estender o prazo.`,
        });
      } else if (daysLeft <= 3) {
        result.push({
          id: 'campaign-ending',
          type: 'warning',
          icon: <CalendarClock className="w-4 h-4 text-amber-400" />,
          title: 'Campanha encerrando',
          description: `Faltam ${daysLeft} dia(s) para o fim da campanha (${format(endDate, 'dd/MM', { locale: ptBR })}).`,
        });
      } else if (daysLeft <= 7) {
        result.push({
          id: 'campaign-ending-week',
          type: 'info',
          icon: <CalendarClock className="w-4 h-4 text-blue-400" />,
          title: 'Campanha encerra em breve',
          description: `${daysLeft} dias restantes até ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })}.`,
        });
      }
    }

    // 2. Posts overdue (scheduled in the past but not published)
    const overduePosts = posts.filter(p =>
      p.scheduled_at && isPast(new Date(p.scheduled_at)) && p.status !== 'published'
    );
    if (overduePosts.length > 0) {
      result.push({
        id: 'posts-overdue',
        type: 'danger',
        icon: <Clock className="w-4 h-4 text-red-400" />,
        title: `${overduePosts.length} post(s) atrasado(s)`,
        description: `Posts agendados no passado sem publicação: ${overduePosts.map(p => `"${p.title}"`).slice(0, 3).join(', ')}${overduePosts.length > 3 ? '...' : ''}.`,
      });
    }

    // 3. Posts stuck in production
    const stuckPosts = posts.filter(p => p.status === 'in_production');
    if (stuckPosts.length >= 3) {
      result.push({
        id: 'posts-stuck',
        type: 'warning',
        icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        title: `${stuckPosts.length} posts parados em produção`,
        description: 'Muitos posts estão em produção sem avançar. Revise o workflow para destravar.',
      });
    }

    // 4. No published posts yet
    const publishedCount = posts.filter(p => p.status === 'published').length;
    if (posts.length > 0 && publishedCount === 0) {
      result.push({
        id: 'no-published',
        type: 'info',
        icon: <Info className="w-4 h-4 text-blue-400" />,
        title: 'Nenhum post publicado',
        description: `A campanha tem ${posts.length} posts mas nenhum foi publicado ainda.`,
      });
    }

    // 5. Goals below target
    if (goals && goals.length > 0) {
      const behindGoals = goals.filter(g => {
        const pct = g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0;
        return pct < 30 && g.target_value > 0;
      });
      if (behindGoals.length > 0) {
        result.push({
          id: 'goals-behind',
          type: 'warning',
          icon: <TrendingDown className="w-4 h-4 text-amber-400" />,
          title: `${behindGoals.length} meta(s) abaixo de 30%`,
          description: `Metas atrasadas: ${behindGoals.map(g => g.title).join(', ')}.`,
        });
      }

      const completedGoals = goals.filter(g => g.target_value > 0 && g.current_value >= g.target_value);
      if (completedGoals.length > 0) {
        result.push({
          id: 'goals-completed',
          type: 'success',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          title: `${completedGoals.length} meta(s) atingida(s)! 🎉`,
          description: `Metas concluídas: ${completedGoals.map(g => g.title).join(', ')}.`,
        });
      }
    }

    // 6. Low content completion
    const withContent = posts.filter(p => p.hook && p.script && (p.caption_short || p.caption_long));
    if (posts.length >= 5 && withContent.length / posts.length < 0.3) {
      result.push({
        id: 'low-content',
        type: 'warning',
        icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        title: 'Conteúdo incompleto',
        description: `Apenas ${Math.round((withContent.length / posts.length) * 100)}% dos posts têm conteúdo completo (hook + roteiro + legenda).`,
      });
    }

    // 7. All published - success!
    if (posts.length > 0 && publishedCount === posts.length) {
      result.push({
        id: 'all-published',
        type: 'success',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        title: 'Todos os posts publicados! 🎉',
        description: 'A campanha atingiu 100% de publicação.',
      });
    }

    return result;
  }, [campaign, posts, goals]);

  if (alerts.length === 0) {
    return (
      <Card className="glass-card p-4 text-center">
        <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Tudo em dia! Nenhum alerta para esta campanha.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <Card key={alert.id} className={`p-3 border ${TYPE_STYLES[alert.type]}`}>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0">{alert.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[11px] font-medium text-foreground">{alert.title}</p>
                <Badge className={`${TYPE_BADGE[alert.type]} text-[8px]`}>
                  {alert.type === 'danger' ? 'Urgente' : alert.type === 'warning' ? 'Atenção' : alert.type === 'success' ? 'Sucesso' : 'Info'}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">{alert.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
