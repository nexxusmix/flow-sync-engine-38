/**
 * RevisionsTab - Aba de Revisões na plataforma (integração real)
 * 
 * Exibe comentários e solicitações de ajustes do portal do cliente
 * Permite filtrar, responder e resolver ajustes
 */

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Filter,
  Image,
  Play,
  Send,
  AlertTriangle,
  User,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useProjectRevisions, type ProjectComment, type ProjectChangeRequest } from "@/hooks/useProjectRevisions";
import type { ProjectWithStages } from "@/hooks/useProjects";

interface RevisionsTabProps {
  project: ProjectWithStages;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'resolved';
type FilterPriority = 'all' | 'normal' | 'high' | 'urgent';

export function RevisionsTab({ project }: RevisionsTabProps) {
  const {
    comments,
    changeRequests,
    stats,
    portalLink,
    isLoading,
    updateCommentStatus,
    updateChangeRequestStatus,
    addManagerResponse,
    resolveComment,
    isUpdating,
  } = useProjectRevisions(project.id);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ProjectComment | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");

  // Filter comments
  const filteredComments = comments.filter(c => {
    if (filterStatus === 'pending' && c.status !== 'revision_requested' && c.status !== 'open') return false;
    if (filterStatus === 'resolved' && c.status !== 'resolved') return false;
    if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
    return true;
  });

  // Filter change requests
  const filteredChangeRequests = changeRequests.filter(cr => {
    if (filterStatus === 'pending' && cr.status !== 'open') return false;
    if (filterStatus === 'in_progress' && cr.status !== 'in_progress') return false;
    if (filterStatus === 'resolved' && cr.status !== 'resolved') return false;
    if (filterPriority !== 'all' && cr.priority !== filterPriority) return false;
    return true;
  });

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-500 text-[10px]">Urgente</Badge>;
      case 'high':
        return <Badge className="bg-amber-500 text-[10px]">Alta</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-[10px]">Baixa</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'resolved':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Resolvido
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">
            <Clock className="w-3 h-3 mr-1" />
            Em Análise
          </Badge>
        );
      case 'revision_requested':
      case 'open':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleReply = () => {
    if (!replyingTo || !replyContent.trim() || !replyAuthor.trim()) return;
    
    addManagerResponse({
      deliverableId: replyingTo.deliverable_id!,
      content: replyContent,
      authorName: replyAuthor,
    });
    
    setReplyingTo(null);
    setReplyContent("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty state - no portal linked
  if (!portalLink) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-sm font-normal text-foreground mb-2">Portal não configurado</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Configure o portal do cliente para receber revisões e comentários.
        </p>
      </div>
    );
  }

  // Empty state - no revisions
  if (stats.total === 0) {
    return (
      <div className="space-y-6">
        {/* Stats Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">0</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-foreground">0</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Em Análise</span>
            </div>
            <p className="text-2xl font-bold text-foreground">0</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Resolvidos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">0</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-sm font-normal text-foreground mb-2">Nenhuma revisão recebida</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Comentários e ajustes do cliente aparecerão aqui quando forem enviados pelo portal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Em Análise</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Resolvidos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.resolved}</p>
        </div>
      </div>

      {/* AI Summary Button */}
      <Button variant="outline" className="w-full md:w-auto" disabled={stats.total === 0}>
        <Sparkles className="w-4 h-4 mr-2" />
        Gerar Resumo de Ajustes (IA)
      </Button>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros:</span>
        </div>
        
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="in_progress">Em Análise</SelectItem>
            <SelectItem value="resolved">Resolvidos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as FilterPriority)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Revision Comments */}
      <div className="space-y-3">
        {filteredComments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-start gap-4">
              {/* Screenshot Preview */}
              {comment.screenshot_url && (
                <button
                  onClick={() => setSelectedScreenshot(comment.screenshot_url!)}
                  className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted/30 relative group"
                >
                  <img
                    src={comment.screenshot_url}
                    alt="Frame"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Image className="w-5 h-5 text-white" />
                  </div>
                </button>
              )}

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getPriorityBadge(comment.priority)}
                      {comment.deliverable_title && (
                        <span className="text-sm font-medium text-foreground">
                          {comment.deliverable_title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {comment.author_name}
                      </span>
                      {comment.timecode && (
                        <span className="flex items-center gap-1 font-mono">
                          <Play className="w-3 h-3" />
                          {comment.timecode}
                        </span>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(comment.created_at), { 
                          locale: ptBR, 
                          addSuffix: true 
                        })}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(comment.status)}
                </div>

                {/* Content */}
                <p className="text-sm text-muted-foreground mb-3">
                  {comment.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {comment.screenshot_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSelectedScreenshot(comment.screenshot_url!)}
                    >
                      <Image className="w-3.5 h-3.5 mr-1" />
                      Ver Anotação
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setReplyingTo(comment)}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1" />
                    Responder
                  </Button>
                  {comment.status !== 'resolved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-emerald-500 hover:text-emerald-600"
                      onClick={() => resolveComment(comment.id)}
                      disabled={isUpdating}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Resolver
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Change Requests */}
        {filteredChangeRequests.map((request) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4 border-l-4 border-l-amber-500"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getPriorityBadge(request.priority)}
                  <span className="text-sm font-medium text-foreground">
                    {request.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {request.author_name}
                  </span>
                  {request.deliverable_title && (
                    <span>• {request.deliverable_title}</span>
                  )}
                  <span>
                    {formatDistanceToNow(new Date(request.created_at), { 
                      locale: ptBR, 
                      addSuffix: true 
                    })}
                  </span>
                </div>
              </div>
              {getStatusBadge(request.status)}
            </div>

            {request.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {request.description}
              </p>
            )}

            <div className="flex items-center gap-2">
              {request.status === 'open' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => updateChangeRequestStatus({
                    requestId: request.id,
                    status: 'in_progress',
                  })}
                  disabled={isUpdating}
                >
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Iniciar Análise
                </Button>
              )}
              {request.status !== 'resolved' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-emerald-500 hover:text-emerald-600"
                  onClick={() => updateChangeRequestStatus({
                    requestId: request.id,
                    status: 'resolved',
                    resolvedBy: 'Equipe',
                  })}
                  disabled={isUpdating}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Resolver
                </Button>
              )}
            </div>
          </motion.div>
        ))}

        {filteredComments.length === 0 && filteredChangeRequests.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma revisão encontrada com os filtros selecionados.
          </div>
        )}
      </div>

      {/* Screenshot Modal */}
      <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Anotação Visual</DialogTitle>
          </DialogHeader>
          {selectedScreenshot && (
            <div className="relative rounded-lg overflow-hidden bg-black">
              <img
                src={selectedScreenshot}
                alt="Anotação"
                className="w-full h-auto"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={!!replyingTo} onOpenChange={() => setReplyingTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Comentário</DialogTitle>
          </DialogHeader>
          {replyingTo && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                <p className="text-muted-foreground">{replyingTo.content}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  — {replyingTo.author_name}
                </p>
              </div>
              
              <Input
                placeholder="Seu nome"
                value={replyAuthor}
                onChange={(e) => setReplyAuthor(e.target.value)}
              />
              
              <Textarea
                placeholder="Sua resposta..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
              />

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setReplyingTo(null)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleReply}
                  disabled={!replyContent.trim() || !replyAuthor.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
