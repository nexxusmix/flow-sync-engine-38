import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Inbox,
  FolderKanban,
  FileText,
  FileSignature,
  Wallet,
  Film,
  BookOpen,
  BarChart3,
  Settings,
  Plug,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainMenuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "CRM", href: "/crm", icon: Users },
  { name: "Inbox", href: "/inbox", icon: Inbox, badge: 3 },
  { name: "Projetos", href: "/projetos", icon: FolderKanban },
  { name: "Propostas", href: "/propostas", icon: FileText },
  { name: "Contratos", href: "/contratos", icon: FileSignature },
  { name: "Financeiro", href: "/financeiro", icon: Wallet },
  { name: "Conteúdo", href: "/conteudo", icon: Film },
  { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

const integrationItems = [
  { name: "Integrações", href: "/integracoes", icon: Plug },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-foreground">
          <Sparkles className="h-4 w-4 text-background" />
        </div>
        <span className="font-semibold text-foreground tracking-tight">SQUAD Hub</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainMenuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-foreground/10 text-[10px] font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="my-4 border-t border-sidebar-border" />

        {/* Integrations */}
        {integrationItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium">
            JS
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">João Silva</p>
            <p className="text-xs text-muted-foreground">Dono</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </aside>
  );
}
