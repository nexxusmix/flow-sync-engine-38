import { cn } from "@/lib/utils";
import { Clock, Zap, Play } from "lucide-react";
import type { ExecutionPlan } from "@/hooks/useExecutionPlans";

interface ExecutionPlanBadgeProps {
  plan: ExecutionPlan;
  compact?: boolean;
}

const ENERGY_CONFIG = {
  baixa: { label: "Baixa", color: "text-primary/60" },
  media: { label: "Média", color: "text-primary" },
  alta: { label: "Alta", color: "text-destructive" },
} as const;

const MODE_CONFIG = {
  deep_work: { label: "Deep Work", emoji: "🧠" },
  admin: { label: "Admin", emoji: "📋" },
  criativo: { label: "Criativo", emoji: "🎨" },
  comunicacao: { label: "Comunicação", emoji: "💬" },
} as const;

export function ExecutionPlanBadge({ plan, compact = false }: ExecutionPlanBadgeProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
        {plan.estimate_min != null && plan.estimate_max != null && (
          <span className="inline-flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {plan.estimate_min}–{plan.estimate_max}min
          </span>
        )}
        {plan.energy_level && (
          <span className={cn("inline-flex items-center gap-0.5", ENERGY_CONFIG[plan.energy_level].color)}>
            <Zap className="w-2.5 h-2.5" />
            {ENERGY_CONFIG[plan.energy_level].label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 mt-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      <div className="flex items-center gap-3 flex-wrap text-[11px]">
        {plan.estimate_min != null && plan.estimate_max != null && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            {plan.estimate_min}–{plan.estimate_max} min
          </span>
        )}
        {plan.energy_level && (
          <span className={cn("inline-flex items-center gap-1", ENERGY_CONFIG[plan.energy_level].color)}>
            <Zap className="w-3 h-3" />
            Energia: {ENERGY_CONFIG[plan.energy_level].label}
          </span>
        )}
        {plan.work_mode && (
          <span className="text-muted-foreground">
            {MODE_CONFIG[plan.work_mode].emoji} {MODE_CONFIG[plan.work_mode].label}
          </span>
        )}
      </div>
      {plan.next_action && (
        <div className="flex items-start gap-1.5 text-[11px] text-primary/80">
          <Play className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span className="font-light leading-snug">{plan.next_action}</span>
        </div>
      )}
    </div>
  );
}
