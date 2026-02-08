/**
 * PortalRevisionsTab - Aba Revisões do portal do cliente (aprimorada)
 * 
 * Exibe solicitações de ajustes e histórico de revisões com UI premium
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PortalChangeRequest, PortalComment } from "@/hooks/useClientPortalEnhanced";

interface PortalRevisionsTabProps {
  changeRequests: PortalChangeRequest[];
  comments: PortalComment[];
  onCreateRequest?: () => void;
}

function PortalRevisionsTabComponent({ changeRequests, comments, onCreateRequest }: PortalRevisionsTabProps) {
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  if (totalRevisions === 0) {
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Em Análise</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Resolvidos</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#111] flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-gray-600" />
          </div>
          <h3 className="font-semibold text-white mb-2">Nenhuma revisão solicitada</h3>
          <p className="text-sm text-gray-500 mb-4">
            Quando você solicitar ajustes nos materiais, eles aparecerão aqui.
          </p>
          {onCreateRequest && (
            <Button
              variant="outline"
              size="sm"
              className="border-[#2a2a2a] text-gray-400 hover:text-white"
              onClick={onCreateRequest}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Solicitação
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalRevisions}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-white">{pendingCount}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Em Análise</span>
          </div>
          <p className="text-2xl font-bold text-white">{inProgressCount}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Resolvidos</span>
          </div>
          <p className="text-2xl font-bold text-white">{resolvedCount}</p>
        </div>
      </div>

      {/* New Request Button */}
      {onCreateRequest && (
        <Button
          variant="outline"
          size="sm"
          className="border-[#2a2a2a] text-gray-400 hover:text-white"
          onClick={onCreateRequest}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Solicitação de Ajuste
        </Button>
      )}

      {/* Revision Comments */}
      {revisionComments.length > 0 && (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#1a1a1a]">
            <h3 className="font-semibold text-white">Comentários de Revisão</h3>
          </div>
          
          <div className="divide-y divide-[#1a1a1a]">
            {revisionComments.map((comment) => {
              const hasScreenshot = !!(comment as any).screenshot_url;
              const timecode = comment.timecode;
              const isExpanded = expandedId === comment.id;

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
                        className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#111] relative group"
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
                          <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <User className="w-3 h-3 text-cyan-400" />
                          </div>
                          <span className="text-sm font-medium text-white">
                            {comment.author_name}
                          </span>
                          {timecode && (
                            <Badge variant="outline" className="text-[10px] font-mono">
                              <Play className="w-2.5 h-2.5 mr-1" />
                              {timecode}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-600">
                          {formatDistanceToNow(new Date(comment.created_at), { 
                            locale: ptBR, 
                            addSuffix: true 
                          })}
                        </span>
                      </div>

                      <p className="text-sm text-gray-400">
                        {comment.content}
                      </p>

                      {/* Status Badge */}
                      <div className="mt-3">
                        {comment.status === 'resolved' ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Resolvido
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">
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
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#1a1a1a]">
            <h3 className="font-semibold text-white">Solicitações de Ajuste</h3>
          </div>
          
          <div className="divide-y divide-[#1a1a1a]">
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
                        <h4 className="font-medium text-white">{request.title}</h4>
                        <p className="text-[10px] text-gray-500">
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
                    <p className="text-sm text-gray-400 mb-3">
                      {request.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[10px] text-gray-500">
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
        <DialogContent className="max-w-4xl bg-[#0a0a0a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">Anotação Visual</DialogTitle>
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
