/**
 * PortalRevisionsTab - Aba Revisões do portal do cliente (aprimorada)
 * 
 * Exibe solicitações de ajustes e histórico de revisões com UI premium
 * Permite criar novas solicitações de ajuste
 */

import { memo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  User,
  Calendar,
  Image,
  Play,
  ChevronDown,
  Plus,
  Send,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PortalChangeRequest, PortalComment, PortalDeliverable } from "@/hooks/useClientPortalEnhanced";

interface PortalRevisionsTabProps {
  changeRequests: PortalChangeRequest[];
  comments: PortalComment[];
  deliverables?: PortalDeliverable[];
  onCreateRequest?: (data: {
    deliverableId?: string;
    title: string;
    description?: string;
    authorName: string;
    authorEmail?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }) => void;
  isCreatingRequest?: boolean;
}

const PRIORITIES = [
  { id: 'low', label: 'Baixa', color: 'bg-gray-500' },
  { id: 'normal', label: 'Normal', color: 'bg-blue-500' },
  { id: 'high', label: 'Alta', color: 'bg-amber-500' },
  { id: 'urgent', label: 'Urgente', color: 'bg-red-500' },
] as const;

function PortalRevisionsTabComponent({ 
  changeRequests, 
  comments, 
  deliverables = [],
  onCreateRequest,
  isCreatingRequest = false,
}: PortalRevisionsTabProps) {
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  
  // New request form state
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    authorName: '',
    authorEmail: '',
    deliverableId: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  });

  const revisionComments = comments.filter(c => c.status === 'revision_requested');
  
  // Stats
  const totalRevisions = changeRequests.length + revisionComments.length;
  const pendingCount = changeRequests.filter(cr => cr.status === 'open').length +
    revisionComments.filter(c => c.status === 'revision_requested').length;
  const inProgressCount = changeRequests.filter(cr => cr.status === 'in_progress').length;
  const resolvedCount = changeRequests.filter(cr => cr.status === 'resolved').length +
    comments.filter(c => c.status === 'resolved').length;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'resolved':
        return { label: 'Resolvido', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/20' };
      case 'in_progress':
        return { label: 'Em andamento', icon: Clock, color: 'text-blue-500 bg-blue-500/20' };
      case 'rejected':
        return { label: 'Rejeitado', icon: AlertCircle, color: 'text-red-500 bg-red-500/20' };
      default:
        return { label: 'Pendente', icon: MessageSquare, color: 'text-amber-500 bg-amber-500/20' };
    }
  };

  const getPriorityBadge = (priority: string) => {
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

  const handleSubmitNewRequest = () => {
    if (!newRequest.title.trim() || !newRequest.authorName.trim()) return;
    
    onCreateRequest?.({
      deliverableId: newRequest.deliverableId || undefined,
      title: newRequest.title,
      description: newRequest.description || undefined,
      authorName: newRequest.authorName,
      authorEmail: newRequest.authorEmail || undefined,
      priority: newRequest.priority,
    });
    
    // Reset form
    setNewRequest({
      title: '',
      description: '',
      authorName: '',
      authorEmail: '',
      deliverableId: '',
      priority: 'normal',
    });
    setShowNewRequestForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalRevisions}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Em Análise</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Resolvidos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{resolvedCount}</p>
        </div>
      </div>

      {/* New Request Button / Form */}
      {onCreateRequest && !showNewRequestForm && (
        <Button
          variant="outline"
          size="sm"
          className="border-border text-muted-foreground hover:text-foreground"
          onClick={() => setShowNewRequestForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Solicitação de Ajuste
        </Button>
      )}

      {/* New Request Form */}
      <AnimatePresence>
        {showNewRequestForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-xl p-4 space-y-4"
          >
            <h3 className="font-medium text-foreground">Nova Solicitação de Ajuste</h3>
            
            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Título da solicitação *</label>
              <Input
                placeholder="Ex: Ajustar cor do logo..."
                value={newRequest.title}
                onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                className="bg-background"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Descrição</label>
              <Textarea
                placeholder="Descreva o ajuste necessário em detalhes..."
                value={newRequest.description}
                onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                className="bg-background resize-none"
                rows={3}
              />
            </div>

            {/* Material Selection */}
            {deliverables.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Material relacionado (opcional)</label>
                <select
                  value={newRequest.deliverableId}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, deliverableId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md bg-background border border-input text-sm"
                >
                  <option value="">Nenhum (geral)</option>
                  {deliverables.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Prioridade</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setNewRequest(prev => ({ ...prev, priority: p.id }))}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                      newRequest.priority === p.id
                        ? `${p.color} text-white`
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Author Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Seu nome *</label>
                <Input
                  placeholder="Nome"
                  value={newRequest.authorName}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, authorName: e.target.value }))}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">E-mail</label>
                <Input
                  placeholder="E-mail (opcional)"
                  type="email"
                  value={newRequest.authorEmail}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, authorEmail: e.target.value }))}
                  className="bg-background"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewRequestForm(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitNewRequest}
                disabled={isCreatingRequest || !newRequest.title.trim() || !newRequest.authorName.trim()}
              >
                {isCreatingRequest ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {totalRevisions === 0 && !showNewRequestForm && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Nenhuma revisão solicitada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Quando você solicitar ajustes nos materiais, eles aparecerão aqui.
          </p>
          {onCreateRequest && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewRequestForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Solicitação
            </Button>
          )}
        </div>
      )}

      {/* Revision Comments */}
      {revisionComments.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Comentários de Revisão</h3>
          </div>
          
          <div className="divide-y divide-border">
            {revisionComments.map((comment) => {
              const hasScreenshot = !!(comment as any).screenshot_url;
              const timecode = comment.timecode;

              return (
                <motion.div
                  key={comment.id}
                  className="p-4"
                  initial={false}
                >
                  <div className="flex items-start gap-4">
                    {/* Screenshot Preview */}
                    {hasScreenshot && (
                      <button
                        onClick={() => setSelectedScreenshot((comment as any).screenshot_url)}
                        className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted relative group"
                      >
                        <img
                          src={(comment as any).screenshot_url}
                          alt="Frame"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Image className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {comment.author_name}
                          </span>
                          {timecode && (
                            <Badge variant="outline" className="text-[10px] font-mono">
                              <Play className="w-2.5 h-2.5 mr-1" />
                              {timecode}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { 
                            locale: ptBR, 
                            addSuffix: true 
                          })}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {comment.content}
                      </p>

                      {/* Status Badge */}
                      <div className="mt-3">
                        {comment.status === 'resolved' ? (
                          <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Resolvido
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-500 text-[10px]">
                            <Clock className="w-3 h-3 mr-1" />
                            Aguardando análise
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Change Requests */}
      {changeRequests.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Solicitações de Ajuste</h3>
          </div>
          
          <div className="divide-y divide-border">
            {changeRequests.map((request) => {
              const statusConfig = getStatusConfig(request.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={request.id} className="p-4">
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
    </div>
  );
}

export const PortalRevisionsTab = memo(PortalRevisionsTabComponent);
