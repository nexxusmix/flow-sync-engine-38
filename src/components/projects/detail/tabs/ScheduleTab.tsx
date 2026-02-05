import { Project } from "@/types/projects";
import { PROJECT_STAGES } from "@/data/projectTemplates";
import { CheckCircle2, Circle, AlertTriangle, ArrowRight } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ScheduleTabProps {
  project: Project;
}

export function ScheduleTab({ project }: ScheduleTabProps) {
  const today = new Date();

  const getStageStatus = (stage: typeof project.stages[0]) => {
    if (stage.status === 'concluido') return 'completed';
    if (stage.status === 'em_andamento') return 'current';
    if (stage.status === 'bloqueado') return 'blocked';
    return 'pending';
  };

  const getDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return differenceInDays(date, today);
  };

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Timeline do Projeto</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Em andamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span className="text-muted-foreground">Pendente</span>
            </div>
          </div>
        </div>

        {/* Visual Timeline */}
        <div className="relative">
          {/* Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {/* Stages */}
          <div className="space-y-6">
            {project.stages.map((stage, index) => {
              const status = getStageStatus(stage);
              const stageInfo = PROJECT_STAGES.find(s => s.type === stage.type);
              const daysRemaining = getDaysRemaining(stage.plannedDate);

              return (
                <div key={stage.id} className="relative flex items-start gap-4 pl-2">
                  {/* Node */}
                  <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center ${
                    status === 'completed' ? 'bg-emerald-500' :
                    status === 'current' ? 'bg-primary' :
                    status === 'blocked' ? 'bg-red-500' : 'bg-muted'
                  }`}>
                    {status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                    {status === 'current' && <Circle className="w-2 h-2 text-white fill-current" />}
                    {status === 'blocked' && <AlertTriangle className="w-3 h-3 text-white" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className={`font-medium ${
                          status === 'completed' ? 'text-muted-foreground' : 'text-foreground'
                        }`}>
                          {stageInfo?.name || stage.name}
                        </h4>
                        {stage.owner && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Responsável: {stage.owner.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {stage.plannedDate && (
                          <p className="text-sm text-foreground">
                            {format(new Date(stage.plannedDate), "dd MMM", { locale: ptBR })}
                          </p>
                        )}
                        {status === 'current' && daysRemaining !== null && (
                          <p className={`text-xs ${
                            daysRemaining < 0 ? 'text-red-500' :
                            daysRemaining <= 3 ? 'text-amber-500' : 'text-muted-foreground'
                          }`}>
                            {daysRemaining < 0 ? `${Math.abs(daysRemaining)} dias atrasado` :
                             daysRemaining === 0 ? 'Hoje' :
                             `${daysRemaining} dias restantes`}
                          </p>
                        )}
                        {stage.actualDate && (
                          <p className="text-xs text-emerald-500">
                            Concluído em {format(new Date(stage.actualDate), "dd/MM", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Block reason */}
                    {stage.blockReason && (
                      <div className="mt-2 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded inline-block">
                        Bloqueado: {stage.blockReason.replace('_', ' ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Dates Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Início</p>
          <p className="text-lg font-semibold text-foreground">
            {format(new Date(project.startDate), "dd MMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Entrega Prevista</p>
          <p className="text-lg font-semibold text-foreground">
            {format(new Date(project.estimatedDelivery), "dd MMM yyyy", { locale: ptBR })}
          </p>
          {getDaysRemaining(project.estimatedDelivery) !== null && (
            <p className={`text-xs mt-1 ${
              getDaysRemaining(project.estimatedDelivery)! < 0 ? 'text-red-500' :
              getDaysRemaining(project.estimatedDelivery)! <= 7 ? 'text-amber-500' : 'text-muted-foreground'
            }`}>
              {getDaysRemaining(project.estimatedDelivery)! < 0 
                ? `${Math.abs(getDaysRemaining(project.estimatedDelivery)!)} dias atrasado`
                : `${getDaysRemaining(project.estimatedDelivery)} dias restantes`}
            </p>
          )}
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Duração Total</p>
          <p className="text-lg font-semibold text-foreground">
            {differenceInDays(new Date(project.estimatedDelivery), new Date(project.startDate))} dias
          </p>
        </div>
      </div>
    </div>
  );
}
