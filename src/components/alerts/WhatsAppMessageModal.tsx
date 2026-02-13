import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check, Send, Sparkles, Loader2, RefreshCw, Pencil, MessageSquare, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Alert } from "@/hooks/useAlerts";

interface WhatsAppMessageModalProps {
  alert: Alert | null;
  open: boolean;
  onClose: () => void;
  onResolved?: (alertId: string) => void;
}

const tones = [
  { key: "curta", label: "Curta" },
  { key: "padrao", label: "Padrão" },
  { key: "detalhada", label: "Detalhada" },
  { key: "cobrando", label: "Cobrando" },
  { key: "carinhosa", label: "Carinhosa" },
  { key: "objetiva", label: "Objetiva" },
];

export function WhatsAppMessageModal({ alert, open, onClose, onResolved }: WhatsAppMessageModalProps) {
  const [tone, setTone] = useState("padrao");
  const [draft, setDraft] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [clientPhone, setClientPhone] = useState<string | null>(null);

  // Fetch project + client data when alert changes
  useEffect(() => {
    if (!alert?.project_id) { setProject(null); setClientPhone(null); return; }
    
    const fetchContext = async () => {
      const { data: proj } = await supabase
        .from("projects")
        .select("id, name, client_name, due_date, status, stage_current")
        .eq("id", alert.project_id!)
        .single();
      setProject(proj);

      // Try to find phone from crm_contacts by client name
      if (proj?.client_name) {
        const { data: contact } = await supabase
          .from("crm_contacts")
          .select("phone")
          .ilike("name", `%${proj.client_name}%`)
          .limit(1)
          .single();
        setClientPhone(contact?.phone || null);
      }
    };
    fetchContext();
  }, [alert?.project_id]);

  const generateMessage = async () => {
    if (!alert) return;
    setIsGenerating(true);
    setIsEditing(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-alert-whatsapp", {
        body: {
          alert: {
            type: alert.type,
            title: alert.title,
            message: alert.message,
            due_at: alert.due_at,
            severity: alert.severity,
          },
          project: project || undefined,
          client: project?.client_name ? { name: project.client_name } : undefined,
          tone,
        },
      });
      if (error) throw error;
      setDraft(data?.message || "Erro ao gerar mensagem.");

      // Log action
      await supabase.from("alert_actions" as any).insert({
        alert_id: alert.id,
        project_id: alert.project_id,
        action_type: "generate_message",
        payload: { tone, message_preview: (data?.message || "").substring(0, 100) },
      } as any);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar mensagem com IA");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    toast.success("Copiado. Colar no WhatsApp.");
    setTimeout(() => setCopied(false), 2000);

    // Log action
    if (alert) {
      await supabase.from("alert_actions" as any).insert({
        alert_id: alert.id,
        project_id: alert.project_id,
        action_type: "copy",
        payload: { message_length: draft.length },
      } as any);
    }
  };

  const sendWhatsApp = async () => {
    if (!draft) return;
    const phone = clientPhone?.replace(/\D/g, "") || "";
    const encodedText = encodeURIComponent(draft);
    const url = phone ? `https://wa.me/${phone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
    window.open(url, "_blank");

    // Log action + event_logs
    if (alert) {
      await Promise.all([
        supabase.from("alert_actions" as any).insert({
          alert_id: alert.id,
          project_id: alert.project_id,
          action_type: "send_whatsapp",
          payload: { message: draft, phone: phone || null, tone },
        } as any),
        supabase.from("event_logs").insert({
          action: "whatsapp_message_sent",
          entity_type: "alert",
          entity_id: alert.id,
          details: { project_id: alert.project_id, message_preview: draft.substring(0, 200), tone } as any,
        }),
      ]);
      toast.success("WhatsApp aberto. Mensagem registrada no projeto.");
    }
  };

  const handleResolveAfterSend = () => {
    if (alert && onResolved) {
      onResolved(alert.id);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-projection border-[hsl(var(--glass-border))] max-w-lg bg-black/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground font-normal text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" strokeWidth={1.5} />
            Mensagem para WhatsApp
          </DialogTitle>
        </DialogHeader>

        {alert && (
          <div className="space-y-4">
            {/* Alert context */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
              <p className="text-[9px] text-primary font-mono uppercase mb-1">Aviso</p>
              <p className="text-sm text-foreground/80">{alert.title}</p>
              {alert.message && <p className="text-[11px] text-muted-foreground mt-1">{alert.message}</p>}
              {project && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] text-muted-foreground font-mono">Projeto:</span>
                  <span className="text-[10px] text-primary/80">{project.name}</span>
                  {project.client_name && (
                    <>
                      <span className="text-[9px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">{project.client_name}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Tone selector */}
            <div>
              <p className="text-[9px] text-muted-foreground font-mono uppercase mb-2">Tom da Mensagem</p>
              <div className="flex flex-wrap gap-1.5">
                {tones.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTone(t.key)}
                    className={cn(
                      "text-[10px] px-3 py-1.5 rounded-lg font-mono uppercase transition-all",
                      tone === t.key
                        ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_8px_hsl(var(--glow))]"
                        : "bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] border border-white/[0.04]"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate */}
            <Button
              onClick={generateMessage}
              disabled={isGenerating}
              className="w-full bg-primary/15 hover:bg-primary/25 text-primary border border-primary/20 h-10"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Gerando...</>
              ) : draft ? (
                <><RefreshCw className="w-4 h-4 mr-2" /> Regenerar com tom "{tones.find(t => t.key === tone)?.label}"</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Gerar Mensagem</>
              )}
            </Button>

            {/* Draft */}
            <AnimatePresence>
              {draft && (
                <motion.div
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-primary font-mono uppercase">Preview WhatsApp</p>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-[9px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> {isEditing ? "Visualizar" : "Editar"}
                    </button>
                  </div>

                  {isEditing ? (
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="min-h-[140px] bg-black/50 border-white/[0.06] text-sm font-light leading-relaxed resize-none"
                    />
                  ) : (
                    <div className="bg-[#0a1a12] border border-emerald-900/30 rounded-lg p-3">
                      <pre className="text-sm text-emerald-100/90 whitespace-pre-wrap font-light leading-relaxed">{draft}</pre>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                    <Button
                      onClick={copyToClipboard}
                      variant="ghost"
                      size="sm"
                      className="text-[10px] font-mono uppercase bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04]"
                    >
                      {copied ? <Check className="w-3 h-3 mr-1.5 text-emerald-400" /> : <Copy className="w-3 h-3 mr-1.5" />}
                      {copied ? "Copiado!" : "Copiar"}
                    </Button>
                    <Button
                      onClick={sendWhatsApp}
                      variant="ghost"
                      size="sm"
                      className="text-[10px] font-mono uppercase bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                    >
                      <Send className="w-3 h-3 mr-1.5" /> Enviar WhatsApp
                    </Button>
                    <Button
                      onClick={handleResolveAfterSend}
                      variant="ghost"
                      size="sm"
                      className="text-[10px] font-mono uppercase bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 ml-auto"
                    >
                      <Check className="w-3 h-3 mr-1.5" /> Resolver Aviso
                    </Button>
                  </div>

                  {clientPhone && (
                    <p className="text-[9px] text-muted-foreground/40 font-mono flex items-center gap-1">
                      <ExternalLink className="w-2.5 h-2.5" /> wa.me/{clientPhone.replace(/\D/g, "")}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
