import { cn } from "@/lib/utils";
import type { OnboardingPhase } from "@/hooks/useClientOnboarding";

interface Props {
  phases: OnboardingPhase[];
  onToggleStep: (stepId: string, completed: boolean) => void;
}

export function OnboardingPhases({ phases, onToggleStep }: Props) {
  return (
    <div className="space-y-4 mt-4">
      {phases.map((phase, idx) => {
        const totalSteps = phase.steps?.length || 0;
        const doneSteps = phase.steps?.filter((s) => s.is_completed).length || 0;
        const allDone = totalSteps > 0 && doneSteps === totalSteps;

        return (
          <div key={phase.id} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Phase header */}
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 border-b border-border",
              allDone && "bg-emerald-500/5"
            )}>
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                allDone ? "bg-emerald-500/20 text-emerald-600" : "bg-primary/10 text-primary"
              )}>
                {allDone ? (
                  <span className="material-symbols-rounded text-sm">check</span>
                ) : (
                  idx + 1
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground">{phase.title}</h3>
                {phase.description && <p className="text-xs text-muted-foreground">{phase.description}</p>}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{doneSteps}/{totalSteps}</span>
            </div>

            {/* Steps */}
            {phase.steps && phase.steps.length > 0 && (
              <div className="divide-y divide-border/50">
                {phase.steps.map((step) => (
                  <label key={step.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={step.is_completed}
                      onChange={() => onToggleStep(step.id, !step.is_completed)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
                    />
                    <span className={cn(
                      "text-sm transition-all",
                      step.is_completed ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {step.title}
                    </span>
                    {step.is_required && !step.is_completed && (
                      <span className="text-[9px] uppercase tracking-wider text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">obrigatório</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
