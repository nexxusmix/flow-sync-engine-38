import { AlertCircle, Clock, FileText, Wallet, ArrowUpRight } from "lucide-react";
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
  },
  contract: {
    icon: Clock,
    color: "text-info",
  },
  payment: {
    icon: Wallet,
    color: "text-destructive",
  },
};

export function UrgentActionsList() {
  return (
    <div className="polo-card h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-warning" />
          <span className="polo-label">Ações Urgentes</span>
        </div>
        <span className="text-xs text-muted-foreground">{mockActions.length} pendentes</span>
      </div>
      
      <div className="space-y-2">
        {mockActions.map((action) => {
          const config = typeConfig[action.type];
          const Icon = config.icon;
          
          return (
            <div
              key={action.id}
              className="group flex items-start gap-3 p-3 rounded-xl bg-secondary/50 border border-transparent hover:border-border transition-colors cursor-pointer"
            >
              <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.color)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{action.title}</p>
                <p className="text-xs text-muted-foreground truncate">{action.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {action.daysOverdue && (
                  <span className={cn(
                    "text-xs font-medium",
                    action.daysOverdue > 5 ? "text-destructive" : "text-warning"
                  )}>
                    {action.daysOverdue}d
                  </span>
                )}
                {action.amount && (
                  <span className="text-xs font-medium">{action.amount}</span>
                )}
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          );
        })}
      </div>
      
      {mockActions.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <p className="text-sm text-muted-foreground">Nenhuma ação urgente 🎉</p>
        </div>
      )}
    </div>
  );
}
