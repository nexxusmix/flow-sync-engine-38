/**
 * PortalMetricsGrid - Grid de métricas com animações impactantes
 * 3D hover, counters animados, glow effects
 */

import { memo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AnimatedCounter, Card3D, GlowCard } from "./animations";
import type { ProjectInfo } from "@/hooks/useClientPortalEnhanced";

interface PortalMetricsGridProps {
  project: ProjectInfo;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9, rotateX: -15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    rotateX: 0,
    transition: { 
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

function PortalMetricsGridComponent({ project }: PortalMetricsGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
  const contractValue = project.contract_value || 0;

  const metrics = [
    {
      label: 'Valor do Contrato',
      value: contractValue,
      displayValue: formatCurrency(contractValue),
      subtitle: 'Pagamento: 50% concluído',
      color: 'text-white',
      glowColor: 'rgba(255, 255, 255, 0.1)',
      isCounter: true,
      prefix: 'R$ ',
      formatAsCurrency: true,
    },
    {
      label: 'Saúde do Projeto',
      value: healthScore,
      displayValue: `${healthScore}%`,
      subtitle: healthLabel,
      color: healthScore >= 80 ? "text-primary" : healthScore >= 50 ? "text-muted-foreground" : "text-destructive",
      glowColor: healthScore >= 80 ? "rgba(0, 156, 202, 0.3)" : healthScore >= 50 ? "rgba(128, 128, 128, 0.3)" : "rgba(239, 68, 68, 0.3)",
      isCounter: true,
      suffix: '%',
    },
    {
      label: 'Previsão Entrega',
      value: 0,
      displayValue: project.due_date ? formatDate(project.due_date) : '—',
      subtitle: project.due_date ? 'Previsão inicial' : 'Cronograma em definição',
      color: 'text-white',
      glowColor: 'rgba(6, 182, 212, 0.2)',
      isCounter: false,
    },
    {
      label: 'Responsável',
      value: 0,
      displayValue: project.owner_name || 'Não definido',
      subtitle: 'Squad Film Direct',
      color: 'text-primary',
      glowColor: 'rgba(6, 182, 212, 0.3)',
      isCounter: false,
      isSmallValue: true,
    },
  ];

  return (
    <motion.div 
      ref={ref}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          variants={itemVariants}
          className="group"
        >
          <Card3D intensity={8}>
            <GlowCard glowColor={metric.glowColor}>
              <motion.div
                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 min-h-[140px] relative overflow-hidden transition-colors duration-300 group-hover:border-primary/30"
                whileHover={{ 
                  backgroundColor: 'rgba(6, 182, 212, 0.03)',
                }}
              >
                {/* Animated Background Gradient */}
                <motion.div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 120%, ${metric.glowColor}, transparent 70%)`,
                  }}
                />
                
                {/* Content */}
                <div className="relative z-10">
                  <motion.p 
                    className="text-mono uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                  >
                    {metric.label}
                  </motion.p>
                  
                  <motion.div 
                    className={cn(
                      "font-light transition-transform duration-300 group-hover:scale-105",
                      metric.isSmallValue ? "text-lg" : "text-2xl lg:text-3xl",
                      metric.color
                    )}
                  >
                    {metric.isCounter && metric.value > 0 ? (
                      <AnimatedCounter 
                        value={metric.value} 
                        prefix={metric.prefix} 
                        suffix={metric.suffix}
                        duration={1.5}
                        formatAsCurrency={metric.formatAsCurrency}
                      />
                    ) : (
                      <span>{metric.displayValue}</span>
                    )}
                  </motion.div>
                  
                  <motion.p 
                    className="text-xs text-muted-foreground mt-2 opacity-70 group-hover:opacity-100 transition-opacity"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 0.7 } : {}}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    {metric.subtitle}
                  </motion.p>
                </div>
                
                {/* Corner Accent */}
                <motion.div 
                  className="absolute top-0 right-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(135deg, transparent 50%, ${metric.glowColor} 50%)`,
                  }}
                />
              </motion.div>
            </GlowCard>
          </Card3D>
        </motion.div>
      ))}
    </motion.div>
  );
}

export const PortalMetricsGrid = memo(PortalMetricsGridComponent);
