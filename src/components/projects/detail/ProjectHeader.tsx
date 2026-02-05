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
  Edit,
  Copy,
  Globe,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectsStore } from "@/stores/projectsStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

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

  const handleCopyPortalLink = () => {
    if (project.portalLink?.shareToken) {
      const link = `${window.location.origin}/client/${project.portalLink.shareToken}`;
      navigator.clipboard.writeText(link);
      toast.success('Link copiado para a área de transferência!');
    } else {
      toast.error('Gere um link do portal primeiro');
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Info Card */}
      <div className="glass-card rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          {/* Left - Project Info */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-[10px] md:text-xs px-2 py-1 rounded border font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <span className="text-[10px] md:text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                {template?.name}
              </span>
              <span className="text-[10px] md:text-xs text-primary bg-primary/10 px-2 py-1 rounded font-medium">
                {stageInfo?.name}
              </span>
              {project.portalLink?.isActive && (
                <span className="text-[10px] md:text-xs text-primary bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Portal Ativo
                </span>
              )}
              {project.blockedByPayment && (
                <span className="text-[10px] md:text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <Ban className="w-3 h-3" />
                  Bloqueado
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1 truncate">{project.title}</h1>
            <p className="text-sm text-muted-foreground">
              {project.client.company} • {project.client.name}
            </p>
          </div>

          {/* Right - Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit} className="h-9">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyPortalLink} className="h-9">
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>
              <Button size="sm" onClick={handleOpenPortal} className="h-9">
                <ExternalLink className="w-4 h-4 mr-2" />
                Portal do Cliente
              </Button>
            </div>

            {/* Mobile dropdown */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Projeto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyPortalLink}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link Portal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenPortal}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Portal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-5 pt-5 border-t border-border/50">
          {/* Contract Value */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-base md:text-lg font-bold text-foreground truncate">{formatCurrency(project.contractValue)}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Valor do Contrato</p>
            </div>
          </div>

          {/* Health Score */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              project.healthScore >= 80 ? 'bg-emerald-500/20' : 
              project.healthScore >= 50 ? 'bg-amber-500/20' : 'bg-red-500/20'
            }`}>
              <Activity className={`w-4 h-4 md:w-5 md:h-5 ${
                project.healthScore >= 80 ? 'text-emerald-500' : 
                project.healthScore >= 50 ? 'text-amber-500' : 'text-red-500'
              }`} />
            </div>
            <div className="min-w-0">
              <p className="text-base md:text-lg font-bold text-foreground">{project.healthScore}%</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Saúde</p>
            </div>
          </div>

          {/* Delivery Date */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-base md:text-lg font-bold text-foreground truncate">{formatDate(project.estimatedDelivery)}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Entrega</p>
            </div>
          </div>

          {/* Team */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-violet-500" />
            </div>
            <div className="min-w-0">
              <div className="flex -space-x-1.5">
                {project.team.slice(0, 3).map((member) => (
                  <div 
                    key={member.id} 
                    className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center"
                    title={member.name}
                  >
                    <span className="text-[9px] font-medium">{member.initials}</span>
                  </div>
                ))}
                {project.team.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                    <span className="text-[9px] font-medium">+{project.team.length - 3}</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Equipe</p>
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
