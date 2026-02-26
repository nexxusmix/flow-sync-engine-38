/**
 * Marketing Hub Dashboard — SolaFlux Holographic Design
 * Matches the CONTENT_OS // V4.0 reference layout
 */
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useContentAnalytics } from "@/hooks/useContentAnalytics";
import { Loader2, Calendar, FileText, Send, CheckCircle, AlertTriangle, Clock, Eye } from "lucide-react";
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

  const now = new Date();
  const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

  return (
    <MkAppShell title="MARKETING & CONTEÚDO" sectionCode="MK" sectionLabel="Marketing_Overview">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[hsl(195,100%,50%)]" />
        </div>
      ) : (
        <>
          {/* Subtitle */}
          <motion.p {...fadeUp(0.05)} className="text-[11px] text-white/25 uppercase tracking-[0.2em] mb-8 -mt-4">
            Visão Geral da Produção de Conteúdo
          </motion.p>

          {/* 6 KPI Cards — single row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
            {[
              { label: "Em Produção", sublabel: "Active", value: String(kpis?.totalItems || 0), delay: 0.1 },
              { label: "Publicados", sublabel: `Este Mês`, value: String(kpis?.publishedThisMonth || 0), highlight: kpis?.publishedThisMonth ? `+${kpis.publishedThisMonth}` : undefined, delay: 0.13 },
              { label: "Atrasados", sublabel: undefined, value: String(kpis?.overdueCount || 0), danger: (kpis?.overdueCount || 0) > 0, delay: 0.16 },
              { label: "Em Revisão", sublabel: undefined, value: String(kpis?.reviewCount || 0), delay: 0.19 },
              { label: "Aprovados", sublabel: undefined, value: String(kpis?.approvedCount || 0), delay: 0.22 },
              { label: "Agendados", sublabel: "Esta Semana", value: String(kpis?.scheduledCount || 0), delay: 0.25 },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                {...fadeUp(card.delay)}
                className={cn(
                  "holographic-card rounded-lg p-4 flex flex-col justify-between min-h-[100px]",
                  card.danger && "border-red-500/20"
                )}
              >
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "text-[10px] uppercase tracking-[0.12em] font-normal",
                    card.danger ? "text-red-400" : "text-[hsl(195,100%,55%)]"
                  )}>
                    {card.label}
                  </span>
                  {card.sublabel && (
                    <span className="text-[9px] text-white/20 uppercase tracking-wider">{card.sublabel}</span>
                  )}
                </div>
                <div className="flex items-end gap-2 mt-auto overflow-hidden">
                  <motion.span
                    className={cn(
                      "text-3xl font-light tracking-tight data-glow inline-block",
                      card.danger ? "text-red-400" : "text-white"
                    )}
                    initial={{ clipPath: "inset(100% 0 0 0)", y: "100%" }}
                    animate={{ clipPath: "inset(0% 0 0 0)", y: "0%" }}
                    transition={{ delay: card.delay + 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {card.value}
                  </motion.span>
                  {card.highlight && (
                    <span className="text-[10px] text-[hsl(195,100%,55%)] mb-1">{card.highlight}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── AÇÕES RÁPIDAS ── */}
          <motion.div {...fadeUp(0.3)} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-white/[0.08]" />
              <span className="text-[11px] text-white/25 uppercase tracking-[0.2em] font-normal">Ações Rápidas</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { icon: "auto_awesome", label: "Studio Criativo", href: "/marketing/studio" },
                { icon: "add", label: "Nova Ideia", href: "/m/conteudos" },
                { icon: "calendar_month", label: "Ver Calendário", href: "/m/calendario" },
                { icon: "campaign", label: "Campanhas", href: "/m/campanhas" },
                { icon: "photo_camera", label: "Instagram Preview", href: "/m/instagram" },
                { icon: "bookmark", label: "Referências", href: "/m/branding" },
                { icon: "palette", label: "Assets & Brand", href: "/m/assets" },
                { icon: "smart_toy", label: "Automações", href: "/m/automacoes" },
                { icon: "record_voice_over", label: "Transcrição IA", href: "/m/templates" },
                { icon: "bolt", label: "Gerar Plano 30 dias", href: "/m/templates" },
              ].map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.03 }}
                  onClick={() => navigate(action.href)}
                  className="group holographic-card rounded-lg px-4 py-3.5 flex items-center gap-3 text-left hover:border-primary/20 hover:scale-[1.02] transition-all duration-300"
                >
                  <span className="material-symbols-outlined text-lg text-[hsl(195,100%,50%)] group-hover:text-[hsl(195,100%,65%)] transition-colors">
                    {action.icon}
                  </span>
                  <span className="text-[12px] text-white/50 group-hover:text-white/70 transition-colors font-normal tracking-wide">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Content Pipeline + Side Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Content pipeline table */}
            <div className="lg:col-span-8">
              <motion.div {...fadeUp(0.4)} className="glass-projection rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[hsl(195,100%,45%)]" />
                    <span className="text-[11px] text-white/40 uppercase tracking-[0.12em]">Conteúdo Andamento</span>
                  </div>
                  <button
                    onClick={() => navigate("/m/conteudos")}
                    className="text-[11px] text-primary uppercase tracking-[0.1em] hover-underline-sweep transition-colors"
                  >
                    Ver Todos
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
                              transition={{ delay: 0.45 + i * 0.05 }}
                              className="border-b border-white/[0.04] last:border-0 hover:bg-muted/30 transition-colors"
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

            {/* Side stats */}
            <div className="lg:col-span-4 space-y-3">
              {/* Status Pipeline */}
              <motion.div {...fadeUp(0.4)} className="holographic-card rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[hsl(195,100%,45%)]" />
                  <span className="text-[10px] text-white/25 uppercase tracking-[0.12em]">Status_Pipeline</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Publicados', value: kpis?.publishedCount || 0, color: 'bg-emerald-500' },
                    { label: 'Aprovados', value: kpis?.approvedCount || 0, color: 'bg-green-400' },
                    { label: 'Agendados', value: kpis?.scheduledCount || 0, color: 'bg-[hsl(195,100%,50%)]' },
                    { label: 'Em Review', value: kpis?.reviewCount || 0, color: 'bg-amber-500' },
                    { label: 'Rascunhos', value: kpis?.draftCount || 0, color: 'bg-white/20' },
                    { label: 'Atrasados', value: kpis?.overdueCount || 0, color: 'bg-red-500' },
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

              {/* Próximas Entregas */}
              <motion.div {...fadeUp(0.45)} className="holographic-card rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-white/25 uppercase tracking-[0.12em]">Próximas_Entregas</span>
                </div>
                {kpis && kpis.recentItems.filter(i => i.scheduled_at).length > 0 ? (
                  <div className="space-y-2">
                    {kpis.recentItems
                      .filter(i => i.scheduled_at)
                      .slice(0, 4)
                      .map(item => (
                        <div key={item.id} className="flex items-center justify-between">
                          <span className="text-xs text-white/50 truncate max-w-[150px]">{item.title}</span>
                          <span className="text-[10px] font-mono text-white/30">
                            {format(parseISO(item.scheduled_at!), 'dd/MM')}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/15 text-center py-4">Sem entregas agendadas</p>
                )}
              </motion.div>

              {/* Channel breakdown */}
              {kpis && kpis.channelBreakdown.length > 0 && (
                <motion.div {...fadeUp(0.5)} className="holographic-card rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-[10px] text-white/25 uppercase tracking-[0.12em]">Por_Canal</span>
                  </div>
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
          </div>
        </>
      )}
    </MkAppShell>
  );
}
