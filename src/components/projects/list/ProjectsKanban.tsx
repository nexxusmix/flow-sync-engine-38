import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectsStore } from "@/stores/projectsStore";
import { useProjects, ProjectWithStages } from "@/hooks/useProjects";
import { PROJECT_STAGES, STAGE_COLORS, STATUS_CONFIG } from "@/data/projectTemplates";
import { Ban, Plus, ChevronRight, Globe, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type ProjectStageType = typeof PROJECT_STAGES[number]['type'];

function HealthBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-muted-foreground">{score}%</span>
    </div>
  );
}

function KanbanCard({ 
  project, 
  onDragStart,
  isDragging 
}: { 
  project: ProjectWithStages;
  onDragStart: (e: React.DragEvent, project: ProjectWithStages) => void;
  isDragging: boolean;
}) {
  const navigate = useNavigate();
  const status = project.status || 'active';
  const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ok;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, project)}
      className={`glass-card rounded-xl p-4 cursor-grab active:cursor-grabbing hover:bg-muted/30 transition-all group border border-transparent hover:border-primary/20 ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
      onClick={() => navigate(`/projetos/${project.id}`)}
    >
      {/* Drag Handle */}
      <div className="flex items-center gap-2 mb-3">
        <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] text-primary font-medium uppercase">{project.client_name}</span>
          </div>
          <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {project.name}
          </h4>
        </div>
        {project.has_payment_block && (
          <Ban className="w-4 h-4 text-red-500 flex-shrink-0" />
        )}
      </div>

      {/* Value & Status */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">{formatCurrency(project.contract_value || 0)}</span>
        <span className={`text-[9px] px-2 py-0.5 rounded border font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Health bar */}
      <div className="mb-3">
        <HealthBar score={project.health_score || 100} />
      </div>

      {/* Footer - Team & Deadline */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center -space-x-1.5">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border-2 border-card">
            <span className="text-[9px] font-medium text-primary">{project.owner_name?.charAt(0) || 'S'}</span>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '-'}
        </span>
      </div>
    </div>
  );
}

function KanbanColumn({ 
  stage, 
  projects,
  onDragStart,
  onDragOver,
  onDrop,
  draggedProject,
}: { 
  stage: { type: string; name: string }; 
  projects: ProjectWithStages[];
  onDragStart: (e: React.DragEvent, project: ProjectWithStages) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stageType: string) => void;
  draggedProject: ProjectWithStages | null;
}) {
  const { setNewProjectModalOpen } = useProjectsStore();
  const stageColor = STAGE_COLORS[stage.type as keyof typeof STAGE_COLORS] || 'bg-muted';
  const [isDragOver, setIsDragOver] = useState(false);

  const totalValue = projects.reduce((acc, p) => acc + (p.contract_value || 0), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    onDrop(e, stage.type);
  };

  return (
    <div 
      className="flex-shrink-0 w-72 md:w-80"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="glass-card rounded-t-2xl p-4 border-b-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${stageColor}`} />
            <h3 className="font-medium text-foreground text-sm">{stage.name}</h3>
          </div>
          <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded-full">
            {projects.length}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground font-light">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(totalValue)}
        </p>
      </div>

      {/* Column Content */}
      <div className={`glass-card rounded-b-2xl rounded-t-none p-3 space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar transition-all ${
        isDragOver ? 'bg-primary/5 border-primary/30' : ''
      }`}>
        {projects.map(project => (
          <KanbanCard 
            key={project.id} 
            project={project} 
            onDragStart={onDragStart}
            isDragging={draggedProject?.id === project.id}
          />
        ))}

        {projects.length === 0 && (
          <div className={`text-center py-8 text-muted-foreground rounded-xl transition-all ${
            isDragOver ? 'bg-primary/10 border-2 border-dashed border-primary/30' : ''
          }`}>
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <ChevronRight className="w-5 h-5" />
            </div>
            <p className="text-sm font-light">{isDragOver ? 'Solte aqui' : 'Nenhum projeto'}</p>
          </div>
        )}

        {stage.type === 'briefing' && (
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground rounded-xl h-10"
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
  const { projects, isLoading, moveToStage } = useProjects();
  const { filters } = useProjectsStore();
  const [draggedProject, setDraggedProject] = useState<ProjectWithStages | null>(null);

  // Apply filters
  const filteredProjects = projects.filter(project => {
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status !== 'all' && project.status !== filters.status) return false;
    if (filters.stage !== 'all' && project.stage_current !== filters.stage) return false;
    return true;
  });

  const getProjectsByStage = (stageType: string) => {
    return filteredProjects.filter(p => p.stage_current === stageType);
  };

  const handleDragStart = (e: React.DragEvent, project: ProjectWithStages) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageType: string) => {
    e.preventDefault();
    if (draggedProject && draggedProject.stage_current !== stageType) {
      moveToStage({ projectId: draggedProject.id, stageKey: stageType });
    }
    setDraggedProject(null);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ScrollArea className="w-full pb-4" onDragEnd={handleDragEnd}>
      <div className="flex gap-4 min-w-max pb-4 px-1">
        {PROJECT_STAGES.map(stage => (
          <KanbanColumn 
            key={stage.type} 
            stage={stage} 
            projects={getProjectsByStage(stage.type)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            draggedProject={draggedProject}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
