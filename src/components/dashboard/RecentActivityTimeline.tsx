import { FileText, FileSignature, Wallet, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "proposal_sent" | "contract_signed" | "payment_received" | "deal_closed";
  title: string;
  description: string;
  timestamp: string;
}

const mockActivities: Activity[] = [
  {
    id: "1",
    type: "payment_received",
    title: "Pagamento recebido",
    description: "Incorporadora Vista Mar - R$ 8.000,00",
    timestamp: "2h",
  },
  {
    id: "2",
    type: "contract_signed",
    title: "Contrato assinado",
    description: "Restaurante Sabor & Arte",
    timestamp: "5h",
  },
  {
    id: "3",
    type: "proposal_sent",
    title: "Proposta enviada",
    description: "Clínica Estética Premium",
    timestamp: "1d",
  },
  {
    id: "4",
    type: "deal_closed",
    title: "Negócio fechado",
    description: "Arquiteto João Silva",
    timestamp: "1d",
  },
];

const typeConfig = {
  proposal_sent: {
    icon: FileText,
    color: "text-info",
  },
  contract_signed: {
    icon: FileSignature,
    color: "text-foreground",
  },
  payment_received: {
    icon: Wallet,
    color: "text-success",
  },
  deal_closed: {
    icon: CheckCircle,
    color: "text-success",
  },
};

export function RecentActivityTimeline() {
  return (
    <div className="bento-card h-full">
      <h3 className="font-medium mb-5">Atividade Recente</h3>
      
      <div className="space-y-4">
        {mockActivities.map((activity, index) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;
          const isLast = index === mockActivities.length - 1;
          
          return (
            <div key={activity.id} className="flex gap-3 group cursor-pointer">
              <div className="flex flex-col items-center">
                <div className="p-1.5 rounded-lg bg-secondary">
                  <Icon className={cn("h-3.5 w-3.5", config.color)} />
                </div>
                {!isLast && (
                  <div className="w-px h-full bg-border flex-1 my-1.5" />
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">
                    {activity.title}
                  </p>
                  <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activity.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
