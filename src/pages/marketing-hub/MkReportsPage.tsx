import { useEffect, useState } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkSectionHeader, MkEmptyState } from "@/components/marketing-hub/mk-ui";
import { useContentAnalytics } from "@/hooks/useContentAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area
} from "recharts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Heart, MessageCircle, Share2, Users, TrendingUp, Loader2, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parseISO, subDays, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const DEFAULT_WORKSPACE = "00000000-0000-0000-0000-000000000000";
const COLORS = ["hsl(210,100%,55%)", "hsl(170,70%,50%)", "hsl(280,70%,55%)", "hsl(40,90%,55%)", "hsl(0,70%,55%)", "hsl(200,70%,55%)"];

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
        .select('id, title, channel, published_at, status')
        .eq('workspace_id', DEFAULT_WORKSPACE)
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
        .select('content_item_id, views, likes, comments, shares, reach, collected_at')
        .eq('workspace_id', DEFAULT_WORKSPACE)
        .order('collected_at', { ascending: true });
      if (metricsErr) throw metricsErr;

      const { data: items, error: itemsErr } = await supabase
        .from('content_items')
        .select('id, title, channel')
        .eq('workspace_id', DEFAULT_WORKSPACE);
      if (itemsErr) throw itemsErr;

      const itemMap = new Map((items || []).map(i => [i.id, i]));

      return (metrics || []).map(m => ({
        ...m,
        item: itemMap.get(m.content_item_id),
      }));
    },
  });
}

