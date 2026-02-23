import { ProjectWithStages } from "@/hooks/useProjects";
import { PROJECT_STAGES } from "@/data/projectTemplates";
import { ProjectTimelineDetailed } from "@/components/timeline/ProjectTimelineDetailed";
import { useMemo } from "react";

interface ScheduleTabProps {
  project: ProjectWithStages;
}

export function ScheduleTab({ project }: ScheduleTabProps) {
  // Generate timeline data from project stages
  const timelineData = useMemo(() => ({
    segments: project.stages?.map(stage => ({
      id: stage.id,
      projectId: project.id,
      name: stage.title,
      status: (stage.status === 'completed' ? 'done' : 
               stage.status === 'in_progress' ? 'in_progress' : 
               'not_started') as 'done' | 'in_progress' | 'not_started' | 'blocked',
      plannedStart: stage.planned_start || new Date().toISOString(),
      plannedEnd: stage.planned_end || new Date().toISOString(),
      progress: stage.status === 'completed' ? 100 : stage.status === 'in_progress' ? 50 : 0,
    })) || [],
    milestones: [],
    
    currentStage: project.stage_current,
    lastUpdated: project.updated_at,
  }), [project]);

  const currentStageName = PROJECT_STAGES.find(s => s.type === project.stage_current)?.name || project.stage_current;

  return (
    <ProjectTimelineDetailed
      segments={timelineData.segments}
      milestones={timelineData.milestones}
      
      currentStage={currentStageName}
      lastUpdated={project.updated_at}
      projectName={project.name}
    />
  );
}
