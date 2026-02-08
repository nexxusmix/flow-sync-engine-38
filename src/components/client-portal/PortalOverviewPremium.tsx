/**
 * PortalOverviewPremium - Visão Geral do portal idêntica ao HTML de referência
 * Layout com cards de progresso, materiais disponíveis e status de entregas
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import type { ProjectInfo, ProjectStage, PortalDeliverable } from "@/hooks/useClientPortalEnhanced";

interface PortalOverviewPremiumProps {
  project: ProjectInfo;
  stages: ProjectStage[];
  deliverables?: PortalDeliverable[];
  hasPaymentBlock?: boolean;
  isManager?: boolean;
  onEditBriefing?: () => void;
  onGenerateAI?: () => void;
}

// Stage name mapping
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

function PortalOverviewPremiumComponent({ 
  project, 
  stages, 
  deliverables = [],
}: PortalOverviewPremiumProps) {
  const currentStageKey = project.stage_current;
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const totalStages = stages.length || 9;
  const stageProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  const currentStageName = currentStageKey 
    ? STAGE_NAMES[currentStageKey] || currentStageKey 
    : 'Pré-produção';

  // Deliverable stats
  const totalDeliverables = deliverables.length || 0;
  const awaitingReview = deliverables.filter(d => d.awaiting_approval).length;

  // Materials available (with URLs)
  const availableMaterials = deliverables.filter(
    d => d.youtube_url || d.external_url || d.file_url
  );

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getMaterialUrl = (material: PortalDeliverable): string | null => {
    return material.youtube_url || material.external_url || material.file_url || null;
  };

  const getMaterialIcon = (material: PortalDeliverable): string => {
    if (material.youtube_url) return 'smart_display';
    if (material.file_url) return 'description';
    return 'link';
  };

  const getMaterialColor = (material: PortalDeliverable): { bg: string; text: string } => {
    if (material.youtube_url) return { bg: 'bg-red-500/20', text: 'text-red-400' };
    if (material.file_url) return { bg: 'bg-blue-500/20', text: 'text-blue-400' };
    return { bg: 'bg-cyan-500/20', text: 'text-cyan-400' };
  };

  return (
    <div className="space-y-6">
      {/* Progress Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progresso */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-3">
            Progresso
          </p>
          <p className="text-3xl font-light text-white mb-1">{stageProgress}%</p>
          <p className="text-xs text-gray-500">{completedStages} de {totalStages} etapas concluídas</p>
        </div>

        {/* Etapa Atual */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-3">
            Etapa Atual
          </p>
          <p className="text-xl font-light text-cyan-400 mb-1">{currentStageName}</p>
          <p className="text-xs text-gray-500">Em andamento</p>
        </div>

        {/* Materiais Disponíveis */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-3">
            Materiais Prontos
          </p>
          <p className="text-3xl font-light text-emerald-400 mb-1">{availableMaterials.length}</p>
          <p className="text-xs text-gray-500">Disponíveis para acesso</p>
        </div>
      </div>

      {/* Available Materials Section */}
      {availableMaterials.length > 0 && (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a]">
          <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: 18 }}>
                folder_special
              </span>
              <h3 className="text-sm font-medium text-white">Materiais Disponíveis</h3>
            </div>
            <span className="text-xs text-gray-500">{availableMaterials.length} itens</span>
          </div>

          <div className="divide-y divide-[#1a1a1a]">
            {availableMaterials.slice(0, 4).map((material) => {
              const url = getMaterialUrl(material);
              const icon = getMaterialIcon(material);
              const colors = getMaterialColor(material);

              return (
                <div 
                  key={material.id}
                  onClick={() => url && handleOpenLink(url)}
                  className={cn(
                    "p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group",
                    url && "cursor-pointer"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors.bg)}>
                    <span className={cn("material-symbols-outlined", colors.text)} style={{ fontSize: 20 }}>
                      {icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
                      {material.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {material.type || 'Material'}
                    </p>
                  </div>
                  {url && (
                    <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                  )}
                </div>
              );
            })}
          </div>

          {availableMaterials.length > 4 && (
            <div className="p-4 border-t border-[#1a1a1a]">
              <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
                Ver todos os {availableMaterials.length} materiais
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status de Entregas */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a]">
        <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400" style={{ fontSize: 18 }}>
              checklist
            </span>
            <h3 className="text-sm font-medium text-white">Status de Entregas</h3>
          </div>
          <span className="text-xs text-gray-500">{totalDeliverables} Itens Contratados</span>
        </div>

        <div className="divide-y divide-[#1a1a1a]">
          {/* Awaiting Review Item */}
          {awaitingReview > 0 && (
            <div className="p-5 bg-amber-500/5 border-l-2 border-amber-400">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-amber-400 mt-0.5" style={{ fontSize: 20 }}>
                  rate_review
                </span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-white mb-1">
                    {awaitingReview} {awaitingReview === 1 ? 'entrega aguardando' : 'entregas aguardando'} revisão
                  </h4>
                  <p className="text-xs text-amber-400 font-medium mb-2">
                    Aguardando sua Revisão
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Material disponível para feedback imediato na aba 'Entregas'.
                  </p>
                  <Button 
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-black text-xs h-8 rounded-none font-medium"
                  >
                    Revisar Agora
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Delivery */}
          {totalDeliverables > 0 && (
            <div className="p-5">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-cyan-400 mt-0.5" style={{ fontSize: 20 }}>
                  movie_edit
                </span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-white mb-1">
                    Entregas em Produção
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">
                    {totalDeliverables - awaitingReview} itens em produção ou finalizados.
                  </p>
                  <span className="text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold bg-cyan-500/20 text-cyan-400">
                    Em Andamento
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalDeliverables === 0 && (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-gray-600 mb-2" style={{ fontSize: 32 }}>
                inventory_2
              </span>
              <p className="text-xs text-gray-500">
                Nenhuma entrega cadastrada ainda.
              </p>
            </div>
          )}
        </div>

        {totalDeliverables > 0 && (
          <div className="p-4 border-t border-[#1a1a1a]">
            <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
              Ver lista completa de {totalDeliverables} entregas
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Resumo Executivo */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a]">
        <div className="p-5 border-b border-[#1a1a1a] flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400" style={{ fontSize: 18 }}>
            summarize
          </span>
          <h3 className="text-sm font-medium text-white">Resumo Executivo</h3>
        </div>
        <div className="p-5">
          {project.description ? (
            <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
              {project.description.split('\n\n').slice(0, 2).map((paragraph, i) => (
                <p key={i}>{paragraph.substring(0, 400)}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 leading-relaxed">
              Este projeto audiovisual visa registrar e transmitir a magnitude do empreendimento através de uma narrativa cinematográfica completa.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export const PortalOverviewPremium = memo(PortalOverviewPremiumComponent);
