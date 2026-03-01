import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfileSnapshots } from '@/hooks/useInstagramEngine';
import { useInstagramConnection, useInstagramInsights } from '@/hooks/useInstagramAPI';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Minus, Calendar, Users, Eye, Heart, BarChart3 } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TimeRange = '7d' | '30d' | '90d' | 'all';

export function SnapshotsTab() {
  const { data: snapshots, isLoading: loadingSnapshots } = useProfileSnapshots();
  const { data: connection } = useInstagramConnection();
  const { data: insights, isLoading: loadingInsights } = useInstagramInsights(connection?.id);
  const [range, setRange] = useState<TimeRange>('30d');

  // Build time-series from profile snapshots
  const snapshotData = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];

    const now = new Date();
    const cutoff = range === '7d' ? subDays(now, 7)
      : range === '30d' ? subDays(now, 30)
      : range === '90d' ? subDays(now, 90)
      : new Date(0);

    return snapshots
      .filter(s => new Date(s.snapshot_date) >= cutoff)
      .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime())
      .map(s => ({
        date: format(new Date(s.snapshot_date), 'dd/MM', { locale: ptBR }),
        fullDate: s.snapshot_date,
        followers: s.followers,
        following: s.following,
        posts: s.posts_count,
        engagement: s.avg_engagement,
        reach: s.avg_reach,
      }));
  }, [snapshots, range]);

  // Build media-level insights over time from instagram_insights
  const insightTimeSeries = useMemo(() => {
    if (!insights?.raw || insights.raw.length === 0) return [];

    // Group by collected_at date
    const dayMap: Record<string, { reach: number; likes: number; comments: number; impressions: number; count: number }> = {};

    for (const row of insights.raw) {
      if (row.media_type === 'account') continue;
      const day = format(new Date(row.collected_at), 'yyyy-MM-dd');
      if (!dayMap[day]) dayMap[day] = { reach: 0, likes: 0, comments: 0, impressions: 0, count: 0 };

      const val = Number(row.metric_value);
      if (row.metric_name === 'reach') dayMap[day].reach += val;
      if (row.metric_name === 'likes') dayMap[day].likes += val;
      if (row.metric_name === 'comments') dayMap[day].comments += val;
      if (row.metric_name === 'impressions') dayMap[day].impressions += val;
      dayMap[day].count++;
    }

    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: format(new Date(date), 'dd/MM', { locale: ptBR }),
        ...data,
      }));
  }, [insights]);

  // Calculate growth deltas
  const growth = useMemo(() => {
    if (snapshotData.length < 2) return null;
    const first = snapshotData[0];
    const last = snapshotData[snapshotData.length - 1];
    return {
      followers: last.followers - first.followers,
      followersPercent: first.followers > 0 ? ((last.followers - first.followers) / first.followers * 100) : 0,
      engagement: last.engagement - first.engagement,
      reach: last.reach - first.reach,
      reachPercent: first.reach > 0 ? ((last.reach - first.reach) / first.reach * 100) : 0,
    };
  }, [snapshotData]);

  const hasData = snapshotData.length > 0 || insightTimeSeries.length > 0;
  const isLoading = loadingSnapshots || loadingInsights;

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Evolução Temporal</h3>
          <p className="text-xs text-muted-foreground">
            {snapshotData.length} snapshots • {insightTimeSeries.length} dias de métricas
          </p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as TimeRange)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="all">Tudo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Growth Summary Cards */}
      {growth && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GrowthCard
            label="Seguidores"
            icon={<Users className="w-4 h-4" />}
            delta={growth.followers}
            percent={growth.followersPercent}
            current={snapshotData[snapshotData.length - 1]?.followers}
          />
          <GrowthCard
            label="Engajamento"
            icon={<Heart className="w-4 h-4" />}
            delta={growth.engagement}
            percent={0}
            current={snapshotData[snapshotData.length - 1]?.engagement}
            suffix="%"
          />
          <GrowthCard
            label="Alcance Médio"
            icon={<Eye className="w-4 h-4" />}
            delta={growth.reach}
            percent={growth.reachPercent}
            current={snapshotData[snapshotData.length - 1]?.reach}
          />
          <GrowthCard
            label="Posts"
            icon={<BarChart3 className="w-4 h-4" />}
            delta={snapshotData[snapshotData.length - 1]?.posts - snapshotData[0]?.posts}
            percent={0}
            current={snapshotData[snapshotData.length - 1]?.posts}
          />
        </div>
      )}

      {!hasData ? (
        <Card className="glass-card p-8 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Nenhum dado histórico disponível ainda.</p>
          <p className="text-xs text-muted-foreground">
            Registre snapshots na aba "Saúde do Perfil" ou sincronize métricas via Meta Graph API para visualizar a evolução.
          </p>
        </Card>
      ) : (
        <>
          {/* Followers Evolution */}
          {snapshotData.length > 1 && (
            <Card className="glass-card p-5">
              <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Evolução de Seguidores
              </h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={snapshotData}>
                    <defs>
                      <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="followers" stroke="hsl(var(--primary))" fill="url(#followerGrad)" strokeWidth={2} name="Seguidores" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Engagement Rate Evolution */}
          {snapshotData.length > 1 && (
            <Card className="glass-card p-5">
              <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" /> Taxa de Engajamento (%)
              </h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={snapshotData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(val: number) => [`${val.toFixed(2)}%`, 'Engajamento']}
                    />
                    <Line type="monotone" dataKey="engagement" stroke="hsl(195, 60%, 55%)" strokeWidth={2} dot={{ r: 3 }} name="Engajamento" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Reach Evolution */}
          {snapshotData.length > 1 && (
            <Card className="glass-card p-5">
              <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" /> Alcance Médio
              </h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={snapshotData}>
                    <defs>
                      <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(195, 40%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(195, 40%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="reach" stroke="hsl(195, 40%, 50%)" fill="url(#reachGrad)" strokeWidth={2} name="Alcance" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Meta API Insights - Media Performance */}
          {insightTimeSeries.length > 0 && (
            <Card className="glass-card p-5">
              <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Performance de Mídia (Meta API)
              </h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insightTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="reach" fill="hsl(var(--primary))" name="Alcance" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="likes" fill="hsl(var(--chart-2))" name="Curtidas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="comments" fill="hsl(var(--chart-4))" name="Comentários" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function GrowthCard({ label, icon, delta, percent, current, suffix = '' }: {
  label: string;
  icon: React.ReactNode;
  delta: number;
  percent: number;
  current?: number;
  suffix?: string;
}) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-primary">{icon}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground">
        {current !== undefined ? (suffix === '%' ? `${current.toFixed(1)}${suffix}` : current.toLocaleString()) : '—'}
      </p>
      <div className="flex items-center gap-1 mt-1">
        {isNeutral ? (
          <Minus className="w-3 h-3 text-muted-foreground" />
        ) : isPositive ? (
          <TrendingUp className="w-3 h-3 text-emerald-400" />
        ) : (
          <TrendingDown className="w-3 h-3 text-destructive" />
        )}
        <span className={`text-[11px] font-medium ${isNeutral ? 'text-muted-foreground' : isPositive ? 'text-emerald-400' : 'text-destructive'}`}>
          {isPositive ? '+' : ''}{suffix === '%' ? delta.toFixed(2) + suffix : delta.toLocaleString()}
          {percent !== 0 && ` (${percent > 0 ? '+' : ''}${percent.toFixed(1)}%)`}
        </span>
      </div>
    </Card>
  );
}
