import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  
  // Empty state - no financial data yet
  const totalExpected = 0;

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
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
            <p className="text-3xl font-normal text-foreground tracking-tighter mb-2">R$ 0</p>
            <p className="text-xs text-muted-foreground mb-4">Nenhuma receita prevista</p>
            <Button onClick={() => navigate('/financeiro')} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Receita
            </Button>
          </div>
        </motion.div>

        {/* A vencer */}
        <motion.div 
          className="glass-card p-10 rounded-[3rem]"
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.span 
              className="material-symbols-outlined text-warning text-2xl"
            >
              schedule
            </motion.span>
            <span className="text-lg font-normal uppercase tracking-tighter text-foreground">A Vencer</span>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <DollarSign className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">Nenhuma fatura a vencer</p>
            <p className="text-xs text-muted-foreground/70">Faturas pendentes aparecerão aqui</p>
          </div>
        </motion.div>

        {/* Inadimplentes */}
        <motion.div 
          className="glass-card p-10 rounded-[3rem]"
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.span 
              className="material-symbols-outlined text-destructive text-2xl"
            >
              warning
            </motion.span>
            <span className="text-lg font-normal uppercase tracking-tighter text-foreground">Inadimplentes</span>
          </div>
          <motion.div 
            className="flex flex-col items-center justify-center py-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma fatura em atraso</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Excelente!</p>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
