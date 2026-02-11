import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectsDashboard } from "@/components/projects/dashboard/ProjectsDashboard";
import { ProjectsHeader } from "@/components/projects/list/ProjectsHeader";
import { ProjectsTable } from "@/components/projects/list/ProjectsTable";
import { ProjectsKanban } from "@/components/projects/list/ProjectsKanban";
import { NewProjectModal } from "@/components/projects/modals/NewProjectModal";
import { EditProjectModal } from "@/components/projects/modals/EditProjectModal";
import { AIProjectModal } from "@/components/projects/modals/AIProjectModal";
import { ProjectActionsMenu } from "@/components/projects/ProjectActionsMenu";
import { useProjectsStore } from "@/stores/projectsStore";
import { useProjects, ProjectWithStages } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { useExportPdf } from "@/hooks/useExportPdf";
import { LayoutDashboard, List, Kanban, GanttChart, LayoutGrid, Loader2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewType = 'dashboard' | 'board' | 'kanban' | 'timeline' | 'list';

export default function ProjectsListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isNewProjectModalOpen, isEditProjectModalOpen, isAIProjectModalOpen, selectedProjectId, setEditProjectModalOpen, setSelectedProjectId, setAIProjectModalOpen } = useProjectsStore();
  const { isLoading: authLoading } = useAuth();
  const { projects, isLoading: dataLoading } = useProjects();
  const { isExporting, exportProjectsOverview } = useExportPdf();
  
  // Show loading only during auth check or data fetch
  const isLoading = authLoading || dataLoading;
  
  // Determine view from route
  const getViewFromRoute = (): ViewType => {
    if (location.pathname.includes('/board')) return 'board';
    if (location.pathname.includes('/kanban')) return 'kanban';
    if (location.pathname.includes('/timeline')) return 'timeline';
    if (location.pathname.includes('/list')) return 'list';
    return 'dashboard';
  };
  
  const [activeView, setActiveView] = useState<ViewType>(getViewFromRoute());

  useEffect(() => {
    setActiveView(getViewFromRoute());
  }, [location.pathname]);

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    if (view === 'dashboard') {
      navigate('/projetos');
    } else {
      navigate(`/projetos/${view}`);
    }
  };

  const views = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'board' as ViewType, label: 'Board', icon: LayoutGrid },
    { id: 'kanban' as ViewType, label: 'Kanban', icon: Kanban },
    { id: 'timeline' as ViewType, label: 'Timeline', icon: GanttChart },
    { id: 'list' as ViewType, label: 'Lista', icon: List },
  ];

  // Find selected project from Supabase data
  const selectedProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId) 
    : null;

  // Show loading only when actually fetching data
  if (isLoading) {
    return (
      <DashboardLayout title="Projetos">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Projetos">
      <div className="space-y-6 animate-fade-in max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
        {/* View Toggle - Multiple Views */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl w-full sm:w-fit border border-border/50 overflow-x-auto">
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => handleViewChange(view.id)}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                    activeView === view.id 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportProjectsOverview()}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            Exportar Visão Geral
          </Button>
        </div>

        {/* View Content */}
        {activeView === 'dashboard' && (
          <ProjectsDashboard />
        )}

        {activeView === 'board' && (
          <>
            <ProjectsHeader />
            <div className="min-h-[400px]">
              <BoardView projects={projects} />
            </div>
          </>
        )}

        {activeView === 'kanban' && (
          <>
            <ProjectsHeader />
            <div className="min-h-[400px]">
              <ProjectsKanban />
            </div>
          </>
        )}

        {activeView === 'timeline' && (
          <>
            <ProjectsHeader />
            <div className="min-h-[400px]">
              <TimelineView projects={projects} />
            </div>
          </>
        )}

        {activeView === 'list' && (
          <>
            <ProjectsHeader />
            <div className="min-h-[400px]">
              <ProjectsTable />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <NewProjectModal 
        open={isNewProjectModalOpen} 
        onOpenChange={(open) => useProjectsStore.getState().setNewProjectModalOpen(open)} 
      />
      
      <AIProjectModal
        open={isAIProjectModalOpen}
        onOpenChange={setAIProjectModalOpen}
      />
      
      {selectedProject && (
        <EditProjectModal 
          open={isEditProjectModalOpen} 
          onOpenChange={(open) => {
            setEditProjectModalOpen(open);
            if (!open) setSelectedProjectId(null);
          }}
          project={selectedProject}
        />
      )}
    </DashboardLayout>
  );
}

// Board View - Visão Executiva com cards grandes
function BoardView({ projects }: { projects: ProjectWithStages[] }) {
  const navigate = useNavigate();
  const { filters } = useProjectsStore();

  // Apply filters
  const filteredProjects = projects.filter(project => {
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status !== 'all' && project.status !== filters.status) return false;
    if (filters.stage !== 'all' && project.stage_current !== filters.stage) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'paused': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'completed': return 'bg-primary/20 text-primary border-primary/30';
      case 'archived': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStageProgress = (project: ProjectWithStages) => {
    if (!project.stages || project.stages.length === 0) return 0;
    const done = project.stages.filter(s => s.status === 'done').length;
    return Math.round((done / project.stages.length) * 100);
  };

  if (filteredProjects.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
        <LayoutGrid className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg text-muted-foreground">Nenhum projeto encontrado</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Ajuste os filtros ou crie um novo projeto</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {filteredProjects.map((project) => (
        <div 
          key={project.id}
          onClick={() => navigate(`/projetos/${project.id}`)}
          className="glass-card rounded-2xl p-6 cursor-pointer hover:border-primary/30 transition-all group relative"
        >
          {/* Actions Menu */}
          <div className="absolute top-4 right-4 z-10">
            <ProjectActionsMenu project={project} />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-4 pr-10">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-1">{project.client_name}</p>
              <h3 className="text-lg font-normal text-foreground truncate group-hover:text-primary transition-colors">{project.name}</h3>
            </div>
            <span className={`px-2 py-1 rounded-full text-[9px] font-medium uppercase border ${getStatusColor(project.status)}`}>
              {project.status === 'active' ? 'Ativo' : project.status === 'paused' ? 'Pausado' : project.status === 'completed' ? 'Concluído' : 'Arquivado'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">Progresso</span>
              <span className="text-[10px] font-medium text-foreground">{getStageProgress(project)}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${getStageProgress(project)}%` }}
              />
            </div>
          </div>

          {/* Stage Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[9px] font-medium text-muted-foreground uppercase">Etapa:</span>
            <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-medium rounded-lg uppercase">
              {project.stage_current?.replace('_', ' ') || 'Briefing'}
            </span>
          </div>

          {/* Alerts */}
          <div className="flex flex-wrap gap-2 mb-4">
            {project.has_payment_block && (
              <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[8px] font-medium rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">block</span>
                Bloqueio Financeiro
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                {project.owner_name?.charAt(0) || 'S'}
              </div>
              <span className="text-[10px] text-muted-foreground">{project.owner_name || 'Squad'}</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium text-foreground">{formatCurrency(project.contract_value || 0)}</p>
              <p className={`text-[9px] font-medium ${getHealthColor(project.health_score)}`}>{project.health_score}% saúde</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Timeline View - Gantt simplificado
function TimelineView({ projects }: { projects: ProjectWithStages[] }) {
  const navigate = useNavigate();
  const { filters } = useProjectsStore();

  // Apply filters
  const filteredProjects = projects.filter(project => {
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status !== 'all' && project.status !== filters.status) return false;
    if (filters.stage !== 'all' && project.stage_current !== filters.stage) return false;
    return true;
  });

  const getProgressColor = (healthScore: number) => {
    if (healthScore >= 80) return 'bg-emerald-500';
    if (healthScore >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Calculate timeline range (simplified mock)
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const totalDays = Math.ceil((endOfMonth.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));

  const getProjectPosition = (project: ProjectWithStages) => {
    const start = project.start_date ? new Date(project.start_date) : today;
    const end = project.due_date ? new Date(project.due_date) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const startOffset = Math.max(0, Math.ceil((start.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = Math.min((duration / totalDays) * 100, 100 - leftPercent);
    
    return { left: `${leftPercent}%`, width: `${Math.max(widthPercent, 10)}%` };
  };

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonth = today.getMonth();

  if (filteredProjects.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
        <GanttChart className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg text-muted-foreground">Nenhum projeto encontrado</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Ajuste os filtros ou crie um novo projeto</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 overflow-hidden">
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">Timeline de Projetos</h3>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500" /> On Track
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500" /> Em Risco
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" /> Atrasado
          </span>
        </div>
      </div>

      {/* Month Headers */}
      <div className="flex border-b border-border/50 mb-4">
        <div className="w-48 flex-shrink-0" />
        <div className="flex-1 flex">
          {[currentMonth, (currentMonth + 1) % 12].map((month, idx) => (
            <div key={idx} className="flex-1 text-center py-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase">{months[month]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="space-y-4">
        {filteredProjects.map((project) => {
          const position = getProjectPosition(project);
          
          return (
            <div 
              key={project.id} 
              className="flex items-center gap-4 group cursor-pointer"
              onClick={() => navigate(`/projetos/${project.id}`)}
            >
              {/* Project Info */}
              <div className="w-48 flex-shrink-0">
                <p className="text-xs font-normal text-foreground truncate group-hover:text-primary transition-colors">{project.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{project.client_name}</p>
              </div>
              
              {/* Timeline Bar */}
              <div className="flex-1 h-8 relative bg-muted/20 rounded-lg">
                <div 
                  className={`absolute top-1 bottom-1 rounded-md ${getProgressColor(project.health_score)} opacity-80 hover:opacity-100 transition-opacity`}
                  style={position}
                >
                  <div className="h-full flex items-center justify-center">
                    <span className="text-[8px] font-medium text-white px-2 truncate">{project.stage_current?.replace('_', ' ') || 'Briefing'}</span>
                  </div>
                </div>
                
                {/* Today Marker */}
                <div 
                  className="absolute top-0 bottom-0 w-px bg-primary"
                  style={{ left: `${((today.getDate()) / totalDays) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Período: {months[currentMonth]} - {months[(currentMonth + 1) % 12]} {today.getFullYear()}
        </p>
        <p className="text-[10px] text-primary font-bold">
          {filteredProjects.length} projetos no período
        </p>
      </div>
    </div>
  );
}
