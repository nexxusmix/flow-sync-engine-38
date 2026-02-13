/**
 * MkHeader — Now integrated into MkAppShell directly.
 * This file is kept for backward compatibility but the header is now part of MkAppShell.
 */
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Search, LogOut, Menu } from "lucide-react";

interface MkHeaderProps {
  title: string;
  onOpenSearch: () => void;
  onOpenMobileSidebar?: () => void;
}

export function MkHeader({ title, onOpenSearch, onOpenMobileSidebar }: MkHeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 md:px-10 border-b border-[rgba(0,156,202,0.08)]"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <button onClick={onOpenMobileSidebar} className="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-white/60 md:hidden">
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[hsl(195,100%,40%)] animate-pulse" />
          <span className="text-[11px] text-[hsl(195,100%,55%)] uppercase tracking-[0.15em] font-normal">Hub Marketing</span>
        </div>
      </div>

      <button
        onClick={onOpenSearch}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/[0.06] text-white/25 hover:text-white/40 hover:border-white/10 transition-colors text-xs"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Buscar...</span>
        <kbd className="hidden md:inline text-[9px] text-white/15 bg-white/[0.04] px-1 py-0.5 rounded ml-2">⌘K</kbd>
      </button>

      <button
        onClick={async () => { await logout(); window.location.href = "/"; }}
        className="w-8 h-8 rounded border border-white/[0.06] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors text-white/25"
        title="Sair"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </header>
  );
}
