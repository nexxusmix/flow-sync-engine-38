/**
 * Marketing Hub Dashboard — SolaFlux-inspired premium design with blue accent
 */
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp, Eye, Heart, MessageCircle, Share2, Zap, Calendar, Palette, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.6, type: "spring" as const, stiffness: 80, damping: 18 },
});

// SolaFlux-style metric card
function MkMetricCard({ label, value, change, icon: Icon, delay = 0 }: { label: string; value: string; change: string; icon: any; delay?: number }) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-[hsl(210,100%,55%)]/20 hover:bg-white/[0.05] transition-all duration-500"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-[11px] text-white/40 uppercase tracking-widest font-medium">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-[hsl(210,100%,55%)]/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[hsl(210,100%,65%)]" strokeWidth={1.5} />
        </div>
      </div>
      <p className="text-3xl font-semibold text-white tracking-tight mb-1">{value}</p>
      <div className="flex items-center gap-1.5">
        <TrendingUp className="w-3 h-3 text-emerald-400" />
        <span className="text-xs text-emerald-400 font-medium">{change}</span>
        <span className="text-[10px] text-white/25 ml-1">vs mês anterior</span>
      </div>
      <div className="absolute inset-0 rounded-2xl border border-[hsl(210,100%,55%)]/0 group-hover:border-[hsl(210,100%,55%)]/10 transition-all duration-500 pointer-events-none" />
    </motion.div>
  );
}

// SolaFlux-style glass panel
function MkGlassPanel({ title, children, action, delay = 0 }: { title: string; children: React.ReactNode; action?: { label: string; href: string }; delay?: number }) {
  const navigate = useNavigate();
  return (
    <motion.div
      {...fadeUp(delay)}
      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
        <span className="text-sm font-semibold text-white/80 tracking-tight">{title}</span>
        {action && (
          <button
            onClick={() => navigate(action.href)}
            className="flex items-center gap-1 text-[11px] text-[hsl(210,100%,65%)] hover:text-[hsl(210,100%,75%)] transition-colors font-medium"
          >
            {action.label}
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

// Quick action card
function MkQuickAction({ icon: Icon, label, description, href, delay = 0 }: { icon: any; label: string; description: string; href: string; delay?: number }) {
  const navigate = useNavigate();
  return (
    <motion.button
      {...fadeUp(delay)}
      onClick={() => navigate(href)}
      className="group text-left bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-[hsl(210,100%,55%)]/20 hover:bg-white/[0.04] transition-all duration-500"
    >
      <div className="w-10 h-10 rounded-xl bg-[hsl(210,100%,55%)]/10 flex items-center justify-center mb-4 group-hover:bg-[hsl(210,100%,55%)]/15 transition-colors">
        <Icon className="w-5 h-5 text-[hsl(210,100%,65%)]" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-white/80 mb-1">{label}</p>
      <p className="text-[11px] text-white/30 leading-relaxed">{description}</p>
    </motion.button>
  );
}

// Content pipeline item
function PipelineItem({ title, channel, status, statusColor, delay = 0 }: { title: string; channel: string; status: string; statusColor: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/70 truncate">{title}</p>
        <p className="text-[10px] text-white/25 uppercase tracking-wider mt-0.5">{channel}</p>
      </div>
      <span className={`text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusColor}`}>
        {status}
      </span>
    </motion.div>
  );
}

export default function MkDashboardPage() {
  return (
    <MkAppShell title="Dashboard">
      {/* Hero title */}
      <motion.div {...fadeUp(0)} className="mb-10">
        <p className="text-[11px] text-[hsl(210,100%,65%)] uppercase tracking-[0.3em] font-medium mb-2">// Dashboard</p>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
          Marketing<br />
          <span className="text-white/40">Command Center</span>
        </h1>
      </motion.div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MkMetricCard label="Alcance Total" value="24.8K" change="+18%" icon={Eye} delay={0.1} />
        <MkMetricCard label="Engajamento" value="3.2K" change="+24%" icon={Heart} delay={0.15} />
        <MkMetricCard label="Conteúdos Ativos" value="47" change="+8" icon={MessageCircle} delay={0.2} />
        <MkMetricCard label="Compartilhamentos" value="892" change="+31%" icon={Share2} delay={0.25} />
      </div>

      {/* Main grid: 2/3 + 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pipeline */}
        <MkGlassPanel title="Pipeline de Conteúdo" action={{ label: "Ver todos", href: "/m/conteudos" }} delay={0.3}>
          <div className="space-y-0">
            <PipelineItem title="Reel — 5 dicas de branding" channel="Instagram" status="Em Design" statusColor="bg-[hsl(210,100%,55%)]/10 text-[hsl(210,100%,65%)] border-[hsl(210,100%,55%)]/20" delay={0.35} />
            <PipelineItem title="Carrossel — Case Porto 153" channel="Instagram" status="Revisão" statusColor="bg-amber-500/10 text-amber-400 border-amber-500/20" delay={0.4} />
            <PipelineItem title="Post — Bastidores filmagem" channel="Instagram" status="Aprovado" statusColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" delay={0.45} />
            <PipelineItem title="Story — Depoimento cliente" channel="Instagram" status="Agendado" statusColor="bg-purple-500/10 text-purple-400 border-purple-500/20" delay={0.5} />
            <PipelineItem title="YouTube Short — Making of" channel="YouTube" status="Rascunho" statusColor="bg-white/[0.06] text-white/30 border-white/[0.08]" delay={0.55} />
          </div>
        </MkGlassPanel>

        {/* Right column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upcoming */}
          <MkGlassPanel title="Próximos Agendamentos" action={{ label: "Calendário", href: "/m/calendario" }} delay={0.35}>
            <div className="space-y-3">
              {[
                { day: "Hoje", items: "3 posts agendados" },
                { day: "Amanhã", items: "1 reel + 2 stories" },
                { day: "Sex, 14", items: "Campanha Black Week" },
              ].map((d, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(210,100%,55%)]/8 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-[hsl(210,100%,60%)]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs text-white/60 font-medium">{d.day}</p>
                    <p className="text-[10px] text-white/25">{d.items}</p>
                  </div>
                </div>
              ))}
            </div>
          </MkGlassPanel>

          {/* AI suggestion */}
          <motion.div
            {...fadeUp(0.5)}
            className="bg-gradient-to-br from-[hsl(210,100%,55%)]/8 to-[hsl(210,80%,40%)]/5 border border-[hsl(210,100%,55%)]/15 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[hsl(210,100%,65%)]" />
              <span className="text-xs font-semibold text-[hsl(210,100%,70%)]">Sugestão IA</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              "Seus posts de <strong className="text-white/80">bastidores</strong> têm 3x mais engajamento. Considere criar uma série semanal."
            </p>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div {...fadeUp(0.4)} className="mb-4">
        <p className="text-[11px] text-white/25 uppercase tracking-[0.2em] font-medium mb-4">Ações Rápidas</p>
      </motion.div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MkQuickAction icon={Zap} label="Criar Campanha" description="Nova campanha com IA" href="/m/campanhas" delay={0.5} />
        <MkQuickAction icon={Calendar} label="Calendário Editorial" description="Planeje o mês" href="/m/calendario" delay={0.55} />
        <MkQuickAction icon={Palette} label="Brand Kit" description="Identidade visual" href="/m/branding" delay={0.6} />
        <MkQuickAction icon={Sparkles} label="Gerar com IA" description="Posts, copies e roteiros" href="/marketing/studio" delay={0.65} />
      </div>
    </MkAppShell>
  );
}
