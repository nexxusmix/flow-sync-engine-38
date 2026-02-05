import { useNavigate } from "react-router-dom";
import { useProjectsStore } from "@/stores/projectsStore";
import { Project } from "@/types/projects";
import { PROJECT_TEMPLATES, STATUS_CONFIG, STAGE_COLORS } from "@/data/projectTemplates";
import { PROJECT_STAGES } from "@/data/projectTemplates";
import { 
  Ban, 
  ChevronRight, 
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function HealthIndicator({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{score}</span>
    </div>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const navigate = useNavigate();
  const { setSelectedProject, setEditProjectModalOpen, deleteProject } = useProjectsStore();

  const template = PROJECT_TEMPLATES.find(t => t.id === project.template);
  const stageInfo = PROJECT_STAGES.find(s => s.type === project.currentStage);
  const statusConfig = STATUS_CONFIG[project.status];

  const handleEdit = () => {
    setSelectedProject(project);
    setEditProjectModalOpen(true);
  };

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir o projeto "${project.title}"?`)) {
      deleteProject(project.id);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
    } catch {
      return "-";
    }
  };

  return (
    <div 
      className="glass-card rounded-xl p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={() => navigate(`/projetos/${project.id}`)}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">{project.title}</h3>
                {project.blockedByPayment && (
                  <Ban className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{project.client.company}</p>
            </div>
          </div>
        </div>

        {/* Template Badge */}
        <div className="hidden md:block w-28">
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
            {template?.name || project.template}
          </span>
        </div>

        {/* Stage Badge */}
        <div className="hidden md:block w-28">
          <span className={`text-xs px-2 py-1 rounded ${STAGE_COLORS[project.currentStage]} bg-opacity-20 text-foreground`}>
            {stageInfo?.name || project.currentStage}
          </span>
        </div>

        {/* Status Badge */}
        <div className="w-24">
          <span className={`text-xs px-2 py-1 rounded border ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Health Score */}
        <div className="hidden lg:block w-24">
          <HealthIndicator score={project.healthScore} />
        </div>

        {/* Delivery Date */}
        <div className="hidden md:block w-20 text-right">
          <p className="text-sm text-foreground">{formatDate(project.estimatedDelivery)}</p>
          <p className="text-xs text-muted-foreground">Entrega</p>
        </div>

        {/* Owner */}
        <div className="hidden lg:flex items-center gap-2 w-32">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">{project.owner.initials}</span>
          </div>
          <span className="text-sm text-muted-foreground truncate">{project.owner.name.split(' ')[0]}</span>
        </div>

        {/* Updated */}
        <div className="hidden xl:block w-24 text-right">
          <p className="text-xs text-muted-foreground">{getRelativeTime(project.updatedAt)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/projetos/${project.id}`); }}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(); }}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Mobile badges */}
      <div className="flex flex-wrap gap-2 mt-3 lg:hidden">
        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
          {template?.name}
        </span>
        <span className={`text-xs px-2 py-1 rounded ${STAGE_COLORS[project.currentStage]} bg-opacity-20`}>
          {stageInfo?.name}
        </span>
        <span className="text-xs text-muted-foreground">
          Entrega: {formatDate(project.estimatedDelivery)}
        </span>
      </div>
    </div>
  );
}

export function ProjectsTable() {
  const { getFilteredProjects } = useProjectsStore();
  const projects = getFilteredProjects();

  if (projects.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <p className="text-muted-foreground">Nenhum projeto encontrado com os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header (Desktop) */}
      <div className="hidden lg:flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">
        <div className="flex-1">Projeto</div>
        <div className="w-28">Template</div>
        <div className="w-28">Etapa</div>
        <div className="w-24">Status</div>
        <div className="w-24">Saúde</div>
        <div className="w-20 text-right">Data</div>
        <div className="w-32">Owner</div>
        <div className="w-24 text-right">Atualizado</div>
        <div className="w-16"></div>
      </div>

      {/* Project Rows */}
      {projects.map(project => (
        <ProjectRow key={project.id} project={project} />
      ))}
    </div>
  );
}
