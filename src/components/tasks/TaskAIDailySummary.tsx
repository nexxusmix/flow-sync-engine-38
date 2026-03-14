import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";

interface SummaryData {
  summary: string;
  stats: { pending: number; overdue: number; dueToday: number; urgent: number };
}

export function TaskAIDailySummary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-primary tracking-wide">Resumo do dia</span>
        {data && !open && (
          <span className="text-[10px] text-muted-foreground ml-1">
            {data.stats.pending} pendentes
            {data.stats.overdue > 0 && ` · ${data.stats.overdue} atrasadas`}
          </span>
        )}
        {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-1" />}
        <ChevronRight className={cn(
          "w-3 h-3 text-muted-foreground/50 ml-auto transition-transform",
          open && "rotate-90"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-primary/10 bg-primary/[0.02] p-3 mt-1.5"
          >
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : data ? (
              <div className="space-y-1.5">
                <p className="text-xs text-foreground/80 leading-relaxed font-light">{data.summary}</p>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {data.stats.pending} pendentes
                  </span>
                  {data.stats.overdue > 0 && (
                    <span className="flex items-center gap-1 text-destructive/70">
                      <AlertTriangle className="w-2.5 h-2.5" /> {data.stats.overdue} atrasadas
                    </span>
                  )}
                  {data.stats.dueToday > 0 && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {data.stats.dueToday} para hoje
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}
