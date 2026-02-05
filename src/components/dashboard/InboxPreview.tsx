import { conversations, getIntentLabel } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useState } from "react";

const channelIcons: Record<string, string> = {
  whatsapp: "chat",
  instagram: "photo_camera",
  email: "mail",
};

const intentFilters = ["todos", "orcamento", "prazo", "objecao", "suporte", "cobranca"];

export function InboxPreview() {
  const [activeFilter, setActiveFilter] = useState("todos");

  const filteredConversations = activeFilter === "todos"
    ? conversations.slice(0, 8)
    : conversations.filter((c) => c.intent === activeFilter).slice(0, 8);

  return (
    <section className="glass-card p-10 rounded-[3rem]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-label">Inbox Unificada</h2>
        <button className="btn-subtle flex items-center gap-2">
          Abrir Inbox <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {intentFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(filter === activeFilter ? "chip-active" : "chip")}
          >
            {filter === "todos" ? "Todos" : getIntentLabel(filter as any)}
          </button>
        ))}
      </div>

      {/* Conversations list */}
      <div className="space-y-3">
        {filteredConversations.map((conv) => (
          <div
            key={conv.id}
            className={cn(
              "flex items-start gap-4 p-5 rounded-2xl border border-white/5 hover:border-primary/20 hover:bg-white/5 transition-all cursor-pointer",
              conv.unread && "bg-white/5"
            )}
          >
            <div className="icon-box flex-shrink-0">
              <span className="material-symbols-outlined text-muted-foreground">{channelIcons[conv.channel]}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-foreground truncate">{conv.contactName}</span>
                <span className="text-[10px] text-muted-foreground">• {conv.accountName}</span>
                {conv.unread && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate mb-2">{conv.summary}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge-info">{getIntentLabel(conv.intent)}</span>
                {conv.needsHuman && (
                  <span className="badge-warning flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">person</span>
                    Precisa humano
                  </span>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1 font-black">Próxima ação</p>
              <p className="text-xs text-foreground font-medium">{conv.nextAction}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
