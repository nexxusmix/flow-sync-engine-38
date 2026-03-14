import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/hooks/useTasksUnified";

interface Suggestion {
  task_id: string;
  position: number;
  reason: string;
}

interface DailyPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  onApply: (taskIds: string[]) => void;
}

export function DailyPlanDialog({ open, onOpenChange, tasks, onApply }: DailyPlanDialogProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const pendingTasks = tasks.filter(t => t.status !== 'done');

  const handleGenerate = async () => {
    if (pendingTasks.length === 0) {
      toast.error("Nenhuma tarefa pendente para analisar");
      return;
    }
    setIsLoading(true);
    setSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-daily-plan', {
        body: {
          tasks: pendingTasks.map(t => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            due_date: t.due_date,
            category: t.category,
            status: t.status,
            tags: t.tags,
          })),
        },
      });
      if (error) {
        const msg = typeof error === 'object' && error.message ? error.message : String(error);
        if (msg.includes('429')) {
          toast.error('Limite de requisições atingido. Tente novamente em instantes.');
        } else if (msg.includes('402')) {
          toast.error('Cota de IA esgotada.');
        } else {
          throw error;
        }
        return;
      }
      if (!data?.suggestions || data.suggestions.length === 0) {
        toast.info("A IA não conseguiu gerar sugestões. Tente novamente.");
        return;
      }
      setSuggestions(data.suggestions);
    } catch (err: any) {
      console.error('Daily plan error:', err);
      toast.error(err.message || 'Erro ao gerar plano do dia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const taskIds = suggestions.map(s => s.task_id);
      onApply(taskIds);
      toast.success(`${taskIds.length} tarefas movidas para "Hoje"`);
      onOpenChange(false);
      setSuggestions([]);
    } catch {
      toast.error('Erro ao aplicar plano');
    } finally {
      setIsApplying(false);
    }
  };

  const getTaskTitle = (taskId: string) => {
    return tasks.find(t => t.id === taskId)?.title || 'Tarefa';
  };

  const getTaskPriority = (taskId: string) => {
    return tasks.find(t => t.id === taskId)?.priority || 'normal';
  };

  const priorityColors: Record<string, string> = {
    urgent: `${sc.priority('urgent').bg} ${sc.priority('urgent').text}`,
    high: `${sc.priority('high').bg} ${sc.priority('high').text}`,
    normal: `${sc.priority('normal').bg} ${sc.priority('normal').text}`,
    low: `${sc.priority('low').bg} ${sc.priority('low').text}`,
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setSuggestions([]); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Plano do Dia
          </DialogTitle>
        </DialogHeader>

        {suggestions.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              A IA vai analisar suas {pendingTasks.length} tarefas pendentes e sugerir a melhor sequência para hoje.
            </p>
            <Button onClick={handleGenerate} disabled={isLoading || pendingTasks.length === 0} className="gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
              {isLoading ? 'Analisando...' : 'Gerar Sugestões'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {suggestions.length} tarefas sugeridas na ordem ideal:
            </p>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={s.task_id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{getTaskTitle(s.task_id)}</span>
                      <Badge variant="secondary" className={`text-[10px] ${priorityColors[getTaskPriority(s.task_id)] || ''}`}>
                        {getTaskPriority(s.task_id)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-primary/40 shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSuggestions([])}>
              Regenerar
            </Button>
            <Button onClick={handleApply} disabled={isApplying} className="gap-2">
              {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Aplicar Plano
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
