import { useState } from 'react';
import { BarChart3, Loader2, AlertTriangle, Clock, Copy, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Task } from '@/hooks/useTasksUnified';
import { cn } from '@/lib/utils';

interface TaskAnalysisPanelProps {
  tasks: Task[];
}

interface AnalysisResult {
  total: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  overdue: { count: number; tasks: string[] };
  dormant: { count: number; tasks: string[] };
  duplicates: { count: number; groups: string[][] };
  insights: string[];
  recommendations: string[];
}

export function TaskAnalysisPanel({ tasks }: TaskAnalysisPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const runAnalysis = async () => {
    setIsOpen(true);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-tasks', {
        body: { tasks: tasks.map(t => ({ id: t.id, title: t.title, status: t.status, category: t.category, due_date: t.due_date, tags: t.tags, updated_at: t.updated_at, created_at: t.created_at, completed_at: t.completed_at })) },
      });
      if (error) throw error;
      setAnalysis(data);
    } catch (err: any) {
      toast.error(err.message || 'Erro na análise');
    } finally {
      setIsLoading(false);
    }
  };

  const statusLabels: Record<string, string> = { backlog: 'Backlog', week: 'Semana', today: 'Hoje', done: 'Concluídas' };
  const catLabels: Record<string, string> = { pessoal: 'Pessoal', operacao: 'Operação', projeto: 'Projeto' };

  return (
    <>
      <Button variant="outline" size="sm" onClick={runAnalysis} className="gap-1.5">
        <BarChart3 className="w-4 h-4" />
        <span className="hidden sm:inline">Análise IA</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <motion.div
              className="relative z-10 w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl p-5 space-y-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Análise de Tarefas
                </h2>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground animate-pulse">Analisando {tasks.length} tarefas com IA...</p>
                </div>
              ) : analysis ? (
                <div className="space-y-4">
                  {/* KPIs */}
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(analysis.by_status).map(([k, v]) => (
                      <div key={k} className="p-3 rounded-xl border border-border bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase">{statusLabels[k] || k}</p>
                        <p className="text-xl font-bold">{v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Alerts */}
                  {analysis.overdue.count > 0 && (
                    <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 space-y-1">
                      <p className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> {analysis.overdue.count} tarefas atrasadas
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {analysis.overdue.tasks.slice(0, 5).map((t, i) => <li key={i}>• {t}</li>)}
                      </ul>
                    </div>
                  )}

                  {analysis.dormant.count > 0 && (
                    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
                      <p className="text-sm font-semibold text-amber-500 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> {analysis.dormant.count} tarefas dormentes (+7d)
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {analysis.dormant.tasks.slice(0, 5).map((t, i) => <li key={i}>• {t}</li>)}
                      </ul>
                    </div>
                  )}

                  {analysis.duplicates.count > 0 && (
                    <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1">
                      <p className="text-sm font-semibold text-blue-500 flex items-center gap-1.5">
                        <Copy className="w-4 h-4" /> {analysis.duplicates.count} possíveis duplicatas
                      </p>
                      {analysis.duplicates.groups.slice(0, 3).map((g, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {g.join(' ↔ ')}</p>
                      ))}
                    </div>
                  )}

                  {/* Insights */}
                  {analysis.insights.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Insights
                      </p>
                      {analysis.insights.map((ins, i) => (
                        <p key={i} className="text-sm text-foreground">💡 {ins}</p>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Recomendações</p>
                      {analysis.recommendations.map((rec, i) => (
                        <p key={i} className="text-sm text-foreground">✅ {rec}</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
