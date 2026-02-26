import { InboxThread, InboxStatus } from "@/hooks/useInbox";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Instagram, MessageCircle, Mail, Inbox } from "lucide-react";

interface ThreadListProps {
  threads: InboxThread[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  isLoading: boolean;
}

const channelIcons = {
  instagram: Instagram,
  whatsapp: MessageCircle,
  email: Mail,
};

const channelColors = {
  instagram: 'text-pink-500',
  whatsapp: 'text-green-500',
  email: 'text-blue-500',
};

const statusColors: Record<InboxStatus, string> = {
  open: 'bg-green-500',
  pending: 'bg-amber-500',
  closed: 'bg-muted-foreground',
};

export function ThreadList({ threads, selectedThreadId, onSelectThread, isLoading }: ThreadListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!threads.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {threads.map((thread) => {
        const ChannelIcon = channelIcons[thread.channel];
        const isSelected = thread.id === selectedThreadId;

        return (
          <button
            key={thread.id}
            onClick={() => onSelectThread(thread.id)}
            className={cn(
              "w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-muted/50",
              isSelected && "bg-primary/5 border-l-2 border-primary"
            )}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
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
              {/* Status Indicator */}
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                statusColors[thread.status]
              )} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium text-sm text-foreground truncate">
                  {thread.contact_name}
                </span>
                <span className="text-mono text-muted-foreground flex-shrink-0">
                  {thread.last_message_at && formatDistanceToNow(new Date(thread.last_message_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ChannelIcon className={cn("w-3.5 h-3.5", channelColors[thread.channel])} />
                <span className="text-xs text-muted-foreground truncate">
                  {thread.contact_handle || thread.channel}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
