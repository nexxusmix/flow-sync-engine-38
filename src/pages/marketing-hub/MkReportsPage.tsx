import { useEffect, useState } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkSectionHeader, MkEmptyState } from "@/components/marketing-hub/mk-ui";
import { useContentAnalytics } from "@/hooks/useContentAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Heart, MessageCircle, Share2, Users, TrendingUp, Loader2, Plus, Target, Calendar, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, startOfWeek, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DEFAULT_WORKSPACE_ID_ID } from "@/constants/workspace";
const COLORS = ["hsl(var(--primary))", "hsl(var(--primary) / 0.7)", "hsl(var(--primary) / 0.5)", "hsl(var(--primary) / 0.3)", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.5, type: "spring" as const, stiffness: 80, damping: 18 },
});

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// Hook: fetch published items for metrics input
function usePublishedItems() {
  return useQuery({
    queryKey: ['published-items-for-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_items')
        .select('id, title, channel, format, pillar, published_at, status')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID)
        .in('status', ['published', 'publicado'])
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

// Hook: fetch all metrics with dates for charts
function useMetricsTimeline() {
  return useQuery({
    queryKey: ['metrics-timeline'],
    queryFn: async () => {
      const { data: metrics, error: metricsErr } = await supabase
        .from('content_metrics')
        .select('content_item_id, views, likes, comments, shares, reach, collected_at, engagement_rate, performance_score')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID)
        .order('collected_at', { ascending: true });
      if (metricsErr) throw metricsErr;

      const { data: items, error: itemsErr } = await supabase
        .from('content_items')
        .select('id, title, channel, format, pillar')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID);
      if (itemsErr) throw itemsErr;

      const itemMap = new Map((items || []).map(i => [i.id, i]));
      return (metrics || []).map(m => ({ ...m, item: itemMap.get(m.content_item_id) }));
    },
  });
}

// Hook: calendar adherence
function useCalendarAdherence() {
  return useQuery({
    queryKey: ['calendar-adherence'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from('content_items')
        .select('id, status, scheduled_at, published_at, due_at')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID)
        .gte('created_at', thirtyDaysAgo);
      if (error) throw error;
      const items = data || [];
      const scheduled = items.filter(i => i.scheduled_at);
      const publishedOnTime = items.filter(i => {
        if (i.status !== 'published' || !i.published_at) return false;
        if (!i.scheduled_at && !i.due_at) return true;
        const target = i.scheduled_at || i.due_at;
        if (!target) return true;
        return new Date(i.published_at) <= new Date(new Date(target).getTime() + 86400000);
      });
      const overdue = items.filter(i =>
        i.due_at && new Date(i.due_at) < new Date() &&
        !['published', 'archived'].includes(i.status || '')
      );
      return {
        total: items.length,
        scheduled: scheduled.length,
        publishedOnTime: publishedOnTime.length,
        overdue: overdue.length,
        adherenceRate: scheduled.length > 0
          ? Math.round((publishedOnTime.length / scheduled.length) * 100)
          : 0,
      };
    },
  });
}

