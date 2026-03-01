/**
 * PortalOverviewSection - Seção de visão geral do portal do cliente
 * 
 * Exibe:
 * - Métricas expandidas (Progresso, Etapa Atual)
 * - Briefing do projeto (Markdown)
 * - Indicadores de rodapé (Status, Data, Cliente, Bloqueio)
 */

import { memo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { 
  TrendingUp, 
  Layers, 
  Activity,
  Calendar,
  User,
  Lock,
  Unlock,
  FileText,
  CheckCircle2,
  Circle,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectInfo, ProjectStage } from "@/hooks/useClientPortalEnhanced";

interface PortalOverviewSectionProps {
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

function PortalOverviewSectionComponent({ project, stages, hasPaymentBlock }: PortalOverviewSectionProps) {
  // Calculate progress
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const totalStages = stages.length || 9;
  const progressPercent = Math.round((completedStages / totalStages) * 100);

  // Get current stage name
  const currentStage = stages.find(s => s.status === 'in_progress');
  const currentStageName = currentStage?.title || 
    (project.stage_current ? STAGE_NAMES[project.stage_current] || project.stage_current : null);

  return (
    <div className="space-y-6">
      {/* Extended Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Progress Card */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-cyan-500" />
            </div>
            <span className="text-[9px] font-bold text-cyan-500 uppercase">Progresso</span>
          </div>
          <p className="text-lg font-bold text-foreground">{progressPercent}%</p>
          <p className="text-[10px] text-muted-foreground">{completedStages}/{totalStages} etapas</p>
        </div>

        {/* Current Stage Card */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[9px] font-bold text-primary uppercase">Etapa</span>
          </div>
          <p className="text-sm font-bold text-foreground truncate">
            {currentStageName || 'Não definida'}
          </p>
          <p className="text-[10px] text-muted-foreground">Etapa Atual</p>
        </div>
      </div>

      {/* Briefing Section */}
      {project.description && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Briefing do Projeto</h3>
              <p className="text-xs text-muted-foreground">Descrição, escopo e objetivos</p>
            </div>
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-sm text-muted-foreground">
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

      {/* Footer Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Status */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase">Status</span>
          </div>
          <Badge 
            variant={project.status === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {project.status === 'active' ? 'Ativo' : 
             project.status === 'paused' ? 'Pausado' : 
             project.status === 'completed' ? 'Concluído' : project.status}
          </Badge>
        </div>

        {/* Delivery Date */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase">Entrega</span>
          </div>
          <p className="text-sm font-medium text-foreground">
            {project.due_date 
              ? format(new Date(project.due_date), "dd/MM/yyyy", { locale: ptBR }) 
              : '--'}
          </p>
        </div>

        {/* Client Name */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase">Cliente</span>
          </div>
          <p className="text-sm font-medium text-foreground truncate">
            {project.client_name || '--'}
          </p>
        </div>

        {/* Payment Block */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            {hasPaymentBlock ? (
              <Lock className="w-4 h-4 text-amber-500" />
            ) : (
              <Unlock className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-[10px] text-muted-foreground uppercase">Bloqueio</span>
          </div>
          <Badge 
            variant={hasPaymentBlock ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {hasPaymentBlock ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export const PortalOverviewSection = memo(PortalOverviewSectionComponent);
