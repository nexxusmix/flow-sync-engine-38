/**
 * MkInstagramPage — Instagram Integration Hub
 * Feed preview, metrics dashboard, publishing queue, best-time suggestions
 * Premium holographic UI matching Marketing Hub design system
 */
import { useState, useMemo } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Instagram, Heart, MessageCircle, Eye, Send, TrendingUp, TrendingDown,
  Clock, Sparkles, BarChart3, Grid3X3, Calendar, Users, Bookmark,
  Share2, Play, Image as ImageIcon, ChevronRight, ExternalLink,
  Zap, ArrowUpRight, RefreshCw, Plus, CheckCircle2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

type TabView = "feed" | "metrics" | "publish" | "schedule";

// ── Mock Data ────────────────────────────────────────
const MOCK_PROFILE = {
  username: "squadfilme",
  name: "Squad Filme",
  bio: "Produtora audiovisual 🎬 | Conteúdo que converte",
  avatar: null,
  followers: 12847,
  following: 892,
  posts: 347,
  engagement_rate: 4.7,
  reach_avg: 8420,
  growth_7d: 2.3,
};

const MOCK_POSTS = Array.from({ length: 12 }, (_, i) => ({
  id: `post-${i}`,
  type: i % 4 === 0 ? "VIDEO" : i % 3 === 0 ? "CAROUSEL_ALBUM" : "IMAGE",
  thumbnail: `https://picsum.photos/seed/${i + 100}/400/400`,
  caption: [
    "🎬 Bastidores da produção do novo reels...",
    "✨ Dica de edição: use transições sutis...",
    "🚀 Case de sucesso: +300% de engajamento...",
    "📸 Nova campanha para @marca_parceira",
    "💡 3 hooks que funcionam no Instagram",
    "🎯 Como criar conteúdo que converte",
  ][i % 6],
  likes: Math.floor(Math.random() * 1200) + 200,
  comments: Math.floor(Math.random() * 80) + 10,
  reach: Math.floor(Math.random() * 8000) + 2000,
  saves: Math.floor(Math.random() * 150) + 20,
  shares: Math.floor(Math.random() * 60) + 5,
  timestamp: subDays(new Date(), i * 2).toISOString(),
  engagement: (Math.random() * 6 + 2).toFixed(1),
}));

const MOCK_METRICS_WEEKLY = [
  { day: "Seg", reach: 3200, impressions: 5100, engagement: 4.2 },
  { day: "Ter", reach: 4100, impressions: 6800, engagement: 5.1 },
  { day: "Qua", reach: 2800, impressions: 4200, engagement: 3.8 },
  { day: "Qui", reach: 5200, impressions: 8400, engagement: 6.2 },
  { day: "Sex", reach: 6100, impressions: 9800, engagement: 5.7 },
  { day: "Sáb", reach: 4800, impressions: 7600, engagement: 4.9 },
  { day: "Dom", reach: 3600, impressions: 5900, engagement: 4.1 },
];

const BEST_TIMES = [
  { hour: "09:00", score: 72, label: "Bom" },
  { hour: "12:00", score: 91, label: "Ótimo" },
  { hour: "15:00", score: 65, label: "Médio" },
  { hour: "18:00", score: 88, label: "Ótimo" },
  { hour: "21:00", score: 95, label: "Melhor" },
];

const MOCK_QUEUE = [
  { id: "q1", title: "Reel: Bastidores da gravação", type: "VIDEO", scheduledAt: "2026-02-28T18:00:00", status: "scheduled" },
  { id: "q2", title: "Carrossel: 5 dicas de edição", type: "CAROUSEL", scheduledAt: "2026-03-01T12:00:00", status: "scheduled" },
  { id: "q3", title: "Post: Case de sucesso", type: "IMAGE", scheduledAt: "2026-03-02T21:00:00", status: "draft" },
];

