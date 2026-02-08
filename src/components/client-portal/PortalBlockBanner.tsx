/**
 * PortalBlockBanner - Banner de bloqueio fixo no topo
 * Estilo exato do HTML de referência
 */

import { memo } from "react";
import { Button } from "@/components/ui/button";

interface PortalBlockBannerProps {
  isVisible: boolean;
  onRegularize?: () => void;
}

function PortalBlockBannerComponent({ isVisible, onRegularize }: PortalBlockBannerProps) {
  if (!isVisible) return null;

  return (
    <div className="w-full bg-red-500/10 border-b border-red-500/20 py-2 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-red-500" style={{ fontSize: 14 }}>
          lock
        </span>
        <span className="text-red-400 text-[10px] uppercase tracking-widest font-medium">
          Bloqueado
        </span>
      </div>
    </div>
  );
}

export const PortalBlockBanner = memo(PortalBlockBannerComponent);
