import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import squadHubLogo from "@/assets/squad-hub-logo.png";

const mainMenuItems = [
  { name: "Overview", href: "/", icon: "dashboard" },
  { name: "Calendário", href: "/calendario", icon: "calendar_month" },
  { name: "Projetos", href: "/projetos", icon: "movie_edit", badge: 8 },
  { name: "CRM", href: "/crm", icon: "radar", badge: 3 },
  { name: "Marketing", href: "/marketing", icon: "perm_media", badge: 12 },
  { name: "Prospecção", href: "/prospeccao", icon: "person_search", badge: 5 },
  { name: "Financeiro", href: "/financeiro", icon: "account_balance_wallet" },
  { name: "Propostas", href: "/propostas", icon: "description" },
  { name: "Contratos", href: "/contratos", icon: "contract" },
  { name: "Relatórios", href: "/relatorios", icon: "monitoring" },
  { name: "Tarefas", href: "/tarefas", icon: "task_alt" },
];

const settingsItems = [
  { name: "Configurações", href: "/configuracoes", icon: "settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  }),
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <motion.aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#030303] border-r border-white/[0.04] flex flex-col",
        collapsed ? "w-14" : "w-56"
      )}
      initial={false}
      animate={{ width: collapsed ? 56 : 224 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Logo & Toggle */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-white/[0.04]">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.img 
              src={squadHubLogo} 
              alt="SQUAD Hub" 
              className="h-6 w-auto object-contain"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>
        <button 
          onClick={onToggle}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.04] transition-all",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <Menu className="w-4 h-4" strokeWidth={1.5} /> : <X className="w-3.5 h-3.5" strokeWidth={1.5} />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {mainMenuItems.map((item, index) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          return (
            <motion.div
              key={item.name}
              custom={index}
              variants={menuItemVariants}
              initial="hidden"
              animate="visible"
            >
              <Link
                to={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative",
                  isActive
                    ? "bg-white text-black"
                    : "text-muted-foreground/80 hover:text-foreground hover:bg-white/[0.04]",
                  collapsed && "justify-center px-2"
                )}
              >
                <span 
                  className={cn(
                    "material-symbols-outlined text-lg",
                    isActive ? "text-black" : "text-muted-foreground/70 group-hover:text-primary"
                  )}
                >
                  {item.icon}
                </span>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.div 
                      className="flex items-center gap-2 flex-1"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span className="text-[11px] font-light uppercase tracking-wider flex-1">
                        {item.name}
                      </span>
                      {item.badge && (
                        <span 
                          className={cn(
                            "flex items-center justify-center h-4 min-w-4 px-1 rounded text-[9px] font-light",
                            isActive ? "bg-black/10 text-black" : "bg-primary/15 text-primary"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}

        {/* Separator */}
        <div className="my-3 border-t border-white/[0.04]" />

        {/* Settings & Integrations */}
        {settingsItems.map((item, index) => {
          const isActive = location.pathname === item.href;
          return (
            <motion.div
              key={item.name}
              custom={mainMenuItems.length + index}
              variants={menuItemVariants}
              initial="hidden"
              animate="visible"
            >
              <Link
                to={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative",
                  isActive
                    ? "bg-white text-black"
                    : "text-muted-foreground/80 hover:text-foreground hover:bg-white/[0.04]",
                  collapsed && "justify-center px-2"
                )}
              >
                <span 
                  className={cn(
                    "material-symbols-outlined text-lg",
                    isActive ? "text-black" : "text-muted-foreground/70 group-hover:text-primary"
                  )}
                >
                  {item.icon}
                </span>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span 
                      className="text-[11px] font-light uppercase tracking-wider"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User section */}
      <div 
        className={cn(
          "px-3 py-3 border-t border-white/[0.04]",
          collapsed && "px-2"
        )}
      >
        <div 
          className={cn(
            "flex items-center gap-2.5",
            collapsed && "justify-center"
          )}
        >
          <div 
            className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary text-[10px] font-light flex-shrink-0"
          >
            RS
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div 
                className="min-w-0"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-[10px] text-foreground/90 font-light uppercase truncate tracking-wider">Rodrigo S.</p>
                <p className="text-[9px] text-muted-foreground/60 font-light uppercase tracking-wider">Admin Root</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
