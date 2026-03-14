/**
 * PortalProjectStages - Timeline visual das etapas do projeto
 * 
 * Exibe um pipeline horizontal/vertical com:
 * - Etapas concluídas (verde)
 * - Etapa em andamento (azul/primária)
 * - Etapas não iniciadas (cinza)
 */

import { memo } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectStage } from "@/hooks/useClientPortalEnhanced";

interface PortalProjectStagesProps {
  stages: ProjectStage[];
  currentStageKey?: string | null;
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

// Default stages if none exist
const DEFAULT_STAGES = [
  { key: 'briefing', title: 'Briefing' },
  { key: 'roteiro', title: 'Roteiro' },
  { key: 'pre_producao', title: 'Pré-Produção' },
  { key: 'captacao', title: 'Captação' },
  { key: 'edicao', title: 'Edição' },
  { key: 'revisao', title: 'Revisão' },
  { key: 'aprovacao', title: 'Aprovação' },
  { key: 'entrega', title: 'Entrega' },
  { key: 'pos_venda', title: 'Pós-Venda' },
];

function PortalProjectStagesComponent({ stages, currentStageKey }: PortalProjectStagesProps) {
  // Use provided stages or defaults
  const displayStages = stages.length > 0 ? stages : DEFAULT_STAGES.map((d, i) => ({
    id: `default-${i}`,
    project_id: '',
    title: d.title,
    stage_key: d.key,
    order_index: i,
    status: currentStageKey === d.key ? 'in_progress' : 
            (currentStageKey && DEFAULT_STAGES.findIndex(s => s.key === currentStageKey) > i) ? 'completed' : 
            'not_started',
    planned_start: null,
    planned_end: null,
    actual_start: null,
    actual_end: null,
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-primary" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground/50" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'in_progress':
        return 'Em andamento';
      default:
        return 'Não iniciada';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-semibold text-foreground mb-1">Etapas do Projeto</h3>
      <p className="text-xs text-muted-foreground mb-6">Fluxo de Produção</p>

      {/* Desktop: Horizontal Timeline */}
      <div className="hidden md:block overflow-x-auto pb-2">
        <div className="flex items-center min-w-max">
          {displayStages.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2",
                  stage.status === 'completed' && "bg-emerald-500/20 border-emerald-500",
                  stage.status === 'in_progress' && "bg-primary/20 border-primary",
                  stage.status === 'not_started' && "bg-muted/50 border-muted-foreground/30"
                )}>
                  {getStatusIcon(stage.status)}
                </div>
                <div className="mt-2 text-center max-w-[80px]">
                  <p className={cn(
                    "text-xs font-medium truncate",
                    stage.status === 'completed' && "text-emerald-500",
                    stage.status === 'in_progress' && "text-primary",
                    stage.status === 'not_started' && "text-muted-foreground"
                  )}>
                    {stage.title || STAGE_NAMES[stage.stage_key] || stage.stage_key}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {getStatusLabel(stage.status)}
                  </p>
                </div>
              </div>
              {index < displayStages.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-1",
                  stage.status === 'completed' ? "bg-emerald-500" : "bg-muted-foreground/30"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical Timeline */}
      <div className="md:hidden space-y-0">
        {displayStages.map((stage, index) => (
          <div key={stage.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0",
                stage.status === 'completed' && "bg-emerald-500/20 border-emerald-500",
                stage.status === 'in_progress' && "bg-primary/20 border-primary",
                stage.status === 'not_started' && "bg-muted/50 border-muted-foreground/30"
              )}>
                {getStatusIcon(stage.status)}
              </div>
              {index < displayStages.length - 1 && (
                <div className={cn(
                  "w-0.5 h-6 my-1",
                  stage.status === 'completed' ? "bg-emerald-500" : "bg-muted-foreground/30"
                )} />
              )}
            </div>
            <div className="pt-1 pb-4">
              <p className={cn(
                "text-sm font-medium",
                stage.status === 'completed' && "text-emerald-500",
                stage.status === 'in_progress' && "text-primary",
                stage.status === 'not_started' && "text-muted-foreground"
              )}>
                {stage.title || STAGE_NAMES[stage.stage_key] || stage.stage_key}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {getStatusLabel(stage.status)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const PortalProjectStages = memo(PortalProjectStagesComponent);
