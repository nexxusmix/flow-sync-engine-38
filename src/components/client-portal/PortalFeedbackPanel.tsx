/**
 * PortalFeedbackPanel - Painel de feedback/comentários para um material
 * 
 * Funcionalidades:
 * - Comentários encadeados (cliente ↔ gestor)
 * - Envio de comentários com identificação
 * - Botão de aprovação
 * - Solicitação de revisão
 * - Visualização de status de aprovação
 */

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  User,
  AlertCircle,
  Loader2,
  ThumbsUp,
  Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface PortalComment {
  id: string;
  author_name: string;
  author_email?: string | null;
  author_role?: string | null;
  content: string;
  timecode?: string | null;
  status?: string | null;
  created_at: string;
}

export interface PortalApproval {
  id: string;
  approved_by_name: string;
  approved_by_email?: string | null;
  approved_at: string;
  notes?: string | null;
}

interface PortalFeedbackPanelProps {
  materialId: string;
  materialTitle: string;
  comments: PortalComment[];
  approval?: PortalApproval | null;
  onAddComment: (data: { authorName: string; authorEmail?: string; content: string }) => void;
  onApprove: (data: { approvedByName: string; approvedByEmail?: string; notes?: string }) => void;
  onRequestRevision: (data: { authorName: string; authorEmail?: string; content: string }) => void;
  isAddingComment: boolean;
  isApproving: boolean;
  isRequestingRevision: boolean;
  hasPaymentBlock?: boolean;
}

function CommentItem({ comment }: { comment: PortalComment }) {
  const isManager = comment.author_role === 'manager';
  
  return (
    <div className={cn(
      "flex gap-3",
      isManager && "flex-row-reverse"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isManager ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <User className="w-4 h-4" />
      </div>
      <div className={cn(
        "flex-1 max-w-[80%]",
        isManager && "text-right"
      )}>
        <div className={cn(
          "rounded-2xl p-3",
          isManager ? "bg-primary/10 rounded-tr-sm" : "bg-muted/50 rounded-tl-sm"
        )}>
          <p className="text-sm text-foreground">{comment.content}</p>
        </div>
        <div className={cn(
          "flex items-center gap-2 mt-1 text-[10px] text-muted-foreground",
          isManager && "flex-row-reverse"
        )}>
          <span className="font-medium">{comment.author_name}</span>
          <span>•</span>
          <span>{format(new Date(comment.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
          {comment.timecode && (
            <>
              <span>•</span>
              <span className="text-primary font-mono">{comment.timecode}</span>
            </>
          )}
          {comment.status === 'revision_requested' && (
            <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[9px] ml-2">
              Revisão
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export function PortalFeedbackPanel({
  materialId,
  materialTitle,
  comments,
  approval,
  onAddComment,
  onApprove,
  onRequestRevision,
  isAddingComment,
  isApproving,
  isRequestingRevision,
  hasPaymentBlock,
}: PortalFeedbackPanelProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    content: '',
  });
  const [mode, setMode] = useState<'comment' | 'revision' | 'approve'>('comment');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.content) return;

    if (mode === 'revision') {
      onRequestRevision({
        authorName: form.name,
        authorEmail: form.email || undefined,
        content: form.content,
      });
    } else {
      onAddComment({
        authorName: form.name,
        authorEmail: form.email || undefined,
        content: form.content,
      });
    }
    setForm({ ...form, content: '' });
  };

  const handleApprove = () => {
    if (!form.name) return;
    onApprove({
      approvedByName: form.name,
      approvedByEmail: form.email || undefined,
    });
  };

  const isApproved = !!approval;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Feedback</h3>
          </div>
          {isApproved ? (
            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Aprovado
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
              <Clock className="w-3 h-3 mr-1" />
              Aguardando
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{materialTitle}</p>
      </div>

      {/* Approval Info */}
      {approval && (
        <div className="p-4 bg-emerald-500/5 border-b border-border/50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Aprovado por {approval.approved_by_name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {format(new Date(approval.approved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {approval.notes && (
                <p className="text-xs text-muted-foreground mt-1">{approval.notes}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Block Warning */}
      {hasPaymentBlock && (
        <div className="p-4 bg-amber-500/5 border-b border-border/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Aprovação bloqueada devido a pendências financeiras. Entre em contato com a equipe.
            </p>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="p-4 max-h-[400px] overflow-y-auto space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum comentário ainda</p>
            <p className="text-[10px] text-muted-foreground/60">
              Seja o primeiro a comentar sobre este material
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>

      {/* Input Form */}
      {!isApproved && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 space-y-3">
          {/* Name & Email Row */}
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Seu nome *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-9 text-sm"
              required
            />
            <Input
              type="email"
              placeholder="E-mail (opcional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-9 text-sm"
            />
          </div>

          {/* Comment Input */}
          <div className="relative">
            <Textarea
              placeholder={mode === 'revision' ? "Descreva os ajustes necessários..." : "Escreva seu comentário..."}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="min-h-[80px] pr-12 text-sm resize-none"
              required
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute bottom-2 right-2 h-8 w-8"
              disabled={!form.name || !form.content || isAddingComment || isRequestingRevision}
            >
              {(isAddingComment || isRequestingRevision) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={mode === 'comment' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setMode('comment')}
            >
              <MessageSquare className="w-3 h-3 mr-1.5" />
              Comentar
            </Button>
            <Button
              type="button"
              variant={mode === 'revision' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setMode('revision')}
            >
              <Edit3 className="w-3 h-3 mr-1.5" />
              Pedir Ajuste
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1 text-xs bg-emerald-500 hover:bg-emerald-600"
              onClick={handleApprove}
              disabled={!form.name || isApproving || hasPaymentBlock}
            >
              {isApproving ? (
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              ) : (
                <ThumbsUp className="w-3 h-3 mr-1.5" />
              )}
              Aprovar
            </Button>
          </div>
        </form>
      )}

      {/* Already Approved Message */}
      {isApproved && (
        <div className="p-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Este material já foi aprovado. Você ainda pode adicionar comentários se necessário.
          </p>
          <form onSubmit={handleSubmit} className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Seu nome *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-8 text-xs"
                required
              />
              <Input
                type="email"
                placeholder="E-mail"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="relative">
              <Textarea
                placeholder="Comentário adicional..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="min-h-[60px] pr-10 text-xs resize-none"
                required
              />
              <Button 
                type="submit" 
                size="icon" 
                variant="ghost"
                className="absolute bottom-1 right-1 h-7 w-7"
                disabled={!form.name || !form.content || isAddingComment}
              >
                {isAddingComment ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
