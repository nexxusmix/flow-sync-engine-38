/**
 * PortalTabsPremium - Sistema de abas do portal premium
 */

import { memo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface PortalTabsPremiumProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

const tabs = [
  { id: "overview", label: "Visão Geral" },
  { id: "tasks", label: "Tarefas" },
  { id: "deliverables", label: "Entregas" },
  { id: "revisions", label: "Revisões" },
  { id: "files", label: "Arquivos" },
  { id: "schedule", label: "Cronograma" },
  { id: "portal", label: "Portal" },
  { id: "audit", label: "Auditoria" },
];

function PortalTabsPremiumComponent({ activeTab, onTabChange, children }: PortalTabsPremiumProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-8">
      <ScrollArea className="w-full">
        <TabsList className="w-full h-auto justify-start flex-nowrap bg-transparent p-0 border-b border-[#1a1a1a] gap-0 min-w-max rounded-none">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 px-6 py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
      {children}
    </Tabs>
  );
}

export const PortalTabsPremium = memo(PortalTabsPremiumComponent);

// Re-export TabsContent for use in parent
export { TabsContent };
