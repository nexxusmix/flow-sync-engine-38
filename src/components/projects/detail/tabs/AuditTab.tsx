import { Project } from "@/types/projects";
import { 
  FileText, 
  Upload, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle,
  User,
  Bot,
  ArrowRight
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditTabProps {
  project: Project;
}

const ACTION_ICONS = {
  create: FileText,
  upload: Upload,
  comment: MessageSquare,
  approval: CheckCircle,
  stage_change: ArrowRight,
  resolve_comment: CheckCircle,
  default: FileText,
};

const ACTOR_ICONS = {
  team: User,
  client: User,
  system: Bot,
};

export function AuditTab({ project }: AuditTabProps) {
  const sortedLogs = [...project.auditLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Histórico de Auditoria</h3>
        <span className="text-sm text-muted-foreground">
          {sortedLogs.length} evento(s)
        </span>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="divide-y divide-border/50">
          {sortedLogs.map((log) => {
            const ActionIcon = ACTION_ICONS[log.action as keyof typeof ACTION_ICONS] || ACTION_ICONS.default;
            const ActorIcon = ACTOR_ICONS[log.actorType];

            return (
              <div key={log.id} className="p-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    log.actorType === 'client' ? 'bg-blue-500/20' :
                    log.actorType === 'system' ? 'bg-violet-500/20' : 'bg-muted'
                  }`}>
                    <ActionIcon className={`w-5 h-5 ${
                      log.actorType === 'client' ? 'text-blue-500' :
                      log.actorType === 'system' ? 'text-violet-500' : 'text-muted-foreground'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{log.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ActorIcon className="w-3 h-3" />
                        <span>{log.actor}</span>
                      </div>
                      <span>•</span>
                      <span>{format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                  </div>

                  {/* Entity Type Badge */}
                  <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded uppercase tracking-wider">
                    {log.entityType}
                  </span>
                </div>
              </div>
            );
          })}

          {sortedLogs.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum evento registrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
