import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, InstagramPost, POST_STATUSES, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { Shield, Users, AlertTriangle, CheckCircle, Clock, Flame, TrendingUp } from 'lucide-react';
import { differenceInDays, parseISO, isAfter, isBefore, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

export function CampaignWarRoom({ campaign, posts }: Props) {
  const now = new Date();

  const metrics = useMemo(() => {
    const total = posts.length;
    const byStatus = POST_STATUSES.map(s => ({ ...s, count: posts.filter(p => p.status === s.key).length }));
    const published = byStatus.find(s => s.key === 'published')?.count || 0;
    const inProgress = byStatus.find(s => s.key === 'creating')?.count || 0;
    const review = byStatus.find(s => s.key === 'ready')?.count || 0;
    const planned = byStatus.find(s => s.key === 'planned')?.count || 0;
    const draft = byStatus.find(s => s.key === 'draft')?.count || 0;

    const completionPct = total > 0 ? Math.round((published / total) * 100) : 0;

    // Overdue posts (scheduled in the past but not published)
    const overdue = posts.filter(p => p.scheduled_at && isBefore(parseISO(p.scheduled_at), now) && p.status !== 'published');

    // Days remaining
    const daysLeft = campaign.end_date ? differenceInDays(parseISO(campaign.end_date), now) : null;
    const daysElapsed = campaign.start_date ? differenceInDays(now, parseISO(campaign.start_date)) : null;
    const totalDays = campaign.start_date && campaign.end_date ? differenceInDays(parseISO(campaign.end_date), parseISO(campaign.start_date)) : null;

    // Production velocity
    const postsLast7Days = posts.filter(p => {
      const d = parseISO(p.created_at);
      return differenceInDays(now, d) <= 7;
    }).length;

    // Bottlenecks
    const bottlenecks: { label: string; severity: 'high' | 'medium' | 'low' }[] = [];
    if (overdue.length > 0) bottlenecks.push({ label: `${overdue.length} posts atrasados`, severity: 'high' });
    if (draft > total * 0.5) bottlenecks.push({ label: 'Mais de 50% em rascunho', severity: 'medium' });
    if (daysLeft !== null && daysLeft < 3 && completionPct < 80) bottlenecks.push({ label: 'Prazo apertado', severity: 'high' });
    if (postsLast7Days === 0 && total > 0) bottlenecks.push({ label: 'Produção parada (0 posts em 7 dias)', severity: 'high' });

    // Format coverage
    const formatsUsed = new Set(posts.map(p => p.format).filter(Boolean));
    const formatCoverage = Math.round((formatsUsed.size / FORMATS.length) * 100);

    return { total, byStatus, published, inProgress, review, planned, draft, completionPct, overdue, daysLeft, daysElapsed, totalDays, postsLast7Days, bottlenecks, formatCoverage };
  }, [posts, campaign, now]);

  const progressPct = metrics.totalDays ? Math.min(100, Math.round(((metrics.daysElapsed || 0) / metrics.totalDays) * 100)) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">War Room — Comando Central</h3>
        {metrics.daysLeft !== null && (
          <Badge className={`text-[9px] ml-auto ${metrics.daysLeft <= 3 ? 'bg-destructive/15 text-destructive animate-pulse' : 'bg-primary/15 text-primary'}`}>
            {metrics.daysLeft > 0 ? `${metrics.daysLeft} dias restantes` : 'Prazo encerrado'}
          </Badge>
        )}
      </div>

      {/* Status scoreboard */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {metrics.byStatus.filter(s => s.count > 0).map(s => (
          <Card key={s.key} className="p-3 bg-card/50 border-border/30 text-center">
            <div className="text-lg font-bold text-foreground">{s.count}</div>
            <div className="text-[8px] text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Progress vs Time */}
      <Card className="p-4 bg-card/50 border-border/30">
        <h4 className="text-xs font-semibold text-foreground mb-3">⏱️ Progresso vs Tempo</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
              <span>Tempo decorrido</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <div className="h-full bg-muted-foreground/30 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
              <span>Posts publicados</span>
              <span>{metrics.completionPct}%</span>
            </div>
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${
                metrics.completionPct >= progressPct ? 'bg-primary/60' : 'bg-muted-foreground/60'
              }`} style={{ width: `${metrics.completionPct}%` }} />
            </div>
          </div>
          {metrics.completionPct < progressPct && (
            <div className="text-[9px] text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Produção atrás do cronograma ({progressPct - metrics.completionPct}% de gap)
            </div>
          )}
        </div>
      </Card>

      {/* KPIs row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-lg font-bold text-foreground">{metrics.postsLast7Days}</div>
          <div className="text-[8px] text-muted-foreground">Posts (7 dias)</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-lg font-bold text-foreground">{metrics.formatCoverage}%</div>
          <div className="text-[8px] text-muted-foreground">Cobertura formatos</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-lg font-bold text-foreground">{metrics.review}</div>
          <div className="text-[8px] text-muted-foreground">Aguardando revisão</div>
        </Card>
        <Card className="p-3 bg-card/50 border-border/30 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
          </div>
          <div className="text-lg font-bold text-foreground">{metrics.overdue.length}</div>
          <div className="text-[8px] text-muted-foreground">Atrasados</div>
        </Card>
      </div>

      {/* Bottlenecks */}
      {metrics.bottlenecks.length > 0 && (
        <Card className="p-4 bg-card/50 border-border/30">
          <h4 className="text-xs font-semibold text-foreground mb-3">🚨 Gargalos Detectados</h4>
          <div className="space-y-2">
            {metrics.bottlenecks.map((b, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-background/40 rounded">
                <Badge className={`text-[7px] ${b.severity === 'high' ? 'bg-destructive/10 text-destructive' : b.severity === 'medium' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                  {b.severity}
                </Badge>
                <span className="text-[10px] text-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Overdue posts */}
      {metrics.overdue.length > 0 && (
        <Card className="p-4 bg-card/50 border-border/30">
          <h4 className="text-xs font-semibold text-destructive mb-3">⏰ Posts Atrasados</h4>
          <div className="space-y-2">
            {metrics.overdue.slice(0, 8).map(p => (
              <div key={p.id} className="flex items-center gap-2 p-2 bg-destructive/5 rounded text-[10px]">
                <Badge variant="outline" className="text-[7px]">{FORMATS.find(f => f.key === p.format)?.label || p.format}</Badge>
                <span className="text-foreground font-medium flex-1 truncate">{p.title}</span>
                {p.scheduled_at && (
                  <span className="text-destructive text-[9px] shrink-0">
                    {format(parseISO(p.scheduled_at), 'dd/MM', { locale: ptBR })}
                  </span>
                )}
                <Badge className="bg-muted/20 text-muted-foreground text-[7px]">
                  {POST_STATUSES.find(s => s.key === p.status)?.label || p.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pipeline status */}
      <Card className="p-4 bg-card/50 border-border/30">
        <h4 className="text-xs font-semibold text-foreground mb-3">📊 Pipeline de Produção</h4>
        <div className="flex items-end gap-1 h-32">
          {metrics.byStatus.map(s => {
            const pct = metrics.total > 0 ? (s.count / metrics.total) * 100 : 0;
            return (
              <div key={s.key} className="flex-1 flex flex-col items-center justify-end gap-1">
                <span className="text-[9px] font-medium text-foreground">{s.count}</span>
                <div
                  className="w-full rounded-t bg-primary/40 transition-all min-h-[4px]"
                  style={{ height: `${Math.max(4, pct)}%` }}
                />
                <span className="text-[7px] text-muted-foreground text-center leading-tight">{s.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {metrics.bottlenecks.length === 0 && metrics.overdue.length === 0 && (
        <Card className="p-4 bg-emerald-500/5 border-emerald-500/10 text-center">
          <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
          <p className="text-xs text-emerald-400 font-medium">Tudo sob controle! 🎯</p>
          <p className="text-[9px] text-muted-foreground">Sem gargalos ou atrasos detectados</p>
        </Card>
      )}
    </div>
  );
}
