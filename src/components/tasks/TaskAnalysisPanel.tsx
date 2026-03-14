import { useState, useRef, useEffect } from 'react';
import {
  BarChart3, Loader2, AlertTriangle, Clock, Copy, TrendingUp, X,
  Send, Trash2, Archive, ArrowUpDown, CalendarDays, Zap, Undo2,
  Sparkles, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Lightbulb, Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '@/components/ui/Portal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Task } from '@/hooks/useTasksUnified';
import { useSmartTaskAI } from '@/hooks/useSmartTaskAI';
import { cn } from '@/lib/utils';

interface TaskAnalysisPanelProps {
  tasks: Task[];
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
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

const QUICK_ACTIONS = [
  { intent: 'delete_duplicates', label: 'Remover Duplicados', icon: Trash2, destructive: true },
  { intent: 'archive_completed', label: 'Arquivar Concluídas', icon: Archive, destructive: true },
  { intent: 'reorganize_priority', label: 'Reorganizar Semana', icon: ArrowUpDown, destructive: false },
  { intent: 'create_week_plan', label: 'Plano Inteligente', icon: CalendarDays, destructive: false },
];

export function TaskAnalysisPanel({ tasks, externalOpen, onExternalOpenChange }: TaskAnalysisPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (externalOpen) {
      runAnalysis();
      onExternalOpenChange?.(false);
    }
  }, [externalOpen]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [command, setCommand] = useState('');
  const [showInsights, setShowInsights] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isProcessing, isExecuting, pendingAction, lastResult, canUndo,
    sendCommand, confirmAction, cancelAction, undoLastAction, runQuickAction,
  } = useSmartTaskAI(tasks);

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

  const handleCommand = () => {
    if (!command.trim()) return;
    sendCommand(command.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommand();
    }
  };

  const statusLabels: Record<string, string> = { backlog: 'Backlog', week: 'Semana', today: 'Hoje', done: 'Concluídas' };

  return (
    <>
      <Button variant="outline" size="sm" onClick={runAnalysis} className="gap-1.5">
        <BarChart3 className="w-4 h-4" />
        <span className="hidden sm:inline">Análise IA</span>
      </Button>

      <Portal>
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
              className="relative z-10 w-full max-w-5xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-3 shrink-0">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Análise de Tarefas
                </h2>
                <div className="flex items-center gap-2">
                  {canUndo && (
                    <Button variant="ghost" size="sm" onClick={undoLastAction} disabled={isExecuting} className="gap-1.5 text-muted-foreground hover:text-foreground">
                      <Undo2 className="w-4 h-4" /> Desfazer
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-4 min-h-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Analisando {tasks.length} tarefas com IA...</p>
                  </div>
                ) : analysis ? (
                  <>
                    {/* KPIs */}
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(analysis.by_status).map(([k, v]) => (
                        <div key={k} className="p-3 rounded-xl border border-border bg-muted/50 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{statusLabels[k] || k}</p>
                          <p className="text-2xl font-bold">{v}</p>
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

                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Ações Rápidas
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_ACTIONS.map((qa) => (
                          <Button
                            key={qa.intent}
                            variant={qa.destructive ? "outline" : "secondary"}
                            size="sm"
                            className={cn(
                              "gap-1.5 justify-start h-9",
                              qa.destructive && "border-destructive/30 text-destructive hover:bg-destructive/10"
                            )}
                            onClick={() => runQuickAction(qa.intent)}
                            disabled={isProcessing || isExecuting}
                          >
                            <qa.icon className="w-3.5 h-3.5" />
                            {qa.label}
                          </Button>
                        ))}
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1.5 justify-start h-9 col-span-2 bg-primary/90 hover:bg-primary"
                          onClick={() => runQuickAction('auto_optimize_all')}
                          disabled={isProcessing || isExecuting}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          ⚡ Otimização Completa
                        </Button>
                      </div>
                    </div>

                    {/* Pending Action Confirmation */}
                    <AnimatePresence>
                      {pendingAction && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={cn(
                            "p-4 rounded-xl border space-y-3",
                            pendingAction.action_type === 'destructive'
                              ? "border-destructive/30 bg-destructive/5"
                              : "border-primary/30 bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {pendingAction.action_type === 'destructive' ? (
                              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                            ) : (
                              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-1 flex-1">
                              <p className="text-sm font-semibold">{pendingAction.summary}</p>
                              {pendingAction.details && (
                                <p className="text-xs text-muted-foreground">
                                  {pendingAction.details.count} tarefa(s) serão afetadas
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={pendingAction.action_type === 'destructive' ? "destructive" : "default"}
                              onClick={confirmAction}
                              disabled={isExecuting}
                              className="gap-1.5"
                            >
                              {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Confirmar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelAction} disabled={isExecuting} className="gap-1.5">
                              <XCircle className="w-3.5 h-3.5" /> Cancelar
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Last Result */}
                    {lastResult && (
                      <div className="p-3 rounded-xl border border-green-500/20 bg-green-500/5">
                        <p className="text-sm text-green-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> {lastResult}
                        </p>
                      </div>
                    )}

                    {/* Insights */}
                    {analysis.insights.length > 0 && (
                      <div className="space-y-2">
                        <button
                          className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground transition-colors w-full"
                          onClick={() => setShowInsights(!showInsights)}
                        >
                          <Lightbulb className="w-3 h-3 text-blue-400" /> Insights
                          {showInsights ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                        </button>
                        <AnimatePresence>
                          {showInsights && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-hidden"
                            >
                              {analysis.insights.map((ins, i) => (
                                <div key={`i-${i}`} className="flex items-start gap-3 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                                  <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                  <p className="text-sm text-foreground leading-snug">{ins}</p>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Recomendações */}
                    {analysis.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <p className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
                          <Target className="w-3 h-3 text-emerald-400" /> Recomendações
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {analysis.recommendations.map((rec, i) => (
                            <div key={`r-${i}`} className="flex items-start gap-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                              <Target className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <p className="text-sm text-foreground leading-snug">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Fixed Footer - Command Input */}
              {analysis && !isLoading && (
                <div className="shrink-0 border-t border-border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        ref={inputRef}
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite um comando... ex: apagar duplicados"
                        className="pr-10 bg-muted/50"
                        disabled={isProcessing || isExecuting}
                      />
                      {isProcessing && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={handleCommand}
                      disabled={!command.trim() || isProcessing || isExecuting}
                      className="gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Exemplos: "apagar duplicados" • "reorganizar semana" • "distribuir backlog em 10 dias" • "otimizar tudo"
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </Portal>
    </>
  );
}
