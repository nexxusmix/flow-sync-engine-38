import { useNavigate } from "react-router-dom";
import { useProjectsStore } from "@/stores/projectsStore";
import { useProjects, ProjectWithStages } from "@/hooks/useProjects";
import { ProjectActionsMenu } from "@/components/projects/ProjectActionsMenu";
import { PROJECT_TEMPLATES, STATUS_CONFIG, STAGE_COLORS, PROJECT_STAGES } from "@/data/projectTemplates";
import { 
  Ban, 
  ChevronRight, 
  ExternalLink,
  Loader2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function HealthIndicator({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-[10px] font-bold ${textColor}`}>{score}%</span>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectWithStages }) {
  const navigate = useNavigate();

  const template = PROJECT_TEMPLATES.find(t => t.id === project.template);
  const stageInfo = PROJECT_STAGES.find(s => s.type === project.stage_current);
  const statusConfig = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ok;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div 
      className="glass-card rounded-2xl p-4 md:p-5 hover:bg-muted/30 transition-all cursor-pointer group border border-transparent hover:border-primary/20"
      onClick={() => navigate(`/projetos/${project.id}`)}
    >
      <div className="flex flex-col gap-4">
        {/* Top Row - Title, Client, Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              {project.has_payment_block && (
                <Ban className="w-4 h-4 text-destructive flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{project.client_name}</span>
              <span className="text-border">•</span>
              <span className="text-primary font-medium">{formatCurrency(project.contract_value || 0)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ProjectActionsMenu project={project} />
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>

        {/* Bottom Row - Badges and Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Template */}
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg font-medium">
            {template?.name || project.template || 'Projeto'}
          </span>
          
          {/* Stage */}
          <span className={`text-[10px] px-2.5 py-1 rounded-lg font-medium ${STAGE_COLORS[project.stage_current as keyof typeof STAGE_COLORS] || 'bg-muted'} bg-opacity-20 text-foreground`}>
            {stageInfo?.name || project.stage_current}
          </span>
          
          {/* Status */}
          <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>

          <div className="flex-1" />

          {/* Health */}
          <div className="hidden sm:block">
            <HealthIndicator score={project.health_score || 100} />
          </div>

          {/* Delivery Date */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Entrega:</span>
            <span className="font-medium text-foreground">{formatDate(project.due_date)}</span>
          </div>

          {/* Owner */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] font-medium text-primary">{project.owner_name?.charAt(0) || 'S'}</span>
            </div>
            <span className="text-sm text-muted-foreground">{project.owner_name?.split(' ')[0] || 'Squad'}</span>
          </div>

          {/* Updated */}
          <span className="hidden xl:block text-xs text-muted-foreground">
            {getRelativeTime(project.updated_at)}
          </span>
        </div>

        {/* Mobile Health */}
        <div className="sm:hidden">
          <HealthIndicator score={project.health_score || 100} />
        </div>
      </div>
    </div>
  );
}

export function ProjectsTable() {
  const { projects, isLoading } = useProjects();
  const { filters } = useProjectsStore();

  // Apply filters
  const filteredProjects = projects.filter(project => {
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status !== 'all' && project.status !== filters.status) return false;
    if (filters.stage !== 'all' && project.stage_current !== filters.stage) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="w-8 h-8 text-primary/60" />
        </div>
        <h3 className="text-lg font-normal text-foreground mb-2">Nenhum projeto encontrado</h3>
        <p className="text-muted-foreground text-sm font-light max-w-[280px]">
          Tente ajustar os filtros ou criar um novo projeto para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 min-h-[200px]">
      {filteredProjects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
