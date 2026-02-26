/**
 * MkSidebar — Holographic sidebar for Marketing Hub
 * Space Grotesk, cyan accent, glass-projection style
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { X, ArrowLeftRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface MkMenuItem {
  name: string;
  href: string;
  icon: string;
}

const menuItems: MkMenuItem[] = [
  { name: "Dashboard", href: "/m", icon: "space_dashboard" },
  { name: "Ideias", href: "/m/ideias", icon: "lightbulb" },
  { name: "Campanhas", href: "/m/campanhas", icon: "campaign" },
  { name: "Conteúdos", href: "/m/conteudos", icon: "article" },
  { name: "Calendário", href: "/m/calendario", icon: "calendar_month" },
  { name: "Instagram", href: "/m/instagram", icon: "photo_camera" },
  { name: "Templates IA", href: "/m/templates", icon: "auto_awesome" },
  { name: "Branding", href: "/m/branding", icon: "palette" },
  { name: "Assets", href: "/m/assets", icon: "perm_media" },
  { name: "Aprovações", href: "/m/aprovacoes", icon: "check_circle" },
  { name: "Relatórios", href: "/m/relatorios", icon: "monitoring" },
  { name: "Automações", href: "/m/automacoes", icon: "smart_toy" },
];

const bottomItems: MkMenuItem[] = [
  { name: "Configurações", href: "/m/configuracoes", icon: "settings" },
];

interface MkSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function MkSidebar({ collapsed, onToggle }: MkSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <motion.aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col",
        "bg-[#050507] border-r border-[rgba(0,156,202,0.08)]",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-[rgba(0,156,202,0.08)]">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              className="flex items-center gap-2.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-8 h-8 rounded border border-[rgba(0,156,202,0.25)] flex items-center justify-center bg-[rgba(0,156,202,0.05)]">
                <span className="text-[hsl(195,100%,50%)] text-sm font-semibold">H</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-white/70 tracking-wider uppercase">Hub Marketing</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="mx-auto w-8 h-8 rounded border border-[rgba(0,156,202,0.25)] flex items-center justify-center bg-[rgba(0,156,202,0.05)]">
            <span className="text-[hsl(195,100%,50%)] text-sm font-semibold">H</span>
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggle} className="w-7 h-7 rounded flex items-center justify-center text-white/20 hover:text-white/50 transition-all">
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Switch Hub */}
      <div className="px-3 py-2 border-b border-[rgba(0,156,202,0.06)]">
        <button
          onClick={() => navigate("/")}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded text-white/25 hover:text-white/50 hover:bg-white/[0.02] transition-all",
            collapsed && "justify-center px-2"
          )}
        >
          <ArrowLeftRight className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span className="text-[10px] uppercase tracking-[0.15em]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Film Hub
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== "/m" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-150 group",
                isActive
                  ? "bg-[rgba(0,156,202,0.08)] border border-[rgba(0,156,202,0.2)] text-[hsl(195,100%,60%)]"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.02] border border-transparent",
                collapsed && "justify-center px-2"
              )}
            >
              <span className={cn("material-symbols-outlined text-xl", isActive ? "text-[hsl(195,100%,55%)]" : "text-white/25 group-hover:text-[hsl(195,100%,45%)]")}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-[12px] font-normal tracking-wide flex-1">{item.name}</span>
              )}
            </Link>
          );
        })}

        <div className="my-3 border-t border-[rgba(0,156,202,0.06)]" />

        {bottomItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-150 group border border-transparent",
                isActive ? "bg-[rgba(0,156,202,0.08)] border-[rgba(0,156,202,0.2)] text-[hsl(195,100%,60%)]" : "text-white/25 hover:text-white/50 hover:bg-white/[0.02]",
                collapsed && "justify-center px-2"
              )}
            >
              <span className={cn("material-symbols-outlined text-lg", isActive ? "text-[hsl(195,100%,55%)]" : "text-white/25 group-hover:text-[hsl(195,100%,45%)]")}>
                {item.icon}
              </span>
              {!collapsed && <span className="text-[12px] font-normal tracking-wide">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className={cn("px-3 py-3 border-t border-[rgba(0,156,202,0.06)]", collapsed && "px-2")}>
        <button
          onClick={async () => { await logout(); window.location.href = "/"; }}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded text-white/20 hover:text-red-400/60 hover:bg-red-500/5 transition-all",
            collapsed && "justify-center px-2"
          )}
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          {!collapsed && <span className="text-[11px] tracking-wider">Sair</span>}
        </button>
      </div>
    </motion.aside>
  );
}
