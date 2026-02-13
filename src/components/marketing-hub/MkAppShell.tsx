/**
 * MarketingAppShell — SolaFlux Holographic Platform Skin
 * Space Grotesk, glass-projection, cyan glow, fully isolated from Film Hub
 */
import { useState, useEffect, ReactNode } from "react";
import { MkSidebar } from "./MkSidebar";
import { SearchModal } from "@/components/search/SearchModal";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import "@/styles/mk-holographic.css";

interface MkAppShellProps {
  children: ReactNode;
  title: string;
  sectionCode?: string;
  sectionLabel?: string;
}

export function MkAppShell({ children, title, sectionCode, sectionLabel }: MkAppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  useEffect(() => { if (isMobile) setMobileSidebarOpen(false); }, [title, isMobile]);

  const now = new Date();
  const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const timeStr = `${monthNames[now.getMonth()]} / ${now.getFullYear()}`;

  return (
    <div className="mk-holo h-[100dvh] relative flex overflow-hidden">
      {/* Ambient glow */}
      <div className="ambient-glow" />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <MkSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      )}

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobile && mobileSidebarOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileSidebarOpen(false)} />
            <motion.div className="fixed left-0 top-0 z-50 h-[100dvh]" initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <MkSidebar collapsed={false} onToggle={() => setMobileSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        className={cn("relative z-10 flex flex-col h-[100dvh] overflow-hidden flex-1", !isMobile && (sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"))}
        initial={false}
        animate={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 260) }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header bar */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 md:px-10 border-b border-[rgba(0,156,202,0.08)]">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setMobileSidebarOpen(true)} className="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-white/60 md:hidden">
                <span className="material-symbols-outlined text-xl">menu</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[hsl(195,100%,40%)] animate-pulse" />
              <span className="text-[11px] text-[hsl(195,100%,55%)] uppercase tracking-[0.15em] font-normal">Hub Marketing</span>
              {sectionLabel && (
                <>
                  <span className="text-white/15 text-[11px]">//</span>
                  <span className="text-[11px] text-white/30 uppercase tracking-[0.1em]">{sectionLabel}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/[0.06] text-white/25 hover:text-white/40 hover:border-white/10 transition-colors text-xs"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span className="hidden md:inline">Buscar...</span>
              <kbd className="hidden md:inline text-[9px] text-white/15 bg-white/[0.04] px-1 py-0.5 rounded ml-2">⌘K</kbd>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className={cn("flex-1 overflow-y-auto flex flex-col", isMobile ? "px-4 py-6" : "px-6 md:px-10 py-8")}>
          {/* Section title area */}
          {sectionCode && (
            <div className="mb-8">
              <p className="section-label mb-2">
                Section_{sectionCode} // {sectionLabel || title}
              </p>
              <div className="flex items-end justify-between">
                <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-none">
                  <span className="text-white/60 font-light">{title.split(' ')[0]} </span>
                  <span className="text-[hsl(195,100%,45%)] font-semibold data-glow-blue">
                    {title.split(' ').slice(1).join(' ') || title}
                  </span>
                </h1>
                <div className="hidden md:block text-right">
                  <p className="text-[10px] text-white/20 uppercase tracking-[0.15em] mb-1">Timeline_Ref</p>
                  <p className="text-lg text-white/80 font-light tracking-wide">{timeStr}</p>
                </div>
              </div>
            </div>
          )}

          <motion.div
            className="w-full flex-1"
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, type: "spring", stiffness: 80, damping: 18 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Footer bar */}
        <footer className="holo-footer h-10 flex items-center justify-between px-6 md:px-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded border border-white/10 flex items-center justify-center">
              <span className="text-[9px] text-white/30 font-medium">M</span>
            </div>
            <div>
              <span className="text-[10px] text-white/20 tracking-wider">Object_ID_Access</span>
              <span className="text-[10px] text-white/40 ml-2 tracking-wider">MKT_{monthNames[now.getMonth()]}_{now.getFullYear()}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="text-[10px] text-white/15 tracking-wider">Interface_Ver</span>
              <span className="text-[10px] text-[hsl(195,100%,50%)] ml-2">HUB_OS v4.2.0-MK</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-white/15 tracking-wider">Transmission</span>
              <span className="text-[10px] text-white/30 ml-2">P.01 / 01</span>
            </div>
          </div>
        </footer>
      </motion.div>

      <AnimatePresence>
        {searchOpen && <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
