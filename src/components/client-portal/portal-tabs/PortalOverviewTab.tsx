/**
 * PortalOverviewTab - Aba Visão Geral do portal do cliente
 * 
 * Versão do cliente da OverviewTab interna, com:
 * - Métricas de progresso
 * - Briefing do projeto (read-only)
 * - Etapas do projeto
 * - Indicadores de status
 */

import { memo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { 
  Activity,
  DollarSign,
  Target,
  Zap,
  TrendingUp,
  Calendar,
  FileText,
  CheckCircle2,
  Circle,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectInfo, ProjectStage } from "@/hooks/useClientPortalEnhanced";
import { PortalIntelligenceBlock } from "@/components/client-portal/PortalIntelligenceBlock";

interface PortalOverviewTabProps {
  project: ProjectInfo;
  stages: ProjectStage[];
  hasPaymentBlock?: boolean;
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

function PortalOverviewTabComponent({ project, stages, hasPaymentBlock }: PortalOverviewTabProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-primary';
    if (health >= 70) return 'text-muted-foreground';
    return 'text-destructive';
  };

  const currentStageName = project.stage_current 
    ? STAGE_NAMES[project.stage_current] || project.stage_current 
    : 'Não definida';
  
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const totalStages = stages.length || 9;
  const stageProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground/50" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Predictive Intelligence - Read Only */}
      <PortalIntelligenceBlock project={project} stages={stages} />

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <span className="text-caption font-bold text-primary uppercase">Progresso</span>
          </div>
          <p className="text-lg font-bold text-foreground">{stageProgress}%</p>
          <p className="text-mono text-muted-foreground">{completedStages}/{totalStages} etapas</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <span className="text-caption font-bold text-primary uppercase">Saúde</span>
          </div>
          <p className={cn("text-lg font-bold", getHealthColor(project.health_score || 0))}>
            {project.health_score || 0}%
          </p>
          <p className="text-mono text-muted-foreground">Health Score</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Zap className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-caption font-bold text-muted-foreground uppercase">Etapa</span>
          </div>
          <p className="text-lg font-bold text-foreground truncate">{currentStageName}</p>
          <p className="text-mono text-muted-foreground">Etapa Atual</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <span className="text-caption font-bold text-primary uppercase">Valor</span>
          </div>
          <p className="text-lg font-bold text-foreground">{formatCurrency(project.contract_value || 0)}</p>
          <p className="text-mono text-muted-foreground">Valor do Contrato</p>
        </div>
      </div>

      {/* Project Briefing / Description - Read Only */}
      {project.description && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Briefing do Projeto</h3>
              <p className="text-[10px] text-muted-foreground">Descrição, escopo e objetivos</p>
            </div>
          </div>
          
          <div className="prose prose-sm prose-invert max-w-none bg-muted/20 rounded-xl p-4">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h2 className="text-lg font-bold text-foreground mt-4 mb-2">{children}</h2>,
                h2: ({ children }) => <h3 className="text-base font-semibold text-foreground mt-4 mb-2">{children}</h3>,
                h3: ({ children }) => <h4 className="text-sm font-semibold text-foreground mt-3 mb-1">{children}</h4>,
                p: ({ children }) => <p className="mb-3 text-muted-foreground">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
              }}
            >
              {project.description}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Project Stages */}
      {stages.length > 0 && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Etapas do Projeto</h3>
              <p className="text-[10px] text-muted-foreground">Fluxo de Produção</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stages.map((stage) => (
              <div key={stage.id} className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide truncate">
                    {stage.title || STAGE_NAMES[stage.stage_key] || stage.stage_key}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(stage.status)}
                  <span className="text-[9px] text-muted-foreground">
                    {stage.status === 'completed' ? 'Concluída' :
                     stage.status === 'in_progress' ? 'Em andamento' :
                     'Não iniciada'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card rounded-xl p-4 border-l-2 border-primary">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-[8px] font-bold text-primary uppercase">Status</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1">Status do Projeto</p>
          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
            {project.status === 'active' ? 'Ativo' : 
             project.status === 'paused' ? 'Pausado' : 
             project.status === 'completed' ? 'Concluído' : project.status}
          </Badge>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-2 border-primary">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-[8px] font-bold text-primary uppercase">Entrega</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1">Data de Entrega</p>
          <p className="text-sm font-bold text-foreground">
            {project.due_date 
              ? format(new Date(project.due_date), "dd/MM/yyyy", { locale: ptBR }) 
              : '--'}
          </p>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-2 border-amber-500">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-[8px] font-bold text-amber-500 uppercase">Cliente</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1">Nome do Cliente</p>
          <p className="text-sm font-bold text-foreground truncate">{project.client_name || '--'}</p>
        </div>

      </div>
    </div>
  );
}

export const PortalOverviewTab = memo(PortalOverviewTabComponent);
