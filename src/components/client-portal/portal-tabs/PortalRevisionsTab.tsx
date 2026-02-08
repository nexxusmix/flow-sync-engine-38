/**
 * PortalRevisionsTab - Aba Revisões do portal do cliente
 * 
 * Exibe solicitações de ajustes e histórico de revisões
 */

import { memo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  User,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PortalChangeRequest, PortalComment } from "@/hooks/useClientPortalEnhanced";

interface PortalRevisionsTabProps {
  changeRequests: PortalChangeRequest[];
  comments: PortalComment[];
}

function PortalRevisionsTabComponent({ changeRequests, comments }: PortalRevisionsTabProps) {
  const revisionComments = comments.filter(c => c.status === 'revision_requested');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'resolved':
        return { label: 'Resolvido', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/20' };
      case 'in_progress':
        return { label: 'Em andamento', icon: Clock, color: 'text-amber-500 bg-amber-500/20' };
      case 'rejected':
        return { label: 'Rejeitado', icon: AlertCircle, color: 'text-red-500 bg-red-500/20' };
      default:
        return { label: 'Aberto', icon: MessageSquare, color: 'text-primary bg-primary/20' };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-[10px]">Urgente</Badge>;
      case 'high':
        return <Badge className="bg-amber-500 text-[10px]">Alta</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-[10px]">Baixa</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Normal</Badge>;
    }
  };

  if (changeRequests.length === 0 && revisionComments.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Nenhuma revisão solicitada</h3>
        <p className="text-sm text-muted-foreground">
          Quando você solicitar ajustes nos materiais, eles aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Change Requests */}
      {changeRequests.length > 0 && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="font-semibold text-foreground mb-4">Solicitações de Ajuste</h3>
          
          <div className="space-y-3">
            {changeRequests.map((request) => {
              const statusConfig = getStatusConfig(request.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={request.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border/50"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", statusConfig.color)}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{request.title}</h4>
                        <p className="text-[10px] text-muted-foreground">
                          por {request.author_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(request.priority)}
                      <Badge variant="outline" className={cn("text-[10px]", statusConfig.color)}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>

                  {request.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {request.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {request.resolved_at && (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <CheckCircle2 className="w-3 h-3" />
                        Resolvido em {format(new Date(request.resolved_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Revision Comments */}
      {revisionComments.length > 0 && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="font-semibold text-foreground mb-4">Comentários de Revisão</h3>
          
          <div className="space-y-3">
            {revisionComments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 rounded-xl bg-muted/30 border border-border/50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm">
                        {comment.author_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(comment.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {comment.content}
                    </p>
                    {comment.timecode && (
                      <Badge variant="secondary" className="mt-2 text-[10px]">
                        {comment.timecode}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const PortalRevisionsTab = memo(PortalRevisionsTabComponent);
