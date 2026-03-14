import { useState } from "react";
import { InboxThread, InboxMessage, InboxStatus } from "@/hooks/useInbox";
import { MessageComposer } from "./MessageComposer";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Instagram, MessageCircle, Mail, MoreVertical, UserPlus, CheckCircle, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThreadViewProps {
  thread: InboxThread;
  messages: InboxMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onUpdateStatus: (status: InboxStatus) => void;
  onAssign: (assignedTo: string | null) => void;
}

const channelIcons = {
  instagram: Instagram,
  whatsapp: MessageCircle,
  email: Mail,
};

const channelColors = {
  instagram: 'text-primary bg-primary/10',
  whatsapp: 'text-primary bg-primary/10',
  email: 'text-primary bg-primary/10',
};

const statusLabels: Record<InboxStatus, string> = {
  open: 'Aberto',
  pending: 'Pendente',
  closed: 'Fechado',
};

export function ThreadView({ 
  thread, 
  messages, 
  isLoading, 
  onSendMessage, 
  onUpdateStatus,
  onAssign 
}: ThreadViewProps) {
  const ChannelIcon = channelIcons[thread.channel];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {thread.contact_avatar_url ? (
            <img
              src={thread.contact_avatar_url}
              alt={thread.contact_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-semibold text-muted-foreground">
                {thread.contact_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold text-foreground">{thread.contact_name}</h3>
            <div className="flex items-center gap-2">
              <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs", channelColors[thread.channel])}>
                <ChannelIcon className="w-3 h-3" />
                <span className="capitalize">{thread.channel}</span>
              </div>
              {thread.contact_handle && (
                <span className="text-xs text-muted-foreground">{thread.contact_handle}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span className={cn(
            "px-3 py-1 rounded-full text-mono font-bold uppercase tracking-wider",
            thread.status === 'open' && "bg-primary/10 text-primary",
            thread.status === 'pending' && "bg-muted text-muted-foreground",
            thread.status === 'closed' && "bg-muted text-muted-foreground"
          )}>
            {statusLabels[thread.status]}
          </span>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUpdateStatus('open')}>
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Marcar como Aberto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus('pending')}>
                <Clock className="w-4 h-4 mr-2 text-amber-500" />
                Marcar como Pendente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus('closed')}>
                <X className="w-4 h-4 mr-2 text-muted-foreground" />
                Fechar Conversa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAssign(null)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Atribuir Responsável
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                <div className={cn(
                  "animate-pulse rounded-2xl bg-muted h-16 w-64"
                )} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.direction === 'out' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[70%] rounded-2xl px-4 py-3",
                message.direction === 'out' 
                  ? "bg-primary text-primary-foreground rounded-br-sm" 
                  : "bg-muted text-foreground rounded-bl-sm"
              )}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className={cn(
                  "text-mono mt-1",
                  message.direction === 'out' ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {format(new Date(message.sent_at), "HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <div className="p-4 border-t border-border">
        <MessageComposer 
          onSend={onSendMessage}
          disabled={thread.status === 'closed'}
          placeholder={thread.status === 'closed' ? 'Conversa fechada' : `Responder via ${thread.channel}...`}
        />
      </div>
    </div>
  );
}
