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
    <div className="w-full bg-red-500/10 border-b border-red-500/30 py-4 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-red-500 mt-0.5" style={{ fontSize: 20 }}>
            report
          </span>
          <div>
            <h3 className="font-semibold text-red-400 text-sm">
              Projeto Bloqueado por Inadimplência
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Existe uma fatura em atraso. A entrega final e o acesso a novos materiais estão suspensos.
            </p>
          </div>
        </div>
        <Button 
          onClick={onRegularize}
          className="bg-red-500 hover:bg-red-600 text-white text-xs px-4 py-2 h-auto rounded-none font-medium"
        >
          Regularizar Agora
        </Button>
      </div>
    </div>
  );
}

export const PortalBlockBanner = memo(PortalBlockBannerComponent);
