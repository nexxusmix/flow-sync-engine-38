import { useMemo, useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend } from 'recharts';
import { InstagramPost, POST_STATUSES, FORMATS, PILLARS, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Target, Zap, BarChart3, Activity, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface Goal {
  id: string;
  title: string;
  metric_key: string;
  target_value: number;
  current_value: number;
  unit: string;
}

const COLORS = ['hsl(210,80%,50%)', 'hsl(142,60%,45%)', 'hsl(280,60%,50%)', 'hsl(30,80%,50%)', 'hsl(350,60%,50%)', 'hsl(45,90%,50%)'];

// Animated counter component
function AnimatedCounter({ value, suffix = '', prefix = '', duration = 1.2 }: { value: number; suffix?: string; prefix?: string; duration?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - startTime) / (duration * 1000);
      if (elapsed >= 1) {
        setDisplayed(value);
        prevRef.current = value;
        return;
      }
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setDisplayed(Math.round(start + diff * eased));
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{prefix}{displayed.toLocaleString('pt-BR')}{suffix}</>;
}

// Sparkline mini chart
function Sparkline({ data, color = 'hsl(var(--primary))' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');

  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Progress ring
function ProgressRing({ value, size = 48, strokeWidth = 4, color = 'hsl(var(--primary))' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (Math.min(value, 100) / 100) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [value, circumference]);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} opacity={0.3} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  );
}

// Animated metric card
function LiveMetricCard({ icon, label, value, numericValue, accent, trend, sparkData, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string | number; numericValue?: number; accent?: boolean; trend?: 'up' | 'down' | null; sparkData?: number[]; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="glass-card p-4 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? 'bg-emerald-500/15 text-emerald-400' : 'bg-primary/15 text-primary'}`}>
                {icon}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            {trend && (
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + 0.3 }}
                className={`flex items-center gap-0.5 text-[9px] font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </motion.span>
            )}
          </div>
          <div className="flex items-end justify-between">
            <p className={`text-2xl font-bold tracking-tight ${accent ? 'text-emerald-400' : 'text-foreground'}`}>
              {typeof numericValue === 'number' ? <AnimatedCounter value={numericValue} /> : value}
            </p>
            {sparkData && sparkData.length > 1 && <Sparkline data={sparkData} color={accent ? 'hsl(142,60%,45%)' : undefined} />}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function CampaignPerformanceDashboard({ campaign, posts }: Props) {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: goals } = useQuery({
    queryKey: ['campaign-goals', campaign.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_campaign_goals' as any)
        .select('*')
        .eq('campaign_id', campaign.id);
      if (error) throw error;
      return (data || []) as unknown as Goal[];
    },
  });

  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    posts.forEach(p => { map[p.status] = (map[p.status] || 0) + 1; });
    return Object.entries(map).map(([key, value]) => {
      const s = POST_STATUSES.find(st => st.key === key);
      return { name: s?.label || key, value, key };
    });
  }, [posts]);

  const formatData = useMemo(() => {
    const map: Record<string, number> = {};
    posts.forEach(p => { map[p.format] = (map[p.format] || 0) + 1; });
    return Object.entries(map).map(([key, value]) => {
      const f = FORMATS.find(fm => fm.key === key);
      return { name: f?.label || key, value };
    });
  }, [posts]);

  const pillarData = useMemo(() => {
    const map: Record<string, number> = {};
    posts.forEach(p => { if (p.pillar) map[p.pillar] = (map[p.pillar] || 0) + 1; });
    return Object.entries(map).map(([key, value]) => {
      const pl = PILLARS.find(p => p.key === key);
      return { name: pl?.label || key, value, color: pl?.color || 'hsl(var(--primary))' };
    });
  }, [posts]);

  const timelineData = useMemo(() => {
    if (!campaign.start_date) return [];
    const start = new Date(campaign.start_date);
    const end = campaign.end_date ? new Date(campaign.end_date) : new Date();
    const weeks: { week: string; posts: number; published: number; scheduled: number }[] = [];
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    let current = new Date(start);
    let weekNum = 1;
    while (current <= end && weekNum <= 52) {
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

  const published = posts.filter(p => p.status === 'published').length;
  const aiCount = posts.filter(p => p.ai_generated).length;
  const completionPct = posts.length > 0 ? Math.round((published / posts.length) * 100) : 0;

  // Sparkline data from timeline
  const weeklySparkData = timelineData.map(w => w.posts);
  const publishedSparkData = timelineData.map(w => w.published);

  // Goals progress
  const goalsAchieved = (goals || []).filter(g => g.current_value >= g.target_value).length;
  const goalsTotal = (goals || []).length;
  const goalsOverallPct = goalsTotal > 0
    ? Math.round((goals || []).reduce((acc, g) => acc + Math.min((g.current_value / (g.target_value || 1)) * 100, 100), 0) / goalsTotal)
    : 0;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/30 h-8">
          <TabsTrigger value="overview" className="text-[11px] h-6">Visão Geral</TabsTrigger>
          <TabsTrigger value="content" className="text-[11px] h-6">Conteúdo</TabsTrigger>
          <TabsTrigger value="timeline" className="text-[11px] h-6">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5 mt-3">
          {/* Hero KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <LiveMetricCard icon={<BarChart3 className="w-4 h-4" />} label="Posts" value={posts.length} numericValue={posts.length} sparkData={weeklySparkData} delay={0} />
            <LiveMetricCard icon={<TrendingUp className="w-4 h-4" />} label="Publicados" value={published} numericValue={published} accent sparkData={publishedSparkData} delay={0.1} trend={published > 0 ? 'up' : null} />
            <LiveMetricCard icon={<Zap className="w-4 h-4" />} label="IA" value={aiCount} numericValue={aiCount} delay={0.2} />
            <LiveMetricCard icon={<Target className="w-4 h-4" />} label="Conclusão" value={`${completionPct}%`} numericValue={completionPct} accent={completionPct >= 80} delay={0.3} trend={completionPct >= 50 ? 'up' : completionPct > 0 ? 'down' : null} />
          </div>

          {/* Goals Overview Ring + Progress */}
          {goalsTotal > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="glass-card p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <ProgressRing value={goalsOverallPct} size={64} strokeWidth={5} color={goalsOverallPct >= 80 ? 'hsl(142,60%,45%)' : 'hsl(var(--primary))'} />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                      <AnimatedCounter value={goalsOverallPct} suffix="%" />
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">Progresso das Metas</p>
                    <p className="text-[10px] text-muted-foreground">{goalsAchieved}/{goalsTotal} metas atingidas</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {(goals || []).slice(0, 4).map((g, i) => {
                        const pct = g.target_value > 0 ? Math.min(Math.round((g.current_value / g.target_value) * 100), 100) : 0;
                        return (
                          <motion.div
                            key={g.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                          >
                            <Badge variant="outline" className={`text-[9px] gap-1 ${pct >= 100 ? 'border-emerald-500/50 text-emerald-400' : ''}`}>
                              {g.title}: {pct}%
                            </Badge>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Charts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <Card className="glass-card p-4">
                <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Status</h5>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" animationDuration={1200} animationBegin={300}>
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {statusData.map((s, i) => (
                    <span key={s.key} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {s.name} ({s.value})
                    </span>
                  ))}
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
              <Card className="glass-card p-4">
                <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Formatos</h5>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} animationDuration={1000} animationBegin={500} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Pillar distribution */}
          {pillarData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Card className="glass-card p-4">
                <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Pilares</h5>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pillarData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis hide />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1000} animationBegin={600}>
                        {pillarData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Content Completeness */}
        <TabsContent value="content" className="space-y-4 mt-3">
          <Card className="glass-card p-4">
            <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Completude</h5>
            <div className="space-y-3">
              {contentMetrics.map((m, i) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-foreground font-medium">{m.name}</span>
                    <span className="text-muted-foreground">{m.count}/{posts.length} ({m.pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${m.pct >= 80 ? 'bg-emerald-500' : m.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${m.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </motion.div>
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
                {posts.map((p, i) => {
                  const fmt = FORMATS.find(f => f.key === p.format);
                  const st = POST_STATUSES.find(s => s.key === p.status);
                  return (
                    <motion.tr
                      key={p.id}
                      className="border-b border-border/10 hover:bg-muted/10 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <td className="py-1.5 text-foreground max-w-[200px] truncate">{p.title}</td>
                      <td className="py-1.5 text-center"><Badge variant="outline" className="text-[9px]">{fmt?.label || p.format}</Badge></td>
                      <td className="py-1.5 text-center"><Badge className={`${st?.color} text-[9px]`}>{st?.label}</Badge></td>
                      <td className="py-1.5 text-center">{p.hook ? '✅' : '—'}</td>
                      <td className="py-1.5 text-center">{p.script ? '✅' : '—'}</td>
                      <td className="py-1.5 text-center">{(p.caption_short || p.caption_long) ? '✅' : '—'}</td>
                      <td className="py-1.5 text-center">{p.ai_generated ? <Zap className="w-3 h-3 text-primary mx-auto" /> : '—'}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="space-y-4 mt-3">
          {timelineData.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                      <Area type="monotone" dataKey="posts" name="Total" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} animationDuration={1500} />
                      <Area type="monotone" dataKey="published" name="Publicados" stroke="hsl(142,60%,45%)" fill="hsl(142,60%,45%)" fillOpacity={0.15} animationDuration={1500} animationBegin={300} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          ) : (
            <Card className="glass-card p-6 text-center text-xs text-muted-foreground">
              Defina datas de início e fim na campanha para ver a timeline.
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
