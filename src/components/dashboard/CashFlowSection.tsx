import { invoices, cashFlowForecast } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.15,
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  }),
};

export function CashFlowSection() {
  const dueSoon = invoices.filter((inv) => inv.status === "pendente" && inv.daysOverdue === 0);
  const overdue = invoices.filter((inv) => inv.status === "vencido");
  const overdueByRange = {
    d1_3: overdue.filter((inv) => inv.daysOverdue >= 1 && inv.daysOverdue <= 3),
    d4_7: overdue.filter((inv) => inv.daysOverdue >= 4 && inv.daysOverdue <= 7),
    d8_15: overdue.filter((inv) => inv.daysOverdue >= 8 && inv.daysOverdue <= 15),
    d15plus: overdue.filter((inv) => inv.daysOverdue > 15),
  };
  const totalExpected = cashFlowForecast.reduce((sum, d) => sum + d.expected, 0);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="section-label mb-6">Caixa</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Previsão 30 dias */}
        <motion.div 
          className="glass-card p-10 rounded-[3rem]"
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ 
            y: -8,
            boxShadow: "0 20px 40px -20px rgba(0, 163, 211, 0.2)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.span 
              className="material-symbols-outlined text-success text-2xl"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              trending_up
            </motion.span>
            <span className="text-lg font-normal uppercase tracking-tighter text-foreground">Previsão 30 dias</span>
          </div>
          <div className="mb-6">
            <motion.p 
              className="text-4xl font-normal text-foreground tracking-tighter"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" as const, stiffness: 100 }}
            >
              R$ {totalExpected.toLocaleString()}
            </motion.p>
            <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-widest mt-1">Total previsto</p>
          </div>
          <div className="space-y-3">
            {cashFlowForecast.slice(0, 6).map((day, i) => (
              <motion.div 
                key={i} 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                <span className="text-[10px] text-muted-foreground w-12 font-normal">{day.date}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary/50 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((day.expected / 25000) * 100, 100)}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-16 text-right font-normal">
                  {day.expected > 0 ? `R$ ${(day.expected / 1000).toFixed(1)}k` : "-"}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* A vencer */}
        <motion.div 
          className="glass-card p-10 rounded-[3rem]"
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ 
            y: -8,
            boxShadow: "0 20px 40px -20px rgba(234, 179, 8, 0.2)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.span 
              className="material-symbols-outlined text-warning text-2xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              schedule
            </motion.span>
            <span className="text-lg font-normal uppercase tracking-tighter text-foreground">A Vencer</span>
          </div>
          {dueSoon.length > 0 ? (
            <div className="space-y-3">
              {dueSoon.map((inv, index) => (
                <motion.div 
                  key={inv.id} 
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02, 
                    borderColor: "rgba(234, 179, 8, 0.3)",
                    x: 4,
                  }}
                >
                  <div>
                    <p className="text-sm font-normal text-foreground">{inv.accountName}</p>
                    <p className="text-[10px] text-muted-foreground">Vence {new Date(inv.dueDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="text-sm font-normal text-foreground">R$ {inv.amount.toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhuma fatura a vencer</p>
          )}
        </motion.div>

        {/* Inadimplentes */}
        <motion.div 
          className="glass-card p-10 rounded-[3rem]"
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ 
            y: -8,
            boxShadow: "0 20px 40px -20px rgba(239, 68, 68, 0.2)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.span 
              className="material-symbols-outlined text-destructive text-2xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              warning
            </motion.span>
            <span className="text-lg font-normal uppercase tracking-tighter text-foreground">Inadimplentes</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "D+1 a D+3", data: overdueByRange.d1_3, color: "warning" },
              { label: "D+15+", data: overdueByRange.d15plus, color: "destructive" },
            ].map((range, index) => {
              const total = range.data.reduce((sum, inv) => sum + inv.amount, 0);
              if (range.data.length === 0) return null;
              return (
                <motion.div 
                  key={range.label} 
                  className="p-4 rounded-2xl bg-white/5 border border-white/5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    borderColor: range.color === "warning" ? "rgba(234, 179, 8, 0.3)" : "rgba(239, 68, 68, 0.3)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[10px] font-normal uppercase", range.color === "warning" ? "text-warning" : "text-destructive")}>{range.label}</span>
                    <span className="text-[10px] text-muted-foreground">{range.data.length} faturas</span>
                  </div>
                  <motion.p 
                    className="text-2xl font-normal text-foreground"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    R$ {total.toLocaleString()}
                  </motion.p>
                </motion.div>
              );
            })}
            {overdue.length === 0 && (
              <motion.p 
                className="text-muted-foreground text-center py-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, scale: [1, 1.05, 1] }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                Nenhuma fatura em atraso 🎉
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
