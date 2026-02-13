/**
 * PortalOverviewPremium - Visão Geral do portal idêntica ao HTML de referência
 * Layout com cards de progresso, grid de materiais com thumbnails e player, status de entregas
 * Supports: select individual/all, bulk delete, undo/redo
 */

import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ChevronDown, Play, Film, Youtube, Link2, Trash2, Undo2, Redo2, CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ProjectInfo, ProjectStage, PortalDeliverable } from "@/hooks/useClientPortalEnhanced";

interface PortalOverviewPremiumProps {
  project: ProjectInfo;
  stages: ProjectStage[];
  deliverables?: PortalDeliverable[];
  isManager?: boolean;
  onEditBriefing?: () => void;
  onGenerateAI?: () => void;
  onReviewNow?: (deliverableId: string) => void;
}

// Stage name mapping
const STAGE_NAMES: Record<string, string> = {
  briefing: 'Briefing',
  roteiro: 'Roteiro',
  pre_producao: 'Pré-Produção',
  captacao: 'Captação',
  edicao: 'Edição',
  revisao: 'Revisão',
  aprovacao: 'Aprovação',
  entrega: 'Entrega',
  pos_venda: 'Pós-Venda',
};

function getYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : null;
}

// Undo/Redo action types
type HistoryAction = {
  type: 'delete';
  ids: string[];
};

