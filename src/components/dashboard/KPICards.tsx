import { motion } from "framer-motion";
import { useKPIMetrics } from "@/hooks/useKPIMetrics";
import { formatCurrencyBRL } from "@/utils/format";
import { Tilt3DCard } from "@/components/ui/tilt-3d-card";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.9, filter: "blur(4px)" },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 80,
      damping: 18,
    }
  },
};

export function KPICards() {
  const metrics = useKPIMetrics();

  const kpis = [
    { label: "Leads Novos", value: metrics.newLeads, icon: "person_add", detail: "HOT LEADS" },
    { label: "Respostas", value: metrics.inboundReplies, icon: "mark_email_read", detail: "HOJE" },
    { label: "Calls", value: metrics.upcomingMeetings, icon: "call", detail: "AGENDADAS" },
    { label: "Propostas", value: metrics.sentProposals, icon: "send", detail: "ENVIADAS" },
    { label: "Pagamentos", value: formatCurrencyBRL(metrics.pendingPaymentsTotal), icon: "payments", detail: "PREVISTOS" },
    { label: "Entregas", value: metrics.upcomingDeliveries, icon: "local_shipping", detail: "7 DIAS" },
  ];

  return (
    <section>
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {kpis.map((kpi, index) => (
          <Tilt3DCard key={kpi.label} variants={item}>
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="glass-card p-8 rounded-[2rem] transition-colors duration-500 group cursor-pointer min-h-[160px] border border-transparent h-full"
            >
              <div className="flex justify-between items-start mb-8">
                <motion.span 
                  className="material-symbols-outlined text-primary text-3xl"
                  initial={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ delay: 0.2 + index * 0.08, type: "spring", stiffness: 200 }}
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                >
                  {kpi.icon}
                </motion.span>
                <motion.span 
                  className="text-mono text-muted-foreground font-light uppercase tracking-widest"
                  initial={{ opacity: 0, x: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.3 + index * 0.08 }}
                >
                  {kpi.detail}
                </motion.span>
              </div>
              <motion.h4 
                className="text-body-sm text-muted-foreground font-light uppercase tracking-[0.4em] mb-2"
                initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.25 + index * 0.08 }}
              >
                {kpi.label}
              </motion.h4>
              <motion.span 
                className="text-4xl font-normal text-foreground tracking-tighter block"
                initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.3 + index * 0.08, type: "spring", stiffness: 100 }}
              >
                {metrics.isLoading ? (
                  <span className="text-2xl text-muted-foreground animate-pulse">—</span>
                ) : (
                  kpi.value
                )}
              </motion.span>
            </motion.div>
          </Tilt3DCard>
        ))}
      </motion.div>
    </section>
  );
}
