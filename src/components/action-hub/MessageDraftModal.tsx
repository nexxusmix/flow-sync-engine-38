import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActionItem } from "@/hooks/useActionItems";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check, Send, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  item: ActionItem | null;
  open: boolean;
  onClose: () => void;
}

const tones = [
  { key: "neutro", label: "Neutro" },
  { key: "direto", label: "Direto" },
  { key: "premium", label: "Premium" },
  { key: "amigavel", label: "Amigável" },
];

export function MessageDraftModal({ item, open, onClose }: Props) {
  const [tone, setTone] = useState("neutro");
  const [channel, setChannel] = useState("whatsapp");
  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markedSent, setMarkedSent] = useState(false);

  const generateMessage = async () => {
    if (!item) return;
    setIsGenerating(true);
    setDraft("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-action-message", {
        body: {
          actionItem: item,
          tone,
          channel,
        },
      });
      if (error) throw error;
      setDraft(data?.content || "Erro ao gerar mensagem.");

      // Save as draft
      await supabase.from("message_drafts" as any).insert({
        action_item_id: item.id,
        scope: item.scope,
        project_id: item.project_id,
        client_id: item.client_id,
        channel,
        tone,
        content: data?.content || "",
        status: "draft",
      } as any);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar mensagem com IA");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    toast.success("Mensagem copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const markAsSent = async () => {
    if (!item) return;
    await supabase
      .from("action_items" as any)
      .update({ status: "done" } as any)
      .eq("id", item.id);
    setMarkedSent(true);
    toast.success("Marcado como enviado!");
    setTimeout(() => onClose(), 1000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-card border-border/30 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground font-normal text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.5} />
            Gerar Mensagem IA
          </DialogTitle>
        </DialogHeader>

        {item && (
          <div className="space-y-4">
            {/* Context */}
            <div className="bg-muted/20 rounded-xl p-3">
              <p className="text-[9px] text-muted-foreground font-mono uppercase mb-1">Contexto da Ação</p>
              <p className="text-sm text-foreground">{item.title}</p>
              {item.description && <p className="text-[11px] text-muted-foreground mt-1">{item.description}</p>}
            </div>

            {/* Tone selector */}
            <div>
              <p className="text-[9px] text-muted-foreground font-mono uppercase mb-2">Tom</p>
              <div className="flex gap-2">
                {tones.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTone(t.key)}
                    className={cn(
                      "text-[10px] px-3 py-1.5 rounded-lg font-mono uppercase transition-colors",
                      tone === t.key ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Channel */}
            <div>
              <p className="text-[9px] text-muted-foreground font-mono uppercase mb-2">Canal</p>
              <div className="flex gap-2">
                {["whatsapp", "email"].map(ch => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={cn(
                      "text-[10px] px-3 py-1.5 rounded-lg font-mono uppercase transition-colors",
                      channel === ch ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={generateMessage}
              disabled={isGenerating}
              className="btn-primary w-full justify-center"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
              ) : draft ? (
                <><RefreshCw className="w-4 h-4" /> Regenerar</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Gerar Mensagem</>
              )}
            </button>

            {/* Draft output */}
            {draft && (
              <motion.div
                className="bg-muted/10 border border-border/30 rounded-xl p-4 space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-[9px] text-primary font-mono uppercase">Mensagem Gerada</p>
                <pre className="text-sm text-foreground whitespace-pre-wrap font-light leading-relaxed">{draft}</pre>

                <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-mono uppercase"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                  <button
                    onClick={markAsSent}
                    disabled={markedSent}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-mono uppercase"
                  >
                    <Send className="w-3 h-3" />
                    {markedSent ? "Enviado ✓" : "Marcar Enviado"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
