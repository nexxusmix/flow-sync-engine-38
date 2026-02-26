import { useState, useCallback, useEffect } from 'react';
import { Brain, Loader2, Play, X, Clock, FileDown, Save, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

function formatEstimatedTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getBlockStatus(bIdx: number, activeBlockIdx: number, blockCompleted: boolean): { label: string; className: string } {
  if (blockCompleted) return { label: 'Done', className: 'text-emerald-400' };
  if (bIdx === activeBlockIdx) return { label: 'Active', className: 'text-white font-medium' };
  if (bIdx < activeBlockIdx) return { label: 'Done', className: 'text-emerald-400' };
  if (bIdx === activeBlockIdx + 1) return { label: 'Queued', className: 'text-slate-400' };
  return { label: 'Scheduled', className: 'text-slate-600' };
}

function getIndicatorStyle(type: ExecutionBlock['type']): string {
  if (type === 'deep_work') return 'bg-[hsl(var(--primary))] shadow-[0_0_6px_rgba(0,115,153,0.5)]';
  if (type === 'shallow_work') return 'bg-slate-600';
  return 'bg-amber-500/50';
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
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);

  const pendingTasks = tasks.filter(t => t.status !== 'done');

  // Auto-advance blocks when all tasks in current block are done
  useEffect(() => {
    if (!plan) return;
    const currentBlock = plan.blocks[activeBlockIdx];
    if (!currentBlock) return;

    const allDone = currentBlock.tasks.every(t => completedTasks.has(t.id));
    if (allDone && activeBlockIdx < plan.blocks.length - 1) {
      // Move to next block
      setActiveBlockIdx(prev => prev + 1);
      setActiveTaskIdx(0);
      setExpandedBlock(activeBlockIdx + 1);
      toast.info(`✅ Bloco "${currentBlock.title}" concluído! Avançando...`);
    }
  }, [completedTasks, plan, activeBlockIdx]);

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
      setExpandedBlock(0); // Auto-expand first block
    } catch (err: any) {
      const msg = err.message || 'Erro ao gerar plano';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const completeTask = useCallback((taskId: string) => {
    setCompletedTasks(prev => {
      const next = new Set([...prev, taskId]);
      return next;
    });

    // Advance activeTaskIdx within the current block
    if (plan) {
      const currentBlock = plan.blocks[activeBlockIdx];
      if (currentBlock) {
        const nextUnfinished = currentBlock.tasks.findIndex(
          (t, idx) => idx > activeTaskIdx && !completedTasks.has(t.id) && t.id !== taskId
        );
        if (nextUnfinished >= 0) {
          setActiveTaskIdx(nextUnfinished);
        }
      }
    }

    // Persist to real task
    onComplete?.(taskId);
    toast.success('Tarefa concluída!');
  }, [onComplete, plan, activeBlockIdx, activeTaskIdx, completedTasks]);

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

  const totalTasks = plan?.blocks?.reduce((sum, b) => sum + (b.tasks?.length || 0), 0) || 0;
  const completedCount = completedTasks.size;
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

            <motion.div
              className="relative z-10 w-full max-w-5xl max-h-[70vh] my-auto flex flex-col rounded-3xl border border-[rgba(0,115,153,0.25)] bg-black/90 backdrop-blur-[20px] shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]"
              style={{
                backgroundImage: 'radial-gradient(rgba(0,115,153,0.05) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 z-20 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* HEADER */}
              <div className="shrink-0 px-8 pt-8 pb-6">
                <p
                  className="text-[9px] uppercase tracking-[0.3em] text-[hsl(var(--primary))]/70 font-mono mb-3"
                  style={{ textShadow: '1px 0 0 rgba(255,255,255,0.05), -1px 0 0 rgba(0,115,153,0.3)' }}
                >
                  MODO FOCO · BLOCOS OTIMIZADOS COM IA
                  <span className="ml-4 text-slate-600">//HUB · {dateStr}</span>
                </p>

                <div className="flex items-end justify-between gap-6">
                  <h2
                    className="text-3xl font-bold uppercase tracking-tight text-white"
                    style={{ textShadow: '1px 0 0 rgba(255,255,255,0.05), -1px 0 0 rgba(0,115,153,0.3)' }}
                  >
                    Plano de Execução
                  </h2>

                  {plan && !isLoading && !error && (
                    <div className="flex items-center gap-0 bg-[rgba(0,115,153,0.07)] border border-[rgba(0,115,153,0.15)] rounded-xl px-5 py-2.5">
                      <div className="text-center px-4">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-mono">Blocos</p>
                        <p className="text-lg font-semibold text-white">{plan.blocks.length}</p>
                      </div>
                      <div className="w-px h-8 bg-[rgba(0,115,153,0.2)]" />
                      <div className="text-center px-4">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-mono">Progresso</p>
                        <p className="text-lg font-semibold text-white">{completedCount}/{totalTasks}</p>
                      </div>
                      <div className="w-px h-8 bg-[rgba(0,115,153,0.2)]" />
                      <div className="text-center px-4">
                        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-mono">Tempo</p>
                        <p className="text-lg font-semibold text-white">{formatEstimatedTime(plan.total_estimated_minutes)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CONTENT */}
              <div className="flex-1 overflow-y-auto min-h-0 px-8">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
                    <p className="text-sm text-slate-400 animate-pulse">Gerando plano de execução com IA...</p>
                    <p className="text-[10px] text-slate-600">Analisando {pendingTasks.length} tarefas · Neurociência + Produtividade</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <p className="text-sm text-red-400 font-medium">Não foi possível gerar o plano</p>
                    <p className="text-xs text-slate-500 max-w-xs">{error}</p>
                    <Button variant="outline" size="sm" onClick={generatePlan} className="gap-1.5 mt-2 border-[rgba(0,115,153,0.25)] bg-transparent text-white hover:bg-[rgba(0,115,153,0.1)]">
                      <Play className="w-3.5 h-3.5" /> Tentar novamente
                    </Button>
                  </div>
                ) : plan ? (
                  <div>
                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-mono">Progresso Geral</span>
                        <span className="text-[10px] text-slate-400 font-mono">{totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-emerald-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_140px_140px_100px] gap-2 px-4 pb-3 border-b border-white/[0.04]">
                      <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-mono">Execução Estratégica</span>
                      <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-mono">Método</span>
                      <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-mono">Duração</span>
                      <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-mono text-right">Status</span>
                    </div>

                    {plan.blocks.map((block, bIdx) => {
                      const blockCompleted = block.tasks.every(t => completedTasks.has(t.id));
                      const status = getBlockStatus(bIdx, activeBlockIdx, blockCompleted);
                      const isExpanded = expandedBlock === bIdx;
                      const methodLabel = block.type === 'break' ? 'BREAK' : block.type === 'deep_work' ? 'DEEP WORK' : 'SHALLOW WORK';
                      const blockDoneCount = block.tasks.filter(t => completedTasks.has(t.id)).length;

                      return (
                        <div key={block.id}>
                          <div
                            className={cn(
                              "grid grid-cols-[1fr_140px_140px_100px] gap-2 items-center px-4 py-3.5 border-b border-white/[0.03] cursor-pointer transition-all duration-300",
                              bIdx === activeBlockIdx ? "bg-[rgba(0,115,153,0.08)]" : "hover:bg-[rgba(0,115,153,0.04)]"
                            )}
                            onClick={() => setExpandedBlock(isExpanded ? null : bIdx)}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", getIndicatorStyle(block.type))} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-[13px] font-medium text-white/90 truncate">{block.title}</p>
                                  <span className="text-[10px] text-slate-500 font-mono">{blockDoneCount}/{block.tasks.length}</span>
                                  <ChevronDown className={cn("w-3.5 h-3.5 text-slate-600 transition-transform shrink-0", isExpanded && "rotate-180")} />
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 tracking-wider">{methodLabel}</span>
                            <span className="text-[11px] font-mono text-slate-400">{block.technique} {block.duration_minutes}min</span>
                            <span className={cn("text-[11px] font-mono text-right", status.className)}>{status.label}</span>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden bg-[rgba(0,115,153,0.04)] border-b border-white/[0.03]"
                              >
                                <div className="px-4 py-3 pl-12 space-y-1.5">
                                  {block.tasks.map((task, tIdx) => {
                                    const isDone = completedTasks.has(task.id);
                                    return (
                                      <div
                                        key={task.id}
                                        className={cn(
                                          "flex items-center gap-3 py-2 px-3 rounded-lg text-xs transition-all",
                                          isDone ? "opacity-50 line-through" : "hover:bg-[rgba(0,115,153,0.06)]"
                                        )}
                                      >
                                        <button
                                          onClick={(e) => { e.stopPropagation(); if (!isDone) completeTask(task.id); }}
                                          className={cn(
                                            "w-4 h-4 rounded-full border-2 shrink-0 transition-all",
                                            isDone ? "bg-emerald-500 border-emerald-500" : "border-slate-600 hover:border-[hsl(var(--primary))]"
                                          )}
                                        />
                                        <span className="flex-1 text-[12px] text-white/80 font-medium">{task.title}</span>
                                        <span className="text-[10px] text-slate-500 font-mono">{task.estimated_minutes}min</span>
                                        {bIdx === activeBlockIdx && tIdx === activeTaskIdx && !isDone && (
                                          <TaskTimer compact onTimeUpdate={() => {}} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {/* FOOTER */}
              {plan && !isLoading && !error && (
                <div className="shrink-0 px-8 py-5 border-t border-white/[0.04]">
                  {(plan.tips?.length ?? 0) > 0 && (
                    <div className="mb-4">
                      <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-mono mb-2.5">Dicas de Produtividade</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {plan.tips.map((tip, i) => (
                          <p key={i} className="text-[11px] text-slate-400 leading-relaxed">
                            <span className="text-[hsl(var(--primary))] mr-1.5 font-mono">&gt;</span>
                            {tip}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-600 font-mono">
                      powered by <span className="text-slate-500">SQUAD///FILM</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-[10px] border-[rgba(0,115,153,0.2)] bg-transparent text-slate-400 hover:bg-[rgba(0,115,153,0.1)] hover:text-white"
                            disabled={isExportingPdf}
                          >
                            {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                            Exportar PDF
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="z-[60]">
                          <DropdownMenuItem onClick={() => handleExportPdf('landscape')}>A4 Horizontal (Paisagem)</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportPdf('portrait')}>A4 Vertical (Retrato)</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-[10px] border-[rgba(0,115,153,0.2)] bg-transparent text-slate-400 hover:bg-[rgba(0,115,153,0.1)] hover:text-white"
                        onClick={handleSavePlan}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Salvar Plano
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
