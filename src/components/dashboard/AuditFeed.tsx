import { FileText, FileSignature, Wallet, Package, FolderKanban, Bell } from "lucide-react";
import { events } from "@/data/mockData";
import { cn } from "@/lib/utils";

const actionIcons: Record<string, any> = {
  "Proposta enviada": FileText,
  "Contrato assinado": FileSignature,
  "Pagamento confirmado": Wallet,
  "Cobrança D+5 enviada": Wallet,
  "Cobrança D+7 enviada": Wallet,
  "Lembrete D-3 enviado": Bell,
  "Follow up realizado": FileText,
  "Entrega pronta": Package,
  "Revisão solicitada": FolderKanban,
  "Lead qualificado": FileText,
  "Gravação concluída": FolderKanban,
  "Deal movido": FileText,
  "Briefing incompleto": FolderKanban,
  "Proposta aceita": FileText,
  "Call realizada": FileText,
};

export function AuditFeed() {
  return (
    <section className="card-flat">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-foreground">Feed de Atividades</h2>
        <span className="text-xs text-muted-foreground">{events.length} eventos</span>
      </div>

      <div className="space-y-0 max-h-[400px] overflow-y-auto pr-2">
        {events.slice(0, 15).map((event, index) => {
          const Icon = actionIcons[event.action] || Bell;
          const time = new Date(event.timestamp);
          const timeStr = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const dateStr = time.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

          return (
            <div
              key={event.id}
              className={cn(
                "flex gap-3 py-3 border-b border-border last:border-0 hover:bg-muted/20 -mx-2 px-2 rounded cursor-pointer transition-colors"
              )}
            >
              <div className="flex flex-col items-center">
                <div className="icon-box flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                {index < events.length - 1 && (
                  <div className="w-px flex-1 bg-border mt-2" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-foreground">{event.action}</span>
                  <span className="text-xs text-muted-foreground">• {event.actor}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{event.entityName}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">{timeStr}</p>
                <p className="text-[10px] text-muted-foreground">{dateStr}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
