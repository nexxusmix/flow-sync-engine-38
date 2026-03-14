import { useClientMessages } from '@/hooks/useClientMessages';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MessageHistoryProps {
  projectId: string;
  onBack: () => void;
}

export function MessageHistory({ projectId, onBack }: MessageHistoryProps) {
  const { messages, isLoading } = useClientMessages(projectId);

  const statusColors: Record<string, string> = {
    draft: 'text-muted-foreground',
    sent: 'text-primary',
    failed: 'text-destructive',
    queued: 'text-muted-foreground',
  };

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-xs -ml-2">
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
      </Button>

      <h3 className="text-sm font-medium">Histórico de envios</h3>

      {isLoading ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Carregando...</p>
      ) : messages.length === 0 ? (
        <div className="py-8 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Nenhuma mensagem enviada ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(m => (
            <div key={m.id} className="p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] uppercase font-medium", statusColors[m.status] || 'text-muted-foreground')}>
                    {m.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{m.channel}</span>
                  {m.ai_goal && <span className="text-[10px] text-primary/60">{m.ai_goal}</span>}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              <p className="text-xs text-foreground/70 whitespace-pre-wrap line-clamp-4">{m.content}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1.5 h-6 text-[10px] gap-1 px-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(m.content);
                }}
              >
                <Copy className="w-2.5 h-2.5" /> Copiar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
