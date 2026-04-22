/**
 * PortalMaterialsTab - Aba de Materiais do Portal com player de vídeo e anotações
 * Supports batch selection + bulk download
 */

import { memo, useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileVideo, Plus, Upload, Download, CheckSquare, X, Search, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PortalMaterialCard } from "./PortalMaterialCard";
import { AddVersionDialog } from "./AddVersionDialog";
import { AnnotationCanvas } from "./AnnotationCanvas";
import { RevisionForm } from "./RevisionForm";
import { MaterialLightbox } from "./MaterialLightbox";
import { QuickRevisionDrawer } from "../QuickRevisionDrawer";
import type {
  PortalDeliverable,
  PortalComment,
  PortalApproval,
  PortalVersion,
} from "@/hooks/useClientPortalEnhanced";

interface PortalMaterialsTabProps {
  deliverables: PortalDeliverable[];
  comments: PortalComment[];
  approvals: PortalApproval[];
  versions: PortalVersion[];
  selectedMaterialId: string | null;
  onSelectMaterial: (id: string | null) => void;
  onAddComment: (data: { 
    authorName: string; 
    authorEmail?: string; 
    content: string;
    timecode?: string;
    priority?: string;
    frameTimestampMs?: number;
    screenshotUrl?: string;
  }) => void;
  onApprove: (data: { approvedByName: string; approvedByEmail?: string; notes?: string }) => void;
  onRequestRevision: (data: { 
    deliverableId?: string;
    authorName: string; 
    authorEmail?: string; 
    content: string;
    timecode?: string;
    priority?: string;
    frameTimestampMs?: number;
    screenshotUrl?: string;
  }) => void;
  isAddingComment: boolean;
  isApproving: boolean;
  isRequestingRevision: boolean;
  portalLinkId?: string;
  isManager?: boolean;
}

