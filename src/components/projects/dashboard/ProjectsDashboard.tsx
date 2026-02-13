import { ProjectQuickAccessGrid } from "@/components/dashboard/ProjectQuickAccessGrid";
import { useProjectsStore } from "@/stores/projectsStore";
import { useProjects, ProjectWithStages } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Clock,
  Wallet,
  Bolt,
  Inbox,
  ChevronRight,
  Sparkles,
  Plus,
  FolderKanban,
  BarChart3
} from "lucide-react";
import { PROJECT_STAGES, STATUS_CONFIG } from "@/data/projectTemplates";
import { Button } from "@/components/ui/button";
import { ProjectsMetricsCharts } from "./ProjectsMetricsCharts";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Health Score Indicator Component
function HealthScoreIndicator({ score, compact = false }: { score: number; compact?: boolean }) {
  const getStatusColor = (s: number) => {
    if (s > 90) return { main: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'bg-emerald-500' };
    if (s > 70) return { main: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', bar: 'bg-primary' };
    return { main: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', bar: 'bg-red-500' };
  };

  const colors = getStatusColor(score);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
          <div className={`h-full ${colors.bar}`} style={{ width: `${score}%` }}></div>
        </div>
        <span className={`text-[10px] font-medium ${colors.main}`}>{score}%</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${colors.bg} ${colors.border}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${colors.bar} animate-pulse`}></div>
      <span className={`text-[9px] font-medium uppercase tracking-wider ${colors.main}`}>{score}%</span>
    </div>
  );
}

// Radial Progress Component
function RadialProgress({ value, size = 80, strokeWidth = 6, color = "hsl(var(--primary))", label }: { 
  value: number; 
  size?: number; 
  strokeWidth?: number; 
  color?: string; 
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1s ease-in-out' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-medium text-foreground">{value}%</span>
        {label && <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>}
      </div>
    </div>
  );
}

// Mini Kanban Card for Visual Board
function MiniKanbanCard({ project }: { project: ProjectWithStages }) {
  const navigate = useNavigate();
  const statusConfig = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG];

  return (
    <div 
      onClick={() => navigate(`/projetos/${project.id}`)}
      className="glass-card rounded-xl p-3 cursor-pointer hover:bg-muted/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {project.name}
        </h4>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{project.client_name || 'Sem cliente'}</span>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center border border-background">
            <span className="text-[8px] font-medium text-primary">{project.owner_name?.charAt(0) || '?'}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
        <HealthScoreIndicator score={project.health_score || 0} compact />
        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${statusConfig?.color || 'text-muted-foreground'}`}>
          {statusConfig?.label || 'Ok'}
        </span>
      </div>
    </div>
  );
}

// Visual Board Column
function VisualBoardColumn({ stage, projects }: { stage: string; projects: ProjectWithStages[] }) {
  const stageInfo = PROJECT_STAGES.find(s => s.type === stage);
  
  return (
    <div className="flex-shrink-0 w-56 md:w-64">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{stageInfo?.name || stage}</h4>
        <span className="text-[10px] font-medium text-foreground/50">{projects.length}</span>
      </div>
      <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
        {projects.map(p => (
          <MiniKanbanCard key={p.id} project={p} />
        ))}
        {projects.length === 0 && (
          <div className="glass-card rounded-xl p-4 text-center">
            <Inbox className="w-4 h-4 text-muted-foreground mx-auto mb-2 opacity-50" />
            <span className="text-[10px] text-muted-foreground">Vazio</span>
          </div>
        )}
      </div>
    </div>
  );
}

type DashboardView = 'board' | 'metrics';

