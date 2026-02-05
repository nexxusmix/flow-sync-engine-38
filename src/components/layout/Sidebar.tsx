import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import squadHubLogo from "@/assets/squad-hub-logo.png";

const mainMenuItems = [
  { name: "Overview", href: "/", icon: "dashboard" },
  { name: "Cine CRM", href: "/crm", icon: "radar", badge: 3 },
  { name: "Inbox", href: "/inbox", icon: "mail" },
  { name: "Produção", href: "/projetos", icon: "movie_edit" },
  { name: "Propostas", href: "/propostas", icon: "description" },
  { name: "Contratos", href: "/contratos", icon: "contract" },
  { name: "Financeiro", href: "/financeiro", icon: "account_balance_wallet" },
  { name: "Conteúdo", href: "/conteudo", icon: "perm_media" },
  { name: "Knowledge", href: "/knowledge", icon: "menu_book" },
  { name: "Relatórios", href: "/relatorios", icon: "monitoring" },
  { name: "Configurações", href: "/configuracoes", icon: "settings" },
];

const integrationItems = [
  { name: "Integrações", href: "/integracoes", icon: "hub" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-20 md:w-64 bg-[#050505] border-r border-white/5 flex flex-col transition-all duration-500">
      {/* Logo */}
      <div className="flex h-20 items-center justify-center md:justify-start px-4 md:px-6 border-b border-white/5">
        <img 
          src={squadHubLogo} 
          alt="SQUAD Hub" 
          className="h-8 md:h-10 w-auto object-contain"
        />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {mainMenuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group",
                isActive
                  ? "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <span className={cn(
                "material-symbols-outlined",
                isActive ? "text-black" : "text-muted-foreground group-hover:text-primary"
              )}>
                {item.icon}
              </span>
              <span className="hidden md:block text-[10px] font-black uppercase tracking-widest flex-1">
                {item.name}
              </span>
              {item.badge && (
                <span className={cn(
                  "hidden md:flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[9px] font-black",
                  isActive ? "bg-black/10 text-black" : "bg-primary/20 text-primary"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="my-6 border-t border-white/5" />

        {/* Integrations */}
        {integrationItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group",
                isActive
                  ? "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <span className={cn(
                "material-symbols-outlined",
                isActive ? "text-black" : "text-muted-foreground group-hover:text-primary"
              )}>
                {item.icon}
              </span>
              <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-6 py-6 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-black">
            RS
          </div>
          <div className="hidden md:block">
            <p className="text-[10px] text-foreground font-black uppercase">Rodrigo S.</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Admin Root</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
