import { Project } from "@/types/projects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, CheckCircle2, Clock } from "lucide-react";
import { MOCK_COMMENTS } from "@/data/projectsMockData";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RevisionsTabProps {
  project: Project;
}

export function RevisionsTab({ project }: RevisionsTabProps) {
  // Use mock comments for now
  const comments = MOCK_COMMENTS.filter(c => 
    project.deliverables.some(d => d.id === c.deliverableId)
  );

  const openComments = comments.filter(c => c.status === 'open');
  const resolvedComments = comments.filter(c => c.status === 'resolved');

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
      <Button variant="outline" className="w-full md:w-auto">
        <Sparkles className="w-4 h-4 mr-2" />
        Gerar Resumo de Ajustes (IA)
      </Button>

      {/* Comments List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Comentários do Cliente</h3>

        {/* Open Comments */}
        {openComments.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm text-muted-foreground">Em Aberto ({openComments.length})</h4>
            {openComments.map((comment) => (
              <div 
                key={comment.id}
                className="glass-card rounded-xl p-4 border-l-4 border-amber-500"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-foreground">{comment.author}</span>
                      {comment.timecode !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          ⏱️ {formatTimecode(comment.timecode)}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Rodada {comment.round}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Resolver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resolved Comments */}
        {resolvedComments.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm text-muted-foreground">Resolvidos ({resolvedComments.length})</h4>
            {resolvedComments.map((comment) => (
              <div 
                key={comment.id}
                className="glass-card rounded-xl p-4 opacity-60"
              >
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-foreground line-through">{comment.author}</span>
                      {comment.timecode !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          ⏱️ {formatTimecode(comment.timecode)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-through">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Resolvido por {comment.resolvedBy}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {comments.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum comentário de revisão ainda.</p>
          </div>
        )}
      </div>

      {/* Revision Limit Warning */}
      {project.revisionsUsed >= project.revisionLimit && (
        <div className="glass-card rounded-xl p-4 bg-amber-500/10 border border-amber-500/30">
          <p className="text-sm text-amber-400">
            ⚠️ O limite de {project.revisionLimit} revisões incluídas foi atingido. 
            Novas rodadas de revisão serão cobradas separadamente.
          </p>
        </div>
      )}
    </div>
  );
}
