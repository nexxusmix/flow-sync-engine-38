/**
 * RevisionsTab - Aba de Revisões na plataforma (Redesenhada)
 * 
 * Layout em duas colunas:
 * - Esquerda: Lista de materiais com contagem de revisões
 * - Direita: Detalhes das revisões do material selecionado
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  RefreshCw,
  Filter,
  Image,
  Play,
  Send,
  AlertTriangle,
  User,
  FileVideo,
  FileText,
  Youtube,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useProjectRevisions, type ProjectComment, type ProjectChangeRequest } from "@/hooks/useProjectRevisions";
import type { ProjectWithStages } from "@/hooks/useProjects";

interface RevisionsTabProps {
  project: ProjectWithStages;
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'resolved';

interface MaterialGroup {
  id: string | null;
  title: string;
  version: number;
  type?: string;
  thumbnailUrl?: string;
  pending: number;
  inProgress: number;
  resolved: number;
  total: number;
  items: Array<ProjectComment | ProjectChangeRequest>;
}

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

  // Fetch deliverables for display
  const { data: deliverables } = useQuery({
    queryKey: ['project-portal-deliverables', portalLink?.id],
    queryFn: async () => {
      if (!portalLink?.id) return [];
      const { data } = await supabase
        .from('portal_deliverables')
        .select('id, title, type, thumbnail_url, current_version')
        .eq('portal_link_id', portalLink.id);
      return data || [];
    },
    enabled: !!portalLink?.id,
  });

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("Equipe");

  // Group by material
  const materialGroups = useMemo(() => {
    const groups: Record<string, MaterialGroup> = {};
    const generalGroup: MaterialGroup = {
      id: null,
      title: 'Geral',
      version: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      total: 0,
      items: [],
    };

    // Process comments
    comments.forEach(c => {
      const materialId = c.deliverable_id || null;
      
      if (!materialId) {
        generalGroup.items.push(c);
        generalGroup.total++;
        if (c.status === 'revision_requested' || c.status === 'open') generalGroup.pending++;
        else if (c.status === 'resolved') generalGroup.resolved++;
        return;
      }

      if (!groups[materialId]) {
        const deliverable = deliverables?.find(d => d.id === materialId);
        groups[materialId] = {
          id: materialId,
          title: deliverable?.title || c.deliverable_title || 'Material',
          version: deliverable?.current_version || 1,
          type: deliverable?.type,
          thumbnailUrl: deliverable?.thumbnail_url,
          pending: 0,
          inProgress: 0,
          resolved: 0,
          total: 0,
          items: [],
        };
      }

      groups[materialId].items.push(c);
      groups[materialId].total++;
      if (c.status === 'revision_requested' || c.status === 'open') groups[materialId].pending++;
      else if (c.status === 'resolved') groups[materialId].resolved++;
    });

    // Process change requests
    changeRequests.forEach(cr => {
      const materialId = cr.deliverable_id || null;
      
      if (!materialId) {
        generalGroup.items.push(cr as any);
        generalGroup.total++;
        if (cr.status === 'open') generalGroup.pending++;
        else if (cr.status === 'in_progress') generalGroup.inProgress++;
        else if (cr.status === 'resolved') generalGroup.resolved++;
        return;
      }

      if (!groups[materialId]) {
        const deliverable = deliverables?.find(d => d.id === materialId);
        groups[materialId] = {
          id: materialId,
          title: deliverable?.title || cr.deliverable_title || 'Material',
          version: deliverable?.current_version || 1,
          type: deliverable?.type,
          thumbnailUrl: deliverable?.thumbnail_url,
          pending: 0,
          inProgress: 0,
          resolved: 0,
          total: 0,
          items: [],
        };
      }

      groups[materialId].items.push(cr as any);
      groups[materialId].total++;
      if (cr.status === 'open') groups[materialId].pending++;
      else if (cr.status === 'in_progress') groups[materialId].inProgress++;
      else if (cr.status === 'resolved') groups[materialId].resolved++;
    });

    const result = Object.values(groups).sort((a, b) => b.pending - a.pending);
    if (generalGroup.total > 0) result.unshift(generalGroup);
    return result;
  }, [comments, changeRequests, deliverables]);

  // Selected material's items
  const selectedGroup = useMemo(() => {
    if (selectedMaterialId === null && materialGroups.length > 0) {
      // Auto-select first with pending items, or first overall
      const withPending = materialGroups.find(g => g.pending > 0);
      return withPending || materialGroups[0];
    }
    return materialGroups.find(g => g.id === selectedMaterialId) || null;
  }, [selectedMaterialId, materialGroups]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.items.filter(item => {
      const status = item.status;
      if (filterStatus === 'pending') {
        return status === 'open' || status === 'revision_requested';
      }
      if (filterStatus === 'in_progress') return status === 'in_progress';
      if (filterStatus === 'resolved') return status === 'resolved';
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [selectedGroup, filterStatus]);

  const getMaterialIcon = (type?: string) => {
    if (type?.includes('video')) return <FileVideo className="w-5 h-5" />;
    if (type?.includes('image')) return <Image className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-500 text-[10px]">Urgente</Badge>;
      case 'high':
        return <Badge className="bg-amber-500 text-[10px]">Alta</Badge>;
      default:
        return null;
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
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const isChangeRequest = (item: any): item is ProjectChangeRequest => {
    return 'title' in item && 'description' in item;
  };

  const handleReply = (itemId: string, deliverableId: string) => {
    if (!replyContent.trim()) return;
    
    addManagerResponse({
      deliverableId,
      content: replyContent,
      authorName: replyAuthor,
    });
    
    setReplyingToId(null);
    setReplyContent("");
  };

  const handleResolve = (item: any) => {
    if (isChangeRequest(item)) {
      updateChangeRequestStatus({ requestId: item.id, status: 'resolved' });
    } else {
      resolveComment(item.id);
    }
  };

  const handleStartAnalysis = (item: ProjectChangeRequest) => {
    updateChangeRequestStatus({ requestId: item.id, status: 'in_progress' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

  if (stats.total === 0) {
    return (
      <div className="space-y-6">
        {/* Stats Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard icon={MessageSquare} label="Total" value={0} color="text-muted-foreground" />
          <StatsCard icon={Clock} label="Pendentes" value={0} color="text-amber-500" />
          <StatsCard icon={RefreshCw} label="Em Análise" value={0} color="text-blue-500" />
          <StatsCard icon={CheckCircle2} label="Resolvidos" value={0} color="text-emerald-500" />
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
        <StatsCard icon={MessageSquare} label="Total" value={stats.total} color="text-muted-foreground" />
        <StatsCard icon={Clock} label="Pendentes" value={stats.pending} color="text-amber-500" />
        <StatsCard icon={RefreshCw} label="Em Análise" value={stats.inProgress} color="text-blue-500" />
        <StatsCard icon={CheckCircle2} label="Resolvidos" value={stats.resolved} color="text-emerald-500" />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Materials List */}
        <div className="lg:col-span-4">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-3 border-b border-border/50">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Materiais ({materialGroups.length})
              </h3>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="p-2 space-y-1">
                {materialGroups.map((group) => (
                  <button
                    key={group.id || 'general'}
                    onClick={() => setSelectedMaterialId(group.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                      selectedGroup?.id === group.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50"
                    )}
                  >
                    {/* Icon/Thumbnail */}
                    <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {group.thumbnailUrl ? (
                        <img src={group.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-muted-foreground">{getMaterialIcon(group.type)}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {group.title}
                        </span>
                        {group.version > 0 && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            V{String(group.version).padStart(2, '0')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {group.pending > 0 && (
                          <span className="text-[10px] text-amber-500 font-medium">
                            {group.pending} pendente{group.pending > 1 ? 's' : ''}
                          </span>
                        )}
                        {group.inProgress > 0 && (
                          <span className="text-[10px] text-blue-500">
                            {group.inProgress} em análise
                          </span>
                        )}
                        {group.pending === 0 && group.inProgress === 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {group.total} revisões
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Indicator */}
                    {group.pending > 0 && (
                      <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right: Revision Details */}
        <div className="lg:col-span-8">
          <div className="glass-card rounded-xl overflow-hidden">
            {/* Header with filter */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">
                  {selectedGroup?.title || 'Selecione um material'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {filteredItems.length} {filteredItems.length === 1 ? 'revisão' : 'revisões'}
                </p>
              </div>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <Filter className="w-3 h-3 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="in_progress">Em Análise</SelectItem>
                  <SelectItem value="resolved">Resolvidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Items */}
            <ScrollArea className="h-[450px]">
              <div className="p-4 space-y-4">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Nenhuma revisão encontrada</p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredItems.map((item) => {
                      const isCR = isChangeRequest(item);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="glass-card rounded-xl p-4"
                        >
                          <div className="flex items-start gap-4">
                            {/* Screenshot */}
                            {(item as any).screenshot_url && (
                              <button
                                onClick={() => setSelectedScreenshot((item as any).screenshot_url)}
                                className="w-20 h-14 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0 relative group"
                              >
                                <img
                                  src={(item as any).screenshot_url}
                                  alt="Frame"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Image className="w-4 h-4 text-white" />
                                </div>
                              </button>
                            )}

                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    {getPriorityBadge(item.priority)}
                                    {isCR && (
                                      <span className="text-sm font-medium text-foreground">
                                        {(item as ProjectChangeRequest).title}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {item.author_name}
                                    </span>
                                    {(item as any).timecode && (
                                      <span className="flex items-center gap-1 font-mono">
                                        <Play className="w-3 h-3" />
                                        {(item as any).timecode}
                                      </span>
                                    )}
                                    <span>
                                      {formatDistanceToNow(new Date(item.created_at), { 
                                        locale: ptBR, 
                                        addSuffix: true 
                                      })}
                                    </span>
                                  </div>
                                </div>
                                {getStatusBadge(item.status)}
                              </div>

                              {/* Content */}
                              <p className="text-sm text-muted-foreground mb-3">
                                {isCR ? (item as ProjectChangeRequest).description : (item as ProjectComment).content}
                              </p>

                              {/* Reply Form */}
                              {replyingToId === item.id ? (
                                <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Seu nome"
                                      value={replyAuthor}
                                      onChange={(e) => setReplyAuthor(e.target.value)}
                                      className="h-8 text-xs w-32"
                                    />
                                  </div>
                                  <Textarea
                                    placeholder="Digite sua resposta..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="text-sm resize-none"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => handleReply(item.id, item.deliverable_id!)}
                                      disabled={!replyContent.trim() || isUpdating}
                                    >
                                      {isUpdating ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <>
                                          <Send className="w-3 h-3 mr-1" />
                                          Enviar
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => setReplyingToId(null)}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                /* Actions */
                                <div className="flex items-center gap-2">
                                  {(item as any).screenshot_url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => setSelectedScreenshot((item as any).screenshot_url)}
                                    >
                                      <Image className="w-3.5 h-3.5 mr-1" />
                                      Ver Anotação
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => setReplyingToId(item.id)}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                    Responder
                                  </Button>
                                  {isCR && item.status === 'open' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => handleStartAnalysis(item as ProjectChangeRequest)}
                                      disabled={isUpdating}
                                    >
                                      <Clock className="w-3.5 h-3.5 mr-1" />
                                      Iniciar Análise
                                    </Button>
                                  )}
                                  {item.status !== 'resolved' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs text-emerald-500 hover:text-emerald-600"
                                      onClick={() => handleResolve(item)}
                                      disabled={isUpdating}
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                      Resolver
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Screenshot Modal */}
      <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
        <DialogContent className="max-w-4xl p-0 bg-background">
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

// Stats Card Component
function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  color: string;
}) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-4 h-4", color)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
