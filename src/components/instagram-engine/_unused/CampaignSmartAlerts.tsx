import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InstagramPost, POST_STATUSES, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Target, TrendingDown, Zap, CalendarX, FileWarning, CheckCircle2, Bell, BellRing } from 'lucide-react';
import { differenceInDays, isAfter, isBefore, addDays, startOfDay } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface SmartAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
  relatedPosts?: InstagramPost[];
}

const TYPE_STYLES = {
  critical: { bg: 'bg-red-500/10 border-red-500/30', icon: 'text-red-400', badge: 'bg-red-500/15 text-red-400' },
  warning: { bg: 'bg-amber-500/10 border-amber-500/30', icon: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-400' },
  info: { bg: 'bg-primary/10 border-primary/30', icon: 'text-primary', badge: 'bg-primary/15 text-primary' },
  success: { bg: 'bg-emerald-500/10 border-emerald-500/30', icon: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400' },
};

export function CampaignSmartAlerts({ campaign, posts }: Props) {
  const alerts = useMemo(() => {
    const result: SmartAlert[] = [];
    const today = startOfDay(new Date());
    const totalPosts = posts.length;
    const published = posts.filter(p => p.status === 'published');
    const ready = posts.filter(p => p.status === 'ready');
    const ideas = posts.filter(p => p.status === 'idea');
    const inProduction = posts.filter(p => p.status === 'in_production');
    const scheduled = posts.filter(p => p.status === 'scheduled');

    // 1. Campaign deadline approaching
    if (campaign.end_date) {
      const endDate = new Date(campaign.end_date);
      const daysLeft = differenceInDays(endDate, today);
      if (daysLeft < 0) {
        result.push({
          id: 'campaign-overdue',
          type: 'critical',
          icon: <CalendarX className="w-4 h-4" />,
          title: 'Campanha encerrada!',
          description: `A campanha terminou há ${Math.abs(daysLeft)} dias. ${totalPosts - published.length} posts ainda não publicados.`,
          relatedPosts: posts.filter(p => p.status !== 'published'),
        });
      } else if (daysLeft <= 3) {
        result.push({
          id: 'campaign-ending-soon',
          type: 'critical',
          icon: <Clock className="w-4 h-4" />,
          title: `Campanha termina em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}!`,
          description: `${ready.length} posts prontos sem agendar. ${inProduction.length} em produção. Acelere para cumprir o prazo.`,
          action: 'Auto-agendar pendentes',
        });
      } else if (daysLeft <= 7) {
        result.push({
          id: 'campaign-week-left',
          type: 'warning',
          icon: <Clock className="w-4 h-4" />,
          title: 'Última semana da campanha',
          description: `${totalPosts - published.length} posts faltam publicar em ${daysLeft} dias.`,
        });
      }
    }

    // 2. Posts stuck in idea stage too long
    const stuckIdeas = ideas.filter(p => {
      const created = new Date(p.created_at);
      return differenceInDays(today, created) > 5;
    });
    if (stuckIdeas.length > 0) {
      result.push({
        id: 'stuck-ideas',
        type: 'warning',
        icon: <FileWarning className="w-4 h-4" />,
        title: `${stuckIdeas.length} ideia${stuckIdeas.length !== 1 ? 's' : ''} parada${stuckIdeas.length !== 1 ? 's' : ''} há +5 dias`,
        description: 'Mova para produção ou descarte para manter o fluxo ativo.',
        relatedPosts: stuckIdeas,
      });
    }

    // 3. Posts in production too long
    const stuckProd = inProduction.filter(p => {
      const updated = new Date(p.updated_at);
      return differenceInDays(today, updated) > 3;
    });
    if (stuckProd.length > 0) {
      result.push({
        id: 'stuck-production',
        type: 'warning',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: `${stuckProd.length} post${stuckProd.length !== 1 ? 's' : ''} em produção há +3 dias`,
        description: 'Verifique se há bloqueios. Considere usar a IA para acelerar a criação.',
        action: 'Gerar conteúdo com IA',
        relatedPosts: stuckProd,
      });
    }

    // 4. Ready posts not scheduled
    if (ready.length > 2) {
      result.push({
        id: 'unscheduled-ready',
        type: 'info',
        icon: <Target className="w-4 h-4" />,
        title: `${ready.length} posts prontos sem agendamento`,
        description: 'Use o auto-agendamento para distribuir nos melhores horários.',
        action: 'Ir para Fila de Publicação',
        relatedPosts: ready,
      });
    }

    // 5. Posts missing essential content
    const incomplete = posts.filter(p => 
      p.status !== 'idea' && p.status !== 'published' &&
      (!p.hook || !(p.caption_short || p.caption_long))
    );
    if (incomplete.length > 0) {
      result.push({
        id: 'missing-content',
        type: 'warning',
        icon: <FileWarning className="w-4 h-4" />,
        title: `${incomplete.length} post${incomplete.length !== 1 ? 's' : ''} sem hook ou legenda`,
        description: 'Posts incompletos podem afetar o engajamento. Complete ou use IA.',
        relatedPosts: incomplete,
      });
    }

    // 6. Low AI usage
    const aiPosts = posts.filter(p => p.ai_generated);
    if (totalPosts > 5 && aiPosts.length / totalPosts < 0.2) {
      result.push({
        id: 'low-ai-usage',
        type: 'info',
        icon: <Zap className="w-4 h-4" />,
        title: 'Uso de IA abaixo de 20%',
        description: 'A IA pode acelerar a criação de hooks, roteiros e legendas. Experimente gerar em lote.',
      });
    }

    // 7. Overdue scheduled posts
    const overdue = scheduled.filter(p => {
      if (!p.scheduled_at) return false;
      return isBefore(new Date(p.scheduled_at), today);
    });
    if (overdue.length > 0) {
      result.push({
        id: 'overdue-scheduled',
        type: 'critical',
        icon: <BellRing className="w-4 h-4" />,
        title: `${overdue.length} post${overdue.length !== 1 ? 's' : ''} atrasado${overdue.length !== 1 ? 's' : ''}!`,
        description: 'Posts agendados no passado que não foram publicados. Publique ou reagende.',
        relatedPosts: overdue,
      });
    }

    // 8. Good progress
    const completionRate = totalPosts > 0 ? (published.length / totalPosts) * 100 : 0;
    if (completionRate >= 80 && totalPosts >= 3) {
      result.push({
        id: 'great-progress',
        type: 'success',
        icon: <CheckCircle2 className="w-4 h-4" />,
        title: 'Campanha com ótimo progresso! 🎉',
        description: `${Math.round(completionRate)}% dos posts publicados. Continue assim!`,
      });
    }

    // 9. Content gap (no posts for next 3 days)
    if (campaign.end_date && isAfter(new Date(campaign.end_date), today)) {
      const next3Days = addDays(today, 3);
      const upcoming = posts.filter(p => {
        if (!p.scheduled_at) return false;
        const d = new Date(p.scheduled_at);
        return isAfter(d, today) && isBefore(d, next3Days);
      });
      if (upcoming.length === 0 && totalPosts > 0) {
        result.push({
          id: 'content-gap',
          type: 'warning',
          icon: <TrendingDown className="w-4 h-4" />,
          title: 'Lacuna de conteúdo nos próximos 3 dias',
          description: 'Nenhum post agendado para os próximos dias. Mantenha a consistência.',
          action: 'Auto-agendar pendentes',
        });
      }
    }

    // Sort: critical first, then warning, info, success
    const order = { critical: 0, warning: 1, info: 2, success: 3 };
    return result.sort((a, b) => order[a.type] - order[b.type]);
  }, [campaign, posts]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Bell className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Alertas Inteligentes</h4>
          <p className="text-[10px] text-muted-foreground">
            {alerts.filter(a => a.type === 'critical').length} críticos ·{' '}
            {alerts.filter(a => a.type === 'warning').length} avisos ·{' '}
            {alerts.filter(a => a.type === 'info').length} sugestões
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">Tudo em ordem! ✨</p>
          <p className="text-xs text-muted-foreground">Nenhum alerta no momento. Continue o bom trabalho.</p>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          {alerts.map((alert, i) => {
            const style = TYPE_STYLES[alert.type];
            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className={`p-4 border ${style.bg} transition-all hover:shadow-md`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.badge}`}>
                      {alert.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-semibold text-foreground">{alert.title}</span>
                        <Badge className={`${style.badge} text-[7px]`}>
                          {alert.type === 'critical' ? 'Crítico' : alert.type === 'warning' ? 'Aviso' : alert.type === 'success' ? 'Sucesso' : 'Info'}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{alert.description}</p>

                      {/* Related posts */}
                      {alert.relatedPosts && alert.relatedPosts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {alert.relatedPosts.slice(0, 5).map(p => (
                            <Badge key={p.id} variant="outline" className="text-[7px]">
                              {p.title.slice(0, 20)}{p.title.length > 20 ? '...' : ''}
                            </Badge>
                          ))}
                          {alert.relatedPosts.length > 5 && (
                            <Badge variant="outline" className="text-[7px]">+{alert.relatedPosts.length - 5}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
