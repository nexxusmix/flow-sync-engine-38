import { Project } from "@/types/projects";
import { PROJECT_STAGES, STATUS_CONFIG } from "@/data/projectTemplates";
import { 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileText,
  Plus,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectsStore } from "@/stores/projectsStore";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OverviewTabProps {
  project: Project;
}

export function OverviewTab({ project }: OverviewTabProps) {
  const { advanceStage } = useProjectsStore();

  const getBlockages = () => {
    const blockages = [];
    
    // Check for incomplete critical checklist items
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

    // Check payment
    if (project.blockedByPayment) {
      blockages.push({
        type: 'payment',
        label: 'Pagamento pendente',
        severity: 'error'
      });
    }

    // Check if approaching revision limit
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
    
    // Check incomplete checklist for current stage
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

    // Suggest advancing stage
    if (currentStageChecklist.filter(i => i.isCritical).length === 0) {
      steps.push({
        action: 'Avançar para próxima etapa',
        description: PROJECT_STAGES[currentStageIndex + 1]?.name || 'Finalizar projeto',
        priority: 'medium'
      });
    }

    // Check deliverables
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Main Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Progress Timeline */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Progresso do Projeto</h3>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max pb-2">
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
                      flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors
                      ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                      ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : ''}
                      ${isBlocked ? 'bg-red-500/20 text-red-400' : ''}
                      ${!isCurrent && !isCompleted && !isBlocked ? 'bg-muted/50 text-muted-foreground' : ''}
                    `}>
                      {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                      {isBlocked && <AlertTriangle className="w-3 h-3" />}
                      {stage.name}
                    </div>
                    {index < arr.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-muted-foreground mx-1 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Blockages */}
        {blockages.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Bloqueios</h3>
            <div className="space-y-3">
              {blockages.map((blockage, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    blockage.severity === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                    'bg-amber-500/10 border border-amber-500/20'
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 ${
                    blockage.severity === 'error' ? 'text-red-500' : 'text-amber-500'
                  }`} />
                  <span className="text-sm text-foreground">{blockage.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="glass-card rounded-2xl p-6">
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
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Ações Rápidas</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Criar Entregável
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Send className="w-4 h-4 mr-2" />
              Solicitar Revisão
            </Button>
            <Button 
              variant="default" 
              className="w-full justify-start" 
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
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Próximos Passos</h3>
          <div className="space-y-3">
            {nextSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  step.priority === 'high' ? 'bg-red-500' :
                  step.priority === 'medium' ? 'bg-amber-500' : 'bg-muted-foreground'
                }`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{step.action}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
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
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Revisões</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Usadas</span>
            <span className="text-sm font-medium text-foreground">
              {project.revisionsUsed} / {project.revisionLimit}
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
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
  );
}
