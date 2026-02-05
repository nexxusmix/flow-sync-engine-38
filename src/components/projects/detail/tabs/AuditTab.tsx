import { ProjectWithStages } from "@/hooks/useProjects";
import { 
  FileText, 
  ArrowRight,
  Inbox
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditTabProps {
  project: ProjectWithStages;
}

export function AuditTab({ project }: AuditTabProps) {
  // For now, we'll show stage transitions as audit entries
  const stageHistory = project.stages?.map(stage => ({
    id: stage.id,
    action: 'stage',
    description: `Etapa "${stage.title}" - ${stage.status === 'completed' ? 'Concluída' : stage.status === 'in_progress' ? 'Em andamento' : 'Não iniciada'}`,
    timestamp: stage.actual_start || stage.created_at,
    actor: 'Sistema',
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Histórico de Auditoria</h3>
        <span className="text-sm text-muted-foreground">
          {stageHistory.length} evento(s)
        </span>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="divide-y divide-border/50">
          {stageHistory.length > 0 ? (
            stageHistory.map((log) => (
              <div key={log.id} className="p-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-muted">
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{log.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{log.actor}</span>
                      <span>•</span>
                      <span>{format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum evento registrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
