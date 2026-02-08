/**
 * PortalMaterialsTab - Aba de Materiais do Portal com sistema de versões
 */

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { FileVideo, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalMaterialCard } from "./PortalMaterialCard";
import { PortalInlineComment } from "./PortalInlineComment";
import { AddVersionDialog } from "./AddVersionDialog";
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
  onAddComment: (data: { authorName: string; authorEmail?: string; content: string }) => void;
  onApprove: (data: { approvedByName: string; approvedByEmail?: string; notes?: string }) => void;
  onRequestRevision: (data: { authorName: string; authorEmail?: string; content: string }) => void;
  isAddingComment: boolean;
  isApproving: boolean;
  isRequestingRevision: boolean;
  portalLinkId?: string;
  isManager?: boolean;
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
        {materials.map((material) => (
          <div key={material.id} className="space-y-3">
            <PortalMaterialCard
              material={material}
              versions={versions.filter(v => v.deliverable_id === material.id)}
              comments={comments.filter(c => c.deliverable_id === material.id)}
              approval={approvals.find(a => a.deliverable_id === material.id)}
              isSelected={selectedMaterialId === material.id}
              onSelect={() => onSelectMaterial(material.id === selectedMaterialId ? null : material.id)}
              onViewVersion={(version) => {
                console.log('View version:', version);
              }}
            />

            {/* Inline Comment (always visible when selected) */}
            {selectedMaterialId === material.id && (
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
                  onAddComment={onAddComment}
                  onApprove={onApprove}
                  onRequestRevision={onRequestRevision}
                  isAddingComment={isAddingComment}
                  isApproving={isApproving}
                  isRequestingRevision={isRequestingRevision}
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
        ))}
      </div>

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
