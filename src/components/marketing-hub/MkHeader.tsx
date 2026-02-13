import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Search, LogOut, Menu } from "lucide-react";
import { motion } from "framer-motion";

interface MkHeaderProps {
  title: string;
  onOpenSearch: () => void;
  onOpenMobileSidebar?: () => void;
}

export function MkHeader({ title, onOpenSearch, onOpenMobileSidebar }: MkHeaderProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.header
      className="sticky top-0 z-30 h-14 md:h-16 bg-[#060608]/80 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between px-4 md:px-6"
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 22 }}
    >
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <button onClick={onOpenMobileSidebar} className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/[0.06] transition-colors md:hidden">
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[hsl(210,100%,55%)] animate-pulse" />
          <span className="text-xs text-white/30 uppercase tracking-[0.2em] hidden md:inline">Marketing Hub</span>
        </div>
      </div>

      <motion.button
        onClick={onOpenSearch}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05] transition-all w-64"
        whileHover={{ scale: 1.02 }}
      >
        <Search className="h-4 w-4 text-white/30" />
        <span className="text-xs text-white/30 flex-1 text-left">Buscar...</span>
        <kbd className="hidden sm:inline-flex text-[10px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded">⌘K</kbd>
      </motion.button>

      <div className="flex items-center gap-2">
        <button
          onClick={async () => { await logout(); window.location.href = "/"; }}
          className="w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 flex items-center justify-center transition-colors text-white/40"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </motion.header>
  );
}
