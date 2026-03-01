/**
 * PortalScheduleTab - Aba Cronograma do portal do cliente
 * 
 * Exibe cronograma visual das etapas do projeto
 */

import { memo } from "react";
import { format, differenceInDays, isAfter, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ProjectStage } from "@/hooks/useClientPortalEnhanced";

interface PortalScheduleTabProps {
  stages: ProjectStage[];
  dueDate?: string | null;
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

function PortalScheduleTabComponent({ stages, dueDate }: PortalScheduleTabProps) {
  const completedStages = stages.filter(s => s.status === 'done' || s.status === 'completed').length;
  const totalStages = stages.length || 1;
  const progress = Math.round((completedStages / totalStages) * 100);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  const getDaysRemaining = () => {
    if (!dueDate) return null;
    const days = differenceInDays(new Date(dueDate), new Date());
    return days;
  };

  const daysRemaining = getDaysRemaining();

  if (stages.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Cronograma não definido</h3>
        <p className="text-sm text-muted-foreground">
          O cronograma do projeto aparecerá aqui quando for configurado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="glass-card rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Progresso Geral</h3>
            <p className="text-[10px] text-muted-foreground">
              {completedStages} de {totalStages} etapas concluídas
            </p>
          </div>
          {daysRemaining !== null && (
            <Badge variant={daysRemaining < 0 ? "destructive" : daysRemaining < 7 ? "default" : "secondary"}>
              {daysRemaining < 0 
                ? `${Math.abs(daysRemaining)} dias de atraso`
                : daysRemaining === 0 
                  ? 'Entrega hoje!'
                  : `${daysRemaining} dias restantes`
              }
            </Badge>
          )}
        </div>

        <Progress value={progress} className="h-3 mb-2" />
        <p className="text-right text-sm font-bold text-foreground">{progress}%</p>

        {dueDate && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <span className="text-sm text-muted-foreground">Data de entrega prevista:</span>
            <span className="text-sm font-medium text-foreground">
              {formatDate(dueDate)}
            </span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="glass-card rounded-2xl p-4 md:p-6">
        <h3 className="font-semibold text-foreground mb-6">Cronograma de Etapas</h3>

        <div className="space-y-0">
          {stages.map((stage, index) => {
            const isCompleted = stage.status === 'done' || stage.status === 'completed';
            const isInProgress = stage.status === 'in_progress';
            const isLast = index === stages.length - 1;

            return (
              <div key={stage.id} className="relative flex gap-4">
                {/* Timeline connector */}
                {!isLast && (
                  <div className={cn(
                    "absolute left-4 top-10 w-0.5 h-full -translate-x-1/2",
                    isCompleted ? "bg-primary" : "bg-border"
                  )} />
                )}

                {/* Status icon */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0",
                  isCompleted ? "bg-primary text-white" :
                  isInProgress ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isInProgress ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={cn(
                      "font-medium",
                      isCompleted ? "text-primary" :
                      isInProgress ? "text-primary" :
                      "text-muted-foreground"
                    )}>
                      {stage.title || STAGE_NAMES[stage.stage_key] || stage.stage_key}
                    </span>
                    <Badge 
                      variant={isCompleted ? "default" : isInProgress ? "secondary" : "outline"}
                      className="text-[10px]"
                    >
                      {isCompleted ? 'Concluída' : isInProgress ? 'Em andamento' : 'Não iniciada'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    {stage.planned_start && (
                      <span>Início: {formatDate(stage.planned_start)}</span>
                    )}
                    {stage.planned_end && (
                      <>
                        <ArrowRight className="w-3 h-3" />
                        <span>Fim: {formatDate(stage.planned_end)}</span>
                      </>
                    )}
                  </div>

                  {/* Actual dates if completed */}
                  {isCompleted && stage.actual_end && (
                    <p className="text-[10px] text-primary mt-1">
                      Concluída em {formatDate(stage.actual_end)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const PortalScheduleTab = memo(PortalScheduleTabComponent);
