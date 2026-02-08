/**
 * PortalOverviewPremium - Visão Geral do portal no estilo premium
 */

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { 
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectInfo, ProjectStage } from "@/hooks/useClientPortalEnhanced";

interface PortalOverviewPremiumProps {
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

const DEFAULT_STAGES = [
  { key: 'briefing', title: 'Briefing' },
  { key: 'roteiro', title: 'Roteiro' },
  { key: 'pre_producao', title: 'Pré-Produção' },
  { key: 'captacao', title: 'Captação' },
  { key: 'edicao', title: 'Edição' },
  { key: 'revisao', title: 'Revisão' },
  { key: 'aprovacao', title: 'Aprovação' },
  { key: 'entrega', title: 'Entrega' },
  { key: 'pos_venda', title: 'Pós-Venda' },
];

function PortalOverviewPremiumComponent({ project, stages, hasPaymentBlock }: PortalOverviewPremiumProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const currentStageKey = project.stage_current;
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const totalStages = stages.length || 9;
  const stageProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  // Get current stage name
  const currentStageName = currentStageKey 
    ? STAGE_NAMES[currentStageKey] || currentStageKey 
    : 'Não definida';

  // Build display stages
  const displayStages = stages.length > 0 ? stages : DEFAULT_STAGES.map((d, i) => ({
    id: `default-${i}`,
    stage_key: d.key,
    title: d.title,
    status: currentStageKey === d.key ? 'in_progress' : 'not_started',
    order_index: i,
  }));

  return (
    <div className="space-y-10">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
            Progresso
          </p>
          <p className="text-2xl font-light text-white mb-1">{stageProgress}%</p>
          <p className="text-xs text-gray-500">{completedStages}/{totalStages} etapas concluídas</p>
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
            Health Score
          </p>
          <p className={cn(
            "text-2xl font-light",
            (project.health_score || 0) >= 80 ? "text-emerald-400" : 
            (project.health_score || 0) >= 50 ? "text-amber-400" : "text-red-400"
          )}>
            {project.health_score || 0}%
          </p>
          <p className="text-xs text-gray-500">
            {(project.health_score || 0) >= 80 ? 'Excelente' : 
             (project.health_score || 0) >= 50 ? 'Atenção' : 'Crítico'}
          </p>
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
            Etapa Atual
          </p>
          <p className="text-xl font-light text-cyan-400">{currentStageName}</p>
          <p className="text-xs text-gray-500">Em Andamento</p>
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
            Investimento
          </p>
          <p className="text-2xl font-light text-white">{formatCurrency(project.contract_value || 0)}</p>
          <p className="text-xs text-gray-500">Valor Total do Contrato</p>
        </div>
      </div>

      {/* Executive Summary */}
      {project.description && (
        <div className="space-y-4">
          <h2 className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold border-l-2 border-cyan-400 pl-4">
            Resumo Executivo
          </h2>
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6">
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h2 className="text-lg font-light text-white mt-6 mb-3">{children}</h2>,
                  h2: ({ children }) => <h3 className="text-base font-medium text-white mt-5 mb-2">{children}</h3>,
                  h3: ({ children }) => <h4 className="text-sm font-medium text-gray-300 mt-4 mb-2">{children}</h4>,
                  p: ({ children }) => <p className="mb-4 text-gray-400 leading-relaxed text-sm">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-400 text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                }}
              >
                {project.description}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Forecast */}
      <div className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold border-l-2 border-cyan-400 pl-4">
          Timeline Forecast
        </h2>
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">// 30D Forecast</span>
              <span className="text-cyan-400 text-xs">Engine Active</span>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
              <div className="w-0.5 h-12 bg-[#1a1a1a]"></div>
            </div>
            <div>
              <p className="text-white text-sm font-medium mb-1">Hoje</p>
              <p className="text-gray-500 text-xs">{currentStageName} em andamento</p>
            </div>
          </div>
          <div className="flex items-start gap-4 mt-2">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full border border-[#1a1a1a]"></div>
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Próximos 30 dias</p>
              <p className="text-gray-500 text-xs">Nenhum evento crítico detectado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Production Flow */}
      <div className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold border-l-2 border-cyan-400 pl-4">
          Fluxo de Produção
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
          {displayStages.slice(0, 5).map((stage) => {
            const isCompleted = stage.status === 'completed';
            const isInProgress = stage.status === 'in_progress';
            const stageName = stage.title || STAGE_NAMES[stage.stage_key] || stage.stage_key;
            
            return (
              <div key={stage.id} className="bg-[#0a0a0a] p-4">
                <div className="flex items-center gap-2 mb-2">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isInProgress ? (
                    <Clock className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-600" />
                  )}
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider font-medium",
                    isCompleted ? "text-emerald-400" :
                    isInProgress ? "text-cyan-400" :
                    "text-gray-500"
                  )}>
                    {stageName}
                  </span>
                </div>
                <p className="text-[9px] text-gray-500">
                  {isCompleted ? 'Concluída' : isInProgress ? 'Em andamento' : 'Aguardando'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical Specs */}
      <div className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold border-l-2 border-cyan-400 pl-4">
          Especificações Técnicas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
          <div className="bg-[#0a0a0a] p-5">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">Resolução</p>
            <p className="text-sm font-medium text-gray-300">Cinema 4K</p>
          </div>
          <div className="bg-[#0a0a0a] p-5">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">Captação</p>
            <p className="text-sm font-medium text-gray-300">Drone 4K</p>
          </div>
          <div className="bg-[#0a0a0a] p-5">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">Tratamento</p>
            <p className="text-sm font-medium text-gray-300">Color Grade</p>
          </div>
          <div className="bg-[#0a0a0a] p-5">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">Direitos</p>
            <p className="text-sm font-medium text-gray-300">Full Licensing</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const PortalOverviewPremium = memo(PortalOverviewPremiumComponent);
