import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowLeftRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import squadHubLogo from "@/assets/squad-hub-logo.png";

interface MkMenuItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
}

const menuItems: MkMenuItem[] = [
  { name: "Dashboard", href: "/m", icon: "space_dashboard" },
  { name: "Campanhas", href: "/m/campanhas", icon: "campaign" },
  { name: "Conteúdos", href: "/m/conteudos", icon: "article" },
  { name: "Calendário", href: "/m/calendario", icon: "calendar_month" },
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

  return (
    <motion.aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#0a0a0c] border-r border-white/[0.05] flex flex-col",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/[0.05]">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-7 h-7 rounded-lg bg-[hsl(210,100%,55%)] flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
              <span className="text-sm font-semibold text-white/90 tracking-tight">Marketing Hub</span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg bg-[hsl(210,100%,55%)] flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggle} className="w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Switch Hub button */}
      <div className="px-3 py-2 border-b border-white/[0.05]">
        <button
          onClick={() => navigate("/")}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all",
            collapsed && "justify-center px-2"
          )}
        >
          <ArrowLeftRight className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span className="text-[11px] uppercase tracking-widest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                isActive
                  ? "bg-[hsl(210,100%,55%)] text-white"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]",
                collapsed && "justify-center px-2"
              )}
            >
              <span className={cn("material-symbols-outlined text-xl", isActive ? "text-white" : "text-white/40 group-hover:text-[hsl(210,100%,65%)]")}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-[13px] font-medium tracking-wide flex-1">{item.name}</span>
              )}
              {!collapsed && item.badge && (
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", isActive ? "bg-white/20 text-white" : "bg-[hsl(210,100%,55%)]/15 text-[hsl(210,100%,65%)]")}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="my-3 border-t border-white/[0.05]" />

        {bottomItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                isActive ? "bg-[hsl(210,100%,55%)] text-white" : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]",
                collapsed && "justify-center px-2"
              )}
            >
              <span className={cn("material-symbols-outlined text-lg", isActive ? "text-white" : "text-white/40 group-hover:text-[hsl(210,100%,65%)]")}>
                {item.icon}
              </span>
              {!collapsed && <span className="text-[13px] font-medium tracking-wide">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={cn("px-3 py-3 border-t border-white/[0.05]", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <div className="w-9 h-9 rounded-lg bg-[hsl(210,100%,55%)]/15 flex items-center justify-center text-[hsl(210,100%,65%)] text-[11px] font-medium shrink-0">
            RS
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[11px] text-white/80 font-medium truncate">Rodrigo S.</p>
              <p className="text-[10px] text-white/30">Marketing Hub</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
