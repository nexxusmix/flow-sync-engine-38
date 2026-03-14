import { useState, useCallback } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkEmptyState, MkSectionHeader } from "@/components/marketing-hub/mk-ui";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Check, X, RefreshCw, Loader2,
  CalendarX, FileWarning, Repeat2, Layers, Compass, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Suggestion {
  id: string;
  title: string;
  message: string | null;
  rule_key: string;
  status: string;
  entity_type: string;
  entity_id: string | null;
  suggestion_json: Record<string, unknown> | null;
  created_at: string;
}

const RULE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  stale_draft: { icon: FileWarning, color: "text-muted-foreground", bg: "bg-muted", label: "Rascunho Parado" },
  calendar_gap: { icon: CalendarX, color: "text-destructive", bg: "bg-destructive/10", label: "Gap no Calendário" },
  repost_opportunity: { icon: Repeat2, color: "text-primary", bg: "bg-primary/10", label: "Repostar" },
  channel_diversify: { icon: Layers, color: "text-primary/70", bg: "bg-primary/10", label: "Diversificação" },
  missing_pillars: { icon: Compass, color: "text-primary", bg: "bg-primary/10", label: "Pilares" },
  onboarding: { icon: Sparkles, color: "text-primary", bg: "bg-primary/10", label: "Início" },
};

const DEFAULT_RULE = { icon: Zap, color: "text-[hsl(195,100%,55%)]", bg: "bg-[hsl(195,100%,55%)]/10", label: "Sugestão" };

export default function MkAutomationsPage() {
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["automation-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_suggestions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Suggestion[];
    },
  });

  const runScan = useCallback(async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content-suggestions");
      if (error) throw error;
      const result = data as { ok: boolean; new_suggestions: number; analyzed: number };
      if (result.new_suggestions > 0) {
        toast.success(`${result.new_suggestions} nova(s) sugestão(ões) gerada(s)!`);
      } else {
        toast.info("Análise concluída. Nenhuma nova sugestão no momento.");
      }
      queryClient.invalidateQueries({ queryKey: ["automation-suggestions"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao analisar conteúdo");
    } finally {
      setScanning(false);
    }
  }, [queryClient]);

  const applySuggestion = async (id: string) => {
    await supabase
      .from("automation_suggestions")
      .update({ status: "applied", applied_at: new Date().toISOString() })
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["automation-suggestions"] });
    toast.success("Sugestão aplicada!");
  };

  const ignoreSuggestion = async (id: string) => {
    await supabase
      .from("automation_suggestions")
      .update({ status: "ignored", ignored_at: new Date().toISOString() })
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["automation-suggestions"] });
  };

  const pending = suggestions.filter(s => s.status === "pending");
  const applied = suggestions.filter(s => s.status === "applied");
  const ignored = suggestions.filter(s => s.status === "ignored");

  return (
    <MkAppShell title="Automações Inteligentes" sectionCode="10" sectionLabel="Smart_Automations">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-white/30">Análise automática do seu conteúdo com sugestões acionáveis</p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
            "bg-[hsl(195,100%,50%)]/10 text-[hsl(195,100%,60%)] border border-[hsl(195,100%,50%)]/20",
            "hover:bg-[hsl(195,100%,50%)]/20 hover:border-[hsl(195,100%,50%)]/30",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {scanning ? "Analisando..." : "Analisar Conteúdo"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[hsl(195,100%,50%)]" />
        </div>
      ) : (
        <>
          {/* Pending suggestions */}
          <MkSectionHeader title={`Pendentes (${pending.length})`} />
          {pending.length === 0 ? (
            <MkEmptyState
              icon="smart_toy"
              title="Sem sugestões pendentes"
              description="Clique em 'Analisar Conteúdo' para gerar novas sugestões com base no seu pipeline."
            />
          ) : (
            <div className="space-y-3 mb-10">
              <AnimatePresence>
                {pending.map((s, i) => {
                  const config = RULE_CONFIG[s.rule_key] || DEFAULT_RULE;
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <MkCard className="flex items-start gap-4 p-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
                          <Icon className={cn("w-5 h-5", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-[9px] uppercase tracking-[0.15em] font-mono", config.color)}>
                              {config.label}
                            </span>
                            <span className="text-[9px] text-white/20 font-mono">
                              {formatDistanceToNow(parseISO(s.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-white/80">{s.title}</h4>
                          {s.message && <p className="text-xs text-white/35 mt-1 leading-relaxed">{s.message}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0 mt-1">
                          <button
                            onClick={() => applySuggestion(s.id)}
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="Aplicar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => ignoreSuggestion(s.id)}
                            className="p-2 rounded-lg bg-white/[0.04] text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-colors"
                            title="Ignorar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </MkCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Applied suggestions */}
          {applied.length > 0 && (
            <>
              <MkSectionHeader title={`Aplicadas (${applied.length})`} />
              <div className="space-y-2 mb-8">
                {applied.slice(0, 10).map(s => {
                  const config = RULE_CONFIG[s.rule_key] || DEFAULT_RULE;
                  return (
                    <MkCard key={s.id} className="flex items-center gap-3 py-3 opacity-50">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className={cn("text-[9px] uppercase tracking-[0.1em] font-mono shrink-0", config.color)}>
                        {config.label}
                      </span>
                      <span className="text-xs text-white/40 truncate">{s.title}</span>
                    </MkCard>
                  );
                })}
              </div>
            </>
          )}

          {/* Ignored suggestions */}
          {ignored.length > 0 && (
            <>
              <MkSectionHeader title={`Ignoradas (${ignored.length})`} />
              <div className="space-y-2">
                {ignored.slice(0, 5).map(s => (
                  <MkCard key={s.id} className="flex items-center gap-3 py-3 opacity-30">
                    <X className="w-4 h-4 text-white/30 shrink-0" />
                    <span className="text-xs text-white/30 truncate">{s.title}</span>
                  </MkCard>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </MkAppShell>
  );
}
