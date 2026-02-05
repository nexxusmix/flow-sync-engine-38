import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectsDashboard } from "@/components/projects/dashboard/ProjectsDashboard";
import { ProjectsHeader } from "@/components/projects/list/ProjectsHeader";
import { ProjectsTable } from "@/components/projects/list/ProjectsTable";
import { ProjectsKanban } from "@/components/projects/list/ProjectsKanban";
import { NewProjectModal } from "@/components/projects/modals/NewProjectModal";
import { EditProjectModal } from "@/components/projects/modals/EditProjectModal";
import { useProjectsStore } from "@/stores/projectsStore";

export default function ProjectsListPage() {
  const { viewMode, isNewProjectModalOpen, isEditProjectModalOpen, selectedProject } = useProjectsStore();

  return (
    <DashboardLayout title="Projetos">
      <div className="space-y-6 animate-fade-in">
        {/* Dashboard Analytics */}
        <ProjectsDashboard />

        {/* Header with filters and actions */}
        <ProjectsHeader />

        {/* Projects List/Kanban View */}
        <div className="min-h-[400px]">
          {viewMode === 'list' ? <ProjectsTable /> : <ProjectsKanban />}
        </div>
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
