import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import squadHubLogo from "@/assets/squad-hub-logo.png";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";

interface MenuItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
  children?: MenuItem[];
}

const mainMenuItems: MenuItem[] = [
  { name: "Overview", href: "/", icon: "space_dashboard" },
  { name: "Tarefas", href: "/tarefas", icon: "checklist" },
  { name: "Projetos", href: "/projetos", icon: "movie_filter", badge: 8 },
  {
    name: "Studio & Marketing",
    href: "/marketing",
    icon: "brush",
    children: [
      { name: "Marketing", href: "/marketing", icon: "campaign", badge: 12 },
      { name: "Gerar Posts", href: "/marketing/studio?tab=templates", icon: "edit_square" },
      { name: "Transcrição", href: "/marketing/transcricao", icon: "subtitles" },
      { name: "Studio Criativo", href: "/marketing/studio", icon: "palette" },
    ],
  },
  { name: "Central de Ações", href: "/central-acoes", icon: "electric_bolt" },
  { name: "CRM", href: "/crm", icon: "handshake", badge: 3 },
  { name: "Clientes", href: "/crm?tab=clients", icon: "groups" },
  { name: "Prospecção", href: "/prospeccao", icon: "person_search", badge: 5 },
  { name: "Calendário", href: "/calendario", icon: "event" },
  { name: "Financeiro", href: "/financeiro", icon: "payments" },
  { name: "Propostas", href: "/propostas", icon: "request_quote" },
  { name: "Contratos", href: "/contratos", icon: "gavel" },
  { name: "Relatórios", href: "/relatorios", icon: "bar_chart" },
  { name: "Avisos", href: "/avisos", icon: "notifications_active" },
];

const settingsItems = [
  { name: "Configurações", href: "/configuracoes", icon: "settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItemVariants = {
  hidden: { opacity: 0, x: -20, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.04,
      type: "spring" as const,
      stiffness: 100,
      damping: 18,
    },
  }),
};

function isItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // Strip query params for comparison
  const hrefPath = href.split("?")[0];
  return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
}

function isGroupActive(pathname: string, children: MenuItem[]) {
  return children.some((child) => isItemActive(pathname, child.href));
}

function SidebarMenuItem({
  item,
  index,
  collapsed,
  pathname,
}: {
  item: MenuItem;
  index: number;
  collapsed: boolean;
  pathname: string;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const groupActive = hasChildren && isGroupActive(pathname, item.children!);
  const [open, setOpen] = useState(groupActive);

  // Auto-open when a child becomes active
  if (groupActive && !open) {
    setOpen(true);
  }

  const isActive = !hasChildren && isItemActive(pathname, item.href);

  if (hasChildren && !collapsed) {
    return (
      <motion.div
        key={item.name}
        custom={index}
        variants={menuItemVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Group trigger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative",
            groupActive
              ? "text-primary"
              : "text-muted-foreground/80 hover:text-foreground hover:bg-white/[0.04]"
          )}
        >
          <span
            className={cn(
              "material-symbols-outlined text-xl",
              groupActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-primary"
            )}
          >
            {item.icon}
          </span>
          <span className="text-[13px] font-light uppercase tracking-wider flex-1 text-left">
            {item.name}
          </span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              open && "rotate-180"
            )}
            strokeWidth={1.5}
          />
        </button>

        {/* Children */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pl-4 mt-0.5 space-y-0.5">
                {item.children!.map((child) => {
                  const childActive = isItemActive(pathname, child.href);
                  return (
                    <Link
                      key={child.name}
                      to={child.href}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 group relative",
                        childActive
                          ? "bg-white text-black"
                          : "text-muted-foreground/80 hover:text-foreground hover:bg-white/[0.04]"
                      )}
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-lg",
                          childActive ? "text-black" : "text-muted-foreground/70 group-hover:text-primary"
                        )}
                      >
                        {child.icon}
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[12px] font-light uppercase tracking-wider flex-1">
                          {child.name}
                        </span>
                        {child.badge && (
                          <span
                            className={cn(
                              "flex items-center justify-center h-5 min-w-5 px-1.5 rounded text-[10px] font-light",
                              childActive ? "bg-black/10 text-black" : "bg-primary/15 text-primary"
                            )}
                          >
                            {child.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Collapsed group → just show icon linking to parent href
  if (hasChildren && collapsed) {
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
          title={item.name}
          className={cn(
            "w-full flex items-center justify-center px-2 py-2.5 rounded-lg transition-all duration-150 group relative",
            groupActive
              ? "bg-white text-black"
              : "text-muted-foreground/80 hover:text-foreground hover:bg-white/[0.04]"
          )}
        >
          <span
            className={cn(
              "material-symbols-outlined text-xl",
              groupActive ? "text-black" : "text-muted-foreground/70 group-hover:text-primary"
            )}
          >
            {item.icon}
          </span>
        </Link>
      </motion.div>
    );
  }

  // Regular item
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
            "material-symbols-outlined text-xl",
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
              <span className="text-[13px] font-light uppercase tracking-wider flex-1">
                {item.name}
              </span>
              {item.badge && (
                <span
                  className={cn(
                    "flex items-center justify-center h-5 min-w-5 px-1.5 rounded text-[10px] font-light",
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
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <motion.aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#030303] border-r border-white/[0.04] flex flex-col",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
      initial={false}
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Logo & Toggle */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/[0.04]">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.img
              src={squadHubLogo}
              alt="SQUAD Hub"
              className="h-7 w-auto object-contain"
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              transition={{ duration: 0.25 }}
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
        {mainMenuItems.map((item, index) => (
          <SidebarMenuItem
            key={item.name}
            item={item}
            index={index}
            collapsed={collapsed}
            pathname={location.pathname}
          />
        ))}

        {/* Separator */}
        <div className="my-3 border-t border-white/[0.04]" />

        {/* Settings */}
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
                      className="text-[13px] font-light uppercase tracking-wider"
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
          "px-3 py-3 border-t border-white/[0.04] space-y-2",
          collapsed && "px-2"
        )}
      >
        {/* Theme toggle + Notifications */}
        <div className={cn("flex items-center gap-1", collapsed ? "justify-center" : "justify-end")}>
          <NotificationDropdown />
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.04] transition-all"
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        <div
          className={cn(
            "flex items-center gap-2.5",
            collapsed && "justify-center"
          )}
        >
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary text-[11px] font-light flex-shrink-0">
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
                <p className="text-[11px] text-foreground/90 font-light uppercase truncate tracking-wider">Rodrigo S.</p>
                <p className="text-[10px] text-muted-foreground/60 font-light uppercase tracking-wider">Admin Root</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
