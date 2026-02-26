import { motion } from "framer-motion";
import { ScrollText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  description: string;
}

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
  // Empty state - no events yet
  const events: AuditEvent[] = [];

  return (
    <motion.section 
      className="glass-card p-10 rounded-[3rem]"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-normal uppercase tracking-tighter text-foreground">
          Feed <span className="squad-logo-text font-light text-muted-foreground">Auditável</span>
        </h2>
        <motion.span 
          className="text-mono text-muted-foreground font-light uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {events.length} eventos
        </motion.span>
      </div>

      {events.length > 0 ? (
        <motion.div className="space-y-0 max-h-[400px] overflow-y-auto pr-2">
          {events.map((event) => {
            const icon = actionIcons[event.action] || "notifications";
            const time = new Date(event.timestamp);
            const timeStr = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            return (
              <motion.div 
                key={event.id} 
                whileHover={{ 
                  backgroundColor: "rgba(255,255,255,0.05)", 
                  x: 8,
                  transition: { duration: 0.2 }
                }}
                className="flex gap-4 py-4 border-b border-white/5 last:border-0 -mx-4 px-4 rounded-xl cursor-pointer"
              >
                <motion.div 
                  className="icon-box flex-shrink-0"
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                >
                  <span className="material-symbols-outlined text-muted-foreground text-lg">{icon}</span>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-normal text-foreground">{event.action}</span>
                    <span className="text-mono text-muted-foreground">• {event.actor}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                </div>
                <span className="text-mono text-muted-foreground font-normal">{timeStr}</span>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <ScrollText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-normal text-foreground mb-2">Nenhuma atividade registrada</h3>
          <p className="text-xs text-muted-foreground max-w-xs mb-4">
            As ações do sistema aparecerão aqui conforme você usar a plataforma.
          </p>
        </div>
      )}
    </motion.section>
  );
}
