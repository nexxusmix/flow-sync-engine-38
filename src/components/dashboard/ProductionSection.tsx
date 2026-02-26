import { motion } from "framer-motion";
import { Clapperboard, Truck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  accountName: string;
  stage: string;
  status: 'ok' | 'em_risco' | 'atrasado';
}

interface Delivery {
  id: string;
  projectTitle: string;
  accountName: string;
  type: string;
  dueDate: string;
  status: 'pendente' | 'em_andamento' | 'pronto' | 'entregue';
}

const projectStageLabels: Record<string, string> = {
  briefing: 'Briefing',
  pre_producao: 'Pré-produção',
  producao: 'Produção',
  pos_producao: 'Pós-produção',
  revisao: 'Revisão',
  entrega: 'Entrega',
  finalizado: 'Finalizado',
};

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
  const navigate = useNavigate();
  
  // Empty state - no projects or deliveries yet
  const projects: Project[] = [];
  const deliveries: Delivery[] = [];
  
  const riskProjects = projects.filter((p) => p.status !== "ok").slice(0, 8);
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
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <motion.span 
                className="material-symbols-outlined text-warning text-2xl"
              >
                priority_high
              </motion.span>
              <span className="text-lg font-normal uppercase tracking-tighter text-foreground">Próximos Marcos de Produção</span>
            </div>
            <motion.button 
              className="btn-subtle"
              onClick={() => navigate('/projetos')}
              whileHover={{ x: 4, color: "hsl(var(--primary))" }}
              whileTap={{ scale: 0.95 }}
            >
              Ver Cronograma <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
            </motion.button>
          </div>

          <motion.div 
            className="flex flex-col items-center justify-center py-12 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Clapperboard className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-sm font-normal text-foreground mb-2">Nenhum projeto em produção</h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-4">
              Crie seu primeiro projeto para acompanhar o fluxo de produção.
            </p>
            <Button onClick={() => navigate('/projetos')}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Projeto
            </Button>
          </motion.div>
        </motion.div>

        {/* Entregas próximas */}
        <motion.div 
          className="lg:col-span-4 glass-card p-10 rounded-[3rem] bg-gradient-to-br from-[#080808] to-black border-primary/10"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
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
              <span className="text-caption text-muted-foreground font-normal uppercase tracking-widest">Próximos 7 dias</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Truck className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">Nenhuma entrega programada</p>
            <p className="text-xs text-muted-foreground/70">Entregas aparecerão quando houver projetos ativos</p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