export default function MkReportsPage() {
  const { data: kpis, isLoading: kpisLoading } = useContentAnalytics();
  const { data: published } = usePublishedItems();
  const { data: timeline } = useMetricsTimeline();
  const queryClient = useQueryClient();
  const [inputOpen, setInputOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [metricsForm, setMetricsForm] = useState({ views: "", likes: "", comments: "", shares: "", reach: "" });
  const [saving, setSaving] = useState(false);

  const handleSaveMetrics = async () => {
    if (!selectedItem) { toast.error("Selecione um conteúdo"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('content_metrics').insert({
        content_item_id: selectedItem,
        workspace_id: DEFAULT_WORKSPACE,
        views: parseInt(metricsForm.views) || 0,
        likes: parseInt(metricsForm.likes) || 0,
        comments: parseInt(metricsForm.comments) || 0,
        shares: parseInt(metricsForm.shares) || 0,
        reach: parseInt(metricsForm.reach) || 0,
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

  // Aggregate timeline data by week for chart
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

  // Channel performance data
  const channelPerformance = (() => {
    if (!timeline || timeline.length === 0) return [];
    const byChannel = new Map<string, { views: number; likes: number; reach: number; count: number }>();
    for (const m of timeline) {
      const ch = m.item?.channel || 'outro';
      const existing = byChannel.get(ch) || { views: 0, likes: 0, reach: 0, count: 0 };
      existing.views += m.views || 0;
      existing.likes += m.likes || 0;
      existing.reach += m.reach || 0;
      existing.count += 1;
      byChannel.set(ch, existing);
    }
    return Array.from(byChannel.entries()).map(([channel, data]) => ({
      channel,
      ...data,
      engagement: data.reach > 0 ? ((data.likes / data.reach) * 100).toFixed(1) : '0',
    })).sort((a, b) => b.reach - a.reach);
  })();

  // Top performing content
  const topContent = (() => {
    if (!timeline || timeline.length === 0) return [];
    const byItem = new Map<string, { title: string; channel: string; views: number; likes: number; reach: number }>();
    for (const m of timeline) {
      if (!m.item) continue;
      const existing = byItem.get(m.content_item_id);
      if (!existing || (m.views || 0) > existing.views) {
        byItem.set(m.content_item_id, {
          title: m.item.title,
          channel: m.item.channel || 'outro',
          views: m.views || 0,
          likes: m.likes || 0,
          reach: m.reach || 0,
        });
      }
    }
    return Array.from(byItem.values()).sort((a, b) => b.reach - a.reach).slice(0, 5);
  })();

  const tooltipStyle = { background: "#111114", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff" };

  return (
    <MkAppShell title="Analytics">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Analytics de Conteúdo</h1>
          <p className="text-sm text-white/30 mt-1">Performance e métricas dos posts publicados</p>
        </div>
        <button onClick={() => setInputOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(210,100%,55%)] text-white text-sm font-medium hover:bg-[hsl(210,100%,50%)] transition-colors shrink-0">
          <Plus className="w-4 h-4" />
          Registrar Métricas
        </button>
      </div>

      {kpisLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[hsl(210,100%,55%)]" />
        </div>
      ) : (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Alcance Total", value: formatNum(kpis?.totalReach || 0), icon: Users },
              { label: "Visualizações", value: formatNum(kpis?.totalViews || 0), icon: Eye },
              { label: "Curtidas", value: formatNum(kpis?.totalLikes || 0), icon: Heart },
              { label: "Comentários", value: formatNum(kpis?.totalComments || 0), icon: MessageCircle },
              { label: "Engajamento", value: `${(kpis?.engagementRate || 0).toFixed(1)}%`, icon: TrendingUp },
            ].map((m, i) => (
              <motion.div key={m.label} {...fadeUp(0.1 + i * 0.05)} className="holographic-card rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <m.icon className="w-4 h-4 text-[hsl(195,100%,50%)]" />
                  <span className="text-[10px] text-white/25 uppercase tracking-[0.12em]">{m.label}</span>
                </div>
                <p className="text-2xl font-light text-white data-glow">{m.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Timeline chart */}
            <motion.div {...fadeUp(0.3)}>
              <MkCard>
                <MkSectionHeader title="Performance Semanal" />
                {weeklyData.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData}>
                        <defs>
                          <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(210,100%,55%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(210,100%,55%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(170,70%,50%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(170,70%,50%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
                        <Area type="monotone" dataKey="reach" name="Alcance" stroke="hsl(210,100%,55%)" fillOpacity={1} fill="url(#reachGrad)" />
                        <Area type="monotone" dataKey="views" name="Views" stroke="hsl(170,70%,50%)" fillOpacity={1} fill="url(#viewsGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-white/20 text-center py-10">Sem dados de métricas ainda</p>
                )}
              </MkCard>
            </motion.div>

            {/* Engagement by week */}
            <motion.div {...fadeUp(0.35)}>
              <MkCard>
                <MkSectionHeader title="Engajamento Semanal" />
                {weeklyData.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
                        <Bar dataKey="likes" name="Curtidas" fill="hsl(0,70%,55%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="comments" name="Comentários" fill="hsl(40,90%,55%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="shares" name="Shares" fill="hsl(280,70%,55%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-white/20 text-center py-10">Sem dados de engajamento</p>
                )}
              </MkCard>
            </motion.div>

            {/* Channel performance */}
            <motion.div {...fadeUp(0.4)}>
              <MkCard>
                <MkSectionHeader title="Performance por Canal" />
                {channelPerformance.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={channelPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="channel" type="category" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
                        <Bar dataKey="reach" name="Alcance" fill="hsl(210,100%,55%)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="likes" name="Curtidas" fill="hsl(170,70%,50%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-white/20 text-center py-10">Sem dados por canal</p>
                )}
              </MkCard>
            </motion.div>

            {/* Top content table */}
            <motion.div {...fadeUp(0.45)}>
              <MkCard>
                <MkSectionHeader title="Top Conteúdos" />
                {topContent.length > 0 ? (
                  <div className="space-y-3">
                    {topContent.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/70 truncate">{item.title}</p>
                          <p className="text-[10px] text-white/25 uppercase">{item.channel}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-white/50 shrink-0">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNum(item.views)}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNum(item.likes)}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{formatNum(item.reach)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/20 text-center py-10">Nenhum conteúdo com métricas</p>
                )}
              </MkCard>
            </motion.div>
          </div>
        </>
      )}

      {/* Metrics Input Dialog */}
      <Dialog open={inputOpen} onOpenChange={setInputOpen}>
        <DialogContent className="bg-[#111114] border-white/[0.08] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white/90">Registrar Métricas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white/50 text-xs">Conteúdo Publicado *</Label>
              <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}
                className="w-full mt-1 py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 focus:outline-none">
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
                  <Label className="text-white/50 text-xs flex items-center gap-1">
                    <f.icon className="w-3 h-3" /> {f.label}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={metricsForm[f.key as keyof typeof metricsForm]}
                    onChange={e => setMetricsForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.08] text-white mt-1"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <button onClick={handleSaveMetrics} disabled={saving}
              className="w-full py-2.5 rounded-xl bg-[hsl(210,100%,55%)] text-white text-sm font-medium hover:bg-[hsl(210,100%,50%)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar Métricas
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </MkAppShell>
  );
}
