/**
 * PortalMaterialsTab - Aba de Materiais do Portal com player de vídeo e anotações
 * Agora com QuickRevisionDrawer para solicitação rápida de ajustes
 */

import { memo, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileVideo, Plus, Upload, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PortalMaterialCard } from "./PortalMaterialCard";
import { PortalInlineComment } from "./PortalInlineComment";
import { AddVersionDialog } from "./AddVersionDialog";
import { VideoPlayerWithMarkers } from "./VideoPlayerWithMarkers";
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

  // Lightbox state
  const [lightboxMaterialId, setLightboxMaterialId] = useState<string | null>(null);
  
  // Player state
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  
  // Sync expandedPlayerId with selectedMaterialId when it changes externally
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

  // Handle quick revision from card
  const handleQuickRevisionFromCard = (material: PortalDeliverable) => {
    setQuickRevisionMaterial(material);
    setShowQuickRevisionDrawer(true);
  };

  // Handle quick revision submission
  const handleQuickRevisionSubmit = (data: {
    deliverableId: string;
    title: string;
    description?: string;
    authorName: string;
    authorEmail?: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  }) => {
    // Use the existing onRequestRevision with the content as title + description
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

  // Show all materials (both team and client uploads)
  const allMaterials = deliverables.filter(d => d.visible_in_portal);
  
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allMaterials.forEach(m => { if (m.material_category) cats.add(m.material_category); });
    return Array.from(cats).sort();
  }, [allMaterials]);

  const materials = categoryFilter 
    ? allMaterials.filter(m => m.material_category === categoryFilter)
    : allMaterials;
  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
  const selectedComments = comments.filter(c => c.deliverable_id === selectedMaterialId);
  const selectedApproval = approvals.find(a => a.deliverable_id === selectedMaterialId);
  const selectedVersions = versions.filter(v => v.deliverable_id === selectedMaterialId);

  const handleAddNewVersion = (material: PortalDeliverable) => {
    setAddVersionForMaterial(material);
    setShowAddVersion(true);
  };

  // Handle frame marking from video player
  const handleMarkFrame = (timestampMs: number, screenshotDataUrl?: string) => {
    setRevisionTimecode(formatTimecode(timestampMs));
    setRevisionTimestampMs(timestampMs);
    if (screenshotDataUrl) {
      setRevisionScreenshot(screenshotDataUrl);
    }
    setShowRevisionForm(true);
  };

  // Handle opening annotation canvas
  const handleOpenAnnotation = (timestampMs: number, screenshotDataUrl: string) => {
    setAnnotationTimestamp(timestampMs);
    setAnnotationImage(screenshotDataUrl);
    setShowAnnotation(true);
  };

  // Handle saving annotation
  const handleSaveAnnotation = (data: { imageUrl: string }) => {
    setRevisionTimecode(formatTimecode(annotationTimestamp));
    setRevisionTimestampMs(annotationTimestamp);
    setRevisionScreenshot(data.imageUrl);
    setShowAnnotation(false);
    setAnnotationImage(null);
    setShowRevisionForm(true);
  };

  // Handle revision form submission
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
    
    // Clear revision state
    setShowRevisionForm(false);
    setRevisionTimecode(undefined);
    setRevisionTimestampMs(undefined);
    setRevisionScreenshot(undefined);
  };

  // Clear marked timecode
  const handleClearTimecode = () => {
    setRevisionTimecode(undefined);
    setRevisionTimestampMs(undefined);
    setRevisionScreenshot(undefined);
  };

  if (allMaterials.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-12 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#111] flex items-center justify-center mx-auto mb-4">
          <FileVideo className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Nenhum material ainda</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Os materiais do projeto aparecerão aqui quando forem publicados pela equipe.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions (only for manager) */}
      {isManager && portalLinkId && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Materiais do Projeto</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#2a2a2a] text-gray-400 hover:text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Enviar Material
            </Button>
          </div>
        </div>
      )}

      {/* Category Filters */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={categoryFilter === null ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setCategoryFilter(null)}
          >
            Todos ({allMaterials.length})
          </Badge>
          {categories.map(cat => (
            <Badge
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              className="cursor-pointer text-xs capitalize"
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
            >
              {cat} ({allMaterials.filter(m => m.material_category === cat).length})
            </Badge>
          ))}
        </div>
      )}

      {/* Materials Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {materials.map((material) => {
          return (
            <div key={material.id}>
              <div
                onClick={() => {
                  setLightboxMaterialId(material.id);
                  onSelectMaterial(material.id);
                }}
              >
                <PortalMaterialCard
                  material={material}
                  versions={versions.filter(v => v.deliverable_id === material.id)}
                  comments={comments.filter(c => c.deliverable_id === material.id)}
                  approval={approvals.find(a => a.deliverable_id === material.id)}
                  isSelected={selectedMaterialId === material.id}
                  onSelect={() => {}}
                  onViewVersion={(version) => {
                    console.log('View version:', version);
                  }}
                  onRequestRevision={handleQuickRevisionFromCard}
                />
              </div>

              {/* Add New Version Button (manager only) */}
              {isManager && selectedMaterialId === material.id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 border-dashed border-[#2a2a2a] text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30"
                  onClick={() => handleAddNewVersion(material)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Enviar Nova Versão
                </Button>
              )}
            </div>
          );
        })}
      </div>

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

      {/* Annotation Canvas (Fullscreen Overlay) */}
      <AnimatePresence>
        {showAnnotation && annotationImage && (
          <AnnotationCanvas
            imageDataUrl={annotationImage}
            timestampMs={annotationTimestamp}
            onSave={handleSaveAnnotation}
            onCancel={() => {
              setShowAnnotation(false);
              setAnnotationImage(null);
            }}
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
          onSuccess={() => {
            setShowAddVersion(false);
            setAddVersionForMaterial(null);
          }}
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