export default function MkInstagramPage() {
  const [tab, setTab] = useState<TabView>("feed");
  const [selectedPost, setSelectedPost] = useState<typeof MOCK_POSTS[0] | null>(null);
  const [isConnected] = useState(true); // Simulated connected state

  const tabs: { key: TabView; label: string; icon: typeof Grid3X3 }[] = [
    { key: "feed", label: "Feed Preview", icon: Grid3X3 },
    { key: "metrics", label: "Métricas", icon: BarChart3 },
    { key: "publish", label: "Publicar", icon: Send },
    { key: "schedule", label: "Agendados", icon: Calendar },
  ];

  return (
    <MkAppShell title="Instagram" sectionCode="IG" sectionLabel="Instagram Integration">
      {/* Profile Header */}
      <motion.div
        className="rounded-2xl border border-[rgba(0,156,202,0.12)] bg-[rgba(0,156,202,0.02)] backdrop-blur-xl p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] p-[2px]">
              <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
                <Instagram className="w-8 h-8 text-white/60" />
              </div>
            </div>
            <motion.div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-[#0a0a0f] flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </motion.div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-semibold text-white/90">@{MOCK_PROFILE.username}</h2>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 uppercase tracking-[0.12em] font-medium">
                Conectado
              </span>
            </div>
            <p className="text-sm text-white/40 mb-3">{MOCK_PROFILE.bio}</p>
            <div className="flex gap-6">
              <ProfileStat value={MOCK_PROFILE.posts} label="Posts" />
              <ProfileStat value={MOCK_PROFILE.followers} label="Seguidores" />
              <ProfileStat value={MOCK_PROFILE.following} label="Seguindo" />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3">
            <QuickMetric
              icon={TrendingUp}
              value={`${MOCK_PROFILE.engagement_rate}%`}
              label="Engajamento"
              trend="up"
            />
            <QuickMetric
              icon={Eye}
              value={`${(MOCK_PROFILE.reach_avg / 1000).toFixed(1)}k`}
              label="Alcance médio"
              trend="up"
            />
            <QuickMetric
              icon={Users}
              value={`+${MOCK_PROFILE.growth_7d}%`}
              label="Crescimento 7d"
              trend="up"
            />
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 border-b border-white/[0.06] pb-px">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-medium tracking-wide transition-all duration-200 border-b-2 -mb-px",
                tab === t.key
                  ? "text-[hsl(195,100%,55%)] border-[hsl(195,100%,50%)]"
                  : "text-white/30 border-transparent hover:text-white/50 hover:border-white/10"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "feed" && <FeedView posts={MOCK_POSTS} onSelectPost={setSelectedPost} />}
          {tab === "metrics" && <MetricsView />}
          {tab === "publish" && <PublishView />}
          {tab === "schedule" && <ScheduleView />}
        </motion.div>
      </AnimatePresence>

      {/* Post Detail Dialog */}
      <PostDetailDialog post={selectedPost} onClose={() => setSelectedPost(null)} />
    </MkAppShell>
  );
}

// ── Profile Stat ─────────────────────
function ProfileStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <span className="text-sm font-semibold text-white/80">{value.toLocaleString("pt-BR")}</span>
      <span className="text-[10px] text-white/30 block">{label}</span>
    </div>
  );
}

