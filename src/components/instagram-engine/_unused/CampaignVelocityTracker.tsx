import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost, POST_STATUSES } from '@/hooks/useInstagramEngine';
import { Gauge, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { differenceInDays, format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

export function CampaignVelocityTracker({ campaign, posts }: Props) {
  const stats = useMemo(() => {
    const total = posts.length;
    const done = posts.filter(p => ['published', 'ready', 'scheduled'].includes(p.status)).length;
    const inProgress = posts.filter(p => p.status === 'in_production').length;
    const remaining = total - done;

    const start = campaign.start_date ? new Date(campaign.start_date) : null;
    const end = campaign.end_date ? new Date(campaign.end_date) : null;
    const now = new Date();

    const totalDays = start && end ? differenceInDays(end, start) : null;
    const elapsedDays = start ? Math.max(0, differenceInDays(now, start)) : null;
    const remainingDays = end ? Math.max(0, differenceInDays(end, now)) : null;

    // Velocity: posts completed per day
    const velocity = elapsedDays && elapsedDays > 0 ? done / elapsedDays : 0;

    // Estimated completion
    const estimatedDaysToFinish = velocity > 0 ? Math.ceil(remaining / velocity) : null;
    const estimatedCompletion = estimatedDaysToFinish ? addDays(now, estimatedDaysToFinish) : null;

    // Required velocity
    const requiredVelocity = remainingDays && remainingDays > 0 ? remaining / remainingDays : null;

    // Progress percentage
    const progressPct = total ? (done / total) * 100 : 0;
    const timePct = totalDays && elapsedDays !== null ? Math.min(100, (elapsedDays / totalDays) * 100) : 0;

    // Health
    const isOnTrack = requiredVelocity !== null ? velocity >= requiredVelocity * 0.8 : true;
    const isAhead = requiredVelocity !== null ? velocity > requiredVelocity * 1.2 : false;
    const isBehind = requiredVelocity !== null ? velocity < requiredVelocity * 0.5 : false;

    // Daily breakdown for burn-down
    const burnDown: { day: number; ideal: number; actual: number }[] = [];
    if (totalDays && start) {
      for (let d = 0; d <= (totalDays || 0); d++) {
        const dayDate = addDays(start, d);
        const idealRemaining = total - (total / totalDays) * d;
        const postsCompletedByDay = posts.filter(p => {
          const completedAt = p.published_at || p.scheduled_at;
          if (!completedAt) return false;
          return new Date(completedAt) <= dayDate;
        }).length;
        burnDown.push({ day: d, ideal: Math.max(0, Math.round(idealRemaining)), actual: total - postsCompletedByDay });
      }
    }

    return { total, done, inProgress, remaining, velocity, estimatedCompletion, requiredVelocity, progressPct, timePct, isOnTrack, isAhead, isBehind, remainingDays, elapsedDays, totalDays, burnDown, estimatedDaysToFinish };
  }, [campaign, posts]);

  const maxBurnDown = stats.total || 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Gauge className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Velocity Tracker & Burn-Down</h3>
        {stats.isAhead && <Badge className="bg-primary/10 text-primary text-[9px]">Adiantado 🚀</Badge>}
        {stats.isBehind && <Badge className="bg-destructive/10 text-destructive text-[9px]">Atrasado ⚠️</Badge>}
        {stats.isOnTrack && !stats.isAhead && !stats.isBehind && <Badge className="bg-primary/10 text-primary text-[9px]">No prazo ✅</Badge>}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-foreground">{stats.done}/{stats.total}</div>
          <div className="text-[10px] text-muted-foreground">Concluídos</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-primary">{stats.velocity.toFixed(1)}</div>
          <div className="text-[10px] text-muted-foreground">Posts/Dia</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-foreground">{stats.remainingDays ?? '—'}</div>
          <div className="text-[10px] text-muted-foreground">Dias Restantes</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="text-lg font-bold text-foreground">
            {stats.estimatedCompletion ? format(stats.estimatedCompletion, 'dd/MM', { locale: ptBR }) : '—'}
          </div>
          <div className="text-[10px] text-muted-foreground">Previsão Conclusão</div>
        </Card>
      </div>

      {/* Progress vs Time */}
      <Card className="p-4 bg-card/50 border-border/30">
        <h4 className="text-xs font-semibold text-foreground mb-3">📊 Progresso vs Tempo</h4>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">Progresso de Produção</span>
              <span className="text-[10px] font-medium text-foreground">{stats.progressPct.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${stats.progressPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">Tempo Decorrido</span>
              <span className="text-[10px] font-medium text-foreground">{stats.timePct.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <div className="h-full bg-muted-foreground rounded-full transition-all" style={{ width: `${stats.timePct}%` }} />
            </div>
          </div>
          {stats.requiredVelocity !== null && (
            <div className="flex items-center gap-3 mt-2">
              <div className="text-[10px] text-muted-foreground">
                Velocidade necessária: <span className="font-semibold text-foreground">{stats.requiredVelocity.toFixed(1)} posts/dia</span>
              </div>
              {stats.velocity >= (stats.requiredVelocity * 0.8) ? (
                <CheckCircle className="w-3.5 h-3.5 text-primary" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Burn-Down Chart (CSS-based) */}
      {stats.burnDown.length > 0 && (
        <Card className="p-4 bg-card/50 border-border/30">
          <h4 className="text-xs font-semibold text-foreground mb-3">📉 Burn-Down Chart</h4>
          <div className="relative h-[120px]">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(pct => (
              <div key={pct} className="absolute left-0 right-0 border-t border-muted/10" style={{ top: `${pct}%` }}>
                <span className="text-[7px] text-muted-foreground/50 -mt-2 block">{Math.round(maxBurnDown * (1 - pct / 100))}</span>
              </div>
            ))}
            {/* Ideal line */}
            <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${stats.burnDown.length} ${maxBurnDown}`} preserveAspectRatio="none">
              <polyline
                points={stats.burnDown.map((p, i) => `${i},${p.ideal}`).join(' ')}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="0.5"
                strokeDasharray="2,2"
                opacity="0.3"
              />
              <polyline
                points={stats.burnDown.map((p, i) => `${i},${p.actual}`).join(' ')}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
              />
            </svg>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 border-t border-dashed border-muted-foreground/30" />
              <span className="text-[9px] text-muted-foreground">Ideal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-primary" />
              <span className="text-[9px] text-muted-foreground">Real</span>
            </div>
          </div>
        </Card>
      )}

      {/* Status breakdown */}
      <Card className="p-4 bg-card/50 border-border/30">
        <h4 className="text-xs font-semibold text-foreground mb-3">📋 Por Status</h4>
        <div className="space-y-1.5">
          {POST_STATUSES.map(s => {
            const count = posts.filter(p => p.status === s.key).length;
            const pct = posts.length ? (count / posts.length) * 100 : 0;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-24">{s.label}</span>
                <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
