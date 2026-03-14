/**
 * PortalTabsPremium - Sistema de abas do portal premium com animações
 * AnimatePresence para transição suave entre abas
 * Inclui badges de contagem para revisões pendentes
 */

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent as RadixTabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TabBadge {
  count: number;
  variant?: 'default' | 'warning' | 'success';
}

interface PortalTabsPremiumProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  badges?: Record<string, TabBadge>;
}

const tabs = [
  { id: "overview", label: "Visão Geral" },
  { id: "materials", label: "Materiais" },
  { id: "messages", label: "Mensagens" },
  { id: "tasks", label: "Tarefas" },
  { id: "activity", label: "Atividades" },
  { id: "revisions", label: "Revisões" },
  { id: "documents", label: "Documentos" },
  { id: "financial", label: "Financeiro" },
  { id: "files", label: "Arquivos" },
  { id: "schedule", label: "Cronograma" },
];

const tabsListVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { delay: 0.35, duration: 0.3 },
  },
};

const getBadgeStyles = (variant: TabBadge['variant'] = 'default') => {
  switch (variant) {
    case 'warning':
      return 'bg-destructive text-destructive-foreground';
    case 'success':
      return 'bg-primary text-primary-foreground';
    default:
      return 'bg-primary text-primary-foreground';
  }
};

function PortalTabsPremiumComponent({ 
  activeTab, 
  onTabChange, 
  children,
  badges = {},
}: PortalTabsPremiumProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={tabsListVariants}
      >
        <ScrollArea className="w-full">
          <TabsList className="w-full h-auto justify-start flex-nowrap bg-transparent p-0 border-b border-[#1a1a1a] gap-0 min-w-max rounded-none">
            {tabs.map((tab, index) => {
              const badge = badges[tab.id];
              return (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.03 }}
                >
                  <TabsTrigger
                    value={tab.id}
                    className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 px-6 py-3 text-sm text-gray-500 hover:text-gray-300 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    {tab.label}
                    {/* Badge */}
                    {badge && badge.count > 0 && (
                      <span
                        className={cn(
                          "absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-mono font-bold px-1",
                          getBadgeStyles(badge.variant)
                        )}
                      >
                        {badge.count > 99 ? '99+' : badge.count}
                      </span>
                    )}
                  </TabsTrigger>
                </motion.div>
              );
            })}
          </TabsList>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </motion.div>
      {children}
    </Tabs>
  );
}

export const PortalTabsPremium = memo(PortalTabsPremiumComponent);

// Animated TabsContent wrapper
interface AnimatedTabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function AnimatedTabsContentComponent({ value, children, className }: AnimatedTabsContentProps) {
  return (
    <RadixTabsContent value={value} className={className}>
      <motion.div
        key={value}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </RadixTabsContent>
  );
}

export const TabsContent = memo(AnimatedTabsContentComponent);
