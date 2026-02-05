import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useInbox, InboxChannel, InboxStatus } from "@/hooks/useInbox";
import { ThreadList } from "@/components/inbox/ThreadList";
import { ThreadView } from "@/components/inbox/ThreadView";
import { cn } from "@/lib/utils";
import { Inbox, Settings, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function InboxPage() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<InboxChannel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<InboxStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = {
    channel: channelFilter !== 'all' ? channelFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchQuery || undefined,
  };

  const { threads, threadsLoading, useThreadMessages, sendMessage, updateThreadStatus, assignThread } = useInbox(filters);
  const { data: messages, isLoading: messagesLoading } = useThreadMessages(selectedThreadId);

  const selectedThread = threads?.find(t => t.id === selectedThreadId);
  const hasIntegrations = true; // For now, always show UI

  if (!hasIntegrations && (!threads || threads.length === 0)) {
    return (
      <DashboardLayout title="Inbox">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="glass-card p-12 rounded-3xl max-w-lg">
            <div className="icon-box w-20 h-20 mb-6 mx-auto">
              <Inbox className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Inbox Unificada</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Centralize todas suas conversas de WhatsApp, Instagram e Email em um só lugar.
              Configure suas integrações para começar.
            </p>
            <Button className="btn-primary">
              <Settings className="w-4 h-4 mr-2" />
              Configurar Integrações
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Inbox">
      <div className="flex h-[calc(100vh-10rem)] gap-4">
        {/* Left Panel - Thread List */}
        <div className="w-[400px] flex flex-col glass-card rounded-2xl overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-border space-y-3">
            <Input
              placeholder="Buscar contato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50"
            />
            <div className="flex gap-2">
              <Select
                value={channelFilter}
                onValueChange={(v) => setChannelFilter(v as InboxChannel | 'all')}
              >
                <SelectTrigger className="flex-1 bg-muted/50">
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Canais</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as InboxStatus | 'all')}
              >
                <SelectTrigger className="flex-1 bg-muted/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abertos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="closed">Fechados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto">
            <ThreadList
              threads={threads || []}
              selectedThreadId={selectedThreadId}
              onSelectThread={setSelectedThreadId}
              isLoading={threadsLoading}
            />
          </div>
        </div>

        {/* Right Panel - Thread View */}
        <div className="flex-1 glass-card rounded-2xl overflow-hidden">
          {selectedThread ? (
            <ThreadView
              thread={selectedThread}
              messages={messages || []}
              isLoading={messagesLoading}
              onSendMessage={(text) => sendMessage({ threadId: selectedThread.id, text })}
              onUpdateStatus={(status) => updateThreadStatus({ threadId: selectedThread.id, status })}
              onAssign={(assignedTo) => assignThread({ threadId: selectedThread.id, assignedTo })}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="icon-box w-16 h-16 mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Selecione uma Conversa</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Escolha uma conversa na lista à esquerda para visualizar as mensagens e responder.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
