/**
 * PortalRevisionsTab - Aba Revisões do portal do cliente (Redesenhada)
 * 
 * Foco em timeline de revisões agrupadas por material
 * Sem formulário (agora integrado no QuickRevisionDrawer)
 */

import { memo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  User,
  Play,
  Image,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileVideo,
  FileText,
  Youtube,
  Link as LinkIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PortalChangeRequest, PortalComment, PortalDeliverable } from "@/hooks/useClientPortalEnhanced";

interface PortalRevisionsTabProps {
  changeRequests: PortalChangeRequest[];
  comments: PortalComment[];
  deliverables?: PortalDeliverable[];
  onNavigateToMaterial?: (materialId: string) => void;
}

interface GroupedRevisions {
  materialId: string | null;
  materialTitle: string;
  materialVersion: number;
  materialType?: string;
  items: Array<{
    id: string;
    type: 'comment' | 'change_request';
    content: string;
    title?: string;
    priority: string | null;
    status: string | null;
    authorName: string;
    createdAt: string;
    timecode?: string | null;
    screenshotUrl?: string | null;
    managerResponse?: string | null;
  }>;
}

function PortalRevisionsTabComponent({ 
  changeRequests, 
  comments, 
  deliverables = [],
  onNavigateToMaterial,
}: PortalRevisionsTabProps) {
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);

  // Filter only revision-related comments
  const revisionComments = comments.filter(c => 
    c.status === 'revision_requested' || c.status === 'resolved' || c.status === 'open'
  );

  // Stats
  const pendingCount = changeRequests.filter(cr => cr.status === 'open').length +
    revisionComments.filter(c => c.status === 'revision_requested' || c.status === 'open').length;
  const inProgressCount = changeRequests.filter(cr => cr.status === 'in_progress').length;
  const resolvedCount = changeRequests.filter(cr => cr.status === 'resolved').length +
    comments.filter(c => c.status === 'resolved').length;

  // Group revisions by material
  const groupedRevisions: GroupedRevisions[] = [];
  const generalItems: GroupedRevisions['items'] = [];

  // Process change requests
  changeRequests.forEach(cr => {
    const item = {
      id: cr.id,
      type: 'change_request' as const,
      content: cr.description || '',
      title: cr.title,
      priority: cr.priority,
      status: cr.status,
      authorName: cr.author_name,
      createdAt: cr.created_at,
      managerResponse: (cr as any).manager_response,
    };

    if (cr.deliverable_id) {
      const existing = groupedRevisions.find(g => g.materialId === cr.deliverable_id);
      const deliverable = deliverables.find(d => d.id === cr.deliverable_id);
      if (existing) {
        existing.items.push(item);
      } else {
        groupedRevisions.push({
          materialId: cr.deliverable_id,
          materialTitle: deliverable?.title || 'Material',
          materialVersion: deliverable?.current_version || 1,
          materialType: deliverable?.type,
          items: [item],
        });
      }
    } else {
      generalItems.push(item);
    }
  });

  // Process comments
  revisionComments.forEach(c => {
    const item = {
      id: c.id,
      type: 'comment' as const,
      content: c.content,
      priority: c.priority,
      status: c.status,
      authorName: c.author_name,
      createdAt: c.created_at,
      timecode: c.timecode,
      screenshotUrl: (c as any).screenshot_url,
    };

    if (c.deliverable_id) {
      const existing = groupedRevisions.find(g => g.materialId === c.deliverable_id);
      const deliverable = deliverables.find(d => d.id === c.deliverable_id);
      if (existing) {
        existing.items.push(item);
      } else {
        groupedRevisions.push({
          materialId: c.deliverable_id,
          materialTitle: deliverable?.title || 'Material',
          materialVersion: deliverable?.current_version || 1,
          materialType: deliverable?.type,
          items: [item],
        });
      }
    } else {
      generalItems.push(item);
    }
  });

  // Add general items group if any
  if (generalItems.length > 0) {
    groupedRevisions.unshift({
      materialId: null,
      materialTitle: 'Geral',
      materialVersion: 0,
      items: generalItems,
    });
  }

  // Sort groups by most recent activity
  groupedRevisions.sort((a, b) => {
    const aLatest = Math.max(...a.items.map(i => new Date(i.createdAt).getTime()));
    const bLatest = Math.max(...b.items.map(i => new Date(i.createdAt).getTime()));
    return bLatest - aLatest;
  });

  // Sort items within each group by date
  groupedRevisions.forEach(g => {
    g.items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  const totalRevisions = changeRequests.length + revisionComments.length;

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-primary/60" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'resolved':
        return 'Resolvido';
      case 'in_progress':
        return 'Em Análise';
      default:
        return 'Pendente';
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-destructive/90 text-white text-[10px]">Urgente</Badge>;
      case 'high':
        return <Badge className="bg-muted text-foreground text-[10px]">Alta</Badge>;
      default:
        return null;
    }
  };

  const getMaterialIcon = (type?: string) => {
    if (type?.includes('video') || type?.includes('youtube')) return <FileVideo className="w-4 h-4" />;
    if (type?.includes('image')) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="flex items-center gap-6 px-4 py-3 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
          <span className="text-sm text-gray-400">
            <span className="font-semibold text-white">{pendingCount}</span> Pendentes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary/60" />
          <span className="text-sm text-gray-400">
            <span className="font-semibold text-white">{inProgressCount}</span> Em Análise
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-sm text-gray-400">
            <span className="font-semibold text-white">{resolvedCount}</span> Resolvidos
          </span>
        </div>
      </div>

      {/* Empty State */}
      {totalRevisions === 0 && (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#111] flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="font-semibold text-white mb-2">Nenhuma revisão solicitada</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Para solicitar ajustes, clique no botão "Solicitar Ajuste" no card do material desejado na aba Materiais.
          </p>
        </div>
      )}

      {/* Grouped Revisions */}
      {groupedRevisions.length > 0 && (
        <div className="space-y-4">
          {groupedRevisions.map((group) => {
            const pendingInGroup = group.items.filter(i => 
              i.status !== 'resolved'
            ).length;
            const isExpanded = expandedMaterial === group.materialId || groupedRevisions.length <= 2;

            return (
              <div
                key={group.materialId || 'general'}
                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden"
              >
                {/* Material Header */}
                <button
                  onClick={() => setExpandedMaterial(
                    expandedMaterial === group.materialId ? null : group.materialId
                  )}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#111] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-gray-500">
                      {group.materialId ? getMaterialIcon(group.materialType) : <MessageSquare className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{group.materialTitle}</span>
                        {group.materialVersion > 0 && (
                          <Badge className="bg-[#1a1a1a] text-primary text-[10px] font-mono border border-primary/30">
                            V{String(group.materialVersion).padStart(2, '0')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {group.items.length} {group.items.length === 1 ? 'solicitação' : 'solicitações'}
                        {pendingInGroup > 0 && (
                          <span className="text-muted-foreground"> • {pendingInGroup} pendente{pendingInGroup > 1 ? 's' : ''}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {group.materialId && onNavigateToMaterial && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-gray-500 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToMaterial(group.materialId!);
                        }}
                      >
                        Ver Material
                      </Button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </button>

                {/* Items Timeline */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-[#1a1a1a]"
                    >
                      <div className="p-4 space-y-3">
                        {group.items.map((item, idx) => (
                          <div
                            key={item.id}
                            className={cn(
                              "relative pl-6 pb-3",
                              idx !== group.items.length - 1 && "border-l-2 border-[#1a1a1a] ml-2"
                            )}
                          >
                            {/* Timeline dot */}
                            <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-[#0a0a0a] border-2 border-[#2a2a2a] flex items-center justify-center -translate-x-1/2">
                              {item.status === 'resolved' ? (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              ) : item.status === 'in_progress' ? (
                                <div className="w-2 h-2 rounded-full bg-primary/50" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="ml-4 bg-[#111] rounded-lg p-3">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getStatusIcon(item.status)}
                                  <span className="text-xs text-gray-400">{getStatusLabel(item.status)}</span>
                                  {getPriorityBadge(item.priority)}
                                  {item.timecode && (
                                    <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30">
                                      <Play className="w-2.5 h-2.5 mr-1" />
                                      {item.timecode}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-600 whitespace-nowrap">
                                  {formatDistanceToNow(new Date(item.createdAt), { 
                                    locale: ptBR, 
                                    addSuffix: true 
                                  })}
                                </span>
                              </div>

                              {/* Title (for change requests) */}
                              {item.title && (
                                <h4 className="font-medium text-white text-sm mb-1">{item.title}</h4>
                              )}

                              {/* Content */}
                              <p className="text-sm text-gray-400">{item.content}</p>

                              {/* Screenshot */}
                              {item.screenshotUrl && (
                                <button
                                  onClick={() => setSelectedScreenshot(item.screenshotUrl!)}
                                  className="mt-2 w-20 h-14 rounded-lg overflow-hidden bg-[#1a1a1a] relative group"
                                >
                                  <img
                                    src={item.screenshotUrl}
                                    alt="Anotação"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Image className="w-4 h-4 text-white" />
                                  </div>
                                </button>
                              )}

                              {/* Manager Response */}
                              {item.managerResponse && (
                                <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                                  <div className="flex items-center gap-2 mb-1">
                                    <User className="w-3 h-3 text-primary" />
                                    <span className="text-[10px] text-primary uppercase tracking-wide">Resposta da equipe</span>
                                  </div>
                                  <p className="text-sm text-gray-300">{item.managerResponse}</p>
                                </div>
                              )}

                              {/* Author */}
                              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-600">
                                <User className="w-3 h-3" />
                                {item.authorName}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot Modal */}
      <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
        <DialogContent className="max-w-4xl bg-[#0a0a0a] border-[#2a2a2a] p-0">
          {selectedScreenshot && (
            <img
              src={selectedScreenshot}
              alt="Anotação visual"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const PortalRevisionsTab = memo(PortalRevisionsTabComponent);
