import { conversations, getIntentLabel } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";

const channelIcons: Record<string, string> = {
  whatsapp: "chat",
  instagram: "photo_camera",
  email: "mail",
};

const intentFilters = ["todos", "orcamento", "prazo", "objecao", "suporte", "cobranca"];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function InboxPreview() {
  const [activeFilter, setActiveFilter] = useState("todos");

  const filteredConversations = activeFilter === "todos"
    ? conversations.slice(0, 8)
    : conversations.filter((c) => c.intent === activeFilter).slice(0, 8);

  return (
    <motion.section 
      className="glass-card p-10 rounded-[3rem]"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-label">Inbox Unificada</h2>
        <motion.button 
          className="btn-subtle flex items-center gap-2"
          whileHover={{ x: 4, color: "hsl(var(--primary))" }}
          whileTap={{ scale: 0.95 }}
        >
          Abrir Inbox <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </motion.button>
      </div>

      {/* Filter chips */}
      <motion.div 
        className="flex gap-2 mb-6 flex-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {intentFilters.map((filter, index) => (
          <motion.button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(filter === activeFilter ? "chip-active" : "chip")}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {filter === "todos" ? "Todos" : getIntentLabel(filter as any)}
          </motion.button>
        ))}
      </motion.div>

      {/* Conversations list */}
      <motion.div 
        className="space-y-3"
        variants={container}
        initial="hidden"
        animate="show"
        key={activeFilter}
      >
        {filteredConversations.map((conv, index) => (
          <motion.div
            key={conv.id}
            variants={itemVariant}
            whileHover={{ 
              scale: 1.01, 
              borderColor: "rgba(0, 163, 211, 0.3)",
              backgroundColor: "rgba(255,255,255,0.05)",
              x: 4,
            }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "flex items-start gap-4 p-5 rounded-2xl border border-white/5 cursor-pointer transition-colors",
              conv.unread && "bg-white/5"
            )}
          >
            <motion.div 
              className="icon-box flex-shrink-0"
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            >
              <span className="material-symbols-outlined text-muted-foreground">{channelIcons[conv.channel]}</span>
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-normal text-foreground truncate">{conv.contactName}</span>
                <span className="text-[10px] text-muted-foreground">• {conv.accountName}</span>
                {conv.unread && (
                  <motion.span 
                    className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mb-2">{conv.summary}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <motion.span className="badge-info" whileHover={{ scale: 1.05 }}>
                  {getIntentLabel(conv.intent)}
                </motion.span>
                {conv.needsHuman && (
                  <motion.span 
                    className="badge-warning flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="material-symbols-outlined text-xs">person</span>
                    Precisa humano
                  </motion.span>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1 font-normal">Próxima ação</p>
              <p className="text-xs text-foreground font-normal">{conv.nextAction}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
