/**
 * PortalOverviewPremium - Visão Geral do portal idêntica ao HTML de referência
 * Layout com cards de progresso, status de entregas e resumo executivo
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, CheckCircle2, Circle } from "lucide-react";
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
  hasPaymentBlock,
}: PortalOverviewPremiumProps) {
  const currentStageKey = project.stage_current;
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const totalStages = stages.length || 9;
  const stageProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  const currentStageName = currentStageKey 
    ? STAGE_NAMES[currentStageKey] || currentStageKey 
    : 'Pré-produção';

  // Deliverable stats
  const totalDeliverables = deliverables.length || 19;
  const awaitingReview = deliverables.filter(d => d.awaiting_approval).length;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
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
            <p className="text-xs text-gray-500">Aguardando Briefing</p>
          </div>

          {/* Ação Requerida */}
          <div className={cn(
            "border p-5",
            hasPaymentBlock 
              ? "bg-red-500/5 border-red-500/30" 
              : "bg-[#0a0a0a] border-[#1a1a1a]"
          )}>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-3">
              Ação Requerida
            </p>
            {hasPaymentBlock ? (
              <>
                <p className="text-lg font-light text-red-400 mb-2">Regularizar Pendência</p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-400 hover:text-red-300 text-xs h-auto p-0 underline"
                >
                  Ver Fatura
                </Button>
              </>
            ) : (
              <>
                <p className="text-lg font-light text-emerald-400 mb-1">Nenhuma ação</p>
                <p className="text-xs text-gray-500">Tudo em dia</p>
              </>
            )}
          </div>
        </div>

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
                      Roteiro & Narrative Board
                    </h4>
                    <p className="text-xs text-amber-400 font-medium mb-2">
                      Aguardando sua Revisão
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Material disponível para feedback imediato na aba 'Revisões'.
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

            {/* Blocked Delivery */}
            {hasPaymentBlock && (
              <div className="p-5 opacity-60">
                <div className="flex items-start gap-4">
                  <Lock className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white mb-1">
                      01 Vídeo Lançamento (Final)
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">
                      Entrega final bloqueada por pendência financeira.
                    </p>
                    <span className="text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold bg-gray-800 text-gray-400">
                      Bloqueado
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Scheduled Delivery */}
            <div className="p-5">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-cyan-400 mt-0.5" style={{ fontSize: 20 }}>
                  movie_edit
                </span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-white mb-1">
                    Captação de Imagens (Obra)
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">
                    Agendado para Fevereiro/2026. 02 profissionais + Drone.
                  </p>
                  <span className="text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold bg-cyan-500/20 text-cyan-400">
                    Em Fila
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#1a1a1a]">
            <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
              Ver lista completa de {totalDeliverables} entregas
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
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
                Este projeto audiovisual visa registrar e transmitir a magnitude do empreendimento através de uma narrativa cinematográfica completa. A produção será conduzida pela SQUAD FILM, utilizando equipamentos de qualidade Cinema 4K e drone.
              </p>
            )}
            <p className="text-sm text-gray-400 leading-relaxed mt-4">
              O foco principal é o registro emocional e técnico do lançamento, garantindo que todos os diferenciais arquitetônicos sejam capturados com a estética industrial e moderna solicitada pelo cliente.
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar will be rendered by parent */}
    </div>
  );
}

export const PortalOverviewPremium = memo(PortalOverviewPremiumComponent);
