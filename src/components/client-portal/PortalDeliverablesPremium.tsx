/**
 * PortalDeliverablesPremium - Entregas do portal com animações
 * Hover lift e glow nos cards, animação de entrada
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2,
  Clock,
  Play,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortalDeliverable, PortalApproval } from "@/hooks/useClientPortalEnhanced";

interface PortalDeliverablesPremiumProps {
  deliverables: PortalDeliverable[];
  approvals: PortalApproval[];
  onSelectMaterial: (id: string) => void;
  selectedMaterialId?: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.25 },
  },
};

function PortalDeliverablesPremiumComponent({
  deliverables,
  approvals,
  onSelectMaterial,
  selectedMaterialId,
}: PortalDeliverablesPremiumProps) {
  const getApprovalStatus = (id: string) => {
    return approvals.some(a => a.deliverable_id === id);
  };

  if (deliverables.length === 0) {
    return (
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xs uppercase tracking-[0.3em] text-primary font-medium border-l-2 border-primary pl-4">
          Entregas Contratadas
        </h2>
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-12 text-center">
          <Film className="w-10 h-10 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Nenhuma entrega cadastrada ainda.</p>
          <p className="text-gray-600 text-xs mt-1">Os materiais aparecerão aqui quando forem publicados.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.h2 
        className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-medium border-l-2 border-cyan-400 pl-4"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        Entregas Contratadas
      </motion.h2>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {deliverables.map((deliverable) => {
          const isApproved = getApprovalStatus(deliverable.id);
          const isSelected = selectedMaterialId === deliverable.id;
          
          return (
            <motion.div
              key={deliverable.id}
              variants={cardVariants}
              whileHover={{ 
                y: -4,
                boxShadow: '0 8px 24px -8px rgba(6, 182, 212, 0.12)',
              }}
              onClick={() => onSelectMaterial(deliverable.id)}
              className={cn(
                "bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 cursor-pointer transition-colors",
                isSelected && "bg-cyan-500/5 border-l-2 border-cyan-500"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {isApproved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                  <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                    {deliverable.current_version > 1 ? `V${deliverable.current_version}` : 'V1'}
                  </span>
                </div>
                <span className={cn(
                  "text-caption px-2 py-0.5 uppercase tracking-wider font-medium",
                  isApproved 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : deliverable.awaiting_approval 
                      ? "bg-amber-500/20 text-amber-400"
                      : "border border-[#1a1a1a] text-gray-500"
                )}>
                  {isApproved ? 'Aprovado' : deliverable.awaiting_approval ? 'Aguardando' : 'Pendente'}
                </span>
              </div>
              
              <h3 className="text-sm font-medium text-white mb-2 line-clamp-2">
                {deliverable.title}
              </h3>
              
              {deliverable.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                  {deliverable.description}
                </p>
              )}
              
              <div className="flex items-center gap-3 text-mono text-gray-500">
                {deliverable.youtube_url ? (
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    YouTube
                  </span>
                ) : (
                  <span>Wide + Vert</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

export const PortalDeliverablesPremium = memo(PortalDeliverablesPremiumComponent);
