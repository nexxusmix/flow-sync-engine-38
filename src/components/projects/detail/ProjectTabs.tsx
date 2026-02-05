import { Project } from "@/types/projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { OverviewTab } from "./tabs/OverviewTab";
import { TasksTab } from "./tabs/TasksTab";
import { DeliverablesTab } from "./tabs/DeliverablesTab";
import { RevisionsTab } from "./tabs/RevisionsTab";
import { FilesTab } from "./tabs/FilesTab";
import { ScheduleTab } from "./tabs/ScheduleTab";
import { PortalTab } from "./tabs/PortalTab";
import { AuditTab } from "./tabs/AuditTab";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ProjectTabsProps {
  project: Project;
  activeTab: string;
  onTabChange: (tab: string) => void;
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

export function ProjectTabs({ project, activeTab, onTabChange }: ProjectTabsProps) {
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

      <TabsContent value="overview" className="mt-6">
        <OverviewTab project={project} />
      </TabsContent>
      
      <TabsContent value="tasks" className="mt-6">
        <TasksTab project={project} />
      </TabsContent>
      
      <TabsContent value="deliverables" className="mt-6">
        <DeliverablesTab project={project} />
      </TabsContent>
      
      <TabsContent value="revisions" className="mt-6">
        <RevisionsTab project={project} />
      </TabsContent>
      
      <TabsContent value="files" className="mt-6">
        <FilesTab project={project} />
      </TabsContent>
      
      <TabsContent value="schedule" className="mt-6">
        <ScheduleTab project={project} />
      </TabsContent>
      
      <TabsContent value="portal" className="mt-6">
        <PortalTab project={project} />
      </TabsContent>
      
      <TabsContent value="audit" className="mt-6">
        <AuditTab project={project} />
      </TabsContent>
    </Tabs>
  );
}
