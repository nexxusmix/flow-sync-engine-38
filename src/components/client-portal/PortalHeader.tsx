import { Project } from "@/types/projects";
import squadHubLogo from "@/assets/squad-hub-logo.png";
import { STATUS_CONFIG } from "@/data/projectTemplates";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortalHeaderProps {
  project: Project;
}

export function PortalHeader({ project }: PortalHeaderProps) {
  const statusConfig = STATUS_CONFIG[project.status];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Project Name */}
          <div className="flex items-center gap-4">
            <img 
              src={squadHubLogo} 
              alt="SQUAD Hub" 
              className="h-8 w-auto object-contain"
            />
            <div className="hidden sm:block h-6 w-px bg-border" />
            <div className="hidden sm:block">
              <h1 className="font-semibold text-foreground">{project.title}</h1>
              <p className="text-xs text-muted-foreground">{project.client.company}</p>
            </div>
          </div>

          {/* Status & Contact */}
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1.5 rounded-full border ${statusConfig.color}`}>
              {project.currentStage === 'entrega' ? 'Entregue' : 
               project.currentStage === 'revisao' ? 'Em Revisão' :
               project.currentStage === 'aprovacao' ? 'Aguardando Aprovação' :
               'Em Produção'}
            </span>
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Falar com a Equipe</span>
            </Button>
          </div>
        </div>

        {/* Mobile Project Name */}
        <div className="sm:hidden mt-3">
          <h1 className="font-semibold text-foreground">{project.title}</h1>
          <p className="text-xs text-muted-foreground">{project.client.company}</p>
        </div>
      </div>
    </header>
  );
}
