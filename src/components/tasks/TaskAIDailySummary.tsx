import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Loader2, AlertTriangle, CheckCircle2, Clock, ChevronRight,
  MessageSquare, Calendar, FileText, Plus, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface SuggestedAction {
  type: "mark_done" | "send_message" | "schedule_meeting" | "create_task" | "generate_proposal";
  label: string;
  data?: Record<string, unknown>;
}

interface SummaryData {
  summary: string;
  stats: { pending: number; overdue: number; dueToday: number; urgent: number };
  suggested_actions?: SuggestedAction[];
}

const ACTION_ICONS: Record<string, typeof MessageSquare> = {
  mark_done: Check,
  send_message: MessageSquare,
  schedule_meeting: Calendar,
  create_task: Plus,
  generate_proposal: FileText,
};

export function TaskAIDailySummary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executingAction, setExecutingAction] = useState<number | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

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

  const executeAction = async (action: SuggestedAction, index: number) => {
    if (executingAction !== null || completedActions.has(index)) return;
    setExecutingAction(index);

    try {
      switch (action.type) {
        case "mark_done": {
          const taskId = action.data?.task_id as string;
          if (taskId) {
            await supabase.from("tasks").update({ status: "done" }).eq("id", taskId);
            toast.success(`Tarefa concluída: ${action.label}`);
          }
          break;
        }
        case "create_task": {
          const title = (action.data?.title as string) || action.label;
          const category = (action.data?.category as string) || "geral";
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("tasks").insert({
              title,
              category,
              user_id: user.id,
              status: "todo",
              priority: "medium",
            });
            toast.success(`Tarefa criada: ${title}`);
          }
          break;
        }
        case "schedule_meeting": {
          navigate("/calendario");
          toast.info("Abra o calendário para agendar: " + action.label);
          break;
        }
        case "send_message": {
          toast.info("Ação de mensagem: " + action.label);
          break;
        }
        case "generate_proposal": {
          navigate("/projetos");
          toast.info("Navegue ao projeto para gerar proposta");
          break;
        }
      }
      setCompletedActions(prev => new Set(prev).add(index));
    } catch (err: any) {
      toast.error("Erro ao executar ação: " + (err.message || "Erro desconhecido"));
    } finally {
      setExecutingAction(null);
    }
  };

  const actions = data?.suggested_actions || [];

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
            className="rounded-lg border border-primary/10 bg-primary/[0.02] p-3 mt-1.5 space-y-2.5"
          >
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : data ? (
              <>
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

                {/* Suggested Actions */}
                {actions.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-border/10">
                    <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 font-medium">
                      Ações sugeridas
                    </span>
                    <div className="space-y-1">
                      {actions.map((action, i) => {
                        const Icon = ACTION_ICONS[action.type] || Sparkles;
                        const done = completedActions.has(i);
                        const isExecuting = executingAction === i;
                        return (
                          <Button
                            key={i}
                            variant="ghost"
                            size="sm"
                            disabled={isExecuting || done}
                            onClick={() => executeAction(action, i)}
                            className={cn(
                              "w-full justify-start gap-2 h-7 text-[11px] font-normal px-2",
                              done && "opacity-50 line-through"
                            )}
                          >
                            {isExecuting ? (
                              <Loader2 className="w-3 h-3 animate-spin text-primary" />
                            ) : done ? (
                              <CheckCircle2 className="w-3 h-3 text-primary" />
                            ) : (
                              <Icon className="w-3 h-3 text-primary/70" />
                            )}
                            <span className="truncate">{action.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}
