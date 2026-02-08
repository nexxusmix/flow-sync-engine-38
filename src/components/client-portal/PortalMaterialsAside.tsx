/**
 * PortalMaterialsAside - Sidebar de materiais com animações
 * Hover effects e entrada animada
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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
        {/* Brand Assets Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -2, boxShadow: '0 4px 16px -4px rgba(168, 85, 247, 0.15)' }}
          className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 flex items-center gap-3 hover:border-gray-700 transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-purple-400" style={{ fontSize: 20 }}>
              folder_zip
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
              Brand Assets
            </p>
            <p className="text-xs text-gray-500">Logos & Identidade</p>
          </div>
        </motion.div>

        {/* Raw Footage Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -2, boxShadow: '0 4px 16px -4px rgba(236, 72, 153, 0.15)' }}
          className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 flex items-center gap-3 hover:border-gray-700 transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-pink-400" style={{ fontSize: 20 }}>
              play_circle
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
              Raw Footage (Preview)
            </p>
            <p className="text-xs text-gray-500">Vídeos de Obra - Jan/26</p>
          </div>
        </motion.div>

        {/* Dynamic materials from deliverables */}
        {materials.slice(0, 3).map((material, index) => (
          <motion.div 
            key={material.id}
            variants={itemVariants}
            whileHover={{ y: -2, boxShadow: '0 4px 16px -4px rgba(6, 182, 212, 0.15)' }}
            className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 flex items-center gap-3 hover:border-gray-700 transition-colors cursor-pointer group"
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              material.youtube_url ? "bg-red-500/20" : 
              material.file_url ? "bg-blue-500/20" : "bg-cyan-500/20"
            )}>
              <span 
                className={cn(
                  "material-symbols-outlined",
                  material.youtube_url ? "text-red-400" : 
                  material.file_url ? "text-blue-400" : "text-cyan-400"
                )}
                style={{ fontSize: 20 }}
              >
                {material.youtube_url ? 'smart_display' : 
                 material.file_url ? 'description' : 'link'}
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
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export const PortalMaterialsAside = memo(PortalMaterialsAsideComponent);
