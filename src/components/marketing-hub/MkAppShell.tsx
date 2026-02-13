/**
 * MarketingAppShell — Isolated layout shell for the Marketing Hub
 * SolaFlux-inspired: Inter font, blue accent, deep black, glass panels
 */
import { useState, useEffect, ReactNode } from "react";
import { MkSidebar } from "./MkSidebar";
import { MkHeader } from "./MkHeader";
import { SearchModal } from "@/components/search/SearchModal";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface MkAppShellProps {
  children: ReactNode;
  title: string;
}

export function MkAppShell({ children, title }: MkAppShellProps) {
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

  return (
    <div className="mk-theme h-[100dvh] bg-[#060608] relative flex overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Ambient blue glow */}
      <div className="fixed top-[-30%] right-[-10%] w-[900px] h-[900px] rounded-full bg-[hsl(210,100%,50%)] opacity-[0.04] blur-[200px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-15%] w-[700px] h-[700px] rounded-full bg-[hsl(200,80%,45%)] opacity-[0.03] blur-[180px] pointer-events-none" />

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
        <MkHeader title={title} onOpenSearch={() => setSearchOpen(true)} onOpenMobileSidebar={isMobile ? () => setMobileSidebarOpen(true) : undefined} />
        <main className={cn("flex-1 overflow-y-auto py-6 md:py-8 flex flex-col", isMobile ? "px-4" : "px-6 lg:px-10")}>
          <motion.div
            className="w-full max-w-[1400px] mx-auto flex-1"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, type: "spring", stiffness: 80, damping: 18 }}
          >
            {children}
          </motion.div>
        </main>
      </motion.div>

      <AnimatePresence>
        {searchOpen && <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
