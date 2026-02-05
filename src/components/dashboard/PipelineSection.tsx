import { pipelineSummary, deals, getStageLabel } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export function PipelineSection() {
  // Deals parados (sem atividade há 3+ dias)
  const stuckDeals = deals.filter((d) => d.lastActivityDays >= 3 && d.stage !== 'pos_venda' && d.stage !== 'fechado');

  return (
    <motion.section 
      className="glass-card p-10 rounded-[3rem]"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="section-label">Pipeline de Vendas</h2>
        <motion.button 
          className="btn-subtle flex items-center gap-2"
          whileHover={{ x: 4, color: "hsl(var(--primary))" }}
          whileTap={{ scale: 0.95 }}
        >
          Ver CRM <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </motion.button>
      </div>

      {/* Mini Kanban */}
      <motion.div 
        className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {pipelineSummary.map((stage, index) => (
          <motion.div 
            key={stage.stage} 
            variants={item}
            whileHover={{ 
              y: -4, 
              scale: 1.02,
              borderColor: "rgba(0, 163, 211, 0.3)",
              transition: { duration: 0.2 }
            }}
            className="kanban-stage flex-shrink-0 cursor-pointer"
          >
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-normal mb-3">{stage.label}</p>
            <motion.p 
              className="text-3xl font-normal text-foreground tracking-tighter"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              {stage.count}
            </motion.p>
            <p className="text-[10px] text-primary font-normal">R$ {(stage.value / 1000).toFixed(0)}k</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Deals parados */}
      {stuckDeals.length > 0 && (
        <motion.div 
          className="mt-8 pt-8 border-t border-white/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div 
            className="flex items-center gap-3 mb-6"
            animate={{ x: [0, 2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="material-symbols-outlined text-warning">priority_high</span>
            <span className="text-[10px] font-normal text-warning uppercase tracking-widest">Deals parados (3+ dias sem atividade)</span>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[9px] text-muted-foreground uppercase tracking-widest border-b border-white/5">
                  <th className="pb-4 font-normal">Deal</th>
                  <th className="pb-4 font-normal">Conta</th>
                  <th className="pb-4 font-normal">Etapa</th>
                  <th className="pb-4 font-normal text-right">Valor</th>
                  <th className="pb-4 font-normal">Última</th>
                  <th className="pb-4 font-normal">Próxima ação</th>
                  <th className="pb-4 font-normal">Resp.</th>
                  <th className="pb-4"></th>
                </tr>
              </thead>
              <tbody>
                {stuckDeals.map((deal, index) => (
                  <motion.tr 
                    key={deal.id} 
                    className="table-row-hover border-b border-white/5 last:border-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)", x: 4 }}
                  >
                    <td className="py-4 font-normal text-foreground">{deal.title}</td>
                    <td className="py-4 text-muted-foreground">{deal.accountName}</td>
                    <td className="py-4">
                      <motion.span className="badge-subtle" whileHover={{ scale: 1.05 }}>
                        {getStageLabel(deal.stage)}
                      </motion.span>
                    </td>
                    <td className="py-4 text-right text-foreground font-normal">R$ {deal.value.toLocaleString()}</td>
                    <td className="py-4">
                      <motion.span 
                        className={cn(
                          "text-[10px] font-normal uppercase",
                          deal.lastActivityDays >= 5 ? "text-destructive" : "text-warning"
                        )}
                        animate={deal.lastActivityDays >= 5 ? { opacity: [1, 0.5, 1] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {deal.lastActivityDays} dias
                      </motion.span>
                    </td>
                    <td className="py-4 text-muted-foreground text-xs">{deal.nextAction}</td>
                    <td className="py-4 text-muted-foreground">{deal.responsible}</td>
                    <td className="py-4">
                      <motion.button 
                        className="btn-subtle text-xs"
                        whileHover={{ scale: 1.05, color: "hsl(var(--primary))" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Abrir
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
