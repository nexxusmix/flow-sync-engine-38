import { Card } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign, Heart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProjectIntelligence } from "@/hooks/useProjectIntelligence";

interface Props {
  intelligence: ProjectIntelligence;
}

function getRiskColor(value: number) {
  if (value <= 25) return "text-primary";
  if (value <= 50) return "text-muted-foreground";
  if (value <= 75) return "text-muted-foreground";
  return "text-destructive";
}

function getRiskBg(value: number) {
  if (value <= 25) return "bg-primary/10";
  if (value <= 50) return "bg-muted";
  if (value <= 75) return "bg-muted";
  return "bg-destructive/10";
}

function getHealthColor(value: number) {
  if (value >= 75) return "text-primary";
  if (value >= 50) return "text-muted-foreground";
  if (value >= 25) return "text-muted-foreground";
  return "text-destructive";
}

function getHealthBg(value: number) {
  if (value >= 75) return "bg-primary/10";
  if (value >= 50) return "bg-muted";
  if (value >= 25) return "bg-muted";
  return "bg-destructive/10";
}

interface Props {
  intelligence: ProjectIntelligence;
}

export function ProjectIntelligenceBlock({ intelligence }: Props) {
  const riskStyle = sc.risk(intelligence.delayRisk);
  const healthStyle = sc.score(intelligence.clientHealth);

  const cards = [
    {
      label: "Risco de Atraso",
      value: `${intelligence.delayRisk}%`,
      icon: TrendingUp,
      colorClass: riskStyle.text,
      bgClass: riskStyle.bg,
      sub: `Velocity: ${intelligence.velocity}/dia`,
    },
    {
      label: "Previsão Conclusão",
      value: intelligence.predictedCompletionDate
        ? format(intelligence.predictedCompletionDate, "dd MMM yyyy", { locale: ptBR })
        : "—",
      icon: Calendar,
      colorClass: intelligence.deadlineAlert ? sc.status("overdue").text : sc.status("active").text,
      bgClass: intelligence.deadlineAlert ? sc.status("overdue").bg : sc.status("active").bg,
      sub: `${intelligence.tasksPending} pendentes · ${intelligence.tasksCompleted} concluídas`,
    },
    {
      label: "ROI do Projeto",
      value: intelligence.roi
        ? `R$ ${intelligence.roi.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}/h`
        : "—",
      icon: DollarSign,
      colorClass: sc.financial("revenue").text,
      bgClass: sc.financial("revenue").bg,
      sub: `${intelligence.financialStatus.percentPaid}% pago · R$ ${(intelligence.financialStatus.totalOverdue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })} vencido`,
    },
    {
      label: "Saúde do Cliente",
      value: `${intelligence.clientHealth}/100`,
      icon: Heart,
      colorClass: healthStyle.text,
      bgClass: healthStyle.bg,
      sub: intelligence.clientHealth >= 75 ? "Saudável" : intelligence.clientHealth >= 50 ? "Atenção" : "Em risco",
    },
  ];

  return (
    <div className="space-y-3">
      <span className="text-primary text-mono uppercase tracking-[0.4em] font-bold text-xs block">
        🧠 Inteligência do Projeto
      </span>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <Card key={card.label} className="glass-card p-4 border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${card.bgClass} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.colorClass}`} />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {card.label}
              </span>
            </div>
            <p className={`text-xl font-bold ${card.colorClass}`}>{card.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{card.sub}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
