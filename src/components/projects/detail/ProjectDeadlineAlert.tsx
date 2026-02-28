import { AlertTriangle, Clock, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProjectIntelligence } from "@/hooks/useProjectIntelligence";

interface Props {
  intelligence: ProjectIntelligence;
  dueDate: string | null;
}

export function ProjectDeadlineAlert({ intelligence, dueDate }: Props) {
  if (!intelligence.deadlineAlert || !intelligence.predictedCompletionDate || !dueDate) return null;

  const isHighRisk = intelligence.daysOverDeadline > 14;
  const bgClass = isHighRisk ? "bg-destructive/10 border-destructive/30" : "bg-yellow-500/10 border-yellow-500/30";
  const textClass = isHighRisk ? "text-destructive" : "text-yellow-600";
  const Icon = isHighRisk ? AlertTriangle : Clock;

  return (
    <div className={`border p-4 flex items-start gap-3 ${bgClass}`}>
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${textClass}`} />
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-bold uppercase tracking-wider ${textClass}`}>
          {isHighRisk ? "⚠️ Risco Alto de Atraso" : "⏰ Alerta de Prazo"}
        </h3>
        <p className="text-sm text-foreground mt-1">
          Conclusão prevista em{" "}
          <strong>{format(intelligence.predictedCompletionDate, "dd/MM/yyyy", { locale: ptBR })}</strong>
          {" — "}prazo contratual em{" "}
          <strong>{format(new Date(dueDate), "dd/MM/yyyy", { locale: ptBR })}</strong>
          {" "}
          <span className={textClass}>({intelligence.daysOverDeadline} dias de atraso previsto)</span>
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Velocity atual: <strong>{intelligence.velocity}</strong>/dia
          </span>
          <span>
            Velocity necessária: <strong>{intelligence.velocityNeeded}</strong>/dia
          </span>
          <span>
            {intelligence.tasksPending} tarefas pendentes
          </span>
        </div>
      </div>
    </div>
  );
}
