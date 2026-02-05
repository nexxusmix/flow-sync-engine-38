import { Project } from "@/types/projects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, CheckCircle2, Clock, Inbox } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RevisionsTabProps {
  project: Project;
}

export function RevisionsTab({ project }: RevisionsTabProps) {
  // Empty state - comments would come from project deliverables
  const comments: any[] = [];
  const openComments = comments.filter(c => c.status === 'open');
  const resolvedComments = comments.filter(c => c.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{comments.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Em Aberto</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{openComments.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Resolvidos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{resolvedComments.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">Rodada Atual</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{project.revisionsUsed + 1}</p>
        </div>
      </div>

      {/* AI Summary Button */}
      <Button variant="outline" className="w-full md:w-auto" disabled={comments.length === 0}>
        <Sparkles className="w-4 h-4 mr-2" />
        Gerar Resumo de Ajustes (IA)
      </Button>

      {/* Empty State */}
      <div className="glass-card rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-sm font-normal text-foreground mb-2">Nenhum comentário de revisão</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Comentários do cliente aparecerão aqui quando houver entregáveis em revisão.
        </p>
      </div>

      {/* Revision Limit Warning */}
      {project.revisionsUsed >= project.revisionLimit && (
        <div className="glass-card rounded-xl p-4 bg-amber-500/10 border border-amber-500/30">
          <p className="text-sm text-amber-400">
            ⚠️ O limite de {project.revisionLimit} revisões incluídas foi atingido.
          </p>
        </div>
      )}
    </div>
  );
}
