import { motion } from "framer-motion";

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

// KPIs zerados para estado inicial
const kpis = [
  { label: "Leads Novos", value: 0, icon: "person_add", detail: "HOT LEADS" },
  { label: "Respostas", value: 0, icon: "mark_email_read", detail: "HOJE" },
  { label: "Calls", value: 0, icon: "call", detail: "AGENDADAS" },
  { label: "Propostas", value: 0, icon: "send", detail: "ENVIADAS" },
  { label: "Pagamentos", value: "R$ 0", icon: "payments", detail: "PREVISTOS" },
  { label: "Entregas", value: 0, icon: "local_shipping", detail: "7 DIAS" },
];

export function KPICards() {
  return (
    <section>
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {kpis.map((kpi, index) => (
          <motion.div 
            key={kpi.label} 
            variants={item}
            whileHover={{ 
              y: -8, 
              scale: 1.02,
              boxShadow: "0 20px 50px -20px rgba(0, 163, 211, 0.3)",
              borderColor: "rgba(0, 163, 211, 0.3)",
              rotateX: -2,
              rotateY: 2,
            }}
            whileTap={{ scale: 0.98 }}
            className="glass-card p-8 rounded-[2rem] transition-colors duration-500 group cursor-pointer min-h-[160px] border border-transparent"
            style={{ transformStyle: "preserve-3d", perspective: 800 }}
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
                className="text-[10px] text-muted-foreground font-light uppercase tracking-widest"
                initial={{ opacity: 0, x: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.3 + index * 0.08 }}
              >
                {kpi.detail}
              </motion.span>
            </div>
            <motion.h4 
              className="text-[11px] text-muted-foreground font-light uppercase tracking-[0.4em] mb-2"
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
              {kpi.value}
            </motion.span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