// ── Quick Metric Card ─────────────────────
function QuickMetric({ icon: Icon, value, label, trend }: { icon: any; value: string; label: string; trend: "up" | "down" }) {
  return (
    <motion.div
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 min-w-[110px]"
      whileHover={{ scale: 1.03, borderColor: "rgba(0,156,202,0.2)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-[hsl(195,100%,50%)]" />
        {trend === "up" ? (
          <ArrowUpRight className="w-3 h-3 text-emerald-400" />
        ) : (
          <TrendingDown className="w-3 h-3 text-red-400" />
        )}
      </div>
      <span className="text-lg font-bold text-white/90 block">{value}</span>
      <span className="text-[9px] text-white/25 uppercase tracking-[0.1em]">{label}</span>
    </motion.div>
  );
}

// ── Feed View ─────────────────────
function FeedView({ posts, onSelectPost }: { posts: typeof MOCK_POSTS; onSelectPost: (p: typeof MOCK_POSTS[0]) => void }) {
  return (
    <div>
      {/* Feed Grid - Instagram style 3 column */}
      <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            className="aspect-square relative group cursor-pointer overflow-hidden"
            onClick={() => onSelectPost(post)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <img
              src={post.thumbnail}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />

            {/* Type badge */}
            {post.type !== "IMAGE" && (
              <div className="absolute top-2 right-2 z-10">
                {post.type === "VIDEO" ? (
                  <Play className="w-5 h-5 text-white drop-shadow-lg" />
                ) : (
                  <Grid3X3 className="w-4 h-4 text-white drop-shadow-lg" />
                )}
              </div>
            )}

            {/* Hover overlay */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <div className="flex items-center gap-1.5 text-white">
                <Heart className="w-5 h-5 fill-white" />
                <span className="text-sm font-semibold">{post.likes.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white">
                <MessageCircle className="w-5 h-5 fill-white" />
                <span className="text-sm font-semibold">{post.comments}</span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Feed stats footer */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Alcance Total", value: "84.2k", icon: Eye, change: "+12%" },
          { label: "Curtidas", value: "6.8k", icon: Heart, change: "+8%" },
          { label: "Salvamentos", value: "1.2k", icon: Bookmark, change: "+24%" },
          { label: "Compartilhamentos", value: "892", icon: Share2, change: "+15%" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            whileHover={{ borderColor: "rgba(0,156,202,0.15)", background: "rgba(0,156,202,0.03)" }}
          >
            <stat.icon className="w-4 h-4 text-[hsl(195,100%,50%)] mb-2" />
            <span className="text-xl font-bold text-white/85 block">{stat.value}</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-white/25 uppercase tracking-[0.1em]">{stat.label}</span>
              <span className="text-[10px] text-emerald-400 font-medium">{stat.change}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Metrics View ─────────────────────
function MetricsView() {
  const maxReach = Math.max(...MOCK_METRICS_WEEKLY.map(d => d.reach));

  return (
    <div className="space-y-6">
      {/* Reach Chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-white/70">Alcance Semanal</h3>
            <p className="text-[10px] text-white/25 mt-0.5">Últimos 7 dias</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white/90">30.8k</span>
            <span className="text-xs text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />+18%
            </span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-2 h-[160px]">
          {MOCK_METRICS_WEEKLY.map((day, i) => (
            <motion.div
              key={day.day}
              className="flex-1 flex flex-col items-center gap-2"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              style={{ transformOrigin: "bottom" }}
            >
              <span className="text-[9px] text-white/30 font-mono">{(day.reach / 1000).toFixed(1)}k</span>
              <motion.div
                className="w-full rounded-t-lg relative overflow-hidden"
                style={{ height: `${(day.reach / maxReach) * 120}px` }}
                whileHover={{ filter: "brightness(1.3)" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(195,100%,40%)] to-[hsl(195,100%,55%)] opacity-80" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              </motion.div>
              <span className="text-[10px] text-white/30">{day.day}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Engagement & Best Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Engagement by type */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h3 className="text-sm font-semibold text-white/70 mb-4">Engajamento por Tipo</h3>
          <div className="space-y-3">
            {[
              { type: "Reels", pct: 68, color: "from-purple-500 to-pink-500" },
              { type: "Carrosséis", pct: 52, color: "from-blue-500 to-cyan-500" },
              { type: "Imagens", pct: 34, color: "from-amber-500 to-orange-500" },
              { type: "Stories", pct: 41, color: "from-emerald-500 to-teal-500" },
            ].map((item, i) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/50">{item.type}</span>
                  <span className="text-xs text-white/70 font-semibold">{item.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full bg-gradient-to-r", item.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Best posting times */}
        <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300/80">Melhores Horários</h3>
          </div>
          <div className="space-y-2.5">
            {BEST_TIMES.map((time, i) => (
              <motion.div
                key={time.hour}
                className="flex items-center gap-3 group"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <span className="text-sm font-mono text-white/50 w-12">{time.hour}</span>
                <div className="flex-1 h-6 rounded-lg bg-white/[0.03] overflow-hidden relative">
                  <motion.div
                    className={cn(
                      "h-full rounded-lg",
                      time.score >= 90 ? "bg-gradient-to-r from-amber-500/40 to-amber-400/60" :
                      time.score >= 70 ? "bg-gradient-to-r from-[hsl(195,100%,40%)]/40 to-[hsl(195,100%,50%)]/60" :
                      "bg-white/[0.08]"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${time.score}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-end pr-2">
                    <span className={cn(
                      "text-[9px] font-semibold uppercase tracking-[0.1em]",
                      time.score >= 90 ? "text-amber-300" : "text-white/30"
                    )}>
                      {time.label}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-white/40 w-8 text-right">{time.score}</span>
              </motion.div>
            ))}
          </div>
          <p className="text-[9px] text-white/15 mt-3 text-center uppercase tracking-[0.12em]">
            Baseado no engajamento dos últimos 30 dias
          </p>
        </div>
      </div>

      {/* Top performing posts */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h3 className="text-sm font-semibold text-white/70 mb-4">Top Posts (Últimos 30 dias)</h3>
        <div className="space-y-3">
          {MOCK_POSTS.slice(0, 5).map((post, i) => (
            <motion.div
              key={post.id}
              className="flex items-center gap-4 rounded-xl p-3 hover:bg-white/[0.02] transition-colors cursor-pointer group"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <span className="text-xs font-bold text-white/15 w-5">#{i + 1}</span>
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/60 truncate">{post.caption}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{format(new Date(post.timestamp), "dd MMM", { locale: ptBR })}</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-white/30 shrink-0">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.reach.toLocaleString()}</span>
                <span className="flex items-center gap-1 text-emerald-400/60">{post.engagement}%</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/30 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Publish View ─────────────────────
function PublishView() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[rgba(0,156,202,0.12)] bg-[rgba(0,156,202,0.02)] p-8 text-center">
        <motion.div
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] p-[2px] mx-auto mb-4"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <div className="w-full h-full rounded-[14px] bg-[#0a0a0f] flex items-center justify-center">
            <Send className="w-6 h-6 text-white/60" />
          </div>
        </motion.div>
        <h3 className="text-lg font-semibold text-white/80 mb-2">Publicação Automática</h3>
        <p className="text-sm text-white/30 max-w-md mx-auto mb-6">
          Conecte sua conta business do Instagram via Meta Graph API para publicar diretamente da plataforma.
        </p>

        {/* Publishing steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { step: "01", title: "Crie o conteúdo", desc: "Use o Studio Criativo para gerar e editar", icon: Zap },
            { step: "02", title: "Agende o horário", desc: "IA sugere os melhores horários", icon: Clock },
            { step: "03", title: "Publique", desc: "Publicação automática via API", icon: Send },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ borderColor: "rgba(0,156,202,0.2)", y: -2 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] text-[hsl(195,100%,50%)] font-mono">{s.step}</span>
                <s.icon className="w-4 h-4 text-white/30" />
              </div>
              <h4 className="text-xs font-semibold text-white/60 mb-1">{s.title}</h4>
              <p className="text-[10px] text-white/20">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Content ready to publish */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/70">Conteúdos Prontos para Publicar</h3>
          <button className="text-[10px] text-[hsl(195,100%,50%)] hover:text-[hsl(195,100%,65%)] transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Novo post
          </button>
        </div>
        <div className="space-y-2">
          {MOCK_QUEUE.map((item, i) => (
            <motion.div
              key={item.id}
              className="flex items-center gap-4 rounded-xl p-3 border border-white/[0.04] hover:border-white/[0.08] transition-all group cursor-pointer"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ x: 4 }}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                item.type === "VIDEO" ? "bg-purple-500/10" : item.type === "CAROUSEL" ? "bg-blue-500/10" : "bg-amber-500/10"
              )}>
                {item.type === "VIDEO" ? <Play className="w-4 h-4 text-purple-400" /> :
                 item.type === "CAROUSEL" ? <Grid3X3 className="w-4 h-4 text-blue-400" /> :
                 <ImageIcon className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/60 font-medium truncate">{item.title}</p>
                <p className="text-[10px] text-white/25">{format(new Date(item.scheduledAt), "dd MMM · HH:mm", { locale: ptBR })}</p>
              </div>
              <span className={cn(
                "text-[9px] px-2 py-0.5 rounded-full uppercase tracking-[0.1em] font-medium",
                item.status === "scheduled"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-white/[0.04] text-white/30 border border-white/[0.06]"
              )}>
                {item.status === "scheduled" ? "Agendado" : "Rascunho"}
              </span>
              <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/30 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Schedule View ─────────────────────
function ScheduleView() {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-6">
      {/* Week overview */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const isToday = i === 0;
          const hasContent = i === 2 || i === 3 || i === 4;
          return (
            <motion.div
              key={i}
              className={cn(
                "rounded-xl border p-4 text-center transition-all duration-200",
                isToday
                  ? "border-[hsl(195,100%,40%)]/30 bg-[hsl(195,100%,40%)]/[0.05] shadow-[0_0_20px_-8px_hsl(195,100%,50%,0.2)]"
                  : "border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08]"
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.03 }}
            >
              <span className="text-[9px] text-white/25 uppercase tracking-[0.12em] block mb-1">
                {format(day, "EEE", { locale: ptBR })}
              </span>
              <span className={cn(
                "text-lg font-bold block",
                isToday ? "text-[hsl(195,100%,55%)]" : "text-white/50"
              )}>
                {format(day, "dd")}
              </span>
              {hasContent && (
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-[hsl(195,100%,50%)] mx-auto mt-2"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Scheduled posts list */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h3 className="text-sm font-semibold text-white/70 mb-4">Próximos Agendamentos</h3>
        <div className="space-y-3">
          {MOCK_QUEUE.map((item, i) => (
            <motion.div
              key={item.id}
              className="relative flex items-center gap-4 rounded-xl p-4 border border-white/[0.04] hover:border-[rgba(0,156,202,0.15)] transition-all group"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ x: 4, background: "rgba(0,156,202,0.02)" }}
            >
              {/* Timeline dot */}
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[hsl(195,100%,40%)] bg-[#0a0a0f]" />

              <div className="rounded-lg bg-[hsl(195,100%,40%)]/10 px-3 py-2 text-center shrink-0">
                <span className="text-sm font-bold text-[hsl(195,100%,55%)] block">{format(new Date(item.scheduledAt), "dd")}</span>
                <span className="text-[9px] text-white/30 uppercase">{format(new Date(item.scheduledAt), "MMM", { locale: ptBR })}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/60 font-medium">{item.title}</p>
                <p className="text-[10px] text-white/25 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(item.scheduledAt), "HH:mm")}
                </p>
              </div>

              <span className={cn(
                "text-[9px] px-2 py-0.5 rounded-full uppercase tracking-[0.1em] font-medium",
                "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              )}>
                Agendado
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Post Detail Dialog ─────────────────────
function PostDetailDialog({ post, onClose }: { post: typeof MOCK_POSTS[0] | null; onClose: () => void }) {
  if (!post) return null;

  return (
    <Dialog open={!!post} onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#0c0c14]/95 border-white/[0.08] backdrop-blur-2xl max-w-lg p-0 overflow-hidden">
        {/* Image */}
        <div className="aspect-square relative">
          <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
          {post.type !== "IMAGE" && (
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] text-white flex items-center gap-1">
              {post.type === "VIDEO" ? <Play className="w-3 h-3" /> : <Grid3X3 className="w-3 h-3" />}
              {post.type === "VIDEO" ? "Reel" : "Carrossel"}
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Heart, value: post.likes, label: "Curtidas", color: "text-red-400" },
              { icon: MessageCircle, value: post.comments, label: "Comentários", color: "text-blue-400" },
              { icon: Eye, value: post.reach, label: "Alcance", color: "text-[hsl(195,100%,50%)]" },
              { icon: Bookmark, value: post.saves, label: "Salvos", color: "text-amber-400" },
            ].map(m => (
              <div key={m.label} className="text-center">
                <m.icon className={cn("w-4 h-4 mx-auto mb-1", m.color)} />
                <span className="text-sm font-bold text-white/80 block">{m.value.toLocaleString()}</span>
                <span className="text-[8px] text-white/25 uppercase tracking-[0.12em]">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Engagement badge */}
          <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-semibold">{post.engagement}% engajamento</span>
          </div>

          {/* Caption */}
          {post.caption && (
            <p className="text-xs text-white/40 leading-relaxed">{post.caption}</p>
          )}

          <p className="text-[10px] text-white/20">
            Publicado em {format(new Date(post.timestamp), "dd MMM yyyy · HH:mm", { locale: ptBR })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
