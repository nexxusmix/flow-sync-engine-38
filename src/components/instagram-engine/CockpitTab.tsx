import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useInstagramPosts, useProfileConfig, useProfileSnapshots, PILLARS, POST_STATUSES } from '@/hooks/useInstagramEngine';
import { Loader2, AlertTriangle, CheckCircle2, Clock, TrendingUp, Zap } from 'lucide-react';
import { formatDistanceToNow, differenceInDays, addDays, format, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { InstagramMetaConnect } from './InstagramMetaConnect';

export function CockpitTab() {
  const { data: posts, isLoading: loadingPosts } = useInstagramPosts();
  const { data: config } = useProfileConfig();
  const { data: snapshots } = useProfileSnapshots();
  const navigate = useNavigate();

  if (loadingPosts) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const allPosts = posts || [];
  const latestSnapshot = snapshots?.[0];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Health status
  const publishedPosts = allPosts.filter(p => p.status === 'published' && p.published_at);
  const lastPublished = publishedPosts.sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime())[0];
  const daysSincePost = lastPublished ? differenceInDays(today, new Date(lastPublished.published_at!)) : 999;
  const healthStatus = daysSincePost <= 3 ? 'green' : daysSincePost <= 7 ? 'yellow' : 'red';
  const healthLabel = { green: 'Saudável', yellow: 'Atenção', red: 'Crítico' }[healthStatus];
  const healthColor = { green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', yellow: 'text-amber-400 bg-amber-500/10 border-amber-500/20', red: 'text-destructive bg-destructive/10 border-destructive/20' }[healthStatus];

  // Next scheduled
  const scheduledPosts = allPosts.filter(p => p.scheduled_at && isAfter(new Date(p.scheduled_at), today)).sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());
  const nextScheduled = scheduledPosts[0];

  // Pipeline counts
  const statusCounts = POST_STATUSES.map(s => ({
    ...s,
    count: allPosts.filter(p => p.status === s.key).length,
  }));

  // Pillar distribution
  const pillarCounts = PILLARS.map(p => ({
    ...p,
    count: allPosts.filter(post => post.pillar === p.key).length,
  }));
  const totalPillar = Math.max(pillarCounts.reduce((s, p) => s + p.count, 0), 1);

  // Action queue
  const actionQueue = [
    ...allPosts.filter(p => p.status === 'in_production').map(p => ({ type: 'production', label: `Finalizar produção: ${p.title}`, post: p })),
    ...allPosts.filter(p => p.status === 'ready').map(p => ({ type: 'schedule', label: `Agendar: ${p.title}`, post: p })),
    ...allPosts.filter(p => p.status === 'idea').slice(0, 3).map(p => ({ type: 'plan', label: `Planejar: ${p.title}`, post: p })),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Meta Graph API Connection & Real Metrics */}
      <InstagramMetaConnect />

      {/* Profile Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Seguidores" value={latestSnapshot?.followers?.toLocaleString() || '—'} icon="group" />
        <StatCard label="Posts" value={latestSnapshot?.posts_count?.toString() || String(publishedPosts.length)} icon="grid_view" />
        <StatCard label="Engajamento" value={latestSnapshot ? `${latestSnapshot.avg_engagement}%` : '—'} icon="favorite" />
        <StatCard label="Alcance Médio" value={latestSnapshot?.avg_reach?.toLocaleString() || '—'} icon="visibility" />
        <StatCard label="Melhor Horário" value={latestSnapshot?.best_posting_time || '—'} icon="schedule" />
      </div>

      {/* Health Alert + Next Post */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`glass-card p-5 border ${healthColor}`}>
          <div className="flex items-center gap-3 mb-3">
            {healthStatus === 'green' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
             healthStatus === 'yellow' ? <Clock className="w-5 h-5 text-amber-400" /> :
             <AlertTriangle className="w-5 h-5 text-destructive" />}
            <div>
              <p className="text-sm font-medium text-foreground">Saúde do Perfil: {healthLabel}</p>
              <p className="text-xs text-muted-foreground">
                {daysSincePost < 999 ? `Último post há ${daysSincePost} dia${daysSincePost !== 1 ? 's' : ''}` : 'Nenhum post publicado ainda'}
              </p>
            </div>
          </div>
          {healthStatus === 'red' && (
            <p className="text-xs text-destructive/80">⚠️ Mais de 7 dias sem postar. O algoritmo está penalizando seu alcance.</p>
          )}
          {healthStatus === 'yellow' && (
            <p className="text-xs text-amber-400/80">⚡ Considere postar nos próximos 2 dias para manter o ritmo.</p>
          )}
        </Card>

        <Card className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-lg">event</span>
            <p className="text-sm font-medium text-foreground">Próximo Post</p>
          </div>
          {nextScheduled ? (
            <div>
              <p className="text-sm text-foreground font-medium">{nextScheduled.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(nextScheduled.scheduled_at!), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
              <Badge variant="secondary" className="mt-2 text-[10px]">{nextScheduled.format}</Badge>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground">Nenhum post agendado nos próximos 7 dias.</p>
              <p className="text-xs text-destructive mt-1">⚠️ Risco de queda de alcance.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Pipeline Status */}
      <Card className="glass-card p-5">
        <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Pipeline de Conteúdo
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {statusCounts.map(s => (
            <div key={s.key} className="text-center">
              <div className={`text-2xl font-bold ${s.count > 0 ? 'text-foreground' : 'text-muted-foreground/40'}`}>{s.count}</div>
              <Badge className={`${s.color} text-[9px] mt-1`}>{s.label}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Queue + Pillar Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">🎯 Próximas Ações</h3>
          {actionQueue.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma ação pendente. Crie conteúdo com IA!</p>
          ) : (
            <div className="space-y-2">
              {actionQueue.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="material-symbols-outlined text-primary text-sm">
                    {a.type === 'production' ? 'movie_edit' : a.type === 'schedule' ? 'schedule_send' : 'lightbulb'}
                  </span>
                  <span className="text-xs text-foreground flex-1 truncate">{a.label}</span>
                  <Badge variant="secondary" className="text-[9px]">{a.post.format}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">📊 Distribuição de Pilares</h3>
          <div className="space-y-3">
            {pillarCounts.map(p => (
              <div key={p.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="text-foreground font-medium">{Math.round((p.count / totalPillar) * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(p.count / totalPillar) * 100}%`, backgroundColor: p.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <Card className="glass-card p-4 text-center">
      <span className="material-symbols-outlined text-primary text-xl mb-1">{icon}</span>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </Card>
  );
}
