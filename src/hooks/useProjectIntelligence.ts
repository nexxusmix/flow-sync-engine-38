import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, differenceInCalendarDays, subDays } from "date-fns";
import { ProjectWithStages } from "@/hooks/useProjects";

export interface ProjectIntelligence {
  velocity: number;
  predictedCompletionDate: Date | null;
  daysOverDeadline: number;
  delayRisk: number;
  roi: number | null;
  financialStatus: {
    totalContract: number;
    totalPaid: number;
    totalOverdue: number;
    percentPaid: number;
  };
  clientHealth: number;
  deadlineAlert: boolean;
  velocityNeeded: number;
  tasksPending: number;
  tasksCompleted: number;
  tasksTotal: number;
}

export function useProjectIntelligence(project: ProjectWithStages | null) {
  const projectId = project?.id;

  const { data: tasks } = useQuery({
    queryKey: ["project-tasks-intelligence", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase
        .from("tasks")
        .select("id, status, created_at, completed_at, priority, time_spent_seconds")
        .eq("project_id", projectId);
      return data || [];
    },
    enabled: !!projectId,
  });

  const { data: revenues } = useQuery({
    queryKey: ["project-revenues-intelligence", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data } = await supabase
        .from("revenues")
        .select("id, amount, status, due_date, received_date")
        .eq("project_id", projectId);
      return data || [];
    },
    enabled: !!projectId,
  });

  const intelligence = useMemo<ProjectIntelligence | null>(() => {
    if (!project || !tasks) return null;

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const completed = tasks.filter((t) => t.status === "done");
    const pending = tasks.filter((t) => t.status !== "done");
    const completedLast30d = completed.filter(
      (t) => t.completed_at && new Date(t.completed_at) >= thirtyDaysAgo
    );

    const velocity = completedLast30d.length / 30;

    let predictedDate: Date | null = null;
    if (velocity > 0 && pending.length > 0) {
      predictedDate = addDays(now, Math.ceil(pending.length / velocity));
    }

    const dueDate = project.due_date ? new Date(project.due_date) : null;
    let daysOverDeadline = 0;
    let deadlineAlert = false;
    let velocityNeeded = 0;

    if (dueDate) {
      if (predictedDate) {
        daysOverDeadline = differenceInCalendarDays(predictedDate, dueDate);
        deadlineAlert = daysOverDeadline > 0;
      }
      const daysRemaining = differenceInCalendarDays(dueDate, now);
      velocityNeeded = daysRemaining > 0 ? pending.length / daysRemaining : pending.length;
    }

    const stages = project.stages || [];
    const overdueStages = stages.filter(
      (s) => s.status !== "completed" && s.planned_end && new Date(s.planned_end) < now
    );
    const stageRisk = stages.length > 0 ? (overdueStages.length / stages.length) * 50 : 0;
    const velocityRisk = velocity < 0.5 ? 30 : velocity < 1 ? 15 : 0;
    const deadlineRisk = daysOverDeadline > 0 ? Math.min(daysOverDeadline * 2, 20) : 0;
    const delayRisk = Math.min(Math.round(stageRisk + velocityRisk + deadlineRisk), 100);

    const contractValue = project.contract_value || 0;
    const totalSeconds = tasks.reduce((sum, t) => sum + (t.time_spent_seconds || 0), 0);
    const estimatedHours = totalSeconds / 3600;
    const roi = estimatedHours > 0 ? contractValue / estimatedHours : null;

    const totalPaid = (revenues || [])
      .filter((r) => r.status === "received")
      .reduce((s, r) => s + (r.amount || 0), 0);
    const totalOverdue = (revenues || [])
      .filter((r) => ["pending", "overdue"].includes(r.status || "") && r.due_date && new Date(r.due_date) < now)
      .reduce((s, r) => s + (r.amount || 0), 0);

    const overdueRevCount = (revenues || []).filter(
      (r) => ["pending", "overdue"].includes(r.status || "") && r.due_date && new Date(r.due_date) < now
    ).length;
    const blockedStages = stages.filter((s) => s.status === "blocked").length;
    let clientHealth = 100;
    clientHealth -= overdueRevCount * 15;
    clientHealth -= blockedStages * 10;
    clientHealth -= delayRisk > 50 ? 20 : delayRisk > 25 ? 10 : 0;
    clientHealth = Math.max(0, Math.min(100, clientHealth));

    return {
      velocity: Math.round(velocity * 100) / 100,
      predictedCompletionDate: predictedDate,
      daysOverDeadline,
      delayRisk,
      roi: roi ? Math.round(roi * 100) / 100 : null,
      financialStatus: {
        totalContract: contractValue,
        totalPaid,
        totalOverdue,
        percentPaid: contractValue > 0 ? Math.round((totalPaid / contractValue) * 100) : 0,
      },
      clientHealth,
      deadlineAlert,
      velocityNeeded: Math.round(velocityNeeded * 100) / 100,
      tasksPending: pending.length,
      tasksCompleted: completed.length,
      tasksTotal: tasks.length,
    };
  }, [project, tasks, revenues]);

  return { intelligence, tasks, revenues };
}
