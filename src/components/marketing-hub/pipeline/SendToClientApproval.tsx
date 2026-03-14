/**
 * SendToClientApproval — Bridge between content pipeline and client portal
 * Allows sending content items for client review/approval via portal
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ContentItem } from "@/types/marketing";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, ExternalLink, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  item: ContentItem;
  onSent: () => void;
}

const STATUS_CONFIG = {
  none: { label: "Não enviado", icon: Clock, color: "text-muted-foreground" },
  pending: { label: "Aguardando cliente", icon: Send, color: "text-primary" },
  approved: { label: "Aprovado pelo cliente", icon: CheckCircle, color: "text-primary" },
  rejected: { label: "Ajustes solicitados", icon: XCircle, color: "text-destructive" },
};

export function SendToClientApproval({ item, onSent }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const status = (item as any).client_approval_status || "none";
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.none;
  const StatusIcon = config.icon;

  const handleSend = async () => {
    setSending(true);
    try {
      // Update content item with portal approval status
      const { error } = await supabase
        .from("content_items")
        .update({
          client_approval_status: "pending",
          status: "review",
        } as any)
        .eq("id", item.id);

      if (error) throw error;

      // Create a comment for audit trail
      await supabase.from("content_comments").insert({
        content_item_id: item.id,
        text: `📤 Enviado para aprovação do cliente${message ? `: ${message}` : ""}`,
        author_name: "Sistema",
      });

      toast.success("Conteúdo enviado para aprovação do cliente!");
      setOpen(false);
      setMessage("");
      onSent();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar para aprovação");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Status indicator + action button */}
      <div className="flex items-center gap-2">
        <div className={cn("flex items-center gap-1.5 text-[10px]", config.color)}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wider font-medium">{config.label}</span>
        </div>

        {status === "none" && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => setOpen(true)}
          >
            <Send className="w-3 h-3" />
            Enviar ao Cliente
          </Button>
        )}

        {status === "rejected" && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => setOpen(true)}
          >
            <Send className="w-3 h-3" />
            Reenviar
          </Button>
        )}
      </div>

      {/* Client feedback display */}
      {(item as any).client_feedback && (
        <div className="mt-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
          <p className="text-[10px] text-destructive uppercase tracking-wider font-medium mb-1">
            Feedback do cliente
          </p>
          <p className="text-xs text-foreground/70">{(item as any).client_feedback}</p>
        </div>
      )}

      {/* Send dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Enviar para Aprovação do Cliente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
              <p className="text-xs font-medium text-foreground/80 mb-1">{item.title}</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                {item.channel && <span className="uppercase">{item.channel}</span>}
                {item.format && <span>• {item.format}</span>}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">
                Mensagem para o cliente (opcional)
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1.5 bg-muted/20 border-border text-foreground min-h-[80px] text-xs"
                placeholder="Instruções ou contexto para revisão..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
