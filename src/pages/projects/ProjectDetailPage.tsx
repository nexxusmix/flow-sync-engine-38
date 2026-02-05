import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectHeader } from "@/components/projects/detail/ProjectHeader";
import { ProjectTabs } from "@/components/projects/detail/ProjectTabs";
import { useProjectsStore } from "@/stores/projectsStore";
import { ArrowLeft } from "lucide-react";
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
          <p className="text-muted-foreground">O projeto solicitado não foi encontrado.</p>
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
      <div className="space-y-6 animate-fade-in">
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/projetos")}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Projetos
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
