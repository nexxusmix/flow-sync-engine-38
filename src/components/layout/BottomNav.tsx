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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-[60px] px-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] min-w-[44px] py-1.5 rounded-xl transition-all duration-200 relative active:scale-95",
                active ? "text-primary" : "text-muted-foreground/50"
              )}
            >
              {active && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-10 h-[2px] rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.span
                className="material-symbols-outlined text-[22px]"
                animate={active ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {item.icon}
              </motion.span>
              <span className={cn(
                "text-caption font-light tracking-wider uppercase transition-colors",
                active ? "text-primary" : "text-muted-foreground/40"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
