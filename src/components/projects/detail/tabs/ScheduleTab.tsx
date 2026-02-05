import { Project } from "@/types/projects";
import { PROJECT_STAGES } from "@/data/projectTemplates";
import { ProjectTimelineDetailed } from "@/components/timeline/ProjectTimelineDetailed";
import { getProjectTimelineData } from "@/data/timelineMockData";
import { useMemo } from "react";

interface ScheduleTabProps {
  project: Project;
}

export function ScheduleTab({ project }: ScheduleTabProps) {
  const timelineData = useMemo(() => getProjectTimelineData(project.id), [project.id]);

  // Get current stage name
  const currentStageName = PROJECT_STAGES.find(s => s.type === project.currentStage)?.name || project.currentStage;

  return (
    <ProjectTimelineDetailed
      segments={timelineData.segments || []}
      milestones={timelineData.milestones}
      hasPaymentBlock={project.blockedByPayment}
      currentStage={currentStageName}
      lastUpdated={project.updatedAt}
      projectName={project.title}
    />
  );
}
