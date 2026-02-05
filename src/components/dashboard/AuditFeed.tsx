import { events } from "@/data/mockData";
import { motion } from "framer-motion";

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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export function AuditFeed() {
  return (
    <motion.section 
      className="glass-card p-10 rounded-[3rem]"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-normal uppercase tracking-tighter text-foreground">Feed <span className="squad-logo-text font-light text-muted-foreground">Auditável</span></h2>
        <motion.span 
          className="text-[10px] text-muted-foreground font-light uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {events.length} eventos
        </motion.span>
      </div>

      <motion.div 
        className="space-y-0 max-h-[400px] overflow-y-auto pr-2"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {events.slice(0, 12).map((event, index) => {
          const icon = actionIcons[event.action] || "notifications";
          const time = new Date(event.timestamp);
          const timeStr = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          return (
            <motion.div 
              key={event.id} 
              variants={item}
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
                  <span className="text-[10px] text-muted-foreground">• {event.actor}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{event.description}</p>
              </div>
              <span className="text-[10px] text-muted-foreground font-normal">{timeStr}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}
