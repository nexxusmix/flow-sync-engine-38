import { useState, useEffect, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SearchModal } from "../search/SearchModal";
import { AICommandButton } from "../ai/AICommandButton";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);

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
    <div className="min-h-screen bg-background relative">
      {/* Grain Overlay */}
      <div className="grain" />
      
      {/* Background Blobs */}
      <div className="blob w-[1200px] h-[1200px] bg-primary top-[-40%] left-[-20%]" />
      <div className="blob w-[800px] h-[800px] bg-white bottom-[-20%] right-[-10%] opacity-5" />
      
      <Sidebar />
      <div className="ml-20 md:ml-64 relative z-10">
        <Header title={title} onOpenSearch={() => setSearchOpen(true)} />
        <main className="p-6 md:p-12 max-w-[1800px] mx-auto preserve-3d">{children}</main>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      
      {/* Floating AI Command Button */}
      <AICommandButton />
    </div>
  );
}
