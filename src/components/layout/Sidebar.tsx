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
  { name: "Integrações", href: "/integracoes", icon: "hub" },
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
        "fixed left-0 top-0 z-40 h-screen bg-[#050505] border-r border-white/5 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Logo & Toggle */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.img 
              src={squadHubLogo} 
              alt="SQUAD Hub" 
              className="h-8 w-auto object-contain"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
        <motion.button 
          onClick={onToggle}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all",
            collapsed && "mx-auto"
          )}
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-4 h-4" />}
          </motion.div>
        </motion.button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
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
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                  isActive
                    ? "bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  collapsed && "justify-center px-2"
                )}
              >
                <motion.span 
                  className={cn(
                    "material-symbols-outlined text-xl relative z-10",
                    isActive ? "text-black" : "text-muted-foreground group-hover:text-primary"
                  )}
                  whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  {item.icon}
                </motion.span>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.div 
                      className="flex items-center gap-2 flex-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="text-[11px] font-normal uppercase tracking-wider flex-1">
                        {item.name}
                      </span>
                      {item.badge && (
                        <motion.span 
                          className={cn(
                            "flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[9px] font-light",
                            isActive ? "bg-black/10 text-black" : "bg-primary/20 text-primary"
                          )}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
                          whileHover={{ scale: 1.2 }}
                        >
                          {item.badge}
                        </motion.span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Hover ripple effect */}
                {!isActive && (
                  <motion.div
                    className="absolute inset-0 bg-primary/5 rounded-xl"
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}

        {/* Separator */}
        <motion.div 
          className="my-4 border-t border-white/5"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        />

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
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                  isActive
                    ? "bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  collapsed && "justify-center px-2"
                )}
              >
                <motion.span 
                  className={cn(
                    "material-symbols-outlined text-xl relative z-10",
                    isActive ? "text-black" : "text-muted-foreground group-hover:text-primary"
                  )}
                  whileHover={{ scale: 1.2, rotate: 180 }}
                  transition={{ duration: 0.4 }}
                >
                  {item.icon}
                </motion.span>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span 
                      className="text-[11px] font-normal uppercase tracking-wider"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
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
      <motion.div 
        className={cn(
          "px-3 py-4 border-t border-white/5",
          collapsed && "px-2"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <motion.div 
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div 
            className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-normal flex-shrink-0"
            whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(0, 163, 211, 0.4)" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            RS
          </motion.div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div 
                className="min-w-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-[11px] text-foreground font-normal uppercase truncate">Rodrigo S.</p>
                <p className="text-[9px] text-muted-foreground font-light uppercase tracking-tight">Admin Root</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.aside>
  );
}
