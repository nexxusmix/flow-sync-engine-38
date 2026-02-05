import { useState, useEffect, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SearchModal } from "../search/SearchModal";
import { AICommandButton } from "../ai/AICommandButton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Default collapsed

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

  return (
    <div className="h-screen bg-background relative flex overflow-hidden">
      {/* Background Blobs */}
      <motion.div 
        className="blob w-[1200px] h-[1200px] bg-primary top-[-40%] left-[-20%]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 2 }}
      />
      <motion.div 
        className="blob w-[800px] h-[800px] bg-white bottom-[-20%] right-[-10%] opacity-5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 2, delay: 0.3 }}
      />
      
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <motion.div 
        className={cn(
          "relative z-10 flex flex-col h-screen overflow-hidden",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
        style={{ flex: 1 }}
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 64 : 256 }}
        transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
      >
        <Header title={title} onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <motion.div 
            className="max-w-[1800px] mx-auto preserve-3d w-full min-h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
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
