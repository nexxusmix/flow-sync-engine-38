import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: "Home", href: "/", icon: "space_dashboard" },
  { name: "Projetos", href: "/projetos", icon: "movie_filter" },
  { name: "Tarefas", href: "/tarefas", icon: "checklist" },
  { name: "CRM", href: "/crm", icon: "handshake" },
  { name: "Mais", href: "/configuracoes", icon: "menu" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-white/[0.06] bg-[#030303]/95 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-lg transition-colors relative",
                active ? "text-primary" : "text-muted-foreground/60"
              )}
            >
              {active && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className={cn(
                "material-symbols-outlined text-[22px]",
                active && "text-primary"
              )}>
                {item.icon}
              </span>
              <span className="text-[10px] font-light tracking-wider uppercase">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
