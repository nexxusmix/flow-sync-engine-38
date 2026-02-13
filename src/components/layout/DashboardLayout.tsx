import { useState, useEffect, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SearchModal } from "../search/SearchModal";
import { AICommandButton } from "../ai/AICommandButton";
import { PoweredByFooter } from "./PoweredByFooter";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Cmd+K handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [title, isMobile]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen]);

  return (
    <div className="h-[100dvh] bg-background relative flex overflow-hidden">
      {/* Background Blobs - hidden on mobile via CSS */}
      <motion.div 
        className="blob w-[1200px] h-[1200px] bg-primary top-[-40%] left-[-20%]"
        initial={{ opacity: 0, scale: 0.6, filter: "blur(100px)" }}
        animate={{ opacity: 0.15, scale: 1, filter: "blur(220px)" }}
        transition={{ duration: 2.5 }}
      />
      <motion.div 
        className="blob w-[800px] h-[800px] bg-white bottom-[-20%] right-[-10%] opacity-5"
        initial={{ opacity: 0, scale: 0.6, filter: "blur(100px)" }}
        animate={{ opacity: 0.05, scale: 1, filter: "blur(220px)" }}
        transition={{ duration: 2.5, delay: 0.3 }}
      />
      
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && mobileSidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              className="fixed left-0 top-0 z-50 h-[100dvh]"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Sidebar 
                collapsed={false} 
                onToggle={() => setMobileSidebarOpen(false)} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <motion.div 
        className={cn(
          "relative z-10 flex flex-col h-[100dvh] overflow-hidden flex-1",
          !isMobile && (sidebarCollapsed ? "ml-[72px]" : "ml-[280px]")
        )}
        initial={false}
        animate={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 280) }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Header 
          title={title} 
          onOpenSearch={() => setSearchOpen(true)} 
          onOpenMobileSidebar={isMobile ? () => setMobileSidebarOpen(true) : undefined}
        />
        <main 
          className={cn(
            "flex-1 overflow-y-auto py-6 flex flex-col",
            isMobile ? "px-4" : "px-4 md:px-6 lg:px-8"
          )} 
          style={isMobile ? undefined : { zoom: 1.2 }}
        >
          <motion.div 
            className="w-full flex-1"
            initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, type: "spring", stiffness: 80, damping: 18 }}
            style={isMobile ? undefined : { transformStyle: "preserve-3d" }}
          >
            {children}
          </motion.div>
          <PoweredByFooter />
        </main>
      </motion.div>
      
      <AnimatePresence>
        {searchOpen && (
          <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
        )}
      </AnimatePresence>
      
      {/* Floating AI Command Button */}
      <AICommandButton />
    </div>
  );
}
