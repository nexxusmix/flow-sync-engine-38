/**
 * Marketing Hub Dashboard — SolaFlux Holographic Design
 * Connected to content_items + content_metrics for real data
 */
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useContentAnalytics } from "@/hooks/useContentAnalytics";
import { Loader2, BarChart3, Eye, Heart, MessageCircle, Share2, TrendingUp, Calendar, FileText, Send } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.5, type: "spring" as const, stiffness: 80, damping: 18 },
});

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function HoloMetricCard({ label, value, icon: Icon, delay = 0 }: {
  label: string; value: string; icon: React.ElementType; delay?: number;
}) {
  return (
    <motion.div {...fadeUp(delay)} className="holographic-card rounded-lg p-5 flex flex-col justify-between min-h-[130px]">
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 rounded border border-[rgba(0,156,202,0.2)] flex items-center justify-center bg-[rgba(0,156,202,0.05)]">
          <Icon className="w-4 h-4 text-[hsl(195,100%,50%)]" />
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] mb-1">{label}</p>
        <p className="text-2xl font-light text-white data-glow tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}

const STATUS_MAP: Record<string, { label: string; type: string }> = {
  published: { label: 'Publicado', type: 'verified' },
  publicado: { label: 'Publicado', type: 'verified' },
  scheduled: { label: 'Agendado', type: 'active' },
  agendado: { label: 'Agendado', type: 'active' },
  draft: { label: 'Rascunho', type: 'processing' },
  rascunho: { label: 'Rascunho', type: 'processing' },
  idea: { label: 'Ideia', type: 'queued' },
  review: { label: 'Em Review', type: 'processing' },
  approved: { label: 'Aprovado', type: 'active' },
};

export default function MkDashboardPage() {
  const navigate = useNavigate();
  const { data: kpis, isLoading } = useContentAnalytics();

  return (
    <MkAppShell title="RESUMO MARKETING" sectionCode="01" sectionLabel="Marketing_Summary">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[hsl(195,100%,50%)]" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <HoloMetricCard
              label="Alcance_Total"
              value={formatNumber(kpis?.totalReach || 0)}
              icon={BarChart3}
              delay={0.1}
            />
            <HoloMetricCard
              label="Visualizações"
              value={formatNumber(kpis?.totalViews || 0)}
              icon={Eye}
              delay={0.15}
            />
            <HoloMetricCard
              label="Engajamento"
              value={`${(kpis?.engagementRate || 0).toFixed(1)}%`}
              icon={TrendingUp}
              delay={0.2}
            />
            <HoloMetricCard
              label="Conteúdos"
              value={String(kpis?.totalItems || 0)}
              icon={FileText}
              delay={0.25}
            />
          </div>

          {/* Second row: Engagement breakdown + Status breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Engagement metrics */}
            <div className="lg:col-span-4 space-y-3">
              <motion.div {...fadeUp(0.3)} className="holographic-card rounded-lg p-5">
                <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] mb-4">Métricas_Engajamento</p>
                <div className="space-y-3">
                  {[
                    { icon: Heart, label: 'Curtidas', value: kpis?.totalLikes || 0 },
                    { icon: MessageCircle, label: 'Comentários', value: kpis?.totalComments || 0 },
                    { icon: Share2, label: 'Compartilhamentos', value: kpis?.totalShares || 0 },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <m.icon className="w-3.5 h-3.5 text-[hsl(195,100%,55%)]" />
                        <span className="text-xs text-white/50">{m.label}</span>
                      </div>
                      <span className="text-sm font-mono text-white/80 data-glow">{formatNumber(m.value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Status breakdown */}
              <motion.div {...fadeUp(0.35)} className="holographic-card rounded-lg p-5">
                <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] mb-4">Status_Pipeline</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Publicados', value: kpis?.publishedCount || 0, color: 'bg-emerald-500' },
                    { label: 'Agendados', value: kpis?.scheduledCount || 0, color: 'bg-[hsl(195,100%,50%)]' },
                    { label: 'Rascunhos', value: kpis?.draftCount || 0, color: 'bg-amber-500' },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", s.color)} />
                        <span className="text-xs text-white/50">{s.label}</span>
                      </div>
                      <span className="text-sm font-mono text-white/80">{s.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Channel breakdown */}
              {kpis && kpis.channelBreakdown.length > 0 && (
                <motion.div {...fadeUp(0.4)} className="holographic-card rounded-lg p-5">
                  <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] mb-4">Por_Canal</p>
                  <div className="space-y-2">
                    {kpis.channelBreakdown.slice(0, 5).map((ch) => (
                      <div key={ch.channel} className="flex items-center justify-between">
                        <span className="text-xs text-white/50 capitalize">{ch.channel}</span>
                        <span className="text-sm font-mono text-white/80">{ch.count}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Content pipeline table */}
            <div className="lg:col-span-8">
              <motion.div {...fadeUp(0.3)} className="glass-projection rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[hsl(195,100%,45%)]" />
                    <span className="text-[11px] text-white/40 uppercase tracking-[0.12em]">Latest_Content_Pipeline</span>
                  </div>
                  <button
                    onClick={() => navigate("/m/conteudos")}
                    className="text-[11px] text-[hsl(195,100%,55%)] uppercase tracking-[0.1em] hover:text-[hsl(195,100%,70%)] transition-colors"
                  >
                    Full_Log_View
                  </button>
                </div>
                <div className="px-6 pb-4">
                  {kpis && kpis.recentItems.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className="text-[10px] text-white/20 uppercase tracking-[0.12em]">
                          <th className="text-left py-2 font-normal">Data</th>
                          <th className="text-left py-2 font-normal">Conteúdo</th>
                          <th className="text-left py-2 font-normal">Status</th>
                          <th className="text-right py-2 font-normal">Métricas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kpis.recentItems.map((item, i) => {
                          const statusInfo = STATUS_MAP[item.status || ''] || { label: item.status || '—', type: 'queued' };
                          const badgeClass = statusInfo.type === "verified" ? "badge-verified"
                            : statusInfo.type === "active" ? "badge-active"
                            : statusInfo.type === "processing" ? "badge-processing"
                            : "badge-queued";
                          const dateStr = item.published_at
                            ? format(parseISO(item.published_at), 'dd/MM')
                            : item.scheduled_at
                            ? format(parseISO(item.scheduled_at), 'dd/MM')
                            : '—';
                          const metricStr = item.views > 0
                            ? `${formatNumber(item.views)} views`
                            : item.likes > 0
                            ? `${formatNumber(item.likes)} likes`
                            : item.reach > 0
                            ? `${formatNumber(item.reach)} alcance`
                            : statusInfo.type === 'active' ? 'Agendado' : '—';

                          return (
                            <motion.tr
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.35 + i * 0.05 }}
                              className="border-b border-white/[0.04] last:border-0"
                            >
                              <td className="py-3 text-sm text-white/30 font-mono">{dateStr}</td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  {item.channel && (
                                    <span className="text-[9px] text-[hsl(195,100%,50%)]/60 font-mono uppercase">{item.channel}</span>
                                  )}
                                  <span className="text-sm text-white/60 truncate max-w-[250px]">{item.title}</span>
                                </div>
                              </td>
                              <td className="py-3"><span className={badgeClass}>{statusInfo.label}</span></td>
                              <td className="py-3 text-sm text-right font-mono text-white/70">{metricStr}</td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Calendar className="w-8 h-8 text-white/10 mb-3" />
                      <p className="text-sm text-white/30 mb-1">Nenhum conteúdo registrado</p>
                      <p className="text-[11px] text-white/15">Crie conteúdos no Pipeline para ver analytics aqui</p>
                      <button
                        onClick={() => navigate("/m/conteudos")}
                        className="mt-4 text-[11px] text-[hsl(195,100%,55%)] uppercase tracking-[0.1em] hover:text-[hsl(195,100%,70%)] transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Ir para Pipeline
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-8">
            <p className="section-label mb-4">● Quick_Actions</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: "campaign", label: "Nova Campanha", desc: "Criar campanha com IA", href: "/m/campanhas" },
                { icon: "calendar_month", label: "Calendário Editorial", desc: "Planeje o mês", href: "/m/calendario" },
                { icon: "palette", label: "Brand Kit", desc: "Identidade visual", href: "/m/branding" },
                { icon: "auto_awesome", label: "Gerar com IA", desc: "Posts, copies e roteiros", href: "/marketing/studio" },
              ].map((a, i) => (
                <motion.button
                  key={a.label}
                  {...fadeUp(0.5 + i * 0.05)}
                  onClick={() => navigate(a.href)}
                  className="group holographic-card rounded-lg p-5 text-left hover:border-[rgba(0,156,202,0.25)] transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded border border-[rgba(0,156,202,0.15)] flex items-center justify-center mb-4 group-hover:border-[rgba(0,156,202,0.3)] group-hover:bg-[rgba(0,156,202,0.05)] transition-all">
                    <span className="material-symbols-outlined text-xl text-[hsl(195,100%,50%)]">{a.icon}</span>
                  </div>
                  <p className="text-sm text-white/60 font-normal mb-1">{a.label}</p>
                  <p className="text-[10px] text-white/20 tracking-wide">{a.desc}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}
    </MkAppShell>
  );
}
