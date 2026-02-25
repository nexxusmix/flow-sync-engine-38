import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, X, Loader2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SummaryData {
  summary: string;
  stats: { pending: number; overdue: number; dueToday: number; urgent: number };
}

export function TaskAIDailySummary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check session storage to avoid re-fetching
    const cached = sessionStorage.getItem("task-daily-summary");
    if (cached) {
      try {
        setData(JSON.parse(cached));
        return;
      } catch {}
    }
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("daily-task-summary");
      if (fnError) throw fnError;
      setData(result);
      sessionStorage.setItem("task-daily-summary", JSON.stringify(result));
    } catch (err: any) {
      setError(err.message || "Erro ao gerar resumo");
    } finally {
      setLoading(false);
    }
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-xl border border-primary/10 bg-primary/[0.03] p-4 relative"
      >
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground/50 hover:text-foreground"
          onClick={() => setDismissed(true)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <h4 className="text-xs uppercase tracking-widest text-primary font-medium">Resumo do dia</h4>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analisando suas tarefas...
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : data ? (
              <>
                <p className="text-sm text-foreground/80 leading-relaxed font-light">{data.summary}</p>
                <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {data.stats.pending} pendentes
                  </span>
                  {data.stats.overdue > 0 && (
                    <span className="flex items-center gap-1 text-destructive/70">
                      <AlertTriangle className="w-3 h-3" /> {data.stats.overdue} atrasadas
                    </span>
                  )}
                  {data.stats.dueToday > 0 && (
                    <span className="flex items-center gap-1 text-amber-500/70">
                      <CheckCircle2 className="w-3 h-3" /> {data.stats.dueToday} para hoje
                    </span>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
