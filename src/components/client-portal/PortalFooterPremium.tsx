/**
 * PortalFooterPremium - Footer do portal idêntico ao HTML de referência
 */

import { memo } from "react";
import squadFilmLogo from "@/assets/squad-film-logo-full.png";

function PortalFooterPremiumComponent() {
  return (
    <footer className="mt-12 py-6 border-t border-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">
              powered by
            </span>
            <img src={squadFilmLogo} alt="SQUAD///FILM" className="h-4 w-auto opacity-60" />
          </div>
          
          <div className="flex items-center gap-6">
            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
              Suporte Direto
            </a>
            <a href="/privacidade" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
              Privacidade
            </a>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-600 mt-4">
          © {new Date().getFullYear()} Portal Exclusivo do Cliente
        </p>
      </div>
    </footer>
  );
}

export const PortalFooterPremium = memo(PortalFooterPremiumComponent);
