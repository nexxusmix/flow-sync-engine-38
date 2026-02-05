import { useNavigate } from "react-router-dom";
import { useProjectsStore } from "@/stores/projectsStore";
import { Project, ProjectStageType } from "@/types/projects";
import { PROJECT_STAGES, STAGE_COLORS, STATUS_CONFIG } from "@/data/projectTemplates";
import { Ban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

function KanbanCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const statusConfig = STATUS_CONFIG[project.status];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div 
      className="glass-card rounded-xl p-4 cursor-pointer hover:bg-muted/30 transition-colors group"
      onClick={() => navigate(`/projetos/${project.id}`)}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-muted-foreground">{project.client.company}</span>
        {project.blockedByPayment && (
          <Ban className="w-4 h-4 text-red-500" />
        )}
      </div>

      <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-2">{project.title}</h4>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-primary">{formatCurrency(project.contractValue)}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded border ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Health bar */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Saúde</span>
          <span className="text-[10px] text-muted-foreground">{project.healthScore}%</span>
        </div>
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              project.healthScore >= 80 ? 'bg-emerald-500' : 
              project.healthScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${project.healthScore}%` }}
          />
        </div>
      </div>

      {/* Owner */}
      <div className="mt-3 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-[10px] font-medium text-primary">{project.owner.initials}</span>
        </div>
        <span className="text-xs text-muted-foreground">{project.owner.name.split(' ')[0]}</span>
      </div>
    </div>
  );
}

function KanbanColumn({ 
  stage, 
  projects 
}: { 
  stage: { type: ProjectStageType; name: string }; 
  projects: Project[] 
}) {
  const { setNewProjectModalOpen } = useProjectsStore();
  const stageColor = STAGE_COLORS[stage.type];

  return (
    <div className="flex-shrink-0 w-72 glass-card rounded-2xl overflow-hidden">
      {/* Column Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stageColor}`} />
            <h3 className="font-medium text-foreground text-sm">{stage.name}</h3>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              {projects.length}
            </span>
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div className="p-3 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
        {projects.map(project => (
          <KanbanCard key={project.id} project={project} />
        ))}

        {projects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum projeto
          </div>
        )}

        {stage.type === 'briefing' && (
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => setNewProjectModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar projeto
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProjectsKanban() {
  const { getFilteredProjects } = useProjectsStore();
  const projects = getFilteredProjects();

  const getProjectsByStage = (stageType: ProjectStageType) => {
    return projects.filter(p => p.currentStage === stageType);
  };

  return (
    <ScrollArea className="w-full pb-4">
      <div className="flex gap-4 min-w-max pb-4">
        {PROJECT_STAGES.map(stage => (
          <KanbanColumn 
            key={stage.type} 
            stage={stage} 
            projects={getProjectsByStage(stage.type)} 
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
