import { Project } from "@/types/projects";
import { PROJECT_STAGES } from "@/data/projectTemplates";
import { ProjectTimelineDetailed } from "@/components/timeline/ProjectTimelineDetailed";
import { useMemo } from "react";

interface ScheduleTabProps {
  project: Project;
}

export function ScheduleTab({ project }: ScheduleTabProps) {
  // Generate timeline data from project stages
  const timelineData = useMemo(() => ({
    segments: project.stages?.map(stage => ({
      id: stage.id,
      projectId: project.id,
      name: stage.name,
      status: stage.status === 'concluido' ? 'done' : stage.status === 'em_andamento' ? 'in_progress' : 'not_started',
      plannedStart: stage.plannedDate || new Date().toISOString(),
      plannedEnd: stage.plannedDate || new Date().toISOString(),
      progress: stage.status === 'concluido' ? 100 : stage.status === 'em_andamento' ? 50 : 0,
    })) || [],
    milestones: [],
    hasPaymentBlock: project.blockedByPayment,
    currentStage: project.currentStage,
    lastUpdated: project.updatedAt,
  }), [project]);

  const currentStageName = PROJECT_STAGES.find(s => s.type === project.currentStage)?.name || project.currentStage;

  return (
    <ProjectTimelineDetailed
      segments={timelineData.segments}
      milestones={timelineData.milestones}
      hasPaymentBlock={project.blockedByPayment}
      currentStage={currentStageName}
      lastUpdated={project.updatedAt}
      projectName={project.title}
    />
  );
}
