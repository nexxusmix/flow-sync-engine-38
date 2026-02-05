import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectHeader } from "@/components/projects/detail/ProjectHeader";
import { ProjectTabs } from "@/components/projects/detail/ProjectTabs";
import { useProjectsStore } from "@/stores/projectsStore";
import { ArrowLeft, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getProjectById, setSelectedProject } = useProjectsStore();
  const [activeTab, setActiveTab] = useState("overview");

  const project = projectId ? getProjectById(projectId) : undefined;

  useEffect(() => {
    if (project) {
      setSelectedProject(project);
    }
    return () => setSelectedProject(null);
  }, [project, setSelectedProject]);

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
    <DashboardLayout title={project.title}>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
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
    </DashboardLayout>
  );
}
