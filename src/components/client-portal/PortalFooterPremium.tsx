/**
 * PortalFooterPremium - Footer do portal no estilo premium SQUAD
 */

import { memo } from "react";
import squadHubLogo from "@/assets/squad-hub-logo.png";

function PortalFooterPremiumComponent() {
  return (
    <footer className="border-t border-[#1a1a1a] mt-16">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={squadHubLogo} alt="SQUAD Hub" className="h-6 w-auto opacity-60" />
            <span className="text-gray-500 text-xs">Visual Storytelling Premium</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
              Portal do Cliente
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
              Termos de Serviço
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
              Suporte
            </a>
          </div>
          
          <p className="text-gray-600 text-xs">
            © 2024 Visual Storytelling
          </p>
        </div>
      </div>
    </footer>
  );
}

export const PortalFooterPremium = memo(PortalFooterPremiumComponent);
