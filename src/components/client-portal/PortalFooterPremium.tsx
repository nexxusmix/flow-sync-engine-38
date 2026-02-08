/**
 * PortalFooterPremium - Footer do portal idêntico ao HTML de referência
 */

import { memo } from "react";
import squadHubLogo from "@/assets/squad-hub-logo.png";

function PortalFooterPremiumComponent() {
  return (
    <footer className="mt-12 py-6 border-t border-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={squadHubLogo} alt="SQUAD Hub" className="h-5 w-auto opacity-50" />
            <p className="text-xs text-gray-600 font-medium tracking-wider">
              SQUAD /// FILM
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
              Suporte Direto
            </a>
            <a href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
              Privacidade
            </a>
            <a href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
              Dashboard
            </a>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-600 mt-4">
          © 2024 Portal Exclusivo do Cliente
        </p>
      </div>
    </footer>
  );
}

export const PortalFooterPremium = memo(PortalFooterPremiumComponent);
