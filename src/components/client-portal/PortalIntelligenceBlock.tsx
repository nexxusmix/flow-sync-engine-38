/**
 * PortalIntelligenceBlock - Versão read-only simplificada das métricas preditivas
 * para o Portal do Cliente. Calcula indicadores baseados nos dados disponíveis
 * (stages, project info) sem acesso a tasks/revenues.
 */

import { memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Calendar, Activity, AlertTriangle, Clock } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProjectInfo, ProjectStage } from "@/hooks/useClientPortalEnhanced";
import { sc } from "@/lib/colors";

interface Props {
  project: ProjectInfo;
  stages: ProjectStage[];
}

const RISK_LABELS: Record<string, string> = {
  low: "Baixo",
  moderate: "Moderado",
  high: "Alto",
  critical: "Crítico",
};

function getRiskLabel(value: number) {
  if (value <= 25) return "Baixo";
  if (value <= 50) return "Moderado";
  if (value <= 75) return "Alto";
  return "Crítico";
}

function PortalIntelligenceBlockComponent({ project, stages }: Props) {
  const metrics = useMemo(() => {
    const now = new Date();
    const completed = stages.filter(s => s.status === "completed").length;
    const total = stages.length || 1;
    const progress = Math.round((completed / total) * 100);

    // Overdue stages risk
    const overdueStages = stages.filter(
      s => s.status !== "completed" && s.planned_end && new Date(s.planned_end) < now
    );
    const stageRisk = total > 0 ? (overdueStages.length / total) * 60 : 0;

    // Deadline risk
    const dueDate = project.due_date ? new Date(project.due_date) : null;
    let deadlineRisk = 0;
    let daysRemaining: number | null = null;
    let estimatedCompletion: Date | null = null;

    if (dueDate) {
      daysRemaining = differenceInCalendarDays(dueDate, now);
      const remainingStages = total - completed;
      
      // Estimate completion based on average stage duration
      const completedWithDates = stages.filter(
        s => s.status === "completed" && s.actual_start && s.actual_end
      );
      
      if (completedWithDates.length > 0) {
        const avgDuration = completedWithDates.reduce((sum, s) => {
          return sum + differenceInCalendarDays(new Date(s.actual_end!), new Date(s.actual_start!));
        }, 0) / completedWithDates.length;
        
        const estimatedDaysLeft = remainingStages * Math.max(avgDuration, 1);
        estimatedCompletion = new Date(now.getTime() + estimatedDaysLeft * 86400000);
      }

      if (daysRemaining < 0) {
        deadlineRisk = Math.min(Math.abs(daysRemaining) * 3, 40);
      } else if (estimatedCompletion && estimatedCompletion > dueDate) {
        deadlineRisk = Math.min(differenceInCalendarDays(estimatedCompletion, dueDate) * 2, 30);
      }
    }

    const delayRisk = Math.min(Math.round(stageRisk + deadlineRisk), 100);
    const health = project.health_score ?? 100;

    return {
      progress,
      delayRisk,
      daysRemaining,
      estimatedCompletion,
      health,
      completedStages: completed,
      totalStages: total,
      overdueCount: overdueStages.length,
    };
  }, [project, stages]);

  const riskStyle = sc.risk(metrics.delayRisk);
  const healthStyle = sc.score(metrics.health);

  const cards = [
    {
      label: "Progresso",
      value: `${metrics.progress}%`,
      icon: TrendingUp,
      colorClass: sc.score(metrics.progress).text,
      bgClass: sc.score(metrics.progress).bg,
      sub: `${metrics.completedStages}/${metrics.totalStages} etapas concluídas`,
    },
    {
      label: "Risco de Atraso",
      value: getRiskLabel(metrics.delayRisk),
      icon: AlertTriangle,
      colorClass: riskStyle.text,
      bgClass: riskStyle.bg,
      sub: metrics.overdueCount > 0 
        ? `${metrics.overdueCount} etapa(s) atrasada(s)` 
        : "Nenhuma etapa atrasada",
    },
    {
      label: "Previsão de Entrega",
      value: metrics.estimatedCompletion
        ? format(metrics.estimatedCompletion, "dd MMM", { locale: ptBR })
        : project.due_date
          ? format(new Date(project.due_date), "dd MMM", { locale: ptBR })
          : "—",
      icon: Calendar,
      colorClass: metrics.estimatedCompletion && project.due_date && metrics.estimatedCompletion > new Date(project.due_date)
        ? sc.status("overdue").text
        : sc.status("active").text,
      bgClass: metrics.estimatedCompletion && project.due_date && metrics.estimatedCompletion > new Date(project.due_date)
        ? sc.status("overdue").bg
        : sc.status("active").bg,
      sub: metrics.daysRemaining !== null
        ? metrics.daysRemaining >= 0
          ? `${metrics.daysRemaining} dias restantes`
          : `${Math.abs(metrics.daysRemaining)} dias de atraso`
        : "Prazo não definido",
    },
    {
      label: "Saúde do Projeto",
      value: `${metrics.health}%`,
      icon: Activity,
      colorClass: healthStyle.text,
      bgClass: healthStyle.bg,
      sub: metrics.health >= 75 ? "Saudável" : metrics.health >= 50 ? "Atenção" : "Em risco",
    },
  ];

  // Show deadline alert banner if risk is high
  const showAlert = metrics.delayRisk > 50 || (metrics.daysRemaining !== null && metrics.daysRemaining < 0);

  return (
    <div className="space-y-3">
      {/* Deadline Alert Banner */}
      {showAlert && (
        <div className={`border rounded-xl p-3 flex items-start gap-3 ${
          metrics.daysRemaining !== null && metrics.daysRemaining < 0 
            ? "bg-destructive/10 border-destructive/30" 
            : "bg-muted border-border"
        }`}>
          <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
            metrics.daysRemaining !== null && metrics.daysRemaining < 0 
              ? "text-destructive" 
              : "text-muted-foreground"
          }`} />
          <div className="text-xs">
            <span className="font-semibold text-foreground">
              {metrics.daysRemaining !== null && metrics.daysRemaining < 0
                ? `Projeto com ${Math.abs(metrics.daysRemaining)} dias de atraso`
                : "Atenção: risco de atraso detectado"}
            </span>
            {metrics.estimatedCompletion && (
              <span className="text-muted-foreground ml-1">
                · Conclusão prevista: {format(metrics.estimatedCompletion, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Intelligence Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="glass-card rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg ${card.bgClass} flex items-center justify-center`}>
                <card.icon className={`w-3.5 h-3.5 ${card.colorClass}`} />
              </div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
                {card.label}
              </span>
            </div>
            <p className={`text-lg font-bold ${card.colorClass}`}>{card.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const PortalIntelligenceBlock = memo(PortalIntelligenceBlockComponent);
