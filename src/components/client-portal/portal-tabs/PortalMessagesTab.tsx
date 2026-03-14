/**
 * PortalMessagesTab - Central de mensagens e feedback do portal
 * Chat integrado com timeline de comunicação
 */

import { memo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Loader2, User, Building2,
  Paperclip, Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { PortalComment, PortalTimelineEvent } from "@/hooks/useClientPortalEnhanced";

interface PortalMessagesTabProps {
  comments: PortalComment[];
  timelineEvents: PortalTimelineEvent[];
  onSendMessage?: (data: { authorName: string; content: string }) => void;
  isSending?: boolean;
}

interface MessageItem {
  id: string;
  type: "comment" | "event";
  content: string;
  author: string;
  authorRole: string | null;
  created_at: string;
}

function PortalMessagesTabComponent({
  comments,
  timelineEvents,
  onSendMessage,
  isSending = false,
}: PortalMessagesTabProps) {
  const [message, setMessage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build unified message timeline
  const messages: MessageItem[] = [
    ...comments.map(c => ({
      id: c.id,
      type: "comment" as const,
      content: c.content,
      author: c.author_name,
      authorRole: c.author_role,
      created_at: c.created_at,
    })),
    ...timelineEvents
      .filter(e => e.event_type === "chat_message" || e.event_type === "update")
      .map(e => ({
        id: e.id,
        type: "event" as const,
        content: e.description || e.title,
        author: e.actor_name || "Sistema",
        authorRole: e.actor_type,
        created_at: e.created_at,
      })),
  ].sort((a, b) => a.created_at.localeCompare(b.created_at));

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!message.trim() || !authorName.trim() || !onSendMessage) return;
    onSendMessage({ authorName, content: message });
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && message.trim() && authorName.trim()) {
      e.preventDefault();
      handleSend();
    }
  };

  const isClient = (role: string | null) => role === "client" || !role;

  return (
    <div className="space-y-4">
      {/* Messages area */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {messages.length > 0 ? (
          <ScrollArea className="h-[500px]" ref={scrollRef as any}>
            <div className="p-4 space-y-4">
              {messages.map((msg) => {
                const fromClient = isClient(msg.authorRole);
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-3", fromClient ? "flex-row-reverse" : "")}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      fromClient ? "bg-primary/15" : "bg-muted"
                    )}>
                      {fromClient ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[75%] rounded-xl p-3 space-y-1",
                      fromClient
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-muted/50 border border-border"
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{msg.author}</span>
                        {msg.authorRole && (
                          <Badge variant="outline" className="text-[8px] py-0 h-4">
                            {msg.authorRole === "client" ? "Cliente" : "Equipe"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground/90">{msg.content}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Mensagens</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Converse com a equipe sobre o projeto. Suas mensagens e feedbacks aparecerão aqui.
            </p>
          </div>
        )}

        {/* Message input */}
        {onSendMessage && (
          <div className="border-t border-border p-3 space-y-2">
            <AnimatePresence>
              {showNameInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input
                    placeholder="Seu nome *"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="text-sm h-9"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Escrever mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={() => setShowNameInput(true)}
                onKeyDown={handleKeyDown}
                className="flex-1 text-sm h-10"
              />
              <Button
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={handleSend}
                disabled={isSending || !message.trim() || !authorName.trim()}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const PortalMessagesTab = memo(PortalMessagesTabComponent);
