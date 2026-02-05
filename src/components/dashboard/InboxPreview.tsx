import { ArrowRight, MessageSquare, Instagram, Mail, AlertTriangle } from "lucide-react";
import { conversations, getChannelLabel, getIntentLabel } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useState } from "react";

const channelIcons = {
  whatsapp: MessageSquare,
  instagram: Instagram,
  email: Mail,
};

const intentFilters = ["todos", "orcamento", "prazo", "objecao", "suporte", "cobranca"];

export function InboxPreview() {
  const [activeFilter, setActiveFilter] = useState("todos");

  const filteredConversations = activeFilter === "todos"
    ? conversations.slice(0, 10)
    : conversations.filter((c) => c.intent === activeFilter).slice(0, 10);

  return (
    <section className="card-flat">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-label">Inbox Unificada</h2>
        <button className="btn-subtle flex items-center gap-1">
          Abrir Inbox <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {intentFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              filter === activeFilter ? "chip-active" : "chip"
            )}
          >
            {filter === "todos" ? "Todos" : getIntentLabel(filter as any)}
          </button>
        ))}
      </div>

      {/* Conversations list */}
      <div className="space-y-2">
        {filteredConversations.map((conv) => {
          const ChannelIcon = channelIcons[conv.channel];
          return (
            <div
              key={conv.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-colors cursor-pointer",
                conv.unread && "bg-muted/20"
              )}
            >
              {/* Channel badge */}
              <div className="icon-box flex-shrink-0">
                <ChannelIcon className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground truncate">{conv.contactName}</span>
                  <span className="text-xs text-muted-foreground">• {conv.accountName}</span>
                  {conv.unread && (
                    <span className="w-2 h-2 rounded-full bg-info flex-shrink-0" />
                  )}
                </div>

                <p className="text-xs text-muted-foreground truncate mb-2">{conv.summary}</p>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge-subtle">{getIntentLabel(conv.intent)}</span>
                  {conv.needsHuman && (
                    <span className="badge-warning flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Precisa humano
                    </span>
                  )}
                </div>
              </div>

              {/* Next action */}
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Próxima ação</p>
                <p className="text-xs text-foreground">{conv.nextAction}</p>
              </div>
            </div>
          );
        })}
      </div>

      {filteredConversations.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma conversa com este filtro</p>
        </div>
      )}
    </section>
  );
}
