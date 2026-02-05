import { useState } from "react";
import { motion } from "framer-motion";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  accountName: string;
  channel: 'whatsapp' | 'instagram' | 'email';
  intent: string;
  needsHuman: boolean;
  summary: string;
  nextAction: string;
  lastMessage: string;
  unread: boolean;
  createdAt: string;
}

const intentLabels: Record<string, string> = {
  orcamento: "Orçamento",
  prazo: "Prazo",
  objecao: "Objeção",
  suporte: "Suporte",
  cobranca: "Cobrança",
  geral: "Geral",
};

export function InboxPreview() {
  // Empty state - no conversations
  const conversations: Conversation[] = [];

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

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <Inbox className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-lg font-normal text-foreground mb-2">Inbox vazia</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Suas conversas com clientes via WhatsApp, Instagram e Email aparecerão aqui.
        </p>
        <p className="text-xs text-muted-foreground/70">
          Configure as integrações em Configurações → Integrações
        </p>
      </div>
    </motion.section>
  );
}
