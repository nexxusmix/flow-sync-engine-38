import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { X } from "lucide-react";

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
];

interface CategoryGroup {
  label: string;
  items: { name: string; href: string; icon: string }[];
}

const moreMenuCategories: CategoryGroup[] = [
  {
    label: "Operacional",
    items: [
      { name: "Overview", href: "/", icon: "space_dashboard" },
      { name: "Command Center", href: "/command-center", icon: "terminal" },
      { name: "Executivo", href: "/executivo", icon: "monitoring" },
      { name: "Central de Ações", href: "/central-acoes", icon: "electric_bolt" },
      { name: "Automações", href: "/automacoes-agencia", icon: "manufacturing" },
      { name: "Inbox Operacional", href: "/inbox-operacional", icon: "inbox" },
      { name: "IA & Governança", href: "/ia-governanca", icon: "psychology" },
    ],
  },
  {
    label: "Projetos",
    items: [
      { name: "Projetos", href: "/projetos", icon: "movie_filter" },
      { name: "Tarefas", href: "/tarefas", icon: "checklist" },
      { name: "Calendário", href: "/calendario", icon: "event" },
      { name: "Playbooks", href: "/playbooks", icon: "menu_book" },
      { name: "Onboarding", href: "/onboarding-clientes", icon: "rocket_launch" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { name: "Financeiro", href: "/financeiro", icon: "payments" },
      { name: "Propostas", href: "/propostas", icon: "request_quote" },
      { name: "Contratos", href: "/contratos", icon: "gavel" },
      { name: "Billing", href: "/billing", icon: "credit_card" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { name: "Marketing", href: "/marketing", icon: "campaign" },
      { name: "Studio Criativo", href: "/marketing/studio", icon: "palette" },
      { name: "Transcrição", href: "/marketing/transcricao", icon: "subtitles" },
      { name: "Instagram Engine", href: "/instagram-engine", icon: "photo_camera" },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { name: "Relatórios", href: "/relatorios", icon: "bar_chart" },
      { name: "Avisos", href: "/avisos", icon: "notifications_active" },
    ],
  },
  {
    label: "Configurações",
    items: [
      { name: "CRM", href: "/crm", icon: "handshake" },
      { name: "Clientes", href: "/clientes", icon: "groups" },
      { name: "Prospecção", href: "/prospeccao", icon: "person_search" },
      { name: "Configurações", href: "/configuracoes", icon: "settings" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
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

          {/* "Mais" button — opens drawer instead of navigating */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] min-w-[44px] py-1.5 rounded-xl transition-all duration-200 relative active:scale-95",
              moreOpen ? "text-primary" : "text-muted-foreground/50"
            )}
          >
            <motion.span
              className="material-symbols-outlined text-[22px]"
              animate={moreOpen ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              menu
            </motion.span>
            <span className={cn(
              "text-caption font-light tracking-wider uppercase transition-colors",
              moreOpen ? "text-primary" : "text-muted-foreground/40"
            )}>
              Mais
            </span>
          </button>
        </div>
      </nav>

      {/* More menu drawer */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="flex items-center justify-between pb-2">
            <DrawerTitle className="text-base font-medium uppercase tracking-wider">
              Menu
            </DrawerTitle>
            <DrawerClose asChild>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="overflow-y-auto px-4 pb-8 space-y-5">
            {moreMenuCategories.map((category) => (
              <div key={category.label}>
                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest mb-2 px-1">
                  {category.label}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {category.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href + item.name}
                        to={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all active:scale-95",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          {item.icon}
                        </span>
                        <span className="text-[10px] font-light tracking-wider uppercase text-center leading-tight">
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
