import { useEffect } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkSectionHeader } from "@/components/marketing-hub/mk-ui";
import { useMarketingStore } from "@/stores/marketingStore";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(210,100%,55%)", "hsl(170,70%,50%)", "hsl(280,70%,55%)", "hsl(40,90%,55%)", "hsl(0,70%,55%)", "hsl(200,70%,55%)"];

export default function MkReportsPage() {
  const { contentItems, campaigns, fetchContentItems, fetchCampaigns, getStats } = useMarketingStore();

  useEffect(() => { fetchContentItems(); fetchCampaigns(); }, []);

  const stats = getStats();

  const statusData = [
    { name: "Em Produção", value: stats.inProduction },
    { name: "Aprovados", value: stats.approved },
    { name: "Agendados", value: stats.scheduledThisWeek },
    { name: "Publicados", value: stats.publishedThisMonth },
  ];

  const channelData = ["instagram", "tiktok", "youtube", "linkedin", "email", "site"].map(ch => ({
    name: ch,
    count: contentItems.filter(i => i.channel === ch).length,
  })).filter(d => d.count > 0);

  return (
    <MkAppShell title="Relatórios">
      <h1 className="text-2xl font-bold text-white/90 mb-2">Relatórios de Marketing</h1>
      <p className="text-sm text-white/30 mb-8">Métricas gerais de produção e conteúdo</p>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Em Produção", value: stats.inProduction, icon: "edit" },
          { label: "Publicados (mês)", value: stats.publishedThisMonth, icon: "check_circle" },
          { label: "Campanhas Ativas", value: stats.activeCampaigns, icon: "campaign" },
          { label: "Ideias Backlog", value: stats.totalIdeas, icon: "lightbulb" },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <MkCard>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg text-[hsl(210,100%,65%)]">{m.icon}</span>
                <span className="text-[11px] text-white/30 uppercase tracking-wider">{m.label}</span>
              </div>
              <p className="text-3xl font-bold text-white/85">{m.value}</p>
            </MkCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status chart */}
        <MkCard>
          <MkSectionHeader title="Status dos Conteúdos" />
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#111114", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff" }} />
                <Bar dataKey="value" fill="hsl(210,100%,55%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MkCard>

        {/* Channel chart */}
        <MkCard>
          <MkSectionHeader title="Conteúdos por Canal" />
          <div className="h-[250px] flex items-center justify-center">
            {channelData.length === 0 ? (
              <p className="text-sm text-white/20">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channelData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                    {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111114", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </MkCard>
      </div>
    </MkAppShell>
  );
}
