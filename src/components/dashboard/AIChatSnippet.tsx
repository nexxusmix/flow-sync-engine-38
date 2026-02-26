import { Sparkles, Play, Check, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ScoutOutput {
  id: string;
  status: string;
  last_error: string | null;
}

export function AIChatSnippet() {
  const { user } = useAuth();
  const [sendState, setSendState] = useState<"idle" | "loading" | "sent" | "failed">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scoutOutputId, setScoutOutputId] = useState<string | null>(null);

  // Load persisted status on mount
  useEffect(() => {
    if (!user?.id) return;

    const loadStatus = async () => {
      const { data } = await supabase
        .from("agent_scout_outputs" as any)
        .select("id, status, last_error")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const outputs = data as unknown as ScoutOutput[] | null;
      if (outputs && outputs.length > 0) {
        const output = outputs[0];
        setScoutOutputId(output.id);
        if (output.status === "sent") {
          setSendState("sent");
        } else if (output.status === "failed") {
          setSendState("failed");
          setErrorMsg(output.last_error || "Erro desconhecido");
        }
      }
    };

    loadStatus();
  }, [user?.id]);

  const handleApprove = useCallback(async () => {
    if (!scoutOutputId || !user?.id) {
      toast.error("Nenhum output do Scout encontrado para aprovar.");
      return;
    }

    setSendState("loading");
    setErrorMsg(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-approve-whatsapp-send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ scout_output_id: scoutOutputId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setSendState("failed");
        setErrorMsg(result.error || "Erro ao enviar");
        return;
      }

      setSendState("sent");
      toast.success("Mensagem enviada via WhatsApp!");
    } catch (err) {
      setSendState("failed");
      setErrorMsg("Erro de conexão ao enviar");
    }
  }, [scoutOutputId, user?.id]);

  const handleRetry = useCallback(() => {
    handleApprove();
  }, [handleApprove]);

  return (
    <div className="glass-card rounded-[2rem] p-6 space-y-5 min-h-[280px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="icon-box bg-primary/20">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <span className="text-mono font-normal text-primary uppercase tracking-[0.3em]">SQUAD Agent Scout</span>
      </div>

      {/* Chat Messages */}
      <div className="space-y-4">
        {/* AI Message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="glass-card rounded-2xl rounded-tl-sm p-4 text-sm text-muted-foreground leading-relaxed font-light">
            Analisei 42 empresas de arquitetura hoje. A <span className="text-foreground font-normal">Haus Arquitetura</span> acabou de postar um projeto novo sem vídeo. O CEO é o Ricardo.
          </div>
        </div>

        {/* User Message */}
        <div className="flex gap-3 justify-end">
          <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-sm p-4 text-sm text-foreground font-light">
            Gere uma abordagem de áudio para o Ricardo.
          </div>
        </div>

        {/* AI Audio Response */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="glass-card rounded-2xl rounded-tl-sm p-4 space-y-3 flex-1">
            {/* Audio Player */}
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </button>
              <div className="flex-1">
                {/* Waveform Placeholder */}
                <div className="flex items-center gap-0.5 h-8">
                  {[...Array(30)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-primary/40 rounded-full" 
                      style={{ height: `${Math.random() * 100}%` }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-mono">0:24</span>
            </div>
            <p className="text-mono text-muted-foreground font-light flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">record_voice_over</span>
              ElevenLabs: Voz Consultor Senior
            </p>
          </div>
        </div>
      </div>

      {/* Action Button / Status */}
      {sendState === "idle" && (
        <button className="btn-primary w-full justify-center" onClick={handleApprove}>
          <Check className="w-4 h-4" />
          Aprovar envio via WhatsApp
        </button>
      )}

      {sendState === "loading" && (
        <button className="btn-primary w-full justify-center opacity-70 cursor-not-allowed" disabled>
          <Loader2 className="w-4 h-4 animate-spin" />
          Enviando...
        </button>
      )}

      {sendState === "sent" && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-500">ENVIADO</span>
        </div>
      )}

      {sendState === "failed" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-destructive text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </div>
          <button className="btn-primary w-full justify-center" onClick={handleRetry}>
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
