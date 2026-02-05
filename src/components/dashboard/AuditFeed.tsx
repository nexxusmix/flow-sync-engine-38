import { events } from "@/data/mockData";

const actionIcons: Record<string, string> = {
  "Proposta enviada": "description",
  "Contrato assinado": "contract",
  "Pagamento confirmado": "payments",
  "Cobrança D+5 enviada": "send",
  "Follow up realizado": "call",
  "Entrega pronta": "check_circle",
  "Revisão solicitada": "edit",
  "Lead qualificado": "person_add",
  "Deal movido": "swap_horiz",
};

export function AuditFeed() {
  return (
    <section className="glass-card p-10 rounded-[3rem]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-normal uppercase tracking-tighter text-foreground">Feed <span className="squad-logo-text font-light text-muted-foreground">Auditável</span></h2>
        <span className="text-[10px] text-muted-foreground font-light uppercase tracking-widest">{events.length} eventos</span>
      </div>

      <div className="space-y-0 max-h-[400px] overflow-y-auto pr-2">
        {events.slice(0, 12).map((event, index) => {
          const icon = actionIcons[event.action] || "notifications";
          const time = new Date(event.timestamp);
          const timeStr = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={event.id} className="flex gap-4 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 -mx-4 px-4 rounded-xl cursor-pointer transition-colors">
              <div className="icon-box flex-shrink-0">
                <span className="material-symbols-outlined text-muted-foreground text-lg">{icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-normal text-foreground">{event.action}</span>
                  <span className="text-[10px] text-muted-foreground">• {event.actor}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{event.description}</p>
              </div>
              <span className="text-[10px] text-muted-foreground font-normal">{timeStr}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
