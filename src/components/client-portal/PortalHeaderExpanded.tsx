/**
 * PortalHeaderExpanded - Header do portal espelhando o ProjectHeader interno
 * 
 * Exibe:
 * - Badges (status, template, etapa, bloqueado)
 * - Título + Logo + Cliente
 * - Botões: Exportar PDF, Copiar Link, Suporte
 * - Cards de métricas (Valor, Saúde, Entrega, Responsável)
 * - Alerta de bloqueio por inadimplência
 */

import { memo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Activity,
  Copy,
  Loader2,
  FileDown,
  Ban,
  AlertTriangle,
  MessageCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import squadHubLogo from "@/assets/squad-hub-logo.png";
import type { ProjectInfo } from "@/hooks/useClientPortalEnhanced";

interface PortalHeaderExpandedProps {
  project: ProjectInfo;
  shareToken: string;
  hasPaymentBlock?: boolean;
  onExportPdf?: () => void;
  isExporting?: boolean;
}

// Stage name mapping
const STAGE_NAMES: Record<string, string> = {
  briefing: 'Briefing',
  roteiro: 'Roteiro',
  pre_producao: 'Pré-Produção',
  captacao: 'Captação',
  edicao: 'Edição',
  revisao: 'Revisão',
  aprovacao: 'Aprovação',
  entrega: 'Entrega',
  pos_venda: 'Pós-Venda',
};

// Template name mapping
const TEMPLATE_NAMES: Record<string, string> = {
  filme_institucional: 'Filme Institucional',
  video_clipe: 'Videoclipe',
  documentario: 'Documentário',
  comercial: 'Comercial',
  evento: 'Cobertura de Evento',
  social_media: 'Social Media',
  custom: 'Projeto',
};

// Status config
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativo', color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' },
  paused: { label: 'Pausado', color: 'bg-amber-500/20 text-amber-500 border-amber-500/30' },
  completed: { label: 'Concluído', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
};

function PortalHeaderExpandedComponent({
  project,
  shareToken,
  hasPaymentBlock,
  onExportPdf,
  isExporting,
}: PortalHeaderExpandedProps) {
  const [copied, setCopied] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd MMM yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/client/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSupport = () => {
    toast.info('Funcionalidade de suporte em desenvolvimento');
  };

  const stageName = project.stage_current 
    ? STAGE_NAMES[project.stage_current] || project.stage_current 
    : null;
  
  const templateName = project.template 
    ? TEMPLATE_NAMES[project.template] || project.template 
    : 'Projeto';
  
  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;

  return (
    <div className="space-y-4">
      {/* Main Info Card */}
      <div className="glass-card rounded-2xl md:rounded-3xl p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          {/* Left - Project Info */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={cn(
                "text-[10px] md:text-xs px-2 py-1 rounded border font-medium",
                statusConfig.color
              )}>
                {statusConfig.label}
              </span>
              <span className="text-[10px] md:text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                {templateName}
              </span>
              {stageName && (
                <span className="text-[10px] md:text-xs text-primary bg-primary/10 px-2 py-1 rounded font-medium">
                  {stageName}
                </span>
              )}
              {hasPaymentBlock && (
                <span className="text-[10px] md:text-xs px-2 py-1 rounded bg-destructive/20 text-destructive border border-destructive/30 flex items-center gap-1">
                  <Ban className="w-3 h-3" />
                  Bloqueado
                </span>
              )}
            </div>

            {/* Title with Logo */}
            <div className="flex items-center gap-3">
              {project.logo_url ? (
                <img
                  src={project.logo_url}
                  alt="Logo do projeto"
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border border-border"
                />
              ) : (
                <img 
                  src={squadHubLogo} 
                  alt="SQUAD Hub" 
                  className="h-8 w-auto object-contain"
                />
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1 truncate">
                  {project.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {project.client_name || 'Cliente'}
                </p>
              </div>
            </div>
          </div>

          {/* Right - Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExportPdf}
              disabled={isExporting}
              className="h-9"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              Exportar PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyLink}
              className="h-9"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Copiar Link
            </Button>
            <Button 
              size="sm" 
              onClick={handleSupport}
              className="h-9"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Suporte
            </Button>
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
              <p className="text-base md:text-lg font-bold text-foreground truncate">
                {formatCurrency(project.contract_value || 0)}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Valor do Contrato</p>
            </div>
          </div>

          {/* Health Score */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className={cn(
              "w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              (project.health_score || 0) >= 80 ? 'bg-emerald-500/20' : 
              (project.health_score || 0) >= 50 ? 'bg-amber-500/20' : 'bg-red-500/20'
            )}>
              <Activity className={cn(
                "w-4 h-4 md:w-5 md:h-5",
                (project.health_score || 0) >= 80 ? 'text-emerald-500' : 
                (project.health_score || 0) >= 50 ? 'text-amber-500' : 'text-red-500'
              )} />
            </div>
            <div className="min-w-0">
              <p className="text-base md:text-lg font-bold text-foreground">
                {project.health_score || 0}%
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Saúde</p>
            </div>
          </div>

          {/* Delivery Date */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-base md:text-lg font-bold text-foreground truncate">
                {formatDate(project.due_date)}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Entrega</p>
            </div>
          </div>

          {/* Owner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {project.owner_name || 'Não definido'}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Responsável</p>
            </div>
          </div>
        </div>
      </div>

      {/* Blockage Alert */}
      {hasPaymentBlock && (
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

export const PortalHeaderExpanded = memo(PortalHeaderExpandedComponent);
