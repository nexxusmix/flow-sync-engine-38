import { cn } from "@/lib/utils";
import { LucideIcon, CheckCircle, Info, AlertTriangle, Inbox, Calendar, FileText, Users, DollarSign, Zap, Activity } from "lucide-react";

type EmptyStateType = 'neutral' | 'info' | 'success' | 'warning';

interface EmptyStateProps {
  type?: EmptyStateType;
  icon?: LucideIcon | string;
  title: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

const typeConfig: Record<EmptyStateType, { iconClass: string; bgClass: string }> = {
  neutral: {
    iconClass: 'text-muted-foreground',
    bgClass: 'bg-muted/30',
  },
  info: {
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
  success: {
    iconClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
  },
  warning: {
    iconClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
  },
};

const defaultIcons: Record<EmptyStateType, LucideIcon> = {
  neutral: Inbox,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
};

export function EmptyState({ 
  type = 'neutral', 
  icon, 
  title, 
  description, 
  compact = false,
  className 
}: EmptyStateProps) {
  const config = typeConfig[type];
  const IconComponent = typeof icon === 'string' ? null : (icon || defaultIcons[type]);
  const isMaterialIcon = typeof icon === 'string';

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 py-4 px-4", className)}>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bgClass)}>
          {isMaterialIcon ? (
            <span className={cn("material-symbols-outlined text-base", config.iconClass)}>{icon}</span>
          ) : IconComponent && (
            <IconComponent className={cn("w-4 h-4", config.iconClass)} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          {description && (
            <p className="text-[10px] text-muted-foreground/70 truncate">{description}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-8 px-4",
      className
    )}>
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
        config.bgClass
      )}>
        {isMaterialIcon ? (
          <span className={cn("material-symbols-outlined text-2xl", config.iconClass)}>{icon}</span>
        ) : IconComponent && (
          <IconComponent className={cn("w-6 h-6", config.iconClass)} />
        )}
      </div>
      <p className="text-sm text-muted-foreground font-light">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-[280px]">{description}</p>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export const emptyStates = {
  noProjects: {
    type: 'neutral' as const,
    icon: Inbox,
    title: 'Nenhum projeto encontrado',
    description: 'Crie um novo projeto para começar',
  },
  noEvents: {
    type: 'success' as const,
    icon: Calendar,
    title: 'Nenhum evento nos próximos 30 dias',
    description: 'Pipeline limpo e sob controle',
  },
  noTasks: {
    type: 'success' as const,
    icon: CheckCircle,
    title: 'Todas as tarefas concluídas',
    description: 'Ótimo trabalho!',
  },
  noAlerts: {
    type: 'success' as const,
    icon: CheckCircle,
    title: 'Nenhum alerta crítico',
    description: 'Operação estável',
  },
  noDeliverables: {
    type: 'info' as const,
    icon: FileText,
    title: 'Nenhum entregável ainda',
    description: 'Entregas aparecerão aqui',
  },
  noClients: {
    type: 'neutral' as const,
    icon: Users,
    title: 'Nenhum cliente encontrado',
    description: 'Adicione clientes ao pipeline',
  },
  noPayments: {
    type: 'success' as const,
    icon: DollarSign,
    title: 'Nenhum pagamento pendente',
    description: 'Fluxo financeiro em dia',
  },
  noData: {
    type: 'neutral' as const,
    icon: Activity,
    title: 'Sem dados disponíveis',
    description: 'Dados aparecerão aqui quando disponíveis',
  },
  operationStable: {
    type: 'success' as const,
    icon: Zap,
    title: 'Operação estável',
    description: 'Todos os indicadores dentro do esperado',
  },
  pipelineClean: {
    type: 'success' as const,
    icon: CheckCircle,
    title: 'Pipeline limpo',
    description: 'Sem riscos detectados',
  },
  materialsNotReady: {
    type: 'info' as const,
    icon: FileText,
    title: 'Materiais ainda não liberados',
    description: 'Aguardando revisão interna',
  },
  dateToDefine: {
    type: 'neutral' as const,
    icon: Calendar,
    title: 'A definir',
  },
};
