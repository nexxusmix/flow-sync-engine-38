/**
 * PortalNextSteps - Card de próximos passos do projeto
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import type { ProjectStage } from "@/hooks/useClientPortalEnhanced";

interface PortalNextStepsProps {
  stages: ProjectStage[];
  currentStageKey?: string | null;
}

const STAGE_NAMES: Record<string, string> = {
  briefing: 'Briefing',
  roteiro: 'Roteiro',
  pre_producao: 'Pré-Produção',
  captacao: 'Captação',
  edicao: 'Edição',
  revisao: 'Revisão',
  aprovacao: 'Aprovação',
  entrega: 'Entrega',
  pos_venda: 'Pós-Venda',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 8 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.25 },
  },
};

function PortalNextStepsComponent({ stages, currentStageKey }: PortalNextStepsProps) {
  // Find current stage index
  const currentIndex = stages.findIndex(s => s.stage_key === currentStageKey || s.status === 'in_progress');
  
  // Get next 3 stages
  const upcomingStages = stages.slice(Math.max(0, currentIndex), currentIndex + 4);

  return (
    <motion.div 
      className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="p-4 border-b border-[#1a1a1a] flex items-center gap-2">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>
          timeline
        </span>
        <h3 className="text-sm font-medium text-white">Próximos Passos</h3>
      </div>

      <div className="p-4 space-y-3">
        {upcomingStages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Projeto concluído! 🎉
          </p>
        ) : (
          upcomingStages.map((stage, index) => {
            const isCompleted = stage.status === 'completed';
            const isCurrent = stage.status === 'in_progress' || stage.stage_key === currentStageKey;
            const stageName = stage.title || STAGE_NAMES[stage.stage_key || ''] || 'Etapa';

            return (
              <motion.div
                key={stage.id}
                variants={itemVariants}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCurrent 
                    ? 'bg-primary/10 border border-primary/30' 
                    : isCompleted 
                      ? 'bg-primary/5 border border-primary/20'
                      : 'bg-muted/30 border border-transparent'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted 
                    ? 'bg-primary/20' 
                    : isCurrent 
                      ? 'bg-primary/20' 
                      : 'bg-muted/50'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 text-primary animate-pulse" />
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    isCurrent ? 'text-primary' : isCompleted ? 'text-primary/70' : 'text-muted-foreground'
                  }`}>
                    {stageName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isCompleted ? 'Concluído' : isCurrent ? 'Em andamento' : 'Pendente'}
                  </p>
                </div>
                {isCurrent && (
                  <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

export const PortalNextSteps = memo(PortalNextStepsComponent);
