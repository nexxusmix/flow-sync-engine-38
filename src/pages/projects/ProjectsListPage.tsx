import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectsDashboard } from "@/components/projects/dashboard/ProjectsDashboard";
import { ProjectsHeader } from "@/components/projects/list/ProjectsHeader";
import { ProjectsTable } from "@/components/projects/list/ProjectsTable";
import { ProjectsKanban } from "@/components/projects/list/ProjectsKanban";
import { NewProjectModal } from "@/components/projects/modals/NewProjectModal";
import { EditProjectModal } from "@/components/projects/modals/EditProjectModal";
import { useProjectsStore } from "@/stores/projectsStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, List } from "lucide-react";

export default function ProjectsListPage() {
  const { viewMode, isNewProjectModalOpen, isEditProjectModalOpen, selectedProject } = useProjectsStore();
  const [activeView, setActiveView] = useState<'dashboard' | 'projects'>('dashboard');

  return (
    <DashboardLayout title="Projetos">
      <div className="space-y-6 animate-fade-in">
        {/* View Toggle - Dashboard vs Projects List */}
        <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl w-fit border border-border/50">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'dashboard' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveView('projects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'projects' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Projetos</span>
          </button>
        </div>

        {activeView === 'dashboard' ? (
          // Dashboard Analytics View
          <ProjectsDashboard />
        ) : (
          // Projects List View
          <>
            {/* Header with filters and actions */}
            <ProjectsHeader />

            {/* Projects List/Kanban View */}
            <div className="min-h-[400px]">
              {viewMode === 'list' ? <ProjectsTable /> : <ProjectsKanban />}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <NewProjectModal 
        open={isNewProjectModalOpen} 
        onOpenChange={(open) => useProjectsStore.getState().setNewProjectModalOpen(open)} 
      />
      
      {selectedProject && (
        <EditProjectModal 
          open={isEditProjectModalOpen} 
          onOpenChange={(open) => useProjectsStore.getState().setEditProjectModalOpen(open)}
          project={selectedProject}
        />
      )}
    </DashboardLayout>
  );
}