export function ProjectsDashboard() {
  const navigate = useNavigate();
  const { setNewProjectModalOpen } = useProjectsStore();
  const { projects } = useProjects();
  const [view, setView] = useState<DashboardView>('board');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate dashboard metrics
  const totalPipeline = projects.reduce((acc, p) => acc + (p.contract_value || 0), 0);
  const avgHealth = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + (p.health_score || 0), 0) / projects.length) 
    : 0;

  // Group projects by stage for visual board
  const projectsByStage = ['roteiro', 'captacao', 'edicao', 'revisao'].reduce((acc, stage) => {
    acc[stage] = projects.filter(p => p.stage_current === stage);
    return acc;
  }, {} as Record<string, ProjectWithStages[]>);

  // Financial overview - top 4 projects by value
  const topProjects = [...projects].sort((a, b) => (b.contract_value || 0) - (a.contract_value || 0)).slice(0, 4);

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">analytics</span>
              <span className="text-[10px] font-medium text-primary uppercase tracking-[0.3em]">Operational Overview</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-normal text-foreground tracking-tight">
              SQUAD <span className="font-serif italic font-light text-muted-foreground">Dashboard</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8">
            <FolderKanban className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-normal text-foreground mb-3">Nenhum projeto ainda</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-8">
            Crie seu primeiro projeto para começar a acompanhar o fluxo de produção, entregas e métricas operacionais.
          </p>
          <Button size="lg" onClick={() => setNewProjectModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Criar Primeiro Projeto
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com Meta Mensal */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">analytics</span>
            <span className="text-[10px] font-medium text-primary uppercase tracking-[0.3em]">Operational Overview</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-normal text-foreground tracking-tight">
            SQUAD <span className="font-serif italic font-light text-muted-foreground">Dashboard</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as DashboardView)}>
            <TabsList>
              <TabsTrigger value="board" className="gap-1.5">
                <FolderKanban className="w-4 h-4" />
                <span className="hidden sm:inline">Board</span>
              </TabsTrigger>
              <TabsTrigger value="metrics" className="gap-1.5">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Métricas</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="glass-card rounded-2xl p-4 flex items-center gap-4 max-w-xs">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Pipeline Total</p>
              <p className="text-lg font-medium text-foreground truncate">{formatCurrency(totalPipeline)}</p>
            </div>
            <div className="flex-shrink-0">
              <RadialProgress value={avgHealth} size={60} label="HEALTH" />
            </div>
          </div>
        </div>
      </div>

      {/* Projetos Ativos - Quick Access */}
      <ProjectQuickAccessGrid projects={projects} />

      {/* Metrics View */}
      {view === 'metrics' && (
        <ProjectsMetricsCharts projects={projects} />
      )}

      {/* Board View */}
      {view === 'board' && (
      <>
      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column - Visual Board */}
        <div className="xl:col-span-8 space-y-6">
          {/* Visual Board */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">Visual Board</h3>
                <p className="text-[10px] text-muted-foreground mt-1">Controle de Fluxo Operacional</p>
              </div>
              <button 
                onClick={() => navigate('/projetos')}
                className="text-[10px] font-medium text-primary uppercase tracking-wider hover:underline flex items-center gap-1"
              >
                Ver Tudo <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 custom-scrollbar">
              {['roteiro', 'captacao', 'edicao', 'revisao'].map(stage => (
                <VisualBoardColumn key={stage} stage={stage} projects={projectsByStage[stage] || []} />
              ))}
            </div>
          </div>

          {/* Timeline 30D + Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-medium text-foreground uppercase tracking-wider">Timeline Janela 30D</h3>
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-4">SQUAD ENGINE</p>
              <div className="space-y-3">
                {projects.slice(0, 4).map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <div className="h-1.5 bg-muted rounded-full">
                        <div 
                          className={`h-full rounded-full ${
                            (p.health_score || 0) > 90 ? 'bg-emerald-500' : 
                            (p.health_score || 0) > 70 ? 'bg-primary' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, (idx + 1) * 25 + 10)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[9px] font-medium text-foreground w-20 truncate">{p.name.split(' ').slice(0, 2).join(' ')}</span>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Sem projetos ativos</p>
                )}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6">
              <h3 className="text-xs font-medium text-foreground uppercase tracking-wider mb-6">Capacity Monitor</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Workload Editores</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${projects.length * 10}%` }}></div>
                    </div>
                    <span className="text-[10px] font-medium text-foreground">{Math.min(projects.length * 10, 100)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Cloud Storage</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: '0%' }}></div>
                    </div>
                    <span className="text-[10px] font-medium text-foreground">0%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Metrics + AI */}
        <div className="xl:col-span-4 space-y-6">
          {/* Primary Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-2xl p-4 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Pipeline Ativo</p>
              <p className="text-lg font-medium text-foreground truncate">{formatCurrency(totalPipeline)}</p>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Projetos Ativos</p>
              <p className="text-lg font-medium text-foreground">{projects.length}</p>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Bolt className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Health Médio</p>
              <p className="text-lg font-medium text-foreground">{avgHealth}%</p>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Margem Líquida</p>
              <p className="text-lg font-medium text-foreground">--</p>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-medium text-foreground uppercase tracking-wider">Visão de Contas</h3>
                <p className="text-[10px] text-muted-foreground">Financeiro</p>
              </div>
            </div>
            {topProjects.length > 0 ? (
              <div className="space-y-3">
                {topProjects.map(project => {
                  const stageInfo = PROJECT_STAGES.find(s => s.type === project.stage_current);
                  return (
                    <div 
                      key={project.id}
                      onClick={() => navigate(`/projetos/${project.id}`)}
                      className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[10px] text-primary font-medium">{project.client_name || 'Sem cliente'}</p>
                          <p className="text-[9px] text-muted-foreground">{project.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <HealthScoreIndicator score={project.health_score || 0} compact />
                      </div>
                      <p className="text-xs font-medium text-foreground truncate mb-2">{project.name}</p>
                      <div className="flex items-center justify-between text-[9px]">
                        <div>
                          <span className="text-muted-foreground">Valor </span>
                          <span className="font-medium text-foreground truncate">{formatCurrency(project.contract_value || 0)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fase </span>
                          <span className="font-medium text-foreground">{stageInfo?.name || project.stage_current}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Inbox className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Sem projetos com valor</p>
              </div>
            )}
          </div>

          {/* AI Assistant Insight */}
          <div className="rounded-3xl p-5 bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-medium text-foreground uppercase tracking-wider">IA Squad Assistant</h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {projects.length === 0 
                ? "Crie seu primeiro projeto para que eu possa analisar métricas e sugerir ações."
                : `Você tem ${projects.length} projeto(s) ativo(s). A saúde média está em ${avgHealth}%.`
              }
            </p>
          </div>
        </div>
        </div>
      </>
      )}
    </div>
  );
}
