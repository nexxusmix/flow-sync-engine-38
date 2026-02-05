import { motion } from "framer-motion";
import { TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PipelineStage {
  stage: string;
  label: string;
  count: number;
  value: number;
}

interface Deal {
  id: string;
  title: string;
  accountName: string;
  stage: string;
  value: number;
  lastActivityDays: number;
  nextAction: string;
  responsible: string;
}

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
  const navigate = useNavigate();
  
  // Empty state - no deals yet
  const pipelineSummary: PipelineStage[] = [
    { stage: 'lead', label: 'Lead', count: 0, value: 0 },
    { stage: 'qualificacao', label: 'Qualificação', count: 0, value: 0 },
    { stage: 'proposta', label: 'Proposta', count: 0, value: 0 },
    { stage: 'negociacao', label: 'Negociação', count: 0, value: 0 },
    { stage: 'fechado', label: 'Fechado', count: 0, value: 0 },
  ];
  
  const deals: Deal[] = [];
  const stuckDeals = deals.filter((d) => d.lastActivityDays >= 3);

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
          onClick={() => navigate('/crm')}
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

      {/* Empty state when no deals */}
      {deals.length === 0 && (
        <motion.div 
          className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-sm font-normal text-foreground mb-2">Nenhum deal no pipeline</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Comece adicionando seus primeiros leads e oportunidades de negócio.
          </p>
          <Button onClick={() => navigate('/crm')}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Deal
          </Button>
        </motion.div>
      )}
    </motion.section>
  );
}
