import { Project } from "@/types/projects";
import { PROJECT_STAGES, STATUS_CONFIG } from "@/data/projectTemplates";
import { TimelineForecast30D } from "@/components/timeline/TimelineForecast30D";
import { ProjectUpdatesSection } from "../ProjectUpdatesSection";
import { getProjectMilestones } from "@/data/timelineMockData";
import { 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileText,
  Plus,
  Send,
  Activity,
  DollarSign,
  Target,
  Zap,
  Inbox,
  TrendingUp,
  Calendar,
  Users,
  HardDrive,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectsStore } from "@/stores/projectsStore";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OverviewTabProps {
  project: Project;
}

// Mock data for Visual Board
const visualBoardData = {
  columns: [
    { 
      name: 'Roteiro', 
      count: 1, 
      projects: [
        { id: 'SF-102', title: 'Legacy Private', client: 'Banco Legacy', initials: ['B', 'M'], status: 'Ok' }
      ]
    },
    { 
      name: 'Captação', 
      count: 1, 
      projects: [
        { id: 'SF-108', title: 'Tour 360', client: 'Vértice Arq', initials: ['C', 'B'], status: 'Ok' }
      ]
    },
    { 
      name: 'Edição', 
      count: 2, 
      projects: [
        { id: 'SF-092', title: 'Manifesto Matta', client: 'Lugasa Group', initials: ['M', 'V'], status: 'Ok' },
        { id: 'SF-095', title: 'Brand Film Exotic', client: 'Sarto Imóveis', initials: ['V', 'R'], status: 'Em Risco' }
      ]
    },
    { 
      name: 'Review', 
      count: 0, 
      projects: []
    }
  ],
  timeline: [
    { name: 'Manifesto Matta', progress: 85, color: 'bg-primary' },
    { name: 'Brand Film Exotic', progress: 45, color: 'bg-amber-500' },
    { name: 'Legacy Private', progress: 25, color: 'bg-emerald-500' },
    { name: 'Tour 360', progress: 60, color: 'bg-violet-500' }
  ],
  accounts: [
    { id: 'SF-092', client: 'Lugasa Group', title: 'Manifesto Matta', value: 85, phase: 'Edição', health: 94 },
    { id: 'SF-095', client: 'Sarto Imóveis', title: 'Brand Film Exotic', value: 45, phase: 'Edição', health: 68 },
    { id: 'SF-102', client: 'Banco Legacy', title: 'Legacy Private', value: 120, phase: 'Roteiro', health: 98 },
    { id: 'SF-108', client: 'Vértice Arq', title: 'Tour 360', value: 32, phase: 'Captação', health: 82 }
  ]
};

