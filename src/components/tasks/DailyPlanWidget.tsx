import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Clock, Zap, Coffee, AlertTriangle, Play,
  CheckCircle2, Sun, CalendarClock, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Task } from "@/hooks/useTasksUnified";
import type { ExecutionPlan } from "@/hooks/useExecutionPlans";

interface DailyPlanWidgetProps {
  todayTasks: Task[];
  plans: ExecutionPlan[];
  getPlanForTask: (taskId: string) => ExecutionPlan | null;
}

const MODE_LABELS: Record<string, { label: string; color: string }> = {
  deep_work: { label: "Deep Work", color: "text-violet-400" },
  admin: { label: "Admin", color: "text-blue-400" },
  criativo: { label: "Criativo", color: "text-pink-400" },
  comunicacao: { label: "Comunicação", color: "text-cyan-400" },
};

const ENERGY_COLORS = {
  baixa: "bg-emerald-500",
  media: "bg-amber-500",
  alta: "bg-red-500",
};

export function DailyPlanWidget({ todayTasks, plans, getPlanForTask }: DailyPlanWidgetProps) {
  const dailyMetrics = useMemo(() => {
    const tasksWithPlans = todayTasks
      .map(t => ({ task: t, plan: getPlanForTask(t.id) }))
      .filter((tp): tp is { task: Task; plan: ExecutionPlan } => tp.plan !== null);

    const totalMinMin = tasksWithPlans.reduce((s, tp) => s + (tp.plan.estimate_min || 0), 0);
    const totalMinMax = tasksWithPlans.reduce((s, tp) => s + (tp.plan.estimate_max || 0), 0);
    const avgCognitiveLoad = tasksWithPlans.length > 0
      ? Math.round(tasksWithPlans.reduce((s, tp) => s + (tp.plan.cognitive_load || 50), 0) / tasksWithPlans.length)
      : 0;

    // Group by work_mode
    const modeGroups: Record<string, typeof tasksWithPlans> = {};
    tasksWithPlans.forEach(tp => {
      const mode = tp.plan.work_mode || "admin";
      if (!modeGroups[mode]) modeGroups[mode] = [];
      modeGroups[mode].push(tp);
    });

    // Overload risk
    const overloadRisk = totalMinMax > 480 ? "alto" : totalMinMax > 360 ? "medio" : "baixo";

    // Suggested order: high energy first (morning), low energy last
    const energyOrder = { alta: 0, media: 1, baixa: 2 };
    const sorted = [...tasksWithPlans].sort((a, b) => {
      const ea = energyOrder[a.plan.energy_level || "media"];
      const eb = energyOrder[b.plan.energy_level || "media"];
      return ea - eb;
    });

    return {
      totalMinMin, totalMinMax, avgCognitiveLoad,
      modeGroups, overloadRisk, sorted,
      totalWithPlans: tasksWithPlans.length,
      totalTasks: todayTasks.length,
    };
  }, [todayTasks, getPlanForTask]);

  if (todayTasks.length === 0) {
    return (
      <Card className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Plano do Dia — Base Científica</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma tarefa para hoje. Mova tarefas para "Hoje" para gerar o plano.
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Plano do Dia — Base Científica</h3>
        </div>
        {dailyMetrics.totalWithPlans < dailyMetrics.totalTasks && (
          <Badge variant="outline" className="text-[9px]">
            {dailyMetrics.totalWithPlans}/{dailyMetrics.totalTasks} com plano
          </Badge>
        )}
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]"
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Tempo Total</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {Math.round(dailyMetrics.totalMinMin / 60)}–{Math.round(dailyMetrics.totalMinMax / 60)}h
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]"
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Carga Cognitiva</span>
          </div>
          <Progress value={dailyMetrics.avgCognitiveLoad} className="h-2 mt-1" />
          <p className="text-xs text-muted-foreground mt-1">{dailyMetrics.avgCognitiveLoad}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Foco Ideal</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {Object.keys(dailyMetrics.modeGroups).length <= 2 ? "Alto" : "Médio"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={cn(
            "p-3 rounded-xl border",
            dailyMetrics.overloadRisk === "alto" ? "bg-red-500/5 border-red-500/20" :
            dailyMetrics.overloadRisk === "medio" ? "bg-amber-500/5 border-amber-500/20" :
            "bg-emerald-500/5 border-emerald-500/20"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Risco Sobrecarga</span>
          </div>
          <p className={cn(
            "text-lg font-semibold capitalize",
            dailyMetrics.overloadRisk === "alto" ? "text-red-400" :
            dailyMetrics.overloadRisk === "medio" ? "text-amber-400" : "text-emerald-400"
          )}>
            {dailyMetrics.overloadRisk}
          </p>
        </motion.div>
      </div>

      {/* Recommended sequence */}
      {dailyMetrics.sorted.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Sequência Recomendada
          </p>
          <div className="space-y-1.5">
            {dailyMetrics.sorted.map((tp, i) => (
              <motion.div
                key={tp.task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{tp.task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {tp.plan.estimate_min != null && (
                      <span className="text-[10px] text-muted-foreground">
                        {tp.plan.estimate_min}–{tp.plan.estimate_max}min
                      </span>
                    )}
                    {tp.plan.work_mode && (
                      <span className={cn("text-[10px]", MODE_LABELS[tp.plan.work_mode]?.color)}>
                        {MODE_LABELS[tp.plan.work_mode]?.label}
                      </span>
                    )}
                  </div>
                </div>
                {tp.plan.energy_level && (
                  <div className={cn(
                    "w-2 h-8 rounded-full flex-shrink-0",
                    ENERGY_COLORS[tp.plan.energy_level]
                  )} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Break recommendations */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
        <Coffee className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Recomendação: Faça pausas de 10min a cada 50min de trabalho focado. Hidrate-se e alongue-se.
        </span>
      </div>
    </Card>
  );
}
