/**
 * EntityScheduleRoadmap – Macro schedule/roadmap view.
 * Shows stages, milestones, dependencies and progress for a project.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { format, differenceInDays, isAfter, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2, Circle, Clock, Lock, AlertTriangle, ArrowRight,
  Flag, GitBranch, Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface RoadmapStage {
  id: string;
  name: string;
  status: "not_started" | "in_progress" | "done" | "blocked";
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  ownerName?: string;
  progress: number;
  tasks?: { total: number; done: number };
  dependsOn?: string[];
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  date: string;
  type: "delivery" | "review" | "payment" | "internal" | "start" | "end";
  isCompleted?: boolean;
  linkedStageId?: string;
}

interface EntityScheduleRoadmapProps {
  stages: RoadmapStage[];
  milestones?: RoadmapMilestone[];
  currentStageId?: string;
  projectName?: string;
  hasPaymentBlock?: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  not_started: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted/30", label: "Não iniciada" },
  in_progress: { icon: Clock, color: "text-primary", bg: "bg-primary/10", label: "Em andamento" },
  done: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10", label: "Concluída" },
  blocked: { icon: Lock, color: "text-destructive", bg: "bg-destructive/10", label: "Bloqueada" },
};

export const EntityScheduleRoadmap = memo(function EntityScheduleRoadmap({
  stages,
  milestones = [],
  currentStageId,
  projectName,
  hasPaymentBlock,
  className,
}: EntityScheduleRoadmapProps) {
  const today = new Date();

  const overallProgress = useMemo(() => {
    if (stages.length === 0) return 0;
    return Math.round(stages.reduce((sum, s) => sum + s.progress, 0) / stages.length);
  }, [stages]);

  const completedStages = stages.filter((s) => s.status === "done").length;
  const delayedStages = stages.filter(
    (s) => s.plannedEnd && isPast(new Date(s.plannedEnd)) && s.status !== "done"
  ).length;

  return (
    <div className={cn("rounded-2xl border border-border/20 bg-card overflow-hidden", className)}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Cronograma</h3>
            {projectName && (
              <span className="text-xs text-muted-foreground">· {projectName}</span>
            )}
          </div>
          {hasPaymentBlock && (
            <Badge variant="destructive" className="text-[10px] gap-1">
              <Lock className="w-3 h-3" /> Bloqueado
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <Progress value={overallProgress} className="flex-1 h-1.5" />
          <span className="text-xs text-muted-foreground font-medium">{overallProgress}%</span>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
          <span>{completedStages}/{stages.length} etapas</span>
          {delayedStages > 0 && (
            <span className="text-destructive flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3" /> {delayedStages} atrasada(s)
            </span>
          )}
          {milestones.length > 0 && (
            <span className="flex items-center gap-0.5">
              <Flag className="w-3 h-3" /> {milestones.length} marco(s)
            </span>
          )}
        </div>
      </div>

      {/* Stages */}
      <div className="relative px-5 py-4">
        {/* Vertical connector */}
        <div className="absolute left-[39px] top-4 bottom-4 w-px bg-border/30" />

        <div className="space-y-0">
          {stages.map((stage, idx) => {
            const config = STATUS_CONFIG[stage.status];
            const StatusIcon = config.icon;
            const isCurrent = stage.id === currentStageId || stage.status === "in_progress";
            const isDelayed =
              stage.plannedEnd &&
              isPast(new Date(stage.plannedEnd)) &&
              stage.status !== "done";
            const delayDays = isDelayed
              ? differenceInDays(today, new Date(stage.plannedEnd!))
              : 0;

            // Find milestones for this stage
            const stageMilestones = milestones.filter(
              (m) => m.linkedStageId === stage.id
            );

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "relative flex gap-3 py-3 group",
                  isCurrent && "bg-primary/[0.02] -mx-5 px-5 rounded-xl"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border z-10 transition-all",
                    stage.status === "done"
                      ? "bg-primary/10 border-primary/30"
                      : stage.status === "blocked"
                      ? "bg-destructive/10 border-destructive/30"
                      : isCurrent
                      ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20"
                      : "bg-muted/30 border-border"
                  )}
                >
                  <StatusIcon
                    className={cn(
                      "w-3.5 h-3.5",
                      stage.status === "done"
                        ? "text-primary"
                        : stage.status === "blocked"
                        ? "text-destructive"
                        : isCurrent
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p
                      className={cn(
                        "text-xs font-medium",
                        stage.status === "done"
                          ? "text-muted-foreground"
                          : isCurrent
                          ? "text-foreground"
                          : "text-foreground/70"
                      )}
                    >
                      {stage.name}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] px-1 py-0",
                        stage.status === "done" && "border-primary/20 text-primary",
                        stage.status === "blocked" && "border-destructive/20 text-destructive",
                        isCurrent && stage.status !== "blocked" && "border-primary/30 text-primary"
                      )}
                    >
                      {config.label}
                    </Badge>
                    {isDelayed && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0">
                        +{delayDays}d atraso
                      </Badge>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    {stage.plannedStart && stage.plannedEnd && (
                      <span>
                        {format(new Date(stage.plannedStart), "dd MMM", { locale: ptBR })} →{" "}
                        {format(new Date(stage.plannedEnd), "dd MMM", { locale: ptBR })}
                      </span>
                    )}
                    {stage.ownerName && (
                      <>
                        <span>·</span>
                        <span>{stage.ownerName}</span>
                      </>
                    )}
                    {stage.tasks && (
                      <>
                        <span>·</span>
                        <span>
                          {stage.tasks.done}/{stage.tasks.total} tarefas
                        </span>
                      </>
                    )}
                  </div>

                  {/* Progress for in_progress */}
                  {stage.status === "in_progress" && stage.progress > 0 && (
                    <Progress value={stage.progress} className="mt-2 h-1" />
                  )}

                  {/* Stage milestones */}
                  {stageMilestones.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {stageMilestones.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-1.5 text-[10px]"
                        >
                          <Flag
                            className={cn(
                              "w-3 h-3",
                              m.isCompleted
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                          <span
                            className={cn(
                              m.isCompleted
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            )}
                          >
                            {m.title}
                          </span>
                          <span className="text-muted-foreground/50">
                            {format(new Date(m.date), "dd/MM")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dependencies */}
                  {stage.dependsOn && stage.dependsOn.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/60">
                      <GitBranch className="w-3 h-3" />
                      <span>
                        Depende de:{" "}
                        {stage.dependsOn
                          .map((depId) => {
                            const dep = stages.find((s) => s.id === depId);
                            return dep?.name || depId;
                          })
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
