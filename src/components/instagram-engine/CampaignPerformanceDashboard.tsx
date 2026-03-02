import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { InstagramPost, POST_STATUSES, FORMATS, PILLARS, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { TrendingUp, Eye, Heart, MessageCircle, Share2, Target, Zap, BarChart3 } from 'lucide-react';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

const COLORS = ['hsl(210,80%,50%)', 'hsl(140,60%,40%)', 'hsl(280,60%,50%)', 'hsl(30,80%,50%)', 'hsl(350,60%,50%)', 'hsl(45,90%,50%)'];

export function CampaignPerformanceDashboard({ campaign, posts }: Props) {
  const [activeTab, setActiveTab] = useState('overview');

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    posts.forEach(p => { map[p.status] = (map[p.status] || 0) + 1; });
    return Object.entries(map).map(([key, value]) => {
      const s = POST_STATUSES.find(st => st.key === key);
      return { name: s?.label || key, value, key };
    });
  }, [posts]);

  // Format distribution
  const formatData = useMemo(() => {
    const map: Record<string, number> = {};
    posts.forEach(p => { map[p.format] = (map[p.format] || 0) + 1; });
    return Object.entries(map).map(([key, value]) => {
      const f = FORMATS.find(fm => fm.key === key);
      return { name: f?.label || key, value };
    });
  }, [posts]);

  // Pillar distribution
  const pillarData = useMemo(() => {
    const map: Record<string, number> = {};
    posts.forEach(p => { if (p.pillar) map[p.pillar] = (map[p.pillar] || 0) + 1; });
    return Object.entries(map).map(([key, value]) => {
      const pl = PILLARS.find(p => p.key === key);
      return { name: pl?.label || key, value, color: pl?.color || 'hsl(var(--primary))' };
    });
  }, [posts]);

  // Timeline: posts per week
  const timelineData = useMemo(() => {
    if (!campaign.start_date) return [];
    const start = new Date(campaign.start_date);
    const end = campaign.end_date ? new Date(campaign.end_date) : new Date();
    const weeks: { week: string; posts: number; published: number; scheduled: number }[] = [];
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    let current = new Date(start);
    let weekNum = 1;
    while (current <= end) {
      const weekEnd = new Date(current.getTime() + weekMs);
      const weekPosts = posts.filter(p => {
        const d = p.scheduled_at ? new Date(p.scheduled_at) : new Date(p.created_at);
        return d >= current && d < weekEnd;
      });
      weeks.push({
        week: `S${weekNum}`,
        posts: weekPosts.length,
        published: weekPosts.filter(p => p.status === 'published').length,
        scheduled: weekPosts.filter(p => p.status === 'scheduled').length,
      });
      current = weekEnd;
      weekNum++;
    }
    return weeks;
  }, [posts, campaign]);

  // Content completion metrics
  const contentMetrics = useMemo(() => {
    let withHook = 0, withScript = 0, withCaption = 0, withCta = 0, withHashtags = 0, aiGenerated = 0;
    posts.forEach(p => {
      if (p.hook) withHook++;
      if (p.script) withScript++;
      if (p.caption_short || p.caption_medium || p.caption_long) withCaption++;
      if (p.cta) withCta++;
      if (p.hashtags?.length) withHashtags++;
      if (p.ai_generated) aiGenerated++;
    });
    const total = posts.length || 1;
    return [
      { name: 'Hook', pct: Math.round((withHook / total) * 100), count: withHook },
      { name: 'Roteiro', pct: Math.round((withScript / total) * 100), count: withScript },
      { name: 'Legenda', pct: Math.round((withCaption / total) * 100), count: withCaption },
      { name: 'CTA', pct: Math.round((withCta / total) * 100), count: withCta },
      { name: 'Hashtags', pct: Math.round((withHashtags / total) * 100), count: withHashtags },
      { name: 'IA', pct: Math.round((aiGenerated / total) * 100), count: aiGenerated },
    ];
  }, [posts]);

  // Budget allocation by format
  const budgetData = useMemo(() => {
    if (!campaign.budget) return [];
    const formatCounts: Record<string, number> = {};
    posts.forEach(p => { formatCounts[p.format] = (formatCounts[p.format] || 0) + 1; });
    const total = posts.length || 1;
    return Object.entries(formatCounts).map(([key, count]) => {
      const f = FORMATS.find(fm => fm.key === key);
      const allocation = Math.round((count / total) * Number(campaign.budget));
      return { name: f?.label || key, allocation, posts: count, pctBudget: Math.round((count / total) * 100) };
    });
  }, [posts, campaign.budget]);

  const published = posts.filter(p => p.status === 'published').length;
  const aiCount = posts.filter(p => p.ai_generated).length;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/30 h-8">
          <TabsTrigger value="overview" className="text-[11px] h-6">Visão Geral</TabsTrigger>
          <TabsTrigger value="content" className="text-[11px] h-6">Conteúdo</TabsTrigger>
          <TabsTrigger value="timeline" className="text-[11px] h-6">Timeline</TabsTrigger>
          {campaign.budget && <TabsTrigger value="budget" className="text-[11px] h-6">Verba</TabsTrigger>}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard icon={<BarChart3 />} label="Total" value={posts.length} />
            <MetricCard icon={<TrendingUp />} label="Publicados" value={published} accent />
            <MetricCard icon={<Zap />} label="Gerados por IA" value={aiCount} />
            <MetricCard icon={<Target />} label="Conclusão" value={`${posts.length ? Math.round((published / posts.length) * 100) : 0}%`} accent={published === posts.length && posts.length > 0} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Pie */}
            <Card className="glass-card p-4">
              <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Distribuição por Status</h5>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Format Bar */}
            <Card className="glass-card p-4">
              <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Posts por Formato</h5>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Pillar distribution */}
          {pillarData.length > 0 && (
            <Card className="glass-card p-4">
              <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Distribuição por Pilar</h5>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pillarData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis hide />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {pillarData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Content Completeness */}
        <TabsContent value="content" className="space-y-4 mt-3">
          <Card className="glass-card p-4">
            <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Completude do Conteúdo</h5>
            <div className="space-y-3">
              {contentMetrics.map(m => (
                <div key={m.name}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-foreground font-medium">{m.name}</span>
                    <span className="text-muted-foreground">{m.count}/{posts.length} ({m.pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${m.pct >= 80 ? 'bg-emerald-500' : m.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Post details table */}
          <Card className="glass-card p-4 overflow-x-auto">
            <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Detalhes dos Posts</h5>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-1.5 text-muted-foreground font-medium">Título</th>
                  <th className="text-center py-1.5 text-muted-foreground font-medium">Formato</th>
                  <th className="text-center py-1.5 text-muted-foreground font-medium">Status</th>
                  <th className="text-center py-1.5 text-muted-foreground font-medium">Hook</th>
                  <th className="text-center py-1.5 text-muted-foreground font-medium">Roteiro</th>
                  <th className="text-center py-1.5 text-muted-foreground font-medium">Legenda</th>
                  <th className="text-center py-1.5 text-muted-foreground font-medium">IA</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(p => {
                  const fmt = FORMATS.find(f => f.key === p.format);
                  const st = POST_STATUSES.find(s => s.key === p.status);
                  return (
                    <tr key={p.id} className="border-b border-border/10">
                      <td className="py-1.5 text-foreground max-w-[200px] truncate">{p.title}</td>
                      <td className="py-1.5 text-center"><Badge variant="outline" className="text-[9px]">{fmt?.label || p.format}</Badge></td>
                      <td className="py-1.5 text-center"><Badge className={`${st?.color} text-[9px]`}>{st?.label}</Badge></td>
                      <td className="py-1.5 text-center">{p.hook ? '✅' : '—'}</td>
                      <td className="py-1.5 text-center">{p.script ? '✅' : '—'}</td>
                      <td className="py-1.5 text-center">{(p.caption_short || p.caption_long) ? '✅' : '—'}</td>
                      <td className="py-1.5 text-center">{p.ai_generated ? <Zap className="w-3 h-3 text-primary mx-auto" /> : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="space-y-4 mt-3">
          {timelineData.length > 0 ? (
            <Card className="glass-card p-4">
              <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Posts por Semana</h5>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="posts" name="Total" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="published" name="Publicados" stroke="hsl(140,60%,40%)" fill="hsl(140,60%,40%)" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="scheduled" name="Agendados" stroke="hsl(210,80%,50%)" fill="hsl(210,80%,50%)" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ) : (
            <Card className="glass-card p-6 text-center text-xs text-muted-foreground">
              Defina datas de início e fim na campanha para ver a timeline.
            </Card>
          )}
        </TabsContent>

        {/* Budget */}
        {campaign.budget && (
          <TabsContent value="budget" className="space-y-4 mt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard icon={<Target />} label="Orçamento Total" value={`R$ ${Number(campaign.budget).toLocaleString()}`} />
              <MetricCard icon={<BarChart3 />} label="Custo/Post" value={posts.length ? `R$ ${Math.round(Number(campaign.budget) / posts.length).toLocaleString()}` : '—'} />
              <MetricCard icon={<TrendingUp />} label="Posts Planejados" value={posts.length} />
            </div>

            <Card className="glass-card p-4">
              <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Alocação por Formato</h5>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `R$${v}`} />
                    <Bar dataKey="allocation" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`R$ ${v.toLocaleString()}`, 'Verba']} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="glass-card p-4">
              <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Detalhamento</h5>
              <div className="space-y-2">
                {budgetData.map(b => (
                  <div key={b.name} className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground">{b.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{b.posts} posts</span>
                      <span className="text-muted-foreground">{b.pctBudget}%</span>
                      <span className="text-foreground font-medium">R$ {b.allocation.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function MetricCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className="glass-card p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={accent ? 'text-emerald-400' : 'text-primary'}>{icon}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-lg font-bold ${accent ? 'text-emerald-400' : 'text-foreground'}`}>{value}</p>
    </Card>
  );
}
