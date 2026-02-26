import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Brain, RefreshCw, Pin, PinOff, Loader2, Clock, Zap, Play,
  CheckCircle2, Coffee, Sun, AlertTriangle, Sparkles, CalendarClock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutionPlan } from "@/hooks/useExecutionPlans";
import type { Task } from "@/hooks/useTasksUnified";
import { isPast, parseISO } from "date-fns";

interface ExecutionPlanPanelProps {
  task: Task;
  plan: ExecutionPlan | null;
  isGenerating: boolean;
  onGenerate: (task: Task & { is_overdue?: boolean }) => Promise<unknown>;
  onUpdate: (taskId: string, updates: Partial<ExecutionPlan>) => void;
  onTogglePin: (taskId: string) => void;
}

const ENERGY_CONFIG = {
  baixa: { label: "Baixa", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  media: { label: "Média", color: "text-amber-400", bg: "bg-amber-500/10" },
  alta: { label: "Alta", color: "text-red-400", bg: "bg-red-500/10" },
};

const MODE_CONFIG = {
  deep_work: { label: "Deep Work", icon: Brain, color: "text-violet-400" },
  admin: { label: "Admin", icon: CheckCircle2, color: "text-blue-400" },
  criativo: { label: "Criativo", icon: Sparkles, color: "text-pink-400" },
  comunicacao: { label: "Comunicação", icon: Coffee, color: "text-cyan-400" },
};

export function ExecutionPlanPanel({
  task, plan, isGenerating, onGenerate, onUpdate, onTogglePin,
}: ExecutionPlanPanelProps) {
  const [notes, setNotes] = useState(plan?.user_notes || "");
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== "done";

  const handleGenerate = () => {
    onGenerate({ ...task, is_overdue: !!isOverdue });
  };

  const handleNotesBlur = () => {
    if (plan && notes !== (plan.user_notes || "")) {
      onUpdate(task.id, { user_notes: notes || null });
    }
  };

  const toggleStep = (idx: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const microSteps = plan?.micro_steps || [];
  const stepsTotal = microSteps.length;
  const stepsDone = checkedSteps.size;

  return (
    <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Plano de Execução (IA)</span>
          {plan?.emergency_mode && (
            <Badge variant="destructive" className="text-[9px] h-4">
              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
              Emergência
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {plan && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onTogglePin(task.id)}
              title={plan.pinned ? "Desafixar (permitir regeneração)" : "Fixar (impedir sobrescrita)"}
            >
              {plan.pinned ? <Pin className="w-3.5 h-3.5 text-primary" /> : <PinOff className="w-3.5 h-3.5 text-muted-foreground" />}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1"
            onClick={handleGenerate}
            disabled={isGenerating || (plan?.pinned ?? false)}
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : plan ? (
              <RefreshCw className="w-3 h-3" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {plan ? "Regenerar" : "Gerar"}
          </Button>
        </div>
      </div>

      {/* Content */}
      {plan ? (
        <div className="space-y-3">
          {/* Metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {plan.estimate_min != null && plan.estimate_max != null && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">{plan.estimate_min}–{plan.estimate_max}min</p>
                  <p className="text-[9px] text-muted-foreground">Estimativa</p>
                </div>
              </div>
            )}
            {plan.energy_level && (
              <div className={cn("flex items-center gap-1.5 p-2 rounded-lg border border-white/[0.04]", ENERGY_CONFIG[plan.energy_level].bg)}>
                <Zap className={cn("w-3.5 h-3.5", ENERGY_CONFIG[plan.energy_level].color)} />
                <div>
                  <p className={cn("text-xs font-medium", ENERGY_CONFIG[plan.energy_level].color)}>
                    {ENERGY_CONFIG[plan.energy_level].label}
                  </p>
                  <p className="text-[9px] text-muted-foreground">Energia</p>
                </div>
              </div>
            )}
            {plan.work_mode && (() => {
              const cfg = MODE_CONFIG[plan.work_mode];
              const Icon = cfg.icon;
              return (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                  <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                  <div>
                    <p className="text-xs font-medium">{cfg.label}</p>
                    <p className="text-[9px] text-muted-foreground">Modo</p>
                  </div>
                </div>
              );
            })()}
            {plan.cognitive_load != null && (
              <div className="flex flex-col gap-1 p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Carga Cognitiva</span>
                  <span className="text-xs font-medium">{plan.cognitive_load}%</span>
                </div>
                <Progress value={plan.cognitive_load} className="h-1" />
              </div>
            )}
          </div>

          {/* Next action */}
          {plan.next_action && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Play className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-primary/60 mb-0.5">Próximo passo (2 min)</p>
                <p className="text-sm text-foreground leading-snug">{plan.next_action}</p>
              </div>
            </div>
          )}

          {/* Micro steps — now checkable */}
          {stepsTotal > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Micro-passos</p>
                <span className="text-[10px] text-muted-foreground font-mono">{stepsDone}/{stepsTotal}</span>
              </div>
              {stepsTotal > 1 && (
                <Progress value={(stepsDone / stepsTotal) * 100} className="h-1 mb-2" />
              )}
              <div className="space-y-1.5">
                {microSteps.map((step, i) => {
                  const isDone = checkedSteps.has(i);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-2 text-xs cursor-pointer group rounded-md p-1.5 -mx-1.5 transition-colors hover:bg-white/[0.03]",
                        isDone && "opacity-60"
                      )}
                      onClick={() => toggleStep(i)}
                    >
                      <Checkbox
                        checked={isDone}
                        onCheckedChange={() => toggleStep(i)}
                        className="mt-0.5 shrink-0"
                      />
                      <span className={cn("leading-snug", isDone && "line-through text-muted-foreground")}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Definition of Done */}
          {plan.definition_of_done?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Critérios de Conclusão</p>
              <div className="space-y-1">
                {plan.definition_of_done.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-foreground/70">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500/50 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Break + Time slot */}
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            {plan.break_pattern && (
              <span className="inline-flex items-center gap-1">
                <Coffee className="w-3 h-3" />
                Pausa: {plan.break_pattern}
              </span>
            )}
            {plan.suggested_time_slot && (
              <span className="inline-flex items-center gap-1">
                <Sun className="w-3 h-3" />
                {plan.suggested_time_slot}
              </span>
            )}
          </div>

          {/* User notes */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Minhas notas</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              rows={2}
              className="text-xs bg-white/[0.02] border-white/[0.06] resize-none"
              placeholder="Adicionar notas pessoais..."
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Gere um plano de execução inteligente com IA
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            Baseado em neurociência e ciência de produtividade
          </p>
        </div>
      )}
    </div>
  );
}