function PortalOverviewPremiumComponent({ 
  project, 
  stages, 
  deliverables = [],
  isManager,
  onReviewNow,
}: PortalOverviewPremiumProps) {
  const queryClient = useQueryClient();
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<PortalDeliverable | null>(null);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);
  
  const currentStageKey = project.stage_current;
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const totalStages = stages.length || 9;
  const stageProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  const currentStageName = currentStageKey 
    ? STAGE_NAMES[currentStageKey] || currentStageKey 
    : 'Pré-produção';

  const totalDeliverables = deliverables.length || 0;
  const awaitingReview = deliverables.filter(d => d.awaiting_approval).length;

  const availableMaterials = deliverables.filter(
    d => d.youtube_url || d.external_url || d.file_url
  );

  const getMaterialType = (material: PortalDeliverable) => {
    if (material.youtube_url) return { label: 'YouTube', icon: Youtube, color: 'text-red-500' };
    if (material.file_url) return { label: 'Vídeo', icon: Film, color: 'text-primary' };
    return { label: 'Link', icon: Link2, color: 'text-primary' };
  };

  const isPlayable = (material: PortalDeliverable) => {
    return material.youtube_url || (material.file_url && material.file_url.match(/\.(mp4|webm|mov)$/i));
  };

  const previewYoutubeId = previewMaterial ? getYouTubeVideoId(previewMaterial.youtube_url) : null;

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === availableMaterials.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableMaterials.map(m => m.id)));
    }
  }, [availableMaterials, selectedIds.size]);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  // Delete (archive) selected materials
  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsDeleting(true);
    try {
      // Archive the deliverables (soft delete)
      const { error } = await supabase
        .from('project_deliverables')
        .update({ visible_in_portal: false, updated_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;

      // Push to undo stack
      setUndoStack(prev => [...prev, { type: 'delete', ids }]);
      setRedoStack([]); // Clear redo on new action

      setSelectedIds(new Set());
      setSelectionMode(false);
      setShowDeleteConfirm(false);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['client-portal'] });
      toast.success(`${ids.length} ${ids.length === 1 ? 'material removido' : 'materiais removidos'}`, {
        action: {
          label: 'Desfazer',
          onClick: () => handleUndo({ type: 'delete', ids }),
        },
      });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover materiais');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, queryClient]);

  // Undo: restore visibility
  const handleUndo = useCallback(async (action?: HistoryAction) => {
    const actionToUndo = action || undoStack[undoStack.length - 1];
    if (!actionToUndo) return;

    try {
      if (actionToUndo.type === 'delete') {
        await supabase
          .from('project_deliverables')
          .update({ visible_in_portal: true, updated_at: new Date().toISOString() })
          .in('id', actionToUndo.ids);
        
        if (!action) {
          setUndoStack(prev => prev.slice(0, -1));
          setRedoStack(prev => [...prev, actionToUndo]);
        }
        
        queryClient.invalidateQueries({ queryKey: ['client-portal'] });
        toast.success('Ação desfeita');
      }
    } catch (err: any) {
      toast.error('Erro ao desfazer');
    }
  }, [undoStack, queryClient]);

  // Redo: re-hide
  const handleRedo = useCallback(async () => {
    const actionToRedo = redoStack[redoStack.length - 1];
    if (!actionToRedo) return;

    try {
      if (actionToRedo.type === 'delete') {
        await supabase
          .from('project_deliverables')
          .update({ visible_in_portal: false, updated_at: new Date().toISOString() })
          .in('id', actionToRedo.ids);
        
        setRedoStack(prev => prev.slice(0, -1));
        setUndoStack(prev => [...prev, actionToRedo]);
        
        queryClient.invalidateQueries({ queryKey: ['client-portal'] });
        toast.success('Ação refeita');
      }
    } catch (err: any) {
      toast.error('Erro ao refazer');
    }
  }, [redoStack, queryClient]);

  const allSelected = availableMaterials.length > 0 && selectedIds.size === availableMaterials.length;

  return (
    <div className="space-y-6">
      {/* Progress Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">Progresso</p>
          <p className="text-3xl font-light text-foreground mb-1">{stageProgress}%</p>
          <p className="text-xs text-muted-foreground">{completedStages} de {totalStages} etapas concluídas</p>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">Etapa Atual</p>
          <p className="text-xl font-light text-primary mb-1">{currentStageName}</p>
          <p className="text-xs text-muted-foreground">Em andamento</p>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">Materiais Prontos</p>
          <p className="text-3xl font-light text-emerald-400 mb-1">{availableMaterials.length}</p>
          <p className="text-xs text-muted-foreground">Disponíveis para acesso</p>
        </div>
      </div>

      {/* Materials Grid with Thumbnails */}
      {availableMaterials.length > 0 && (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl">
          <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-[18px] h-[18px] text-primary" />
              <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">
                Materiais do Projeto
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Undo / Redo */}
              {(undoStack.length > 0 || redoStack.length > 0) && (
                <div className="flex items-center gap-1 mr-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleUndo()}
                    disabled={undoStack.length === 0}
                    title="Desfazer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    title="Refazer"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              {/* Selection mode toggle */}
              {!selectionMode ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectionMode(true)}
                >
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                  Selecionar
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={selectAll}
                  >
                    {allSelected ? 'Desmarcar tudo' : 'Selecionar tudo'}
                  </Button>
                  
                  {selectedIds.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Excluir ({selectedIds.size})
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={exitSelectionMode}
                  >
                    Cancelar
                  </Button>
                </div>
              )}

              <span className="text-xs text-muted-foreground">{availableMaterials.length} itens</span>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableMaterials.map((material) => {
                const youtubeId = getYouTubeVideoId(material.youtube_url);
                const materialType = getMaterialType(material);
                const playable = isPlayable(material);
                const isChecked = selectedIds.has(material.id);

                return (
                  <div key={material.id} className="relative group">
                    {/* Checkbox overlay */}
                    {selectionMode && (
                      <div
                        className="absolute top-3 left-3 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelection(material.id);
                        }}
                      >
                        <Checkbox
                          checked={isChecked}
                          className={cn(
                            "h-5 w-5 border-2 rounded bg-background/80 backdrop-blur-sm",
                            isChecked 
                              ? "border-primary bg-primary text-primary-foreground" 
                              : "border-white/40"
                          )}
                        />
                      </div>
                    )}

                    <button 
                      onClick={() => {
                        if (selectionMode) {
                          toggleSelection(material.id);
                        } else {
                          setPreviewMaterial(material);
                        }
                      }}
                      className={cn(
                        "bg-background/50 border rounded-lg overflow-hidden text-left transition-all hover:border-primary/50 hover:bg-background/80 w-full",
                        selectionMode && isChecked 
                          ? "border-primary ring-1 ring-primary/50" 
                          : "border-border"
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video relative bg-muted/20">
                        {youtubeId ? (
                          <img 
                            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                            alt={material.title}
                            className="w-full h-full object-cover"
                          />
                        ) : material.file_url && material.file_url.match(/\.(mp4|webm|mov)$/i) ? (
                          <video 
                            src={material.file_url} 
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-muted/30">
                            <materialType.icon className={cn("w-10 h-10", materialType.color, "opacity-50")} />
                          </div>
                        )}
                        
                        {/* Play Button Overlay */}
                        {playable && !selectionMode && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
                              <Play className="w-6 h-6 text-primary-foreground ml-0.5" fill="currentColor" />
                            </div>
                          </div>
                        )}

                        {/* Type Badge */}
                        <div className="absolute top-2 right-2">
                          <span className={cn(
                            "text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded",
                            youtubeId ? "bg-red-500/90 text-white" : "bg-primary/90 text-primary-foreground"
                          )}>
                            {materialType.label}
                          </span>
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="p-4">
                        <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {material.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <materialType.icon className={cn("w-3 h-3", materialType.color)} />
                          <span className="text-[10px] text-muted-foreground">
                            {material.type || materialType.label}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.size} {selectedIds.size === 1 ? 'material' : 'materiais'}?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedIds.size === 1 
                ? 'Este material será removido da visibilidade do portal. Você pode desfazer essa ação.'
                : `Estes ${selectedIds.size} materiais serão removidos da visibilidade do portal. Você pode desfazer essa ação.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Modal */}
      <Dialog open={!!previewMaterial} onOpenChange={() => setPreviewMaterial(null)}>
        <DialogContent className="max-w-4xl p-0 bg-background border-border overflow-hidden">
          <DialogTitle className="sr-only">
            {previewMaterial?.title || 'Preview do Material'}
          </DialogTitle>
          
          <div className="aspect-video bg-black">
            {previewYoutubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${previewYoutubeId}?autoplay=1&rel=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : previewMaterial?.file_url && previewMaterial.file_url.match(/\.(mp4|webm|mov)$/i) ? (
              <video 
                src={previewMaterial.file_url} 
                controls 
                autoPlay 
                className="w-full h-full"
              />
            ) : previewMaterial?.external_url ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Link externo</p>
                  <Button
                    onClick={() => window.open(previewMaterial.external_url!, '_blank')}
                    className="gap-2"
                  >
                    Abrir Link
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          
          <div className="p-4 border-t border-border">
            <h4 className="font-medium text-foreground">{previewMaterial?.title}</h4>
            {previewMaterial?.type && (
              <p className="text-xs text-muted-foreground mt-1">{previewMaterial.type}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Status de Entregas */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a]">
        <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>
              checklist
            </span>
            <h3 className="text-sm font-medium text-foreground">Status de Entregas</h3>
          </div>
          <span className="text-xs text-muted-foreground">{totalDeliverables} Itens Contratados</span>
        </div>

        <div className="divide-y divide-[#1a1a1a]">
          {awaitingReview > 0 && (
            <div className="p-5 bg-amber-500/5 border-l-2 border-amber-400">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-amber-400 mt-0.5" style={{ fontSize: 20 }}>
                  rate_review
                </span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">
                    {awaitingReview} {awaitingReview === 1 ? 'entrega aguardando' : 'entregas aguardando'} revisão
                  </h4>
                  <p className="text-xs text-amber-400 font-medium mb-2">
                    Aguardando sua Revisão
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Material disponível para feedback imediato na aba 'Entregas'.
                  </p>
                  <Button 
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-black text-xs h-8 rounded-none font-medium"
                    onClick={() => {
                      const firstAwaitingId = deliverables.find(d => d.awaiting_approval)?.id;
                      if (firstAwaitingId && onReviewNow) {
                        onReviewNow(firstAwaitingId);
                      }
                    }}
                  >
                    Revisar Agora
                  </Button>
                </div>
              </div>
            </div>
          )}

          {totalDeliverables > 0 && (
            <div className="p-5">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontSize: 20 }}>
                  movie_edit
                </span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">
                    Entregas em Produção
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    {totalDeliverables - awaitingReview} itens em produção ou finalizados.
                  </p>
                  <span className="text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold bg-primary/20 text-primary">
                    Em Andamento
                  </span>
                </div>
              </div>
            </div>
          )}

          {totalDeliverables === 0 && (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-muted-foreground mb-2" style={{ fontSize: 32 }}>
                inventory_2
              </span>
              <p className="text-xs text-muted-foreground">
                Nenhuma entrega cadastrada ainda.
              </p>
            </div>
          )}
        </div>

        {totalDeliverables > 0 && (
          <div className="p-4 border-t border-[#1a1a1a]">
            <button className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              Ver lista completa de {totalDeliverables} entregas
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Resumo Executivo - Collapsible */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a]">
        <button 
          onClick={() => setIsSummaryOpen(!isSummaryOpen)}
          className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>
              summarize
            </span>
            <h3 className="text-sm font-medium text-foreground">Resumo Executivo</h3>
          </div>
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              isSummaryOpen && "rotate-180"
            )} 
          />
        </button>
        <AnimatePresence>
          {isSummaryOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-5 pt-0 border-t border-[#1a1a1a]">
                {project.description ? (
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed pt-5">
                    {project.description.split('\n\n').slice(0, 2).map((paragraph, i) => (
                      <p key={i}>{paragraph.substring(0, 400)}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed pt-5">
                    Este projeto audiovisual visa registrar e transmitir a magnitude do empreendimento através de uma narrativa cinematográfica completa.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const PortalOverviewPremium = memo(PortalOverviewPremiumComponent);
