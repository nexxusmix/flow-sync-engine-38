import { useState } from "react";
import { ProjectWithStages, useProjects } from "@/hooks/useProjects";
import { PROJECT_STAGES } from "@/data/projectTemplates";
import { TimelineForecast30D } from "@/components/timeline/TimelineForecast30D";
import { LatestAlignmentsBlock } from "@/components/projects/meetings/LatestAlignmentsBlock";
import { 
  ReportMetricsBar,
  ExecutiveSummarySection,
  ScopeDetailSection,
  DeliverablesListSection,
  ReportAsidePanel,
} from "@/components/projects/reporting";
import { Video, Clock, CheckCircle2, Circle, Lock } from "lucide-react";
import { useProjectIntelligence } from "@/hooks/useProjectIntelligence";
import { ProjectDeadlineAlert } from "@/components/projects/detail/ProjectDeadlineAlert";
import { ProjectIntelligenceBlock } from "@/components/projects/detail/ProjectIntelligenceBlock";
import { ProjectAIAnalysis } from "@/components/projects/detail/ProjectAIAnalysis";

interface OverviewTabProps {
  project: ProjectWithStages;
}

export function OverviewTab({ project }: OverviewTabProps) {
  const { updateProject } = useProjects();
  const { intelligence, tasks, revenues } = useProjectIntelligence(project);

  // Calculate progress
  const completedStages = project.stages?.filter(s => s.status === 'completed').length || 0;
  const totalStages = project.stages?.length || 9;
  const stageProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  // Get current stage name
  const currentStageName = PROJECT_STAGES.find(s => s.type === project.stage_current)?.name || project.stage_current || 'Briefing';

  // Handle description save
  const handleSaveDescription = (description: string) => {
    updateProject({ id: project.id, data: { description } });
  };

  // Parse deliverables from description (temporary - until we have proper deliverables table)
  const parseDeliverables = () => {
    const defaultDeliverables = [
      { id: '1', title: 'Vídeo Lançamento (Até 02m30s)', description: 'Qualidade Cinema 4K • Wide & Vertical', status: 'not_started' as const },
      { id: '2', title: 'Institucional', description: 'Até 03m00s • Formato Narrativo', status: 'not_started' as const },
      { id: '3', title: 'Vídeo Manifesto', description: 'Até 01m30s • Storytelling Emocional', status: 'not_started' as const },
    ];
    return defaultDeliverables;
  };

  const deliverables = parseDeliverables();

  return (
    <div className="space-y-6">

      {/* Predictive Intelligence Layer */}
      {intelligence && (
        <>
          <ProjectDeadlineAlert intelligence={intelligence} dueDate={project.due_date || null} />
          <ProjectIntelligenceBlock intelligence={intelligence} />
        </>
      )}

      {/* AI Analysis */}
      <ProjectAIAnalysis project={project} tasks={tasks} revenues={revenues} />

      {/* Latest Alignments Block */}
      <LatestAlignmentsBlock projectId={project.id} />

      {/* Top Metrics Bar */}
      <ReportMetricsBar
        progress={stageProgress}
        totalStages={totalStages}
        completedStages={completedStages}
        healthScore={project.health_score || 100}
        currentStage={currentStageName}
        contractValue={project.contract_value || 0}
      />

      {/* Main Content: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 01 — Executive Summary */}
          <ExecutiveSummarySection
            projectId={project.id}
            projectName={project.name}
            clientName={project.client_name || ''}
            template={project.template || ''}
            description={project.description}
            onSave={handleSaveDescription}
            isManager={true}
          />

          {/* 02 — Scope Detail */}
          <ScopeDetailSection
            scopeQuote={project.description ? 
              `O PRESENTE PROJETO TEM POR OBJETO A PRESTAÇÃO DE SERVIÇOS DE PRODUÇÃO AUDIOVISUAL PARA "${project.name?.toUpperCase()}", VISANDO REGISTRAR E TRANSMITIR A MAGNITUDE DO EMPREENDIMENTO ATRAVÉS DE UMA NARRATIVA AUDIOVISUAL COMPLETA.` 
              : null}
            deliveryFormats="Wide (Horizontal) e Vertical, conforme necessidade de cada plataforma."
          />

          {/* 03 — Deliverables */}
          <DeliverablesListSection
            deliverables={deliverables}
            isManager={true}
          />

          {/* Project Stages */}
          <div className="bg-card border border-border p-8">
            <span className="text-primary text-mono uppercase tracking-[0.4em] font-bold mb-6 block">
              04 — ETAPAS DO PROJETO
            </span>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {project.stages?.map((stage) => {
                const StatusIcon = stage.status === 'completed' ? CheckCircle2 :
                                   stage.status === 'in_progress' ? Clock :
                                   stage.status === 'blocked' ? Lock : Circle;
                const statusColor = stage.status === 'completed' ? 'text-emerald-500' :
                                   stage.status === 'in_progress' ? 'text-primary' :
                                   stage.status === 'blocked' ? 'text-destructive' : 'text-muted-foreground';

                return (
                  <div 
                    key={stage.id} 
                    className="bg-muted/30 border border-border p-4 transition-all hover:border-primary/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                      <span className="text-mono font-bold text-muted-foreground uppercase tracking-wide truncate">
                        {stage.title}
                      </span>
                    </div>
                    <span className="text-caption text-muted-foreground">
                      {stage.status === 'completed' ? 'Concluída' :
                       stage.status === 'in_progress' ? 'Em andamento' :
                       stage.status === 'blocked' ? 'Bloqueada' :
                       'Não iniciada'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Aside Column (1/3) */}
        <div className="lg:col-span-1">
          <ReportAsidePanel
            projectId={project.id}
            bannerUrl={(project as any).banner_url}
            logoUrl={(project as any).logo_url}
            isManager={true}
            onEditProject={() => {
              import("@/stores/projectsStore").then(m => m.useProjectsStore.getState().setEditProjectModalOpen(true));
            }}
          />

          {/* Timeline Forecast (compact) */}
          <div className="mt-6">
            <TimelineForecast30D 
              milestones={[]} 
              projectId={project.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
