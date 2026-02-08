/**
 * PortalMaterialsTab - Aba de Materiais do Portal com player de vídeo e anotações
 */

import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileVideo, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalMaterialCard } from "./PortalMaterialCard";
import { PortalInlineComment } from "./PortalInlineComment";
import { AddVersionDialog } from "./AddVersionDialog";
import { VideoPlayerWithMarkers } from "./VideoPlayerWithMarkers";
import { AnnotationCanvas } from "./AnnotationCanvas";
import { RevisionForm } from "./RevisionForm";
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

  // Filter only manager-uploaded materials (not client uploads)
  const materials = deliverables.filter(d => !d.uploaded_by_client && d.visible_in_portal);

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

  if (materials.length === 0) {
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

      {/* Materials Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {materials.map((material) => {
          const isExpanded = expandedPlayerId === material.id;
          const isVideo = material.youtube_url || material.file_url?.includes('.mp4') || material.type?.includes('video');

          return (
            <div key={material.id} className="space-y-3">
              {/* Video Player (expanded) */}
              {isExpanded && isVideo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
                    onClick={() => setExpandedPlayerId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <VideoPlayerWithMarkers
                    videoUrl={material.file_url || undefined}
                    youtubeUrl={material.youtube_url || undefined}
                    thumbnailUrl={material.thumbnail_url || undefined}
                    title={material.title}
                    comments={selectedComments}
                    onMarkFrame={handleMarkFrame}
                    onOpenAnnotation={handleOpenAnnotation}
                    onRequestComment={() => {
                      onSelectMaterial(material.id);
                      // Scroll to comment form
                    }}
                    onRequestRevision={() => {
                      onSelectMaterial(material.id);
                      setShowRevisionForm(true);
                    }}
                  />
                </motion.div>
              )}

              {/* Material Card */}
              {!isExpanded && (
                <div
                  onClick={() => {
                    if (isVideo) {
                      setExpandedPlayerId(material.id);
                      onSelectMaterial(material.id);
                    } else {
                      onSelectMaterial(material.id === selectedMaterialId ? null : material.id);
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
                    onViewVersion={(version) => {
                      console.log('View version:', version);
                    }}
                  />
                </div>
              )}

              {/* Revision Form (when frame is marked) */}
              {showRevisionForm && selectedMaterialId === material.id && (
                <RevisionForm
                  materialId={material.id}
                  materialTitle={material.title}
                  timestampMs={revisionTimestampMs}
                  screenshotUrl={revisionScreenshot}
                  onSubmit={handleRevisionSubmit}
                  onCancel={() => {
                    setShowRevisionForm(false);
                    handleClearTimecode();
                  }}
                  onChangeTimestamp={() => setShowRevisionForm(false)}
                  isSubmitting={isRequestingRevision}
                />
              )}

              {/* Inline Comment - ALWAYS show when material is selected or expanded */}
              {(selectedMaterialId === material.id || isExpanded) && !showRevisionForm && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <PortalInlineComment
                    materialId={material.id}
                    materialTitle={material.title}
                    comments={selectedComments}
                    approval={selectedApproval}
                    currentTimecode={revisionTimecode}
                    screenshotUrl={revisionScreenshot}
                    frameTimestampMs={revisionTimestampMs}
                    onAddComment={(data) => onAddComment({
                      ...data,
                      timecode: revisionTimecode,
                      frameTimestampMs: revisionTimestampMs,
                      screenshotUrl: revisionScreenshot,
                    })}
                    onApprove={onApprove}
                    onRequestRevision={(data) => onRequestRevision({
                      ...data,
                      timecode: revisionTimecode,
                      frameTimestampMs: revisionTimestampMs,
                      screenshotUrl: revisionScreenshot,
                    })}
                    isAddingComment={isAddingComment}
                    isApproving={isApproving}
                    isRequestingRevision={isRequestingRevision}
                    onClearTimecode={revisionTimecode ? handleClearTimecode : undefined}
                  />
                </motion.div>
              )}

              {/* Add New Version Button (manager only) */}
              {isManager && selectedMaterialId === material.id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed border-[#2a2a2a] text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30"
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
    </div>
  );
}

export const PortalMaterialsTab = memo(PortalMaterialsTabComponent);
