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
    timestamp: "Há 2 horas",
  },
  {
    id: "2",
    type: "contract_signed",
    title: "Contrato assinado",
    description: "Restaurante Sabor & Arte - Pacote Reels",
    timestamp: "Há 5 horas",
  },
  {
    id: "3",
    type: "proposal_sent",
    title: "Proposta enviada",
    description: "Clínica Estética Premium - Filme Institucional",
    timestamp: "Ontem às 15:30",
  },
  {
    id: "4",
    type: "deal_closed",
    title: "Negócio fechado",
    description: "Arquiteto João Silva - Tour 360°",
    timestamp: "Ontem às 10:15",
  },
];

const typeConfig = {
  proposal_sent: {
    icon: FileText,
    color: "text-info",
    bg: "bg-info/20",
  },
  contract_signed: {
    icon: FileSignature,
    color: "text-primary",
    bg: "bg-primary/20",
  },
  payment_received: {
    icon: Wallet,
    color: "text-success",
    bg: "bg-success/20",
  },
  deal_closed: {
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success/20",
  },
};

export function RecentActivityTimeline() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 card-shadow">
      <h3 className="font-semibold text-card-foreground mb-4">Atividade Recente</h3>
      
      <div className="space-y-4">
        {mockActivities.map((activity, index) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;
          const isLast = index === mockActivities.length - 1;
          
          return (
            <div key={activity.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn("rounded-full p-2", config.bg)}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                {!isLast && (
                  <div className="w-px h-full bg-border flex-1 my-2" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm font-medium text-card-foreground">
                  {activity.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
