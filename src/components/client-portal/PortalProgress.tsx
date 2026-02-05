import { Project } from "@/types/projects";
import { PROJECT_STAGES } from "@/data/projectTemplates";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface PortalProgressProps {
  project: Project;
}

export function PortalProgress({ project }: PortalProgressProps) {
  const visibleStages = PROJECT_STAGES.filter(stage =>
    project.stages.some(s => s.type === stage.type)
  );

  const currentStageIndex = visibleStages.findIndex(s => s.type === project.currentStage);

  return (
    <section className="glass-card rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-foreground mb-6">Progresso do Projeto</h2>

      {/* Desktop Timeline */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-border">
            <div 
              className="h-full bg-primary transition-all"
              style={{ 
                width: `${((currentStageIndex + 1) / visibleStages.length) * 100}%` 
              }}
            />
          </div>

          {/* Stage Nodes */}
          <div className="relative flex justify-between">
            {visibleStages.map((stage, index) => {
              const projectStage = project.stages.find(s => s.type === stage.type);
              const isCompleted = projectStage?.status === 'concluido';
              const isCurrent = project.currentStage === stage.type;
              const isPending = index > currentStageIndex;

              return (
                <div key={stage.type} className="flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center z-10
                    ${isCompleted ? 'bg-emerald-500' : ''}
                    ${isCurrent ? 'bg-primary ring-4 ring-primary/20' : ''}
                    ${isPending ? 'bg-muted' : ''}
                  `}>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                    {isCurrent && <Circle className="w-3 h-3 text-white fill-current" />}
                    {isPending && <Clock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <span className={`
                    text-xs mt-2 text-center max-w-[80px]
                    ${isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'}
                  `}>
                    {stage.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Timeline */}
      <div className="md:hidden space-y-3">
        {visibleStages.map((stage, index) => {
          const projectStage = project.stages.find(s => s.type === stage.type);
          const isCompleted = projectStage?.status === 'concluido';
          const isCurrent = project.currentStage === stage.type;
          const isPending = index > currentStageIndex;

          return (
            <div 
              key={stage.type}
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-colors
                ${isCurrent ? 'bg-primary/10 border border-primary/30' : ''}
                ${isCompleted ? 'opacity-60' : ''}
              `}
            >
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                ${isCompleted ? 'bg-emerald-500' : ''}
                ${isCurrent ? 'bg-primary' : ''}
                ${isPending ? 'bg-muted' : ''}
              `}>
                {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                {isCurrent && <Circle className="w-2 h-2 text-white fill-current" />}
              </div>
              <span className={`
                text-sm
                ${isCurrent ? 'text-foreground font-medium' : ''}
                ${isCompleted ? 'text-muted-foreground line-through' : ''}
                ${isPending ? 'text-muted-foreground' : ''}
              `}>
                {stage.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
