/**
 * PortalMetricsGrid - Grid de métricas 4 colunas com animações
 * Stagger animation nos cards
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ProjectInfo } from "@/hooks/useClientPortalEnhanced";

interface PortalMetricsGridProps {
  project: ProjectInfo;
}

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3 },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.2,
    },
  },
};

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

  const metrics = [
    {
      label: 'Valor do Contrato',
      value: formatCurrency(project.contract_value || 0),
      subtitle: 'Pagamento: 50% concluído',
      className: 'text-white',
    },
    {
      label: 'Saúde do Projeto',
      value: `${healthScore}%`,
      subtitle: healthLabel,
      className: healthScore >= 80 ? "text-emerald-400" : healthScore >= 50 ? "text-amber-400" : "text-red-400",
    },
    {
      label: 'Previsão Entrega',
      value: project.due_date ? formatDate(project.due_date) : '—',
      subtitle: project.due_date ? 'Previsão inicial' : 'Cronograma em definição',
      className: 'text-white',
    },
    {
      label: 'Responsável',
      value: project.owner_name || 'Não definido',
      subtitle: 'Squad Film Direct',
      className: 'text-cyan-400 text-lg',
      isSmallValue: true,
    },
  ];

  return (
    <motion.div 
      className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a]"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          variants={cardVariants}
          whileHover={{ 
            backgroundColor: 'rgba(6, 182, 212, 0.03)',
            transition: { duration: 0.2 },
          }}
          className="bg-[#0a0a0a] p-5 transition-colors"
        >
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
            {metric.label}
          </p>
          <p className={cn(
            "font-medium",
            metric.isSmallValue ? "text-lg" : "text-xl",
            metric.className
          )}>
            {metric.value}
          </p>
          <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

export const PortalMetricsGrid = memo(PortalMetricsGridComponent);
