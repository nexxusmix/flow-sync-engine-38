import { useState, useEffect, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SearchModal } from "../search/SearchModal";
import { AICommandButton } from "../ai/AICommandButton";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Background Blobs */}
      <div className="blob w-[1200px] h-[1200px] bg-primary top-[-40%] left-[-20%]" />
      <div className="blob w-[800px] h-[800px] bg-white bottom-[-20%] right-[-10%] opacity-5" />
      
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={cn(
        "relative z-10 transition-all duration-300 flex flex-col flex-1",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        <Header title={title} onOpenSearch={() => setSearchOpen(true)} />
        <main className="p-6 md:p-10 max-w-[1800px] mx-auto preserve-3d flex-1 w-full">{children}</main>
      </div>
      
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      
      {/* Floating AI Command Button */}
      <AICommandButton />
    </div>
  );
}
