/**
 * PortalMaterialsAside - Sidebar de materiais com animações
 * Exibe materiais reais do banco (YouTube, links externos, arquivos)
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import type { PortalDeliverable, PortalFile } from "@/hooks/useClientPortalEnhanced";

interface PortalMaterialsAsideProps {
  deliverables: PortalDeliverable[];
  files: PortalFile[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 8 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.25 },
  },
};

function PortalMaterialsAsideComponent({ deliverables, files }: PortalMaterialsAsideProps) {
  // Get materials with external URLs or files
  const materials = deliverables.filter(d => d.external_url || d.file_url || d.youtube_url);
  
  // Get files visible in portal
  const visibleFiles = files.filter(f => f.visible_in_portal);

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getMaterialUrl = (material: PortalDeliverable): string | null => {
    return material.youtube_url || material.external_url || material.file_url || null;
  };

  const getMaterialIcon = (material: PortalDeliverable): string => {
    if (material.youtube_url) return 'smart_display';
    if (material.file_url) return 'description';
    return 'link';
  };

  const getMaterialColor = (material: PortalDeliverable): { bg: string; text: string } => {
    if (material.youtube_url) return { bg: 'bg-destructive/20', text: 'text-destructive' };
    if (material.file_url) return { bg: 'bg-primary/20', text: 'text-primary' };
    return { bg: 'bg-primary/20', text: 'text-primary' };
  };

  const hasMaterials = materials.length > 0 || visibleFiles.length > 0;
  
  return (
    <motion.div 
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div 
        className="flex items-center gap-2"
        variants={itemVariants}
      >
        <h3 className="text-sm font-light text-white">Materiais & Vídeos</h3>
        <span className="material-symbols-outlined text-cyan-400" style={{ fontSize: 16 }}>
          auto_awesome
        </span>
      </motion.div>
      <motion.p 
        className="text-xs text-gray-500"
        variants={itemVariants}
      >
        Acesso rápido aos materiais finalizados e brutos liberados para download.
      </motion.p>
      
      <div className="space-y-2">
        {/* Empty state */}
        {!hasMaterials && (
          <motion.div 
            variants={itemVariants}
            className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 text-center"
          >
            <span className="material-symbols-outlined text-gray-600 mb-2" style={{ fontSize: 32 }}>
              folder_off
            </span>
            <p className="text-xs text-gray-500">
              Nenhum material disponível ainda.
            </p>
          </motion.div>
        )}

        {/* Dynamic materials from deliverables */}
        {materials.map((material) => {
          const url = getMaterialUrl(material);
          const icon = getMaterialIcon(material);
          const colors = getMaterialColor(material);
          
          return (
            <motion.div 
              key={material.id}
              variants={itemVariants}
              whileHover={{ y: -2, boxShadow: '0 4px 16px -4px rgba(6, 182, 212, 0.15)' }}
              onClick={() => url && handleOpenLink(url)}
              className={cn(
                "bg-[#0a0a0a] border border-[#1a1a1a] p-4 flex items-center gap-3 hover:border-gray-700 transition-colors group",
                url && "cursor-pointer"
              )}
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors.bg)}>
                <span className={cn("material-symbols-outlined", colors.text)} style={{ fontSize: 20 }}>
                  {icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
                  {material.title}
                </p>
                <p className="text-xs text-gray-500">
                  {material.type || 'Material'}
                </p>
              </div>
              {url && (
                <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />
              )}
            </motion.div>
          );
        })}

        {/* Visible portal files */}
        {visibleFiles.map((file) => (
          <motion.div 
            key={file.id}
            variants={itemVariants}
            whileHover={{ y: -2, boxShadow: '0 4px 16px -4px rgba(168, 85, 247, 0.15)' }}
            onClick={() => file.file_url && handleOpenLink(file.file_url)}
            className={cn(
              "bg-[#0a0a0a] border border-[#1a1a1a] p-4 flex items-center gap-3 hover:border-gray-700 transition-colors group",
              file.file_url && "cursor-pointer"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-400" style={{ fontSize: 20 }}>
                folder_zip
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">{file.folder || 'Arquivo'}</p>
            </div>
            {file.file_url && (
              <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export const PortalMaterialsAside = memo(PortalMaterialsAsideComponent);
