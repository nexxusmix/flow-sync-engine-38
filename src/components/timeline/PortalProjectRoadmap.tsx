/**
 * PortalProjectRoadmap – Clean, client-facing roadmap for the portal.
 * Shows simplified project progress, stages, and next steps.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2, Circle, Clock, ArrowRight, Sparkles, Flag,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PortalStage {
  id: string;
  name: string;
  status: "not_started" | "in_progress" | "done" | "blocked";
  plannedEnd?: string;
  progress: number;
  description?: string;
}

interface PortalProjectRoadmapProps {
  stages: PortalStage[];
  projectName?: string;
  dueDate?: string | null;
  className?: string;
}

export const PortalProjectRoadmap = memo(function PortalProjectRoadmap({
  stages,
  projectName,
  dueDate,
  className,
}: PortalProjectRoadmapProps) {
  const overallProgress = useMemo(() => {
    if (stages.length === 0) return 0;
    const doneCount = stages.filter((s) => s.status === "done").length;
    const inProgressBonus = stages
      .filter((s) => s.status === "in_progress")
      .reduce((sum, s) => sum + s.progress * 0.01, 0);
    return Math.round(((doneCount + inProgressBonus) / stages.length) * 100);
  }, [stages]);

  const currentStage = stages.find((s) => s.status === "in_progress");
  const nextStage = stages.find((s) => s.status === "not_started");

  return (
    <div className={cn("rounded-2xl border border-border/20 bg-card overflow-hidden", className)}>
      {/* Header */}
      <div className="px-5 py-5 border-b border-border/10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Andamento do Projeto</h3>
        </div>

        {/* Circular progress */}
        <div className="relative w-20 h-20 mx-auto mb-3">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeDasharray={`${(overallProgress / 100) * 264} 264`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-foreground">{overallProgress}%</span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {stages.filter((s) => s.status === "done").length} de {stages.length} etapas concluídas
        </p>
        {dueDate && (
          <p className={cn(
            "text-[10px] mt-1",
            isPast(new Date(dueDate)) ? "text-destructive" : "text-muted-foreground"
          )}>
            Previsão: {format(new Date(dueDate), "dd 'de' MMMM", { locale: ptBR })}
          </p>
        )}
      </div>

      {/* Stages list */}
      <div className="px-5 py-4">
        <div className="space-y-0">
          {stages.map((stage, idx) => {
            const isCurrent = stage.status === "in_progress";
            const isDone = stage.status === "done";
            const isLast = idx === stages.length - 1;

            return (
              <div key={stage.id} className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className={cn(
                    "flex gap-3 py-3 relative",
                    isCurrent && "bg-primary/[0.03] -mx-3 px-3 rounded-xl"
                  )}
                >
                  {/* Connector line */}
                  {!isLast && (
                    <div className={cn(
                      "absolute left-[13px] top-[38px] bottom-0 w-px",
                      isDone ? "bg-primary/30" : "bg-border/30"
                    )} />
                  )}

                  {/* Icon */}
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border z-10 transition-all",
                    isDone
                      ? "bg-primary/10 border-primary/30"
                      : isCurrent
                      ? "bg-primary/10 border-primary/40 ring-2 ring-primary/20 ring-offset-1 ring-offset-card"
                      : "bg-muted/20 border-border/50"
                  )}>
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    ) : isCurrent ? (
                      <Clock className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className={cn(
                      "text-xs font-medium",
                      isDone ? "text-muted-foreground" : isCurrent ? "text-foreground" : "text-foreground/50"
                    )}>
                      {stage.name}
                    </p>

                    {isCurrent && stage.progress > 0 && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <Progress value={stage.progress} className="flex-1 h-1" />
                        <span className="text-[10px] text-primary font-medium">{stage.progress}%</span>
                      </div>
                    )}

                    {isCurrent && (
                      <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        Em andamento
                      </p>
                    )}

                    {stage.plannedEnd && !isDone && (
                      <p className={cn(
                        "text-[10px] mt-0.5",
                        isPast(new Date(stage.plannedEnd)) && !isDone
                          ? "text-destructive"
                          : "text-muted-foreground/60"
                      )}>
                        Previsão: {format(new Date(stage.plannedEnd), "dd/MM")}
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next step callout */}
      {(currentStage || nextStage) && (
        <div className="px-5 py-3 border-t border-border/10 bg-primary/[0.02]">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            {currentStage ? "Etapa atual" : "Próxima etapa"}
          </p>
          <p className="text-xs font-medium text-foreground">
            {currentStage?.name || nextStage?.name}
          </p>
        </div>
      )}
    </div>
  );
});