function formatTimecode(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  a.setAttribute("target", "_blank");
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function PortalMaterialsTabComponent({
  deliverables,
  comments,
  approvals,
  versions,
  selectedMaterialId,
  onSelectMaterial,
  onAddComment,
  onApprove,
  onRequestRevision,
  isAddingComment,
  isApproving,
  isRequestingRevision,
  portalLinkId,
  isManager = false,
}: PortalMaterialsTabProps) {
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [addVersionForMaterial, setAddVersionForMaterial] = useState<PortalDeliverable | null>(null);
  
  // Quick Revision Drawer state
  const [quickRevisionMaterial, setQuickRevisionMaterial] = useState<PortalDeliverable | null>(null);
  const [showQuickRevisionDrawer, setShowQuickRevisionDrawer] = useState(false);
  
  // Category filter
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Search query
  const [searchQuery, setSearchQuery] = useState("");

  // Lightbox state
  const [lightboxMaterialId, setLightboxMaterialId] = useState<string | null>(null);
  
  // Player state
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  
  // Batch selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedMaterialId && selectedMaterialId !== expandedPlayerId) {
      setExpandedPlayerId(selectedMaterialId);
    }
  }, [selectedMaterialId]);
  
  // Annotation state
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [annotationImage, setAnnotationImage] = useState<string | null>(null);
  const [annotationTimestamp, setAnnotationTimestamp] = useState<number>(0);
  
  // Revision form state
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionTimecode, setRevisionTimecode] = useState<string | undefined>(undefined);
  const [revisionTimestampMs, setRevisionTimestampMs] = useState<number | undefined>(undefined);
  const [revisionScreenshot, setRevisionScreenshot] = useState<string | undefined>(undefined);

  const handleQuickRevisionFromCard = (material: PortalDeliverable) => {
    setQuickRevisionMaterial(material);
    setShowQuickRevisionDrawer(true);
  };

  const handleQuickRevisionSubmit = (data: {
    deliverableId: string;
    title: string;
    description?: string;
    authorName: string;
    authorEmail?: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  }) => {
    onRequestRevision({
      deliverableId: data.deliverableId,
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      content: data.description ? `${data.title}\n\n${data.description}` : data.title,
      priority: data.priority,
    });
    setShowQuickRevisionDrawer(false);
    setQuickRevisionMaterial(null);
  };

  const allMaterials = deliverables.filter(d => d.visible_in_portal);

  // Infer a category label from material_category OR from the title prefix (before " · ").
  // Falls back to "Outros" when we cannot infer one.
  const inferCategory = useCallback((m: PortalDeliverable): string => {
    if (m.material_category && m.material_category.trim()) {
      return m.material_category.trim();
    }
    const title = (m.title || m.client_upload_name || "").trim();
    if (title.includes(" · ")) {
      return title.split(" · ")[0].trim() || "Outros";
    }
    if (title.includes(" - ")) {
      return title.split(" - ")[0].trim() || "Outros";
    }
    return "Outros";
  }, []);

  const materialsWithCategory = useMemo(
    () => allMaterials.map(m => ({ material: m, category: inferCategory(m) })),
    [allMaterials, inferCategory]
  );

  // Sorted list of categories with counts, biggest first
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    materialsWithCategory.forEach(({ category }) => {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        // "Outros" always last
        if (a.name === "Outros") return 1;
        if (b.name === "Outros") return -1;
        return b.count - a.count || a.name.localeCompare(b.name, "pt-BR");
      });
  }, [materialsWithCategory]);

  // Apply category filter + search query to produce the visible flat list
  const materials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return materialsWithCategory
      .filter(({ material, category }) => {
        if (categoryFilter && category !== categoryFilter) return false;
        if (q) {
          const hay = `${material.title ?? ""} ${material.client_upload_name ?? ""} ${material.description ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map(({ material }) => material);
  }, [materialsWithCategory, categoryFilter, searchQuery]);

  // Group filtered materials by category for sectioned view
  const groupedByCategory = useMemo(() => {
    const groups = new Map<string, PortalDeliverable[]>();
    materialsWithCategory.forEach(({ material, category }) => {
      if (!materials.includes(material)) return;
      const arr = groups.get(category) ?? [];
      arr.push(material);
      groups.set(category, arr);
    });
    // Keep the same sort order as `categories`
    return categories
      .map(({ name, count }) => ({ name, count, items: groups.get(name) ?? [] }))
      .filter(g => g.items.length > 0);
  }, [materialsWithCategory, materials, categories]);

  // Sectioned view only when no explicit filter + no search and more than one category
  const showGroupedView = !categoryFilter && !searchQuery && categories.length > 1;

  const handleAddNewVersion = (material: PortalDeliverable) => {
    setAddVersionForMaterial(material);
    setShowAddVersion(true);
  };

  const handleMarkFrame = (timestampMs: number, screenshotDataUrl?: string) => {
    setRevisionTimecode(formatTimecode(timestampMs));
    setRevisionTimestampMs(timestampMs);
    if (screenshotDataUrl) setRevisionScreenshot(screenshotDataUrl);
    setShowRevisionForm(true);
  };

  const handleOpenAnnotation = (timestampMs: number, screenshotDataUrl: string) => {
    setAnnotationTimestamp(timestampMs);
    setAnnotationImage(screenshotDataUrl);
    setShowAnnotation(true);
  };

  const handleSaveAnnotation = (data: { imageUrl: string }) => {
    setRevisionTimecode(formatTimecode(annotationTimestamp));
    setRevisionTimestampMs(annotationTimestamp);
    setRevisionScreenshot(data.imageUrl);
    setShowAnnotation(false);
    setAnnotationImage(null);
    setShowRevisionForm(true);
  };

  const handleRevisionSubmit = (data: {
    authorName: string;
    authorEmail?: string;
    content: string;
    priority: string;
    timecode?: string;
    screenshotUrl?: string;
    frameTimestampMs?: number;
  }) => {
    onRequestRevision({
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      content: data.content,
      timecode: data.timecode || revisionTimecode,
      priority: data.priority,
      frameTimestampMs: data.frameTimestampMs || revisionTimestampMs,
      screenshotUrl: data.screenshotUrl || revisionScreenshot,
    });
    setShowRevisionForm(false);
    setRevisionTimecode(undefined);
    setRevisionTimestampMs(undefined);
    setRevisionScreenshot(undefined);
  };

  // --- Batch selection handlers ---
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  }, []);

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const downloadable = materials.filter(m => m.file_url);
    setSelectedIds(new Set(downloadable.map(m => m.id)));
  }, [materials]);

  const handleBulkDownload = useCallback(() => {
    const toDownload = materials.filter(m => selectedIds.has(m.id) && m.file_url);
    toDownload.forEach((m, i) => {
      setTimeout(() => {
        triggerDownload(m.file_url!, m.title || `arquivo-${i + 1}`);
      }, i * 300);
    });
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, [materials, selectedIds]);

  const downloadableSelectedCount = materials.filter(
    m => selectedIds.has(m.id) && m.file_url
  ).length;

  const renderCard = (material: PortalDeliverable) => (
    <div key={material.id} className="relative">
      {selectionMode && (
        <div
          className="absolute top-3 left-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={selectedIds.has(material.id)}
            onCheckedChange={() => toggleSelectItem(material.id)}
            className="bg-background/80 backdrop-blur-sm border-border"
          />
        </div>
      )}
      <div
        className={cn(
          selectionMode && selectedIds.has(material.id) && "ring-2 ring-primary rounded-lg"
        )}
        onClick={() => {
          if (selectionMode) {
            toggleSelectItem(material.id);
          } else {
            setLightboxMaterialId(material.id);
            onSelectMaterial(material.id);
          }
        }}
      >
        <PortalMaterialCard
          material={material}
          versions={versions.filter(v => v.deliverable_id === material.id)}
          comments={comments.filter(c => c.deliverable_id === material.id)}
          approval={approvals.find(a => a.deliverable_id === material.id)}
          isSelected={selectedMaterialId === material.id}
          onSelect={() => {}}
          onViewVersion={(version) => console.log('View version:', version)}
          onRequestRevision={handleQuickRevisionFromCard}
        />
      </div>

      {isManager && selectedMaterialId === material.id && !selectionMode && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3 border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/30"
          onClick={() => handleAddNewVersion(material)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Enviar Nova Versão
        </Button>
      )}
    </div>
  );

  if (allMaterials.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card border border-border rounded-lg p-12 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <FileVideo className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Nenhum material ainda</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Os materiais do projeto aparecerão aqui quando forem publicados pela equipe.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {isManager && portalLinkId && (
          <h2 className="text-lg font-medium text-foreground">Materiais do Projeto</h2>
        )}
        <div className="relative flex-1 max-w-md ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar material..."
            className="pl-9 h-9 bg-background/40 border-border text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Selection mode toggle */}
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            onClick={toggleSelectionMode}
            className="text-xs"
          >
            {selectionMode ? (
              <>
                <X className="w-3.5 h-3.5 mr-1.5" />
                Cancelar
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                Selecionar
              </>
            )}
          </Button>
          {isManager && portalLinkId && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Enviar Material
            </Button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={categoryFilter === null ? "default" : "outline"}
            className="cursor-pointer text-xs px-2.5 py-1"
            onClick={() => setCategoryFilter(null)}
          >
            Todos ({allMaterials.length})
          </Badge>
          {categories.map(({ name, count }) => (
            <Badge
              key={name}
              variant={categoryFilter === name ? "default" : "outline"}
              className="cursor-pointer text-xs px-2.5 py-1 capitalize"
              onClick={() => setCategoryFilter(categoryFilter === name ? null : name)}
            >
              {name} ({count})
            </Badge>
          ))}
        </div>
      )}

      {/* Search result summary */}
      {(searchQuery || categoryFilter) && (
        <div className="text-xs text-muted-foreground">
          {materials.length} {materials.length === 1 ? "material encontrado" : "materiais encontrados"}
          {categoryFilter && <> em <span className="text-foreground capitalize">{categoryFilter}</span></>}
          {searchQuery && <> para "<span className="text-foreground">{searchQuery}</span>"</>}
        </div>
      )}

      {/* Batch select all */}
      {selectionMode && (
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={selectAll}>
            Selecionar todos com arquivo
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setSelectedIds(new Set())}>
              Limpar seleção
            </Button>
          )}
        </div>
      )}

      {/* Materials: grouped sections OR flat grid */}
      {materials.length === 0 ? (
        <div className="bg-card/40 border border-border rounded-lg p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum material encontrado com os filtros atuais.
          </p>
          {(searchQuery || categoryFilter) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-xs"
              onClick={() => { setSearchQuery(""); setCategoryFilter(null); }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : showGroupedView ? (
        <div className="space-y-8">
          {groupedByCategory.map(group => (
            <section key={group.name} className="space-y-3">
              <header className="flex items-center gap-2 sticky top-0 z-[5] bg-background/85 backdrop-blur-sm py-2 -mx-1 px-1 border-b border-border/40">
                <Folder className="w-4 h-4 text-primary/70" />
                <h3 className="text-sm font-medium text-foreground capitalize">
                  {group.name}
                </h3>
                <span className="text-xs text-muted-foreground">{group.count}</span>
                <button
                  onClick={() => setCategoryFilter(group.name)}
                  className="ml-auto text-[11px] text-muted-foreground hover:text-foreground uppercase tracking-wider"
                >
                  Ver todos →
                </button>
              </header>
              <div className="grid md:grid-cols-2 gap-4">
                {group.items.map(material => renderCard(material))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {materials.map(material => renderCard(material))}
        </div>
      )}

      {/* Floating bulk download toolbar */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card border border-border rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4"
          >
            <span className="text-sm text-foreground font-medium">
              {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
            </span>
            <Button
              size="sm"
              onClick={handleBulkDownload}
              disabled={downloadableSelectedCount === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar {downloadableSelectedCount > 0 ? `(${downloadableSelectedCount})` : ''}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}
            >
              Cancelar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Material Lightbox */}
      {lightboxMaterialId && (() => {
        const lbMaterial = materials.find(m => m.id === lightboxMaterialId);
        if (!lbMaterial) return null;
        const lbComments = comments.filter(c => c.deliverable_id === lightboxMaterialId);
        const lbApproval = approvals.find(a => a.deliverable_id === lightboxMaterialId);
        return (
          <MaterialLightbox
            material={lbMaterial}
            materials={materials}
            comments={lbComments}
            approval={lbApproval}
            onClose={() => setLightboxMaterialId(null)}
            onNavigate={(id) => {
              setLightboxMaterialId(id);
              onSelectMaterial(id);
            }}
            onAddComment={onAddComment}
            onRequestRevision={onRequestRevision}
            isAddingComment={isAddingComment}
            isRequestingRevision={isRequestingRevision}
          />
        );
      })()}

      {/* Annotation Canvas */}
      <AnimatePresence>
        {showAnnotation && annotationImage && (
          <AnnotationCanvas
            imageDataUrl={annotationImage}
            timestampMs={annotationTimestamp}
            onSave={handleSaveAnnotation}
            onCancel={() => { setShowAnnotation(false); setAnnotationImage(null); }}
          />
        )}
      </AnimatePresence>

      {/* Add Version Dialog */}
      {addVersionForMaterial && portalLinkId && (
        <AddVersionDialog
          open={showAddVersion}
          onOpenChange={setShowAddVersion}
          deliverable={addVersionForMaterial}
          portalLinkId={portalLinkId}
          onSuccess={() => { setShowAddVersion(false); setAddVersionForMaterial(null); }}
        />
      )}

      {/* Quick Revision Drawer */}
      <QuickRevisionDrawer
        material={quickRevisionMaterial}
        open={showQuickRevisionDrawer}
        onOpenChange={setShowQuickRevisionDrawer}
        onSubmit={handleQuickRevisionSubmit}
        isSubmitting={isRequestingRevision}
      />
    </div>
  );
}

export const PortalMaterialsTab = memo(PortalMaterialsTabComponent);
