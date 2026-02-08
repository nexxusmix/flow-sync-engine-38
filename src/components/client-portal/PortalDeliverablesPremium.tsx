/**
 * PortalDeliverablesPremium - Entregas do portal no estilo premium
 */

import { memo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
      <div className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold border-l-2 border-cyan-400 pl-4">
          Entregas Contratadas
        </h2>
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-12 text-center">
          <Film className="w-10 h-10 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Nenhuma entrega cadastrada ainda.</p>
          <p className="text-gray-600 text-xs mt-1">Os materiais aparecerão aqui quando forem publicados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold border-l-2 border-cyan-400 pl-4">
        Entregas Contratadas
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
        {deliverables.map((deliverable) => {
          const isApproved = getApprovalStatus(deliverable.id);
          const isSelected = selectedMaterialId === deliverable.id;
          
          return (
            <div
              key={deliverable.id}
              onClick={() => onSelectMaterial(deliverable.id)}
              className={cn(
                "bg-[#0a0a0a] p-5 cursor-pointer transition-colors",
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
                  "text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold",
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
              
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                {deliverable.youtube_url ? (
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    YouTube
                  </span>
                ) : (
                  <span>Wide + Vert</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const PortalDeliverablesPremium = memo(PortalDeliverablesPremiumComponent);
