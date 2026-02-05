import { AlertCircle, Clock, FileText, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrgentAction {
  id: string;
  type: "proposal" | "contract" | "payment";
  title: string;
  description: string;
  daysOverdue?: number;
  amount?: string;
}

const mockActions: UrgentAction[] = [
  {
    id: "1",
    type: "proposal",
    title: "Proposta sem resposta",
    description: "Incorporadora Vista Mar - Filme Institucional",
    daysOverdue: 5,
  },
  {
    id: "2",
    type: "contract",
    title: "Contrato aguardando assinatura",
    description: "Restaurante Sabor & Arte - Pacote Reels",
    daysOverdue: 3,
  },
  {
    id: "3",
    type: "payment",
    title: "Cobrança atrasada",
    description: "Clínica Estética Premium - Parcela 2/3",
    amount: "R$ 4.500,00",
    daysOverdue: 7,
  },
];

const typeConfig = {
  proposal: {
    icon: FileText,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  contract: {
    icon: Clock,
    color: "text-info",
    bg: "bg-info/10",
  },
  payment: {
    icon: Wallet,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
};

export function UrgentActionsList() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 card-shadow">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="h-5 w-5 text-warning" />
        <h3 className="font-semibold text-card-foreground">Ações Urgentes</h3>
      </div>
      
      <div className="space-y-3">
        {mockActions.map((action) => {
          const config = typeConfig[action.type];
          const Icon = config.icon;
          
          return (
            <div
              key={action.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            >
              <div className={cn("rounded-lg p-2", config.bg)}>
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground">
                  {action.title}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {action.description}
                </p>
              </div>
              <div className="text-right">
                {action.daysOverdue && (
                  <span className={cn(
                    "text-xs font-medium",
                    action.daysOverdue > 5 ? "text-destructive" : "text-warning"
                  )}>
                    {action.daysOverdue}d atrás
                  </span>
                )}
                {action.amount && (
                  <p className="text-sm font-medium text-card-foreground">
                    {action.amount}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {mockActions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma ação urgente no momento 🎉
        </p>
      )}
    </div>
  );
}
