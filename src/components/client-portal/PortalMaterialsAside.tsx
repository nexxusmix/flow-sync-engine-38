/**
 * PortalMaterialsAside - Sidebar de materiais e vídeos
 * Estilo exato do HTML de referência
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { PortalDeliverable, PortalFile } from "@/hooks/useClientPortalEnhanced";

interface PortalMaterialsAsideProps {
  deliverables: PortalDeliverable[];
  files: PortalFile[];
}

function PortalMaterialsAsideComponent({ deliverables, files }: PortalMaterialsAsideProps) {
  // Get materials with external URLs or files
  const materials = deliverables.filter(d => d.external_url || d.file_url || d.youtube_url);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-light text-white">Materiais & Vídeos</h3>
        <span className="material-symbols-outlined text-cyan-400" style={{ fontSize: 16 }}>
          auto_awesome
        </span>
      </div>
      <p className="text-xs text-gray-500">
        Acesso rápido aos materiais finalizados e brutos liberados para download.
      </p>
      
      <div className="space-y-2">
        {/* Brand Assets Card */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 flex items-center gap-3 hover:border-gray-700 transition-colors cursor-pointer group">
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
        </div>

        {/* Raw Footage Card */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 flex items-center gap-3 hover:border-gray-700 transition-colors cursor-pointer group">
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
        </div>

        {/* Dynamic materials from deliverables */}
        {materials.slice(0, 3).map((material) => (
          <div 
            key={material.id}
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
          </div>
        ))}
      </div>
    </div>
  );
}

export const PortalMaterialsAside = memo(PortalMaterialsAsideComponent);
