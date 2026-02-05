import { projects, deliveries, getProjectStageLabel } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export function ProductionSection() {
  // Projetos em risco ou atrasados
  const riskProjects = projects.filter((p) => p.status !== "ok").slice(0, 8);

  // Próximas entregas (7 dias)
  const upcomingDeliveries = deliveries.filter((d) => d.status !== "entregue").slice(0, 5);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h2 className="section-label mb-6">Produção</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Projetos em risco */}
        <motion.div 
          className="lg:col-span-8 glass-card p-10 rounded-[3rem]"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ boxShadow: "0 20px 40px -20px rgba(234, 179, 8, 0.15)" }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <motion.span 
                className="material-symbols-outlined text-warning text-2xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                priority_high
              </motion.span>
              <span className="text-lg font-normal uppercase tracking-tighter text-foreground">Próximos Marcos de Produção</span>
            </div>
            <motion.button 
              className="btn-subtle"
              whileHover={{ x: 4, color: "hsl(var(--primary))" }}
              whileTap={{ scale: 0.95 }}
            >
              Ver Cronograma <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
            </motion.button>
          </div>

          {riskProjects.length > 0 ? (
            <motion.div 
              className="space-y-4"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {riskProjects.map((proj, index) => (
                <motion.div 
                  key={proj.id} 
                  variants={item}
                  whileHover={{ 
                    scale: 1.01, 
                    backgroundColor: "rgba(255,255,255,0.05)",
                    x: 8,
                    borderColor: proj.status === "em_risco" ? "rgba(234, 179, 8, 0.3)" : "rgba(239, 68, 68, 0.3)",
                  }}
                  whileTap={{ scale: 0.99 }}
                  className="glass-card p-6 rounded-[2rem] flex items-center justify-between cursor-pointer border border-transparent transition-colors"
                >
                  <div className="flex items-center gap-5">
                    <motion.div 
                      className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground font-normal text-[10px]"
                      whileHover={{ scale: 1.1 }}
                    >
                      SF-{proj.id.slice(-3)}
                    </motion.div>
                    <div>
                      <h5 className="text-base font-normal text-foreground uppercase tracking-tight">{proj.title}</h5>
                      <p className="text-[10px] text-muted-foreground uppercase font-normal">{proj.accountName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <span className="text-[9px] text-muted-foreground block uppercase font-normal">Etapa Atual</span>
                      <span className="text-foreground font-normal">{getProjectStageLabel(proj.stage)}</span>
                    </div>
                    <motion.span 
                      className={cn(
                        "material-symbols-outlined",
                        proj.status === "em_risco" ? "text-warning" : "text-destructive"
                      )}
                      animate={proj.status === "atrasado" ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {proj.status === "em_risco" ? "schedule" : "priority_high"}
                    </motion.span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="py-12 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-muted-foreground">Todos os projetos estão em dia 🎉</p>
            </motion.div>
          )}
        </motion.div>

        {/* Entregas próximas */}
        <motion.div 
          className="lg:col-span-4 glass-card p-10 rounded-[3rem] bg-gradient-to-br from-[#080808] to-black border-primary/10"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ boxShadow: "0 20px 40px -20px rgba(0, 163, 211, 0.2)" }}
        >
          <div className="flex items-center gap-4 mb-8">
            <motion.span 
              className="material-symbols-outlined text-primary text-3xl"
              animate={{ 
                y: [0, -5, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              local_shipping
            </motion.span>
            <div>
              <h3 className="text-lg font-normal uppercase tracking-tighter text-foreground">Entregas</h3>
              <span className="text-[9px] text-muted-foreground font-normal uppercase tracking-widest">Próximos 7 dias</span>
            </div>
          </div>

          <motion.div 
            className="space-y-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {upcomingDeliveries.map((del, index) => (
              <motion.div 
                key={del.id} 
                variants={item}
                whileHover={{ 
                  scale: 1.02, 
                  borderColor: "rgba(0, 163, 211, 0.3)",
                  x: 4,
                }}
                className="p-5 rounded-2xl bg-white/5 border border-white/5 cursor-pointer transition-colors"
              >
                <p className="text-sm font-normal text-foreground mb-1">{del.projectTitle}</p>
                <p className="text-[10px] text-muted-foreground mb-3">{del.accountName}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{del.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground font-normal">{new Date(del.dueDate).toLocaleDateString('pt-BR')}</span>
                    <motion.span 
                      className={cn(
                        "w-2 h-2 rounded-full",
                        del.status === "pronto" ? "bg-success" :
                        del.status === "em_andamento" ? "bg-warning" : "bg-muted-foreground"
                      )}
                      animate={del.status === "em_andamento" ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
