import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import squadHubLogo from "@/assets/squad-hub-logo.png";

const mainMenuItems = [
  { name: "Overview", href: "/", icon: "dashboard" },
  { name: "Projetos", href: "/projetos", icon: "movie_edit", badge: 8 },
  { name: "CRM", href: "/crm", icon: "radar", badge: 3 },
  { name: "Marketing & Conteúdo", href: "/conteudo", icon: "perm_media" },
  { name: "Financeiro", href: "/financeiro", icon: "account_balance_wallet" },
  { name: "Propostas", href: "/propostas", icon: "description" },
  { name: "Contratos", href: "/contratos", icon: "contract" },
  { name: "Relatórios", href: "/relatorios", icon: "monitoring" },
  { name: "Knowledge", href: "/knowledge", icon: "menu_book" },
];

const settingsItems = [
  { name: "Integrações", href: "/integracoes", icon: "hub" },
  { name: "Configurações", href: "/configuracoes", icon: "settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-[#050505] border-r border-white/5 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo & Toggle */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
        {!collapsed && (
          <img 
            src={squadHubLogo} 
            alt="SQUAD Hub" 
            className="h-8 w-auto object-contain"
          />
        )}
        <button 
          onClick={onToggle}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {mainMenuItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                collapsed && "justify-center px-2"
              )}
            >
              <span className={cn(
                "material-symbols-outlined text-xl",
                isActive ? "text-black" : "text-muted-foreground group-hover:text-primary"
              )}>
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="text-[11px] font-medium uppercase tracking-wider flex-1">
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className={cn(
                      "flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[9px] font-medium",
                      isActive ? "bg-black/10 text-black" : "bg-primary/20 text-primary"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="my-4 border-t border-white/5" />

        {/* Settings & Integrations */}
        {settingsItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                collapsed && "justify-center px-2"
              )}
            >
              <span className={cn(
                "material-symbols-outlined text-xl",
                isActive ? "text-black" : "text-muted-foreground group-hover:text-primary"
              )}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className={cn(
        "px-3 py-4 border-t border-white/5",
        collapsed && "px-2"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium flex-shrink-0">
            RS
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[11px] text-foreground font-medium uppercase truncate">Rodrigo S.</p>
              <p className="text-[9px] text-muted-foreground font-light uppercase tracking-tight">Admin Root</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
