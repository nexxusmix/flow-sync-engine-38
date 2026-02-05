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
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50 p-1 rounded-xl">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-background"
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab project={project} />
      </TabsContent>
      
      <TabsContent value="tasks">
        <TasksTab project={project} />
      </TabsContent>
      
      <TabsContent value="deliverables">
        <DeliverablesTab project={project} />
      </TabsContent>
      
      <TabsContent value="revisions">
        <RevisionsTab project={project} />
      </TabsContent>
      
      <TabsContent value="files">
        <FilesTab project={project} />
      </TabsContent>
      
      <TabsContent value="schedule">
        <ScheduleTab project={project} />
      </TabsContent>
      
      <TabsContent value="portal">
        <PortalTab project={project} />
      </TabsContent>
      
      <TabsContent value="audit">
        <AuditTab project={project} />
      </TabsContent>
    </Tabs>
  );
}