export function OverviewTab({ project }: OverviewTabProps) {
  const { advanceStage, getProjectUpdates, addProjectUpdate } = useProjectsStore();
  const projectUpdates = getProjectUpdates(project.id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getBlockages = () => {
    const blockages = [];
    
    const criticalPending = project.checklist.filter(
      item => item.isCritical && item.status !== 'concluido'
    );
    if (criticalPending.length > 0) {
      blockages.push({
        type: 'checklist',
        label: `${criticalPending.length} item(s) crítico(s) pendente(s)`,
        severity: 'warning'
      });
    }

    if (project.blockedByPayment) {
      blockages.push({
        type: 'payment',
        label: 'Pagamento pendente',
        severity: 'error'
      });
    }

    if (project.revisionsUsed >= project.revisionLimit) {
      blockages.push({
        type: 'revisions',
        label: 'Limite de revisões atingido',
        severity: 'warning'
      });
    }

    return blockages;
  };

  const getNextSteps = () => {
    const steps = [];
    const currentStageIndex = PROJECT_STAGES.findIndex(s => s.type === project.currentStage);
    
    const currentStageChecklist = project.checklist.filter(
      item => project.stages.find(s => s.id === item.stageId)?.type === project.currentStage && 
              item.status !== 'concluido'
    );
    
    if (currentStageChecklist.length > 0) {
      steps.push({
        action: 'Completar checklist da etapa',
        description: `${currentStageChecklist.length} item(s) pendente(s)`,
        priority: 'high'
      });
    }

    if (currentStageChecklist.filter(i => i.isCritical).length === 0) {
      steps.push({
        action: 'Avançar para próxima etapa',
        description: PROJECT_STAGES[currentStageIndex + 1]?.name || 'Finalizar projeto',
        priority: 'medium'
      });
    }

    const pendingDeliverables = project.deliverables.filter(d => d.status === 'rascunho');
    if (pendingDeliverables.length > 0) {
      steps.push({
        action: 'Enviar entregáveis para revisão',
        description: `${pendingDeliverables.length} entregável(is) em rascunho`,
        priority: 'medium'
      });
    }

    return steps;
  };

  const blockages = getBlockages();
  const nextSteps = getNextSteps();

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-emerald-500';
    if (health >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Ok') {
      return <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Ok</span>;
    }
    return <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">Em Risco</span>;
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-[9px] font-bold text-emerald-500 uppercase">SLA</span>
          </div>
          <p className="text-lg font-bold text-foreground">99%</p>
          <p className="text-[10px] text-muted-foreground">Delivery Rate</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[9px] font-bold text-primary uppercase">Sync</span>
          </div>
          <p className="text-lg font-bold text-foreground">100%</p>
          <p className="text-[10px] text-muted-foreground">Asset Sync</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[9px] font-bold text-amber-500 uppercase">Speed</span>
          </div>
          <p className="text-lg font-bold text-foreground">0.8d</p>
          <p className="text-[10px] text-muted-foreground">Review Speed</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-violet-500" />
            </div>
            <span className="text-[9px] font-bold text-violet-500 uppercase">Margin</span>
          </div>
          <p className="text-lg font-bold text-foreground">32%</p>
          <p className="text-[10px] text-muted-foreground">Margem Projeto</p>
        </div>
      </div>

      {/* Timeline Forecast 30D */}
      <TimelineForecast30D 
        milestones={getProjectMilestones(project.id)} 
        projectId={project.id}
      />

      {/* Project Updates Section */}
      <ProjectUpdatesSection
        project={project}
        updates={projectUpdates}
        onAddUpdate={(update) => addProjectUpdate(project.id, update)}
      />

      {/* Visual Board Section */}
      <div className="glass-card rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Visual Board</h3>
            <p className="text-[10px] text-muted-foreground">Controle de Fluxo Operacional</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-primary">
            <Eye className="w-3 h-3 mr-1" />
            Ver Tudo
          </Button>
        </div>
        
        {/* Mini Kanban */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {visualBoardData.columns.map((column) => (
            <div key={column.name} className="bg-muted/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{column.name}</span>
                <span className="text-[10px] font-bold text-foreground bg-background/50 px-2 py-0.5 rounded-full">{column.count}</span>
              </div>
              <div className="space-y-2">
                {column.projects.length > 0 ? (
                  column.projects.map((proj) => (
                    <div key={proj.id} className="bg-background/50 rounded-lg p-2.5 border border-border/50">
                      <p className="text-[10px] font-bold text-foreground truncate">{proj.title}</p>
                      <p className="text-[8px] text-muted-foreground truncate">{proj.client}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex -space-x-1">
                          {proj.initials.map((initial, idx) => (
                            <div key={idx} className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary border border-background">
                              {initial}
                            </div>
                          ))}
                        </div>
                        {getStatusBadge(proj.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <Inbox className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline 30D & Capacity Monitor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Timeline 30D */}
          <div className="bg-muted/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Timeline Janela 30D</span>
            </div>
            <p className="text-[8px] text-primary font-bold uppercase tracking-widest mb-3">SQUAD ENGINE</p>
            <div className="space-y-2">
              {visualBoardData.timeline.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-foreground font-medium truncate pr-2">{item.name}</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capacity Monitor */}
          <div className="bg-muted/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Capacity Monitor</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-primary" />
                    <span className="text-[10px] text-foreground font-medium">Workload Editores</span>
                  </div>
                  <span className="text-[10px] font-bold text-primary">92%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-3 h-3 text-violet-500" />
                    <span className="text-[10px] text-foreground font-medium">Cloud Storage 10Gbps</span>
                  </div>
                  <span className="text-[10px] font-bold text-violet-500">78%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card rounded-xl p-4 border-l-2 border-emerald-500">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-[8px] font-bold text-emerald-500 uppercase">+24.5%</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1">Pipeline Ativo</p>
          <p className="text-lg font-bold text-foreground">R$ 1.2M</p>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-2 border-primary">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-[8px] font-bold text-primary uppercase">92% On-time</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1">Projetos em Workflow</p>
          <p className="text-lg font-bold text-foreground">18</p>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-2 border-amber-500">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-[8px] font-bold text-amber-500 uppercase">High Perf</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1">Eficiência Squad</p>
          <p className="text-lg font-bold text-foreground">98%</p>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-2 border-violet-500">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-violet-500" />
            <span className="text-[8px] font-bold text-violet-500 uppercase">Financial OK</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1">Margem Líquida</p>
          <p className="text-lg font-bold text-foreground">34.2%</p>
        </div>
      </div>

      {/* Visão de Contas - Financeiro */}
      <div className="glass-card rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Visão de Contas</h3>
            <p className="text-[10px] text-muted-foreground">Financeiro</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {visualBoardData.accounts.map((account) => (
            <div key={account.id} className="bg-muted/20 rounded-xl p-4 hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-primary">{account.client}</span>
                <span className="text-[8px] text-muted-foreground">{account.id}</span>
              </div>
              <p className="text-xs font-bold text-foreground mb-3 truncate">{account.title}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[8px] text-muted-foreground uppercase">Valor</p>
                  <p className="text-[10px] font-bold text-foreground">R$ {account.value}k</p>
                </div>
                <div>
                  <p className="text-[8px] text-muted-foreground uppercase">Fase</p>
                  <p className="text-[10px] font-bold text-foreground">{account.phase}</p>
                </div>
                <div>
                  <p className="text-[8px] text-muted-foreground uppercase">Saúde</p>
                  <p className={`text-[10px] font-bold ${getHealthColor(account.health)}`}>{account.health}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Timeline */}
          <div className="glass-card rounded-2xl p-4 md:p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Flow Linear</h3>
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="flex items-center gap-1 md:gap-2 min-w-max pb-2">
                {PROJECT_STAGES.filter(stage => 
                  project.stages.some(s => s.type === stage.type)
                ).map((stage, index, arr) => {
                  const projectStage = project.stages.find(s => s.type === stage.type);
                  const isCurrent = project.currentStage === stage.type;
                  const isCompleted = projectStage?.status === 'concluido';
                  const isBlocked = projectStage?.status === 'bloqueado';

                  return (
                    <div key={stage.type} className="flex items-center">
                      <div className={`
                        flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium transition-colors
                        ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                        ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : ''}
                        ${isBlocked ? 'bg-red-500/20 text-red-400' : ''}
                        ${!isCurrent && !isCompleted && !isBlocked ? 'bg-muted/50 text-muted-foreground' : ''}
                      `}>
                        {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                        {isBlocked && <AlertTriangle className="w-3 h-3" />}
                        <span className="whitespace-nowrap">{stage.name}</span>
                      </div>
                      {index < arr.length - 1 && (
                        <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground mx-0.5 md:mx-1 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Blockages */}
          {blockages.length > 0 && (
            <div className="glass-card rounded-2xl p-4 md:p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Bloqueios</h3>
              <div className="space-y-3">
                {blockages.map((blockage, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      blockage.severity === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                      'bg-amber-500/10 border border-amber-500/20'
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                      blockage.severity === 'error' ? 'text-red-500' : 'text-amber-500'
                    }`} />
                    <span className="text-sm text-foreground">{blockage.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="glass-card rounded-2xl p-4 md:p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Atividade Recente</h3>
            <div className="space-y-4">
              {project.auditLogs.slice(-5).reverse().map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{log.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.actor} • {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Next Steps */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="glass-card rounded-2xl p-4 md:p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start h-10" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Criar Entregável
              </Button>
              <Button variant="outline" className="w-full justify-start h-10" size="sm">
                <Send className="w-4 h-4 mr-2" />
                Solicitar Revisão
              </Button>
              <Button 
                className="w-full justify-start h-10" 
                size="sm"
                onClick={() => advanceStage(project.id)}
                disabled={project.blockedByPayment}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Avançar Etapa
              </Button>
            </div>
          </div>

          {/* Next Steps */}
          <div className="glass-card rounded-2xl p-4 md:p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Próximos Passos</h3>
            <div className="space-y-3">
              {nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    step.priority === 'high' ? 'bg-red-500' :
                    step.priority === 'medium' ? 'bg-amber-500' : 'bg-muted-foreground'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{step.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                  </div>
                </div>
              ))}
              {nextSteps.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma ação pendente
                </p>
              )}
            </div>
          </div>

          {/* Revision Counter */}
          <div className="glass-card rounded-2xl p-4 md:p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Revisões</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Usadas</span>
              <span className="text-sm font-bold text-foreground">
                {project.revisionsUsed} / {project.revisionLimit}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  project.revisionsUsed >= project.revisionLimit ? 'bg-red-500' :
                  project.revisionsUsed >= project.revisionLimit - 1 ? 'bg-amber-500' : 'bg-primary'
                }`}
                style={{ width: `${(project.revisionsUsed / project.revisionLimit) * 100}%` }}
              />
            </div>
            {project.revisionsUsed >= project.revisionLimit && (
              <p className="text-xs text-amber-500 mt-2">
                Limite atingido. Revisões extras serão cobradas.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}