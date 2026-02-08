import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectHeader } from "@/components/projects/detail/ProjectHeader";
import { ProjectTabs } from "@/components/projects/detail/ProjectTabs";
import { EditProjectModal } from "@/components/projects/modals/EditProjectModal";
import { useProject } from "@/hooks/useProjects";
import { useUrlState } from "@/hooks/useUrlState";
import { useScrollPersistence, useTabPersistence } from "@/hooks/usePersistedState";
import { useProjectsStore } from "@/stores/projectsStore";
import { ArrowLeft, Folder, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(projectId);
  const { isEditProjectModalOpen, setEditProjectModalOpen } = useProjectsStore();
  
  // URL-based tab persistence
  const { getPersistedTab, setPersistedTab } = useTabPersistence('project', projectId);
  const [activeTab, setActiveTab] = useUrlState('tab', getPersistedTab() || 'overview');
  
  // Scroll persistence
  useScrollPersistence(`project:${projectId}`);

  // Sync tab to localStorage for fallback
  useEffect(() => {
    if (activeTab) {
      setPersistedTab(activeTab);
    }
  }, [activeTab, setPersistedTab]);

  if (isLoading) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout title="Projeto não encontrado">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Folder className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Projeto não encontrado</h2>
          <p className="text-muted-foreground text-sm text-center max-w-md">
            O projeto que você está procurando não existe ou foi removido.
          </p>
          <Button variant="outline" onClick={() => navigate("/projetos")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Projetos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={project.name}>
      <div className="space-y-4 md:space-y-6 animate-fade-in max-w-[1600px] 2xl:max-w-[1800px] mx-auto">
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/projetos")}
          className="text-muted-foreground hover:text-foreground -ml-2 h-9"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Voltar para Projetos</span>
          <span className="sm:hidden">Voltar</span>
        </Button>

        {/* Project Header with info and quick actions */}
        <ProjectHeader project={project} />

        {/* Tabs Content */}
        <ProjectTabs 
          project={project} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </div>

      {/* Edit Project Modal */}
      <EditProjectModal
        open={isEditProjectModalOpen}
        onOpenChange={setEditProjectModalOpen}
        project={project}
      />
    </DashboardLayout>
  );
}
