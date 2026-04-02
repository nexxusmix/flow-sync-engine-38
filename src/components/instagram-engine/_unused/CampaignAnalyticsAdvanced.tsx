import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InstagramPost, POST_STATUSES, FORMATS, PILLARS, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, Cell, AreaChart, Area, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis } from 'recharts';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Clock, BarChart3, Activity, Eye, Zap } from 'lucide-react';
import { format, getDay, getHours, parseISO, differenceInDays, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}h`);
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const HEAT_COLORS = [
  'hsl(var(--muted) / 0.15)',
  'hsl(210, 80%, 50% / 0.2)',
  'hsl(210, 80%, 50% / 0.4)',
  'hsl(210, 80%, 50% / 0.6)',
  'hsl(210, 80%, 50% / 0.8)',
  'hsl(210, 80%, 50%)',
];

function getHeatColor(value: number, max: number): string {
  if (max === 0) return HEAT_COLORS[0];
  const idx = Math.min(Math.floor((value / max) * 5), 5);
  return HEAT_COLORS[idx];
}

// Animated counter
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  return <span>{value.toLocaleString('pt-BR')}{suffix}</span>;
}

export function CampaignAnalyticsAdvanced({ campaign, posts }: Props) {
  const [activeTab, setActiveTab] = useState('heatmap');

  // Heatmap: posts by day of week x hour
  const heatmapData = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    posts.forEach(p => {
      const date = p.scheduled_at || p.created_at;
      if (!date) return;
      const d = new Date(date);
      const day = getDay(d);
      const hour = getHours(d);
      grid[day][hour]++;
      if (grid[day][hour] > max) max = grid[day][hour];
    });
    return { grid, max };
  }, [posts]);

  // Format performance radar
  const radarData = useMemo(() => {
    return FORMATS.map(fmt => {
      const fmtPosts = posts.filter(p => p.format === fmt.key);
      const total = fmtPosts.length;
      const published = fmtPosts.filter(p => p.status === 'published').length;
      const withHook = fmtPosts.filter(p => p.hook).length;
      const aiGen = fmtPosts.filter(p => p.ai_generated).length;
      return {
        format: fmt.label,
        total,
        published,
        completion: total > 0 ? Math.round((published / total) * 100) : 0,
        hookRate: total > 0 ? Math.round((withHook / total) * 100) : 0,
        aiRate: total > 0 ? Math.round((aiGen / total) * 100) : 0,
      };
    }).filter(d => d.total > 0);
  }, [posts]);

  // Pillar performance breakdown
  const pillarPerf = useMemo(() => {
    return PILLARS.map(pl => {
      const plPosts = posts.filter(p => p.pillar === pl.key);
      const total = plPosts.length;
      const published = plPosts.filter(p => p.status === 'published').length;
      const ready = plPosts.filter(p => p.status === 'ready').length;
      const withContent = plPosts.filter(p => p.hook && (p.caption_short || p.caption_long)).length;
      return {
        name: pl.label,
        color: pl.color,
        total,
        published,
        ready,
        contentRate: total > 0 ? Math.round((withContent / total) * 100) : 0,
        completionRate: total > 0 ? Math.round((published / total) * 100) : 0,
      };
    }).filter(d => d.total > 0);
  }, [posts]);

  // Content velocity: posts created per day over campaign duration
  const velocityData = useMemo(() => {
    if (!campaign.start_date) return [];
    const start = new Date(campaign.start_date);
    const end = campaign.end_date ? new Date(campaign.end_date) : new Date();
    const totalDays = Math.max(differenceInDays(end, start), 1);
    const bucketSize = totalDays > 60 ? 7 : totalDays > 14 ? 3 : 1;
    const buckets: { label: string; created: number; published: number; cumulative: number }[] = [];
    let cumulative = 0;

    for (let i = 0; i < totalDays; i += bucketSize) {
      const bucketStart = addDays(start, i);
      const bucketEnd = addDays(start, Math.min(i + bucketSize, totalDays));
      const created = posts.filter(p => {
        const d = new Date(p.created_at);
        return d >= bucketStart && d < bucketEnd;
      }).length;
      const published = posts.filter(p => {
        if (p.status !== 'published') return false;
        const d = p.published_at ? new Date(p.published_at) : p.scheduled_at ? new Date(p.scheduled_at) : new Date(p.created_at);
        return d >= bucketStart && d < bucketEnd;
      }).length;
      cumulative += created;
      buckets.push({
        label: format(bucketStart, 'dd/MM', { locale: ptBR }),
        created,
        published,
        cumulative,
      });
    }
    return buckets;
  }, [posts, campaign]);

  // Benchmark scores
  const benchmarks = useMemo(() => {
    const total = posts.length || 1;
    const withHook = posts.filter(p => p.hook).length;
    const withScript = posts.filter(p => p.script).length;
    const withCaption = posts.filter(p => p.caption_short || p.caption_long).length;
    const withCta = posts.filter(p => p.cta).length;
    const withHashtags = posts.filter(p => p.hashtags?.length).length;
    const aiGen = posts.filter(p => p.ai_generated).length;
    const published = posts.filter(p => p.status === 'published').length;

    return [
      { label: 'Hook', value: Math.round((withHook / total) * 100), benchmark: 80, icon: <Flame className="w-3.5 h-3.5" /> },
      { label: 'Roteiro', value: Math.round((withScript / total) * 100), benchmark: 70, icon: <BarChart3 className="w-3.5 h-3.5" /> },
      { label: 'Legenda', value: Math.round((withCaption / total) * 100), benchmark: 90, icon: <Activity className="w-3.5 h-3.5" /> },
      { label: 'CTA', value: Math.round((withCta / total) * 100), benchmark: 75, icon: <TrendingUp className="w-3.5 h-3.5" /> },
      { label: 'Hashtags', value: Math.round((withHashtags / total) * 100), benchmark: 85, icon: <Eye className="w-3.5 h-3.5" /> },
      { label: 'IA', value: Math.round((aiGen / total) * 100), benchmark: 60, icon: <Zap className="w-3.5 h-3.5" /> },
      { label: 'Publicação', value: Math.round((published / total) * 100), benchmark: 70, icon: <Clock className="w-3.5 h-3.5" /> },
    ];
  }, [posts]);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/30 h-8">
          <TabsTrigger value="heatmap" className="text-[11px] h-6">Heatmap</TabsTrigger>
          <TabsTrigger value="velocity" className="text-[11px] h-6">Velocidade</TabsTrigger>
          <TabsTrigger value="radar" className="text-[11px] h-6">Radar</TabsTrigger>
          <TabsTrigger value="benchmarks" className="text-[11px] h-6">Benchmarks</TabsTrigger>
        </TabsList>

        {/* HEATMAP */}
        <TabsContent value="heatmap" className="mt-3 space-y-4">
          <Card className="glass-card p-4">
            <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Distribuição de Posts por Dia × Hora</h5>
            <TooltipProvider delayDuration={100}>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Hour header */}
                  <div className="flex gap-px ml-10 mb-px">
                    {HOUR_LABELS.map((h, i) => (
                      <div key={i} className="w-5 text-[7px] text-muted-foreground text-center">{i % 3 === 0 ? h : ''}</div>
                    ))}
                  </div>
                  {/* Grid */}
                  {DAY_LABELS.map((day, di) => (
                    <div key={di} className="flex items-center gap-px mb-px">
                      <span className="w-9 text-[9px] text-muted-foreground text-right pr-1">{day}</span>
                      {heatmapData.grid[di].map((val, hi) => (
                        <Tooltip key={hi}>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: (di * 24 + hi) * 0.003 }}
                              className="w-5 h-5 rounded-sm cursor-pointer hover:ring-1 hover:ring-primary/40 transition-all"
                              style={{ backgroundColor: getHeatColor(val, heatmapData.max) }}
                            />
                          </TooltipTrigger>
                          <TooltipContent className="text-[10px]">
                            <p>{day} às {hi}h</p>
                            <p className="font-semibold">{val} post{val !== 1 ? 's' : ''}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ))}
                  {/* Legend */}
                  <div className="flex items-center gap-2 mt-3 ml-10">
                    <span className="text-[8px] text-muted-foreground">Menos</span>
                    {HEAT_COLORS.map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
                    ))}
                    <span className="text-[8px] text-muted-foreground">Mais</span>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </Card>

          {/* Pillar performance */}
          {pillarPerf.length > 0 && (
            <Card className="glass-card p-4">
              <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Performance por Pilar</h5>
              <div className="space-y-3">
                {pillarPerf.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-[11px] font-medium text-foreground">{p.name}</span>
                        <Badge variant="outline" className="text-[8px]">{p.total} posts</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {p.published} pub · {p.ready} prontos · {p.contentRate}% completo
                      </span>
                    </div>
                    <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: p.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${p.completionRate}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* VELOCITY */}
        <TabsContent value="velocity" className="mt-3">
          <Card className="glass-card p-4">
            <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Velocidade de Produção & Publicação</h5>
            {velocityData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="cumulative" name="Acumulado" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} animationDuration={1500} />
                    <Area type="monotone" dataKey="created" name="Criados" stroke="hsl(210,80%,50%)" fill="hsl(210,80%,50%)" fillOpacity={0.15} animationDuration={1200} />
                    <Area type="monotone" dataKey="published" name="Publicados" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.08} animationDuration={1200} animationBegin={300} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">Defina datas da campanha para ver a velocidade.</p>
            )}
          </Card>
        </TabsContent>

        {/* RADAR */}
        <TabsContent value="radar" className="mt-3">
          <Card className="glass-card p-4">
            <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Radar de Formatos</h5>
            {radarData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" opacity={0.3} />
                    <PolarAngleAxis dataKey="format" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <PolarRadiusAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                    <Radar name="Conclusão %" dataKey="completion" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} animationDuration={1500} />
                    <Radar name="Hook %" dataKey="hookRate" stroke="hsl(210,80%,50%)" fill="hsl(210,80%,50%)" fillOpacity={0.15} animationDuration={1500} animationBegin={300} />
                    <Radar name="IA %" dataKey="aiRate" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} animationDuration={1500} animationBegin={600} />
                    <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">Crie posts com diferentes formatos para ver o radar.</p>
            )}
          </Card>
        </TabsContent>

        {/* BENCHMARKS */}
        <TabsContent value="benchmarks" className="mt-3">
          <Card className="glass-card p-4">
            <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Benchmarks vs. Meta</h5>
            <div className="space-y-4">
              {benchmarks.map((b, i) => {
                const diff = b.value - b.benchmark;
                const isAbove = diff >= 0;
                return (
                  <motion.div
                    key={b.label}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${isAbove ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {b.icon}
                        </span>
                        <span className="text-[11px] font-medium text-foreground">{b.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-foreground">{b.value}%</span>
                        <span className={`text-[9px] font-medium ${isAbove ? 'text-primary' : 'text-muted-foreground'}`}>
                          {isAbove ? '+' : ''}{diff}%
                        </span>
                        <span className="text-[9px] text-muted-foreground">meta: {b.benchmark}%</span>
                      </div>
                    </div>
                    <div className="relative h-3 bg-muted/20 rounded-full overflow-hidden">
                      {/* Benchmark line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-foreground/30 z-10"
                        style={{ left: `${b.benchmark}%` }}
                      />
                      <motion.div
                        className={`h-full rounded-full ${isAbove ? 'bg-primary' : 'bg-muted-foreground'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(b.value, 100)}%` }}
                        transition={{ duration: 1, delay: 0.2 + i * 0.06 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
