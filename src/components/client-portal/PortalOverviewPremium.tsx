/**
 * PortalOverviewPremium - Visão Geral do portal idêntica ao HTML de referência
 * Layout com cards de progresso, grid de materiais com thumbnails e player, status de entregas
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, ChevronDown, Play, Film, Youtube, Link2 } from "lucide-react";
import type { ProjectInfo, ProjectStage, PortalDeliverable } from "@/hooks/useClientPortalEnhanced";

interface PortalOverviewPremiumProps {
  project: ProjectInfo;
  stages: ProjectStage[];
  deliverables?: PortalDeliverable[];
  hasPaymentBlock?: boolean;
  isManager?: boolean;
  onEditBriefing?: () => void;
  onGenerateAI?: () => void;
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

// Helper to extract YouTube video ID from URL
function getYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : null;
}

function PortalOverviewPremiumComponent({ 
  project, 
  stages, 
  deliverables = [],
}: PortalOverviewPremiumProps) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<PortalDeliverable | null>(null);
  
  const currentStageKey = project.stage_current;
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const totalStages = stages.length || 9;
  const stageProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  const currentStageName = currentStageKey 
    ? STAGE_NAMES[currentStageKey] || currentStageKey 
    : 'Pré-produção';

  // Deliverable stats
  const totalDeliverables = deliverables.length || 0;
  const awaitingReview = deliverables.filter(d => d.awaiting_approval).length;

  // Materials available (with URLs)
  const availableMaterials = deliverables.filter(
    d => d.youtube_url || d.external_url || d.file_url
  );

  // Get material type for badge
  const getMaterialType = (material: PortalDeliverable) => {
    if (material.youtube_url) return { label: 'YouTube', icon: Youtube, color: 'text-red-500' };
    if (material.file_url) return { label: 'Vídeo', icon: Film, color: 'text-primary' };
    return { label: 'Link', icon: Link2, color: 'text-primary' };
  };

  // Check if material is playable (video)
  const isPlayable = (material: PortalDeliverable) => {
    return material.youtube_url || (material.file_url && material.file_url.match(/\.(mp4|webm|mov)$/i));
  };

  // Preview modal YouTube ID
  const previewYoutubeId = previewMaterial ? getYouTubeVideoId(previewMaterial.youtube_url) : null;

  return (
    <div className="space-y-6">
      {/* Progress Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progresso */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
            Progresso
          </p>
          <p className="text-3xl font-light text-foreground mb-1">{stageProgress}%</p>
          <p className="text-xs text-muted-foreground">{completedStages} de {totalStages} etapas concluídas</p>
        </div>

        {/* Etapa Atual */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
            Etapa Atual
          </p>
          <p className="text-xl font-light text-primary mb-1">{currentStageName}</p>
          <p className="text-xs text-muted-foreground">Em andamento</p>
        </div>

        {/* Materiais Disponíveis */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
            Materiais Prontos
          </p>
          <p className="text-3xl font-light text-emerald-400 mb-1">{availableMaterials.length}</p>
          <p className="text-xs text-muted-foreground">Disponíveis para acesso</p>
        </div>
      </div>

      {/* Materials Grid with Thumbnails */}
      {availableMaterials.length > 0 && (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a]">
          <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-[18px] h-[18px] text-primary" />
              <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">
                Materiais do Projeto
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">{availableMaterials.length} itens</span>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableMaterials.map((material) => {
                const youtubeId = getYouTubeVideoId(material.youtube_url);
                const materialType = getMaterialType(material);
                const playable = isPlayable(material);

                return (
                  <button 
                    key={material.id}
                    onClick={() => setPreviewMaterial(material)}
                    className="bg-background/50 border border-border rounded-lg overflow-hidden group text-left transition-all hover:border-primary/50 hover:bg-background/80"
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
                      {playable && (
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
                );
              })}
            </div>
          </div>
        </div>
      )}

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
          {/* Awaiting Review Item */}
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
                  >
                    Revisar Agora
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Delivery */}
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

          {/* Empty state */}
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
