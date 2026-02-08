/**
 * ReportMetricsBar - Top metrics bar in report style
 * Matches the 4-column layout from the HTML template
 */

import { cn } from "@/lib/utils";

interface MetricItem {
  label: string;
  value: string;
  subtext?: string;
  className?: string;
}

interface ReportMetricsBarProps {
  progress: number;
  totalStages: number;
  completedStages: number;
  healthScore: number;
  currentStage: string;
  contractValue: number;
}

export function ReportMetricsBar({
  progress,
  totalStages,
  completedStages,
  healthScore,
  currentStage,
  contractValue,
}: ReportMetricsBarProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getHealthLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 70) return 'Bom';
    if (score >= 50) return 'Atenção';
    return 'Crítico';
  };

  const metrics: MetricItem[] = [
    {
      label: 'Progresso Geral',
      value: `${progress}%`,
      subtext: `${completedStages} / ${totalStages} Etapas`,
    },
    {
      label: 'Saúde do Projeto',
      value: `${healthScore}%`,
      subtext: getHealthLabel(healthScore),
      className: healthScore >= 90 ? 'text-emerald-500' : healthScore >= 70 ? 'text-amber-500' : 'text-destructive',
    },
    {
      label: 'Etapa Atual',
      value: currentStage,
      subtext: '',
    },
    {
      label: 'Valor Total',
      value: formatCurrency(contractValue),
      subtext: 'Investimento Total',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => (
        <div 
          key={idx} 
          className="bg-card border border-border p-6 transition-all hover:border-primary/20"
        >
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
            {metric.label}
          </span>
          <p className={cn(
            "text-2xl font-bold text-foreground truncate",
            metric.className
          )}>
            {metric.value}
          </p>
          {metric.subtext && (
            <span className="text-xs text-muted-foreground">
              {metric.subtext}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
