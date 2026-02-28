import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Loader2, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "@/components/ui/Portal";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Suggestion {
  id: string;
  due_date: string;
  complexity: string;
  reason: string;
}

const COMPLEXITY_LABEL: Record<string, { label: string; className: string }> = {
  simple: { label: "Simples", className: "text-emerald-400" },
  medium: { label: "Média", className: "text-amber-400" },
  complex: { label: "Complexa", className: "text-red-400" },
};

interface TaskAIDeadlineSuggestionsProps {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function TaskAIDeadlineSuggestions({ externalOpen, onExternalOpenChange }: TaskAIDeadlineSuggestionsProps = {}) {
  const qc = useQueryClient();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (externalOpen) {
      fetchSuggestions();
      onExternalOpenChange?.(false);
    }
  }, [externalOpen]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setShowPanel(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-task-deadline", {
        body: { task_ids: [] },
      });
      if (error) throw error;
      setSuggestions(data?.suggestions || []);
      if (!data?.suggestions?.length) toast.info("Todas as tarefas já possuem prazo!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao sugerir prazos");
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = async (s: Suggestion) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ due_date: s.due_date })
        .eq("id", s.id);
      if (error) throw error;
      setSuggestions(prev => prev.filter(x => x.id !== s.id));
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Prazo definido!");
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const rejectSuggestion = (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const acceptAll = async () => {
    for (const s of suggestions) {
      await supabase.from("tasks").update({ due_date: s.due_date }).eq("id", s.id);
    }
    setSuggestions([]);
    qc.invalidateQueries({ queryKey: ["tasks"] });
    toast.success("Todos os prazos definidos!");
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchSuggestions} disabled={loading}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarClock className="w-3.5 h-3.5" />}
        <span className="hidden lg:inline">Sugerir prazos</span>
      </Button>

      <Portal>
      <AnimatePresence>
        {showPanel && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-4 right-4 z-50 w-96 max-h-[60vh] overflow-y-auto rounded-xl border border-white/[0.08] bg-card shadow-2xl"
          >
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Sugestões de Prazo</h3>
                <p className="text-[10px] text-muted-foreground">{suggestions.length} tarefas sem prazo</p>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={acceptAll}>
                  Aceitar todas
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowPanel(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="p-2 space-y-1">
              {suggestions.map((s) => {
                const ccfg = COMPLEXITY_LABEL[s.complexity] || COMPLEXITY_LABEL.medium;
                return (
                  <motion.div
                    key={s.id}
                    layout
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium">
                        {format(parseISO(s.due_date), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                      <span className={cn("text-[10px] uppercase tracking-wider", ccfg.className)}>
                        {ccfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/70">{s.reason}</p>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => rejectSuggestion(s.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-emerald-500" onClick={() => acceptSuggestion(s)}>
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </Portal>
    </>
  );
}