export default function MkReportsPage() {
  const { data: kpis, isLoading: kpisLoading } = useContentAnalytics();
  const { data: published } = usePublishedItems();
  const { data: timeline } = useMetricsTimeline();
  const { data: adherence } = useCalendarAdherence();
  const queryClient = useQueryClient();
  const [inputOpen, setInputOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [metricsForm, setMetricsForm] = useState({ views: "", likes: "", comments: "", shares: "", reach: "" });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useUrlState("tab", "overview");

  const handleSaveMetrics = async () => {
    if (!selectedItem) { toast.error("Selecione um conteúdo"); return; }
    setSaving(true);
    try {
      const views = parseInt(metricsForm.views) || 0;
      const likes = parseInt(metricsForm.likes) || 0;
      const comments = parseInt(metricsForm.comments) || 0;
      const shares = parseInt(metricsForm.shares) || 0;
      const reach = parseInt(metricsForm.reach) || 0;
      const engagementRate = reach > 0 ? ((likes + comments + shares) / reach) * 100 : 0;
      const performanceScore = Math.min(100, Math.round(
        (Math.min(reach, 10000) / 100) + (engagementRate * 5) + (shares * 2)
      ));

      const { error } = await supabase.from('content_metrics').insert({
        content_item_id: selectedItem,
        workspace_id: DEFAULT_WORKSPACE_ID,
        views, likes, comments, shares, reach,
        engagement_rate: engagementRate,
        performance_score: performanceScore,
        collected_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Métricas registradas!");
      setInputOpen(false);
      setMetricsForm({ views: "", likes: "", comments: "", shares: "", reach: "" });
      setSelectedItem("");
      queryClient.invalidateQueries({ queryKey: ['content-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['metrics-timeline'] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar métricas");
    } finally {
      setSaving(false);
    }
  };

  // Aggregate timeline data by week
  const weeklyData = (() => {
    if (!timeline || timeline.length === 0) return [];
    const byWeek = new Map<string, { views: number; likes: number; comments: number; shares: number; reach: number; label: string }>();
    for (const m of timeline) {
      const d = parseISO(m.collected_at);
      const weekStart = startOfWeek(d, { weekStartsOn: 1 });
      const key = format(weekStart, 'yyyy-MM-dd');
      const existing = byWeek.get(key) || { views: 0, likes: 0, comments: 0, shares: 0, reach: 0, label: format(weekStart, 'dd/MM', { locale: ptBR }) };
      existing.views += m.views || 0;
      existing.likes += m.likes || 0;
      existing.comments += m.comments || 0;
      existing.shares += m.shares || 0;
      existing.reach += m.reach || 0;
      byWeek.set(key, existing);
    }
    return Array.from(byWeek.values());
  })();

  // Format breakdown
  const formatBreakdown = (() => {
    if (!timeline || timeline.length === 0) return [];
    const byFormat = new Map<string, { reach: number; likes: number; engagement: number; count: number }>();
    for (const m of timeline) {
      const fmt = m.item?.format || 'outro';
      const existing = byFormat.get(fmt) || { reach: 0, likes: 0, engagement: 0, count: 0 };
      existing.reach += m.reach || 0;
      existing.likes += m.likes || 0;
      existing.count += 1;
      byFormat.set(fmt, existing);
    }
    return Array.from(byFormat.entries()).map(([fmt, d]) => ({
      format: fmt,
      reach: d.reach,
      likes: d.likes,
      engagement: d.reach > 0 ? +((d.likes / d.reach) * 100).toFixed(1) : 0,
      count: d.count,
    })).sort((a, b) => b.reach - a.reach);
  })();

  // Pillar breakdown for radar
  const pillarRadar = (() => {
    if (!timeline || timeline.length === 0) return [];
    const byPillar = new Map<string, { reach: number; count: number }>();
    for (const m of timeline) {
      const pillar = m.item?.pillar || 'outro';
      const existing = byPillar.get(pillar) || { reach: 0, count: 0 };
      existing.reach += m.reach || 0;
      existing.count += 1;
      byPillar.set(pillar, existing);
    }
    return Array.from(byPillar.entries()).map(([p, d]) => ({
      pillar: p.replace('_', ' '),
      reach: d.reach,
      count: d.count,
    }));
  })();

  // Top performing content
  const topContent = (() => {
    if (!timeline || timeline.length === 0) return [];
    const byItem = new Map<string, { title: string; channel: string; format: string; views: number; likes: number; reach: number; score: number }>();
    for (const m of timeline) {
      if (!m.item) continue;
      const existing = byItem.get(m.content_item_id);
      if (!existing || (m.reach || 0) > existing.reach) {
        const reach = m.reach || 0;
        const likes = m.likes || 0;
        const eng = reach > 0 ? (likes / reach) * 100 : 0;
        byItem.set(m.content_item_id, {
          title: m.item.title,
          channel: m.item.channel || 'outro',
          format: m.item.format || '-',
          views: m.views || 0,
          likes,
          reach,
          score: m.performance_score || Math.min(100, Math.round(reach / 100 + eng * 5)),
        });
      }
    }
    return Array.from(byItem.values()).sort((a, b) => b.score - a.score).slice(0, 8);
  })();

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12,
    color: "hsl(var(--foreground))",
    fontSize: 11,
  };

  return (
    <MkAppShell title="Analytics Conteúdo" sectionCode="09" sectionLabel="Content_Analytics">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/20 border border-border/30">
            <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
            <TabsTrigger value="formats" className="text-xs">Por Formato</TabsTrigger>
            <TabsTrigger value="ranking" className="text-xs">Ranking</TabsTrigger>
          </TabsList>
        </Tabs>
        <button onClick={() => setInputOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">
          <Plus className="w-4 h-4" />
          Registrar Métricas
        </button>
      </div>

      {kpisLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* KPI Summary — always visible */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: "Alcance Total", value: formatNum(kpis?.totalReach || 0), icon: Users },
              { label: "Visualizações", value: formatNum(kpis?.totalViews || 0), icon: Eye },
              { label: "Engajamento", value: `${(kpis?.engagementRate || 0).toFixed(1)}%`, icon: TrendingUp },
              { label: "Publicados/Mês", value: String(kpis?.publishedThisMonth || 0), icon: CheckCircle },
              { label: "Atrasados", value: String(kpis?.overdueCount || 0), icon: AlertTriangle, alert: (kpis?.overdueCount || 0) > 0 },
              { label: "Aderência", value: `${adherence?.adherenceRate || 0}%`, icon: Target },
            ].map((m, i) => (
              <motion.div key={m.label} {...fadeUp(0.05 + i * 0.03)} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className={cn("w-3.5 h-3.5", m.alert ? "text-destructive" : "text-primary")} />
                  <span className="text-[9px] text-muted-foreground uppercase tracking-[0.1em]">{m.label}</span>
                </div>
                <p className={cn("text-xl font-light", m.alert ? "text-destructive" : "text-foreground")}>{m.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Weekly reach */}
              <motion.div {...fadeUp(0.2)}>
                <MkCard>
                  <MkSectionHeader title="Alcance Semanal" />
                  {weeklyData.length > 0 ? (
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyData}>
                          <defs>
                            <linearGradient id="reachGrad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                          <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "hsl(var(--muted-foreground) / 0.5)", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Area type="monotone" dataKey="reach" name="Alcance" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#reachGrad2)" />
                          <Area type="monotone" dataKey="views" name="Views" stroke="hsl(var(--primary) / 0.5)" fillOpacity={0} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground/40 text-center py-10">Sem dados de métricas</p>
                  )}
                </MkCard>
              </motion.div>

              {/* Engagement bar */}
              <motion.div {...fadeUp(0.25)}>
                <MkCard>
                  <MkSectionHeader title="Engajamento Semanal" />
                  {weeklyData.length > 0 ? (
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                          <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "hsl(var(--muted-foreground) / 0.5)", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="likes" name="Curtidas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="comments" name="Comentários" fill="hsl(var(--primary) / 0.6)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="shares" name="Shares" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground/40 text-center py-10">Sem dados</p>
                  )}
                </MkCard>
              </motion.div>

              {/* Calendar adherence */}
              <motion.div {...fadeUp(0.3)}>
                <MkCard>
                  <MkSectionHeader title="Saúde do Calendário (30 dias)" />
                  {adherence ? (
                    <div className="space-y-4 mt-2">
                      {[
                        { label: "Total de conteúdos", value: adherence.total, icon: Calendar },
                        { label: "Agendados", value: adherence.scheduled, icon: Target },
                        { label: "Publicados no prazo", value: adherence.publishedOnTime, icon: CheckCircle },
                        { label: "Atrasados", value: adherence.overdue, icon: AlertTriangle, alert: adherence.overdue > 0 },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                          <div className="flex items-center gap-2">
                            <row.icon className={cn("w-3.5 h-3.5", row.alert ? "text-destructive" : "text-muted-foreground")} />
                            <span className="text-xs text-foreground/70">{row.label}</span>
                          </div>
                          <span className={cn("text-sm font-medium", row.alert ? "text-destructive" : "text-foreground")}>{row.value}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-medium text-foreground/80">Taxa de aderência</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-muted/30 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", adherence.adherenceRate >= 70 ? "bg-primary" : "bg-destructive")}
                              style={{ width: `${adherence.adherenceRate}%` }}
                            />
                          </div>
                          <span className={cn("text-sm font-bold", adherence.adherenceRate >= 70 ? "text-primary" : "text-destructive")}>
                            {adherence.adherenceRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground/40 text-center py-10">Calculando...</p>
                  )}
                </MkCard>
              </motion.div>

              {/* Pillar radar */}
              <motion.div {...fadeUp(0.35)}>
                <MkCard>
                  <MkSectionHeader title="Distribuição por Pilar" />
                  {pillarRadar.length > 0 ? (
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={pillarRadar}>
                          <PolarGrid stroke="hsl(var(--border) / 0.3)" />
                          <PolarAngleAxis dataKey="pillar" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                          <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground) / 0.3)", fontSize: 9 }} />
                          <Radar name="Alcance" dataKey="reach" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground/40 text-center py-10">Sem dados por pilar</p>
                  )}
                </MkCard>
              </motion.div>
            </div>
          )}

          {activeTab === "formats" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <motion.div {...fadeUp(0.1)}>
                <MkCard>
                  <MkSectionHeader title="Performance por Formato" />
                  {formatBreakdown.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={formatBreakdown} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                          <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground) / 0.5)", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis dataKey="format" type="category" tick={{ fill: "hsl(var(--foreground) / 0.6)", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="reach" name="Alcance" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="likes" name="Curtidas" fill="hsl(var(--primary) / 0.5)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground/40 text-center py-10">Sem dados por formato</p>
                  )}
                </MkCard>
              </motion.div>

              <motion.div {...fadeUp(0.15)}>
                <MkCard>
                  <MkSectionHeader title="Engajamento por Formato" />
                  {formatBreakdown.length > 0 ? (
                    <div className="space-y-3 mt-2">
                      {formatBreakdown.map((f, i) => (
                        <div key={f.format} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                          <span className="text-xs font-medium text-foreground/70 w-20 capitalize">{f.format}</span>
                          <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${Math.min(f.engagement * 5, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-primary w-14 text-right">{f.engagement}%</span>
                          <span className="text-[10px] text-muted-foreground w-12 text-right">{f.count} posts</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground/40 text-center py-10">Sem dados</p>
                  )}
                </MkCard>
              </motion.div>
            </div>
          )}

          {activeTab === "ranking" && (
            <motion.div {...fadeUp(0.1)}>
              <MkCard>
                <MkSectionHeader title="Top Conteúdos por Performance Score" />
                {topContent.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {topContent.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 py-3 border-b border-border/20 last:border-0">
                        <span className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                          i === 0 ? "bg-primary/20 text-primary" :
                          i === 1 ? "bg-primary/10 text-primary/70" :
                          "bg-muted/20 text-muted-foreground"
                        )}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground/80 truncate">{item.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span className="uppercase">{item.channel}</span>
                            <span>•</span>
                            <span className="capitalize">{item.format}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{formatNum(item.reach)}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNum(item.likes)}</span>
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm font-bold text-primary">{item.score}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground/40 text-center py-10">Nenhum conteúdo com métricas</p>
                )}
              </MkCard>
            </motion.div>
          )}
        </>
      )}

      {/* Metrics Input Dialog */}
      <Dialog open={inputOpen} onOpenChange={setInputOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Registrar Métricas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-muted-foreground text-xs">Conteúdo Publicado *</Label>
              <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}
                className="w-full mt-1 py-2.5 px-3 rounded-lg bg-muted/20 border border-border text-sm text-foreground/70 focus:outline-none">
                <option value="">Selecionar conteúdo...</option>
                {(published || []).map(item => (
                  <option key={item.id} value={item.id}>
                    {item.title} {item.published_at ? `(${format(parseISO(item.published_at), 'dd/MM/yy')})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "views", label: "Views", icon: Eye },
                { key: "likes", label: "Curtidas", icon: Heart },
                { key: "comments", label: "Comentários", icon: MessageCircle },
                { key: "shares", label: "Compartilhamentos", icon: Share2 },
                { key: "reach", label: "Alcance", icon: Users },
              ].map(f => (
                <div key={f.key}>
                  <Label className="text-muted-foreground text-xs flex items-center gap-1">
                    <f.icon className="w-3 h-3" /> {f.label}
                  </Label>
                  <Input type="number" min={0}
                    value={(metricsForm as any)[f.key]}
                    onChange={e => setMetricsForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="mt-1 bg-muted/20 border-border text-foreground h-9 text-xs"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setInputOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted/10 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveMetrics} disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar Métricas"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MkAppShell>
  );
}
