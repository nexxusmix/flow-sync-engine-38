import { Project } from "@/types/projects";
import { PROJECT_TEMPLATES, STATUS_CONFIG, PROJECT_STAGES } from "@/data/projectTemplates";
import { 
  Calendar, 
  DollarSign, 
  Users, 
  ExternalLink,
  Ban,
  AlertTriangle,
  Activity,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectsStore } from "@/stores/projectsStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const { setSelectedProject, setEditProjectModalOpen, generatePortalLink } = useProjectsStore();
  
  const template = PROJECT_TEMPLATES.find(t => t.id === project.template);
  const stageInfo = PROJECT_STAGES.find(s => s.type === project.currentStage);
  const statusConfig = STATUS_CONFIG[project.status];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const handleEdit = () => {
    setSelectedProject(project);
    setEditProjectModalOpen(true);
  };

  const handleOpenPortal = () => {
    if (!project.portalLink) {
      generatePortalLink(project.id);
    }
    if (project.portalLink?.shareToken) {
      window.open(`/client/${project.portalLink.shareToken}`, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Info Card */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          {/* Left - Project Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs px-2 py-1 rounded border ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                {template?.name}
              </span>
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                {stageInfo?.name}
              </span>
              {project.blockedByPayment && (
                <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <Ban className="w-3 h-3" />
                  Bloqueado
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-2">{project.title}</h1>
            <p className="text-muted-foreground">{project.client.company} • {project.client.name}</p>
          </div>

          {/* Right - Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenPortal}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Portal do Cliente
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/50">
          {/* Contract Value */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(project.contractValue)}</p>
              <p className="text-xs text-muted-foreground">Valor do Contrato</p>
            </div>
          </div>

          {/* Health Score */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              project.healthScore >= 80 ? 'bg-emerald-500/20' : 
              project.healthScore >= 50 ? 'bg-amber-500/20' : 'bg-red-500/20'
            }`}>
              <Activity className={`w-5 h-5 ${
                project.healthScore >= 80 ? 'text-emerald-500' : 
                project.healthScore >= 50 ? 'text-amber-500' : 'text-red-500'
              }`} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{project.healthScore}%</p>
              <p className="text-xs text-muted-foreground">Saúde</p>
            </div>
          </div>

          {/* Delivery Date */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{formatDate(project.estimatedDelivery)}</p>
              <p className="text-xs text-muted-foreground">Entrega Prevista</p>
            </div>
          </div>

          {/* Team */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <div className="flex -space-x-2">
                {project.team.slice(0, 3).map((member, i) => (
                  <div 
                    key={member.id} 
                    className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center"
                    title={member.name}
                  >
                    <span className="text-[10px] font-medium">{member.initials}</span>
                  </div>
                ))}
                {project.team.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-[10px] font-medium">+{project.team.length - 3}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Equipe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Blockages Alert */}
      {project.blockedByPayment && (
        <div className="glass-card rounded-2xl p-4 border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Projeto Bloqueado por Inadimplência</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Existe uma fatura em atraso vinculada a este projeto. A entrega final está bloqueada até regularização.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
