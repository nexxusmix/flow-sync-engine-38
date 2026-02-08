/**
 * PortalMetricsGrid - Grid de métricas 4 colunas
 * Estilo exato do HTML de referência
 */

import { memo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ProjectInfo } from "@/hooks/useClientPortalEnhanced";

interface PortalMetricsGridProps {
  project: ProjectInfo;
}

function PortalMetricsGridComponent({ project }: PortalMetricsGridProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd MMM yyyy", { locale: ptBR });
    } catch {
      return "—";
    }
  };

  const healthScore = project.health_score || 100;
  const healthLabel = healthScore >= 80 ? 'Excelente' : healthScore >= 50 ? 'Atenção' : 'Crítico';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
      {/* Valor do Contrato */}
      <div className="bg-[#0a0a0a] p-5">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
          Valor do Contrato
        </p>
        <p className="text-xl font-semibold text-white">
          {formatCurrency(project.contract_value || 0)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Pagamento: 50% concluído
        </p>
      </div>

      {/* Saúde do Projeto */}
      <div className="bg-[#0a0a0a] p-5">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
          Saúde do Projeto
        </p>
        <p className={cn(
          "text-xl font-semibold",
          healthScore >= 80 ? "text-emerald-400" : 
          healthScore >= 50 ? "text-amber-400" : "text-red-400"
        )}>
          {healthScore}%
        </p>
        <p className="text-xs text-gray-500 mt-1">{healthLabel}</p>
      </div>

      {/* Previsão de Entrega */}
      <div className="bg-[#0a0a0a] p-5">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
          Previsão Entrega
        </p>
        <p className="text-xl font-semibold text-white">
          {project.due_date ? formatDate(project.due_date) : '—'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {project.due_date ? 'Previsão inicial' : 'Cronograma em definição'}
        </p>
      </div>

      {/* Responsável */}
      <div className="bg-[#0a0a0a] p-5">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
          Responsável
        </p>
        <p className="text-lg font-medium text-cyan-400">
          {project.owner_name || 'Não definido'}
        </p>
        <p className="text-xs text-gray-500 mt-1">Squad Film Direct</p>
      </div>
    </div>
  );
}

export const PortalMetricsGrid = memo(PortalMetricsGridComponent);
