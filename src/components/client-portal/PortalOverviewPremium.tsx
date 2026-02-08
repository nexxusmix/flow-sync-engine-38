/**
 * PortalOverviewPremium - Visão Geral do portal no estilo premium SQUAD
 * Layout completo com Briefing, Escopo, Entregas, Financeiro, etc.
 */

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Pencil,
  Timer,
  Heart,
  Film,
  DollarSign,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectInfo, ProjectStage, PortalDeliverable } from "@/hooks/useClientPortalEnhanced";

interface PortalOverviewPremiumProps {
  project: ProjectInfo;
  stages: ProjectStage[];
  deliverables?: PortalDeliverable[];
  hasPaymentBlock?: boolean;
  isManager?: boolean;
  onEditBriefing?: () => void;
  onGenerateAI?: () => void;
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

// Parse description into sections
function parseDescription(description: string | null | undefined) {
  if (!description) return null;
  
  const sections: {
    resumo?: string;
    escopo?: string;
    entregas?: string[];
    financeiro?: string;
    observacoes?: string[];
  } = {};
  
  // Split by ## headers
  const parts = description.split(/##\s+/);
  
  parts.forEach(part => {
    const lines = part.trim().split('\n');
    const header = lines[0]?.toUpperCase();
    const content = lines.slice(1).join('\n').trim();
    
    if (header?.includes('RESUMO EXECUTIVO')) {
      sections.resumo = content;
    } else if (header?.includes('ESCOPO')) {
      sections.escopo = content;
    } else if (header?.includes('ENTREGAS')) {
      sections.entregas = content.split('\n- ').filter(Boolean).map(e => e.replace(/^-\s*/, ''));
    } else if (header?.includes('CONDIÇÕES FINANCEIRAS') || header?.includes('FINANC')) {
      sections.financeiro = content;
    } else if (header?.includes('OBSERVAÇÕES') || header?.includes('OBSERVACOES')) {
      sections.observacoes = content.split('\n- ').filter(Boolean).map(e => e.replace(/^-\s*/, ''));
    }
  });
  
  return sections;
}

function PortalOverviewPremiumComponent({ 
  project, 
  stages, 
  deliverables = [],
  hasPaymentBlock,
  isManager = false,
  onEditBriefing,
  onGenerateAI,
}: PortalOverviewPremiumProps) {
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
    : 'Pré-produção';

  // Build display stages
  const displayStages = stages.length > 0 ? stages : DEFAULT_STAGES.map((d, i) => ({
    id: `default-${i}`,
    stage_key: d.key,
    title: d.title,
    status: currentStageKey === d.key ? 'in_progress' : 'not_started',
    order_index: i,
  }));

  // Parse description sections
  const briefingSections = parseDescription(project.description);

  return (
    <div className="space-y-10">
      {/* Top Stats Grid - 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
        <div className="bg-[#0a0a0a] p-6">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-4 h-4 text-gray-500" />
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
              Progresso
            </p>
          </div>
          <p className="text-2xl font-light text-white mb-1">{stageProgress}%</p>
          <p className="text-xs text-gray-500">{completedStages}/{totalStages} etapas</p>
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-gray-500" />
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
              Saúde
            </p>
          </div>
          <p className={cn(
            "text-2xl font-light",
            (project.health_score || 0) >= 80 ? "text-emerald-400" : 
            (project.health_score || 0) >= 50 ? "text-amber-400" : "text-red-400"
          )}>
            {project.health_score || 100}%
          </p>
          <p className="text-xs text-gray-500">
            {(project.health_score || 100) >= 80 ? 'Excelente' : 
             (project.health_score || 100) >= 50 ? 'Atenção' : 'Crítico'}
          </p>
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <div className="flex items-center gap-2 mb-3">
            <Film className="w-4 h-4 text-gray-500" />
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
              Etapa Atual
            </p>
          </div>
          <p className="text-xl font-light text-cyan-400">{currentStageName}</p>
          <p className="text-xs text-gray-500">Em Andamento</p>
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
              Valor Contrato
            </p>
          </div>
          <p className="text-2xl font-light text-white">{formatCurrency(project.contract_value || 0)}</p>
          <p className="text-xs text-gray-500">Investimento Total</p>
        </div>
      </div>

      {/* Briefing do Projeto - Main Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-light text-white mb-1">Briefing do Projeto</h2>
            <p className="text-xs text-gray-500">Descrição, escopo e objetivos principais.</p>
          </div>
          {isManager && (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onGenerateAI}
                className="text-cyan-400 hover:text-cyan-300 h-8 gap-2 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Gerar com IA
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onEditBriefing}
                className="text-gray-400 hover:text-white h-8 gap-2 text-xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </Button>
            </div>
          )}
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a]">
          {/* Resumo Executivo */}
          {briefingSections?.resumo && (
            <div className="p-6 border-b border-[#1a1a1a]">
              <h3 className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold border-l-2 border-cyan-400 pl-4 mb-4">
                Resumo Executivo
              </h3>
              <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
                {briefingSections.resumo.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {/* Escopo Detalhado */}
          {briefingSections?.escopo && (
            <div className="p-6 border-b border-[#1a1a1a]">
              <h3 className="text-sm font-medium text-white mb-4">Escopo Detalhado</h3>
              <div className="text-xs text-gray-500 leading-relaxed bg-[#050505] p-4 border-l-2 border-[#1a1a1a]">
                {briefingSections.escopo.split('\n').slice(0, 3).map((line, i) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Se não há sections parseadas, mostrar description original */}
          {!briefingSections?.resumo && project.description && (
            <div className="p-6">
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h2 className="text-lg font-light text-white mt-6 mb-3">{children}</h2>,
                    h2: ({ children }) => <h3 className="text-sm font-medium text-white mt-5 mb-2">{children}</h3>,
                    h3: ({ children }) => <h4 className="text-xs font-medium text-gray-300 mt-4 mb-2">{children}</h4>,
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
          )}
        </div>
      </div>

      {/* Entregas Contratadas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold border-l-2 border-cyan-400 pl-4">
            Entregas Contratadas
          </h2>
          <span className="text-xs text-gray-500">
            {deliverables.filter(d => d.status === 'approved').length}/{deliverables.length || briefingSections?.entregas?.length || 0} Concluídas
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
          {/* From deliverables or parsed entregas */}
          {(deliverables.length > 0 ? deliverables.slice(0, 6) : (briefingSections?.entregas || []).slice(0, 6)).map((item, i) => {
            const isDeliverable = typeof item === 'object';
            const title = isDeliverable ? (item as PortalDeliverable).title : (item as string).split('(')[0].trim();
            const isApproved = isDeliverable ? (item as PortalDeliverable).status === 'approved' : false;
            
            return (
              <div key={i} className="bg-[#0a0a0a] p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {isApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[9px] px-2 py-0.5 uppercase tracking-wider font-bold",
                    isApproved 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "border border-[#1a1a1a] text-gray-500"
                  )}>
                    {isApproved ? 'Entregue' : 'Pendente'}
                  </span>
                </div>
                
                <h3 className="text-sm font-medium text-white mb-2 line-clamp-2">
                  {title}
                </h3>
                
                <p className="text-[10px] text-gray-500">
                  Wide + Vert
                </p>
              </div>
            );
          })}
        </div>
        
        {((deliverables.length > 6) || ((briefingSections?.entregas?.length || 0) > 6)) && (
          <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
            + Ver todas as entregas
          </button>
        )}
      </div>

      {/* Timeline Forecast */}
      <div className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold border-l-2 border-cyan-400 pl-4">
          Timeline Forecast
        </h2>
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6">
          <div className="flex items-center justify-between mb-6">
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

      {/* Fluxo de Produção */}
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

      {/* Especificações Técnicas */}
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

      {/* Observações Adicionais */}
      {briefingSections?.observacoes && briefingSections.observacoes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold border-l-2 border-cyan-400 pl-4">
            Observações Adicionais
          </h2>
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6">
            <ul className="space-y-3">
              {briefingSections.observacoes.map((obs, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                  <span className="text-gray-600 mt-0.5">•</span>
                  {obs}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export const PortalOverviewPremium = memo(PortalOverviewPremiumComponent);
