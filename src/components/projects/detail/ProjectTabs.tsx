import { ProjectWithStages } from "@/hooks/useProjects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Package, 
  MessageSquare, 
  FolderOpen, 
  Calendar, 
  Globe, 
  FileText,
  Users,
  Clapperboard,
  Bell,
  DollarSign,
  Images,
} from "lucide-react";
import { OverviewTab } from "./tabs/OverviewTab";
import { TasksTab } from "./tabs/TasksTab";
import { DeliverablesTab } from "./tabs/DeliverablesTab";
import { RevisionsTab } from "./tabs/RevisionsTab";
import { FilesTab } from "./tabs/FilesTab";
import { ScheduleTab } from "./tabs/ScheduleTab";
import { PortalTab } from "./tabs/PortalTab";
import { AuditTab } from "./tabs/AuditTab";
import { MeetingsTab } from "../meetings/MeetingsTab";
import { StoryboardTab } from "./tabs/StoryboardTab";
import { AlertsTab } from "./tabs/AlertsTab";
import { FinanceTab } from "./tabs/FinanceTab";
import { GalleryTab } from "./tabs/GalleryTab";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useProjectRevisions } from "@/hooks/useProjectRevisions";
import { useAlerts } from "@/hooks/useAlerts";
import { cn } from "@/lib/utils";

interface ProjectTabsProps {
  project: ProjectWithStages;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "meetings", label: "Reuniões", icon: Users },
  { id: "tasks", label: "Tarefas", icon: CheckSquare },
  { id: "deliverables", label: "Entregas", icon: Package },
  { id: "revisions", label: "Revisões", icon: MessageSquare },
  { id: "files", label: "Arquivos", icon: FolderOpen },
  { id: "gallery", label: "Galeria IA", icon: Images },
  { id: "schedule", label: "Cronograma", icon: Calendar },
  { id: "finance", label: "Financeiro", icon: DollarSign },
  { id: "storyboard", label: "Storyboard IA", icon: Clapperboard },
  { id: "alerts", label: "Avisos", icon: Bell },
  { id: "portal", label: "Portal", icon: Globe },
  { id: "audit", label: "Auditoria", icon: FileText },
];

export function ProjectTabs({ project, activeTab, onTabChange }: ProjectTabsProps) {
  // Get revision stats for badge
  const { stats } = useProjectRevisions(project.id);
  const pendingCount = stats?.pending || 0;

  // Get alerts count for badge
  const { unreadCount: alertsCount } = useAlerts({ projectId: project.id, status: 'open' });

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <ScrollArea className="w-full">
        <TabsList className="w-full h-auto justify-start flex-nowrap bg-muted/30 p-1.5 rounded-xl border border-border/50 gap-1 min-w-max">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="relative flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm"
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {/* Badge for revisions tab */}
              {tab.id === 'revisions' && pendingCount > 0 && (
                <span className={cn(
                  "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1",
                  "bg-amber-500 text-white"
                )}>
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
              {/* Badge for alerts tab */}
              {tab.id === 'alerts' && alertsCount > 0 && (
                <span className={cn(
                  "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1",
                  "bg-red-500 text-white"
                )}>
                  {alertsCount > 99 ? '99+' : alertsCount}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>

      <TabsContent value="overview" className="mt-6">
        <OverviewTab project={project} />
      </TabsContent>

      <TabsContent value="meetings" className="mt-6">
        <MeetingsTab project={project} />
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

      <TabsContent value="gallery" className="mt-6">
        <GalleryTab project={project} />
      </TabsContent>
      
      <TabsContent value="schedule" className="mt-6">
        <ScheduleTab project={project} />
      </TabsContent>

      <TabsContent value="finance" className="mt-6">
        <FinanceTab project={project} />
      </TabsContent>

      <TabsContent value="storyboard" className="mt-6">
        <StoryboardTab project={project} />
      </TabsContent>

      <TabsContent value="alerts" className="mt-6">
        <AlertsTab project={project} />
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
