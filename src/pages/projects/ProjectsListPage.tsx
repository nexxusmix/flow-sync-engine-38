import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectsDashboard } from "@/components/projects/dashboard/ProjectsDashboard";
import { ProjectsHeader } from "@/components/projects/list/ProjectsHeader";
import { ProjectsTable } from "@/components/projects/list/ProjectsTable";
import { ProjectsKanban } from "@/components/projects/list/ProjectsKanban";
import { NewProjectModal } from "@/components/projects/modals/NewProjectModal";
import { EditProjectModal } from "@/components/projects/modals/EditProjectModal";
import { useProjectsStore } from "@/stores/projectsStore";
import { LayoutDashboard, List, Kanban, GanttChart, LayoutGrid } from "lucide-react";

type ViewType = 'dashboard' | 'board' | 'kanban' | 'timeline' | 'list';

export default function ProjectsListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { viewMode, isNewProjectModalOpen, isEditProjectModalOpen, selectedProject } = useProjectsStore();
  
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

  return (
    <DashboardLayout title="Projetos">
      <div className="space-y-6 animate-fade-in">
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
        </div>

        {/* View Content */}
        {activeView === 'dashboard' && (
          <ProjectsDashboard />
        )}

        {activeView === 'board' && (
          <>
            <ProjectsHeader />
            <div className="min-h-[400px]">
              <BoardView />
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
              <TimelineView />
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
      
      {selectedProject && (
        <EditProjectModal 
          open={isEditProjectModalOpen} 
          onOpenChange={(open) => useProjectsStore.getState().setEditProjectModalOpen(open)}
          project={selectedProject}
        />
      )}
    </DashboardLayout>
  );
}

// Board View - Visão Executiva com cards grandes
function BoardView() {
  const getFilteredProjects = useProjectsStore(state => state.getFilteredProjects);
  const filteredProjects = getFilteredProjects();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'em_risco': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'atrasado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'bloqueado': return 'bg-red-500/20 text-red-400 border-red-500/30';
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredProjects.map((project) => (
        <div 
          key={project.id}
          onClick={() => navigate(`/projetos/${project.id}`)}
          className="glass-card rounded-2xl p-6 cursor-pointer hover:border-primary/30 transition-all group"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{project.client.company}</p>
              <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">{project.title}</h3>
            </div>
            <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase border ${getStatusColor(project.status)}`}>
              {project.status === 'ok' ? 'Ok' : project.status === 'em_risco' ? 'Em Risco' : project.status === 'atrasado' ? 'Atrasado' : 'Bloqueado'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Progresso</span>
              <span className="text-[10px] font-bold text-foreground">{Math.round((project.stages.filter(s => s.status === 'concluido').length / project.stages.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(project.stages.filter(s => s.status === 'concluido').length / project.stages.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Stage Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Etapa:</span>
            <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase">
              {project.currentStage.replace('_', ' ')}
            </span>
          </div>

          {/* Alerts */}
          <div className="flex flex-wrap gap-2 mb-4">
            {project.blockedByPayment && (
              <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[8px] font-bold rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">block</span>
                Bloqueio Financeiro
              </span>
            )}
            {project.status === 'atrasado' && (
              <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[8px] font-bold rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">schedule</span>
                Atrasado
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                {project.owner.initials}
              </div>
              <span className="text-[10px] text-muted-foreground">{project.owner.name}</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-foreground">{formatCurrency(project.contractValue)}</p>
              <p className={`text-[9px] font-bold ${getHealthColor(project.healthScore)}`}>{project.healthScore}% saúde</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Timeline View - Gantt simplificado
function TimelineView() {
  const getFilteredProjects = useProjectsStore(state => state.getFilteredProjects);
  const filteredProjects = getFilteredProjects();
  const navigate = useNavigate();

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

  const getProjectPosition = (project: typeof filteredProjects[0]) => {
    const start = new Date(project.startDate);
    const end = new Date(project.estimatedDelivery);
    
    const startOffset = Math.max(0, Math.ceil((start.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = Math.min((duration / totalDays) * 100, 100 - leftPercent);
    
    return { left: `${leftPercent}%`, width: `${Math.max(widthPercent, 10)}%` };
  };

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonth = today.getMonth();

  return (
    <div className="glass-card rounded-2xl p-6 overflow-hidden">
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Timeline de Projetos</h3>
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
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{months[month]}</span>
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
                <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{project.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{project.client.company}</p>
              </div>
              
              {/* Timeline Bar */}
              <div className="flex-1 h-8 relative bg-muted/20 rounded-lg">
                <div 
                  className={`absolute top-1 bottom-1 rounded-md ${getProgressColor(project.healthScore)} opacity-80 hover:opacity-100 transition-opacity`}
                  style={position}
                >
                  <div className="h-full flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white px-2 truncate">{project.currentStage.replace('_', ' ')}</span>
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
