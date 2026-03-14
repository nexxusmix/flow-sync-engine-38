/**
 * PortalAuditTab - Aba Auditoria do portal do cliente
 * 
 * Versão limitada da auditoria para o cliente
 * (sem dados sensíveis internos)
 */

import { memo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  History, 
  CheckCircle2, 
  MessageSquare, 
  FileText,
  Upload,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PortalComment, PortalApproval, PortalVersion } from "@/hooks/useClientPortalEnhanced";

interface PortalAuditTabProps {
  comments: PortalComment[];
  approvals: PortalApproval[];
  versions: PortalVersion[];
}

interface AuditEvent {
  id: string;
  type: 'comment' | 'approval' | 'version' | 'view';
  title: string;
  description: string;
  author: string;
  timestamp: string;
}

function PortalAuditTabComponent({ comments, approvals, versions }: PortalAuditTabProps) {
  // Build audit timeline
  const events: AuditEvent[] = [
    ...comments.map(c => ({
      id: `comment-${c.id}`,
      type: 'comment' as const,
      title: 'Comentário adicionado',
      description: c.content.substring(0, 100) + (c.content.length > 100 ? '...' : ''),
      author: c.author_name,
      timestamp: c.created_at,
    })),
    ...approvals.map(a => ({
      id: `approval-${a.id}`,
      type: 'approval' as const,
      title: 'Material aprovado',
      description: a.notes || 'Aprovação confirmada',
      author: a.approved_by_name,
      timestamp: a.approved_at,
    })),
    ...versions.map(v => ({
      id: `version-${v.id}`,
      type: 'version' as const,
      title: `Nova versão publicada (V${v.version_number})`,
      description: v.notes || v.title || 'Versão atualizada',
      author: v.created_by_name || 'Equipe',
      timestamp: v.created_at,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      case 'approval':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'version':
        return <Upload className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'comment':
        return 'text-blue-500 bg-blue-500/20';
      case 'approval':
        return 'text-primary bg-primary/20';
      case 'version':
        return 'text-primary/70 bg-primary/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  if (events.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <History className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Nenhum registro ainda</h3>
        <p className="text-sm text-muted-foreground">
          O histórico de atividades do projeto aparecerá aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <History className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Histórico de Atividades</h3>
          <p className="text-[10px] text-muted-foreground">
            {events.length} evento{events.length !== 1 ? 's' : ''} registrado{events.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {events.slice(0, 20).map((event) => (
            <div key={event.id} className="relative flex gap-4 pl-2">
              {/* Icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${getEventColor(event.type)}`}>
                {getEventIcon(event.type)}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-foreground text-sm">
                    {event.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(event.timestamp), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {event.description}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  por {event.author}
                </span>
              </div>
            </div>
          ))}
        </div>

        {events.length > 20 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            E mais {events.length - 20} eventos anteriores...
          </p>
        )}
      </div>
    </div>
  );
}

export const PortalAuditTab = memo(PortalAuditTabComponent);
