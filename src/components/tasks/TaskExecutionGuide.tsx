import { useState, useCallback } from 'react';
import { Brain, Loader2, Play, CheckCircle2, X, Clock, Zap, Coffee, FileDown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TaskTimer, formatTime } from './TaskTimer';
import { exportFocusPDF } from '@/services/pdfExportService';
import type { Task } from '@/hooks/useTasksUnified';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExecutionBlock {
  id: string;
  title: string;
  type: 'deep_work' | 'shallow_work' | 'break';
  technique: string;
  duration_minutes: number;
  tasks: { id: string; title: string; estimated_minutes: number; cognitive_type: string }[];
}

interface ExecutionPlan {
  blocks: ExecutionBlock[];
  total_estimated_minutes: number;
  tips: string[];
}

interface TaskExecutionGuideProps {
  tasks: Task[];
  onComplete?: (taskId: string) => void;
}

export function TaskExecutionGuide({ tasks, onComplete }: TaskExecutionGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [activeBlockIdx, setActiveBlockIdx] = useState(0);
  const [activeTaskIdx, setActiveTaskIdx] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const pendingTasks = tasks.filter(t => t.status !== 'done');

  const generatePlan = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-execution-blocks', {
        body: {
          tasks: pendingTasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            category: t.category,
            tags: t.tags,
            due_date: t.due_date,
            status: t.status,
          })),
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setPlan(data);
      setActiveBlockIdx(0);
      setActiveTaskIdx(0);
      setCompletedTasks(new Set());
    } catch (err: any) {
      const msg = err.message || 'Erro ao gerar plano';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const completeTask = useCallback((taskId: string) => {
    setCompletedTasks(prev => new Set([...prev, taskId]));
    onComplete?.(taskId);
    toast.success('Tarefa concluída!');
  }, [onComplete]);

  const handleSavePlan = async () => {
    if (!plan) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const now = new Date();
      const title = `Plano de Foco - ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const { error } = await supabase.from('saved_focus_plans').insert({
        user_id: user.id,
        title,
        plan_data: plan as any,
        completed_tasks: Array.from(completedTasks) as any,
        status: 'active',
      });
      if (error) throw error;
      toast.success('Plano salvo na aba Foco!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar plano');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPdf = async (orientation: 'landscape' | 'portrait') => {
    if (!plan) return;
    setIsExportingPdf(true);
    try {
      await exportFocusPDF(plan, orientation);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const totalTasks = plan?.blocks.reduce((sum, b) => sum + b.tasks.length, 0) || 0;
  const progressPct = totalTasks > 0 ? (completedTasks.size / totalTasks) * 100 : 0;

  const blockTypeConfig = {
    deep_work: { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
    shallow_work: { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    break: { icon: Coffee, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={generatePlan} className="gap-1.5" disabled={pendingTasks.length === 0}>
        <Brain className="w-4 h-4" />
        <span className="hidden sm:inline">Modo Foco</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <motion.div
              className="relative z-10 w-full max-w-lg max-h-[70vh] my-auto flex flex-col rounded-2xl border border-border bg-background shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              {/* Fixed Header */}
              <div className="shrink-0 p-5 pb-3 space-y-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" /> Modo Foco
                  </h2>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {plan && !isLoading && !error && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{completedTasks.size}/{totalTasks} tarefas</span>
                      <span>~{formatTime(plan.total_estimated_minutes * 60)} estimado</span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>
                )}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Gerando plano de execução com IA...</p>
                    <p className="text-[10px] text-muted-foreground">Analisando {pendingTasks.length} tarefas • Neurociência + Produtividade</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <p className="text-sm text-destructive font-medium">Não foi possível gerar o plano</p>
                    <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
                    <Button variant="outline" size="sm" onClick={generatePlan} className="gap-1.5 mt-2">
                      <Play className="w-3.5 h-3.5" /> Tentar novamente
                    </Button>
                  </div>
                ) : plan ? (
                  <div className="space-y-4">
                    {plan.tips.length > 0 && (
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5 space-y-0.5">
                        {plan.tips.map((tip, i) => <p key={i}>💡 {tip}</p>)}
                      </div>
                    )}

                    {plan.blocks.map((block, bIdx) => {
                      const config = blockTypeConfig[block.type] || blockTypeConfig.shallow_work;
                      const BlockIcon = config.icon;
                      const isActive = bIdx === activeBlockIdx;
                      const blockCompleted = block.tasks.every(t => completedTasks.has(t.id));

                      return (
                        <motion.div
                          key={block.id}
                          className={cn(
                            "rounded-xl border p-3 space-y-2 transition-all",
                            config.bg,
                            isActive && "ring-1 ring-primary/30"
                          )}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: bIdx * 0.05 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <BlockIcon className={cn("w-4 h-4", config.color)} />
                              <span className="text-sm font-semibold">{block.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {block.duration_minutes}min
                              {blockCompleted && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{block.technique}</p>

                          <div className="space-y-1">
                            {block.tasks.map((task, tIdx) => {
                              const isDone = completedTasks.has(task.id);
                              return (
                                <div
                                  key={task.id}
                                  className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg text-xs transition-all",
                                    isDone ? "bg-green-500/10 line-through text-muted-foreground" : "bg-background/50"
                                  )}
                                >
                                  <button
                                    onClick={() => !isDone && completeTask(task.id)}
                                    className={cn("w-4 h-4 rounded-full border-2 shrink-0 transition-all",
                                      isDone ? "bg-green-500 border-green-500" : "border-muted-foreground hover:border-primary"
                                    )}
                                  />
                                  <span className="flex-1 font-medium">{task.title}</span>
                                  <span className="text-muted-foreground">{task.estimated_minutes}min</span>
                                  {isActive && tIdx === activeTaskIdx && !isDone && (
                                    <TaskTimer compact onTimeUpdate={() => {}} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              {/* Fixed Footer with actions */}
              {plan && !isLoading && !error && (
                <div className="shrink-0 p-4 border-t border-border flex items-center gap-2 bg-background rounded-b-2xl">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled={isExportingPdf}>
                        {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                        Exportar PDF
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="z-[60]">
                      <DropdownMenuItem onClick={() => handleExportPdf('landscape')}>A4 Horizontal (Paisagem)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportPdf('portrait')}>A4 Vertical (Retrato)</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleSavePlan} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Salvar Plano
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
