/**
 * PortalClientUploads - Seção de uploads do cliente
 * 
 * Card destacado para o cliente enviar referências e materiais
 */

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { 
  Upload, 
  Youtube, 
  Link2, 
  FileUp,
  Plus,
  Folder,
  HardDrive,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClientUploadDialog } from "./ClientUploadDialog";
import { HoverLift, StaggerContainer, StaggerItem } from "./PortalAnimatedSection";
import type { PortalDeliverable } from "@/hooks/useClientPortalEnhanced";

interface PortalClientUploadsProps {
  clientUploads: PortalDeliverable[];
  onUpload: (data: {
    type: 'youtube' | 'link' | 'file';
    title: string;
    description?: string;
    url?: string;
    file?: File;
  }) => Promise<void>;
  isUploading?: boolean;
}

function PortalClientUploadsComponent({
  clientUploads,
  onUpload,
  isUploading,
}: PortalClientUploadsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Upload className="w-4 h-4 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white uppercase tracking-wide">
                Envie Materiais
              </h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                Compartilhe referências com a equipe
              </p>
            </div>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            size="sm"
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-none h-8 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="p-5 grid grid-cols-3 gap-3">
          <HoverLift className="cursor-pointer" glowColor="rgba(239, 68, 68, 0.15)">
            <button
              onClick={() => setDialogOpen(true)}
              className="w-full flex flex-col items-center gap-2 p-4 bg-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-colors"
            >
              <Youtube className="w-5 h-5 text-red-500" />
              <span className="text-[10px] uppercase tracking-wider text-gray-500">YouTube</span>
            </button>
          </HoverLift>
          
          <HoverLift className="cursor-pointer" glowColor="rgba(6, 182, 212, 0.15)">
            <button
              onClick={() => setDialogOpen(true)}
              className="w-full flex flex-col items-center gap-2 p-4 bg-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
            >
              <Link2 className="w-5 h-5 text-cyan-500" />
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Link</span>
            </button>
          </HoverLift>
          
          <HoverLift className="cursor-pointer" glowColor="rgba(168, 85, 247, 0.15)">
            <button
              onClick={() => setDialogOpen(true)}
              className="w-full flex flex-col items-center gap-2 p-4 bg-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
            >
              <FileUp className="w-5 h-5 text-purple-500" />
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Arquivo</span>
            </button>
          </HoverLift>
        </div>

        {/* Client Uploads List */}
        {clientUploads.length > 0 && (
          <div className="border-t border-[#1a1a1a]">
            <div className="p-4 flex items-center gap-2">
              <Folder className="w-4 h-4 text-gray-500" />
              <span className="text-[10px] uppercase tracking-wider text-gray-500">
                Seus envios ({clientUploads.length})
              </span>
            </div>
            <StaggerContainer className="divide-y divide-[#1a1a1a]">
              {clientUploads.slice(0, 5).map((upload) => (
                <StaggerItem key={upload.id}>
                  <div className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className={cn(
                      "w-8 h-8 flex items-center justify-center",
                      upload.youtube_url ? "bg-red-500/10" : 
                      upload.external_url ? "bg-cyan-500/10" : "bg-purple-500/10"
                    )}>
                      {upload.youtube_url ? (
                        <Youtube className="w-4 h-4 text-red-500" />
                      ) : upload.external_url ? (
                        <Link2 className="w-4 h-4 text-cyan-500" />
                      ) : (
                        <FileUp className="w-4 h-4 text-purple-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{upload.title}</p>
                      {upload.description && (
                        <p className="text-[10px] text-gray-500 truncate">{upload.description}</p>
                      )}
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-gray-600 bg-[#1a1a1a] px-2 py-0.5">
                      Enviado
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        )}
      </motion.div>

      <ClientUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpload={onUpload}
        isUploading={isUploading}
      />
    </>
  );
}

export const PortalClientUploads = memo(PortalClientUploadsComponent);
