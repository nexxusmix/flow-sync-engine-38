/**
 * Marketing Hub Dashboard — SolaFlux Holographic Design
 * Glass-projection panels, data-glow, Space Grotesk, cyan accent
 */
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.5, type: "spring" as const, stiffness: 80, damping: 18 },
});

// Holographic metric card (matches reference: Revenue_Total, Pending_Status, Net_Margin)
function HoloMetricCard({ label, value, subValue, badge, icon, delay = 0 }: {
  label: string; value: string; subValue?: string; badge?: string; icon?: string; delay?: number;
}) {
  return (
    <motion.div {...fadeUp(delay)} className="holographic-card rounded-lg p-6 flex flex-col justify-between min-h-[160px]">
      <div className="flex items-start justify-between">
        {icon && (
          <div className="w-8 h-8 rounded border border-[rgba(0,156,202,0.2)] flex items-center justify-center bg-[rgba(0,156,202,0.05)]">
            <span className="material-symbols-outlined text-lg text-[hsl(195,100%,50%)]">{icon}</span>
          </div>
        )}
        {badge && (
          <span className="badge-verified">{badge}</span>
        )}
      </div>
      <div className="mt-auto">
        <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] mb-2">{label}</p>
        <p className="text-2xl md:text-3xl font-light text-white data-glow tracking-tight">
          {value}
          {subValue && <span className="text-lg text-white/30">,{subValue}</span>}
        </p>
      </div>
    </motion.div>
  );
}

// Table row for transactions/content items
function HoloTableRow({ stamp, description, status, statusType, value, isNegative, delay = 0 }: {
  stamp: string; description: string; status: string; statusType: string; value: string; isNegative?: boolean; delay?: number;
}) {
  const badgeClass = statusType === "verified" ? "badge-verified"
    : statusType === "active" ? "badge-active"
    : statusType === "processing" ? "badge-processing"
    : "badge-queued";

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="border-b border-white/[0.04] last:border-0"
    >
      <td className="py-4 text-sm text-white/30 font-mono">{stamp}</td>
      <td className="py-4 text-sm text-white/60">{description}</td>
      <td className="py-4"><span className={badgeClass}>{status}</span></td>
      <td className={`py-4 text-sm text-right font-mono ${isNegative ? 'text-[hsl(195,100%,55%)]' : 'text-white/70'}`}>{isNegative ? '- ' : ''}{value}</td>
    </motion.tr>
  );
}

export default function MkDashboardPage() {
  const navigate = useNavigate();

  return (
    <MkAppShell title="RESUMO MARKETING" sectionCode="01" sectionLabel="Marketing_Summary">
      {/* Grid: 4 cols left (metric cards) + 8 cols right (table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Metric cards */}
        <div className="lg:col-span-4 space-y-4">
          <HoloMetricCard
            label="Alcance_Total"
            value="24.830"
            icon="campaign"
            badge="+18.4% YoY"
            delay={0.1}
          />
          <HoloMetricCard
            label="Leads_Pipeline"
            value="128"
            subValue=""
            icon="group"
            delay={0.15}
          />
          <div className="holographic-card rounded-lg p-6">
            <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] mb-2">Engajamento_Rate</p>
            <div className="flex items-end gap-3">
              <p className="text-2xl md:text-3xl font-light text-white data-glow">4,2%</p>
              <div className="flex items-center gap-1 mb-1">
                <span className="material-symbols-outlined text-sm text-[hsl(195,100%,55%)]">north_east</span>
                <span className="text-xs text-[hsl(195,100%,55%)]">1.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Content pipeline table */}
        <div className="lg:col-span-8">
          <motion.div {...fadeUp(0.2)} className="glass-projection rounded-lg overflow-hidden">
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
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-white/20 uppercase tracking-[0.12em]">
                    <th className="text-left py-2 font-normal">Stamp</th>
                    <th className="text-left py-2 font-normal">Object_Description</th>
                    <th className="text-left py-2 font-normal">Status</th>
                    <th className="text-right py-2 font-normal">Metric</th>
                  </tr>
                </thead>
                <tbody>
                  <HoloTableRow stamp="14.02" description="Reel — 5 dicas de branding" status="Verified" statusType="verified" value="2.4K views" delay={0.25} />
                  <HoloTableRow stamp="14.02" description="Story — Bastidores filmagem" status="Active" statusType="active" value="1.8K views" delay={0.3} />
                  <HoloTableRow stamp="13.02" description="Carrossel — Case Porto 153" status="Processing" statusType="processing" value="Em review" delay={0.35} />
                  <HoloTableRow stamp="12.02" description="Post — Depoimento cliente" status="Verified" statusType="verified" value="890 likes" delay={0.4} />
                  <HoloTableRow stamp="11.02" description="YouTube Short — Making of" status="Queued" statusType="queued" value="Agendado" delay={0.45} />
                </tbody>
              </table>
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
    </MkAppShell>
  );
}
