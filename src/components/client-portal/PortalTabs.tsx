/**
 * PortalTabs - Sistema de abas do portal do cliente
 * 
 * Espelha as abas do ProjectTabs interno, mas com conteúdo
 * adaptado para visualização do cliente.
 */

import { memo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Package, 
  MessageSquare, 
  FolderOpen, 
  Calendar, 
  Globe, 
  FileText 
} from "lucide-react";

interface PortalTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

const tabs = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "tasks", label: "Tarefas", icon: CheckSquare },
  { id: "deliverables", label: "Entregas", icon: Package },
  { id: "revisions", label: "Revisões", icon: MessageSquare },
  { id: "files", label: "Arquivos", icon: FolderOpen },
  { id: "schedule", label: "Cronograma", icon: Calendar },
  { id: "portal", label: "Portal", icon: Globe },
  { id: "audit", label: "Auditoria", icon: FileText },
];

function PortalTabsComponent({ activeTab, onTabChange, children }: PortalTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <ScrollArea className="w-full">
        <TabsList className="w-full h-auto justify-start flex-nowrap bg-muted/30 p-1.5 rounded-xl border border-border/50 gap-1 min-w-max">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm"
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
      {children}
    </Tabs>
  );
}

export const PortalTabs = memo(PortalTabsComponent);

// Re-export TabsContent for use in parent
export { TabsContent };
