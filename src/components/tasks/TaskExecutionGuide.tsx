import { useState, useCallback, useEffect } from 'react';
import { Brain, Loader2, Play, X, Clock, FileDown, Save, ChevronDown, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '@/components/ui/Portal';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TaskTimer, formatTime } from './TaskTimer';
import { exportFocusPDF } from '@/services/pdfExportService';
import type { Task } from '@/hooks/useTasksUnified';
import { cn } from '@/lib/utils';
import { TaskSelectionStep } from './TaskSelectionStep';
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
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

function formatEstimatedTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getBlockStatus(bIdx: number, activeBlockIdx: number, blockCompleted: boolean): { label: string; className: string } {
  if (blockCompleted) return { label: 'Done', className: 'text-primary' };
  if (bIdx === activeBlockIdx) return { label: 'Active', className: 'text-white font-medium' };
  if (bIdx < activeBlockIdx) return { label: 'Done', className: 'text-primary' };
  if (bIdx === activeBlockIdx + 1) return { label: 'Queued', className: 'text-slate-400' };
  return { label: 'Scheduled', className: 'text-slate-600' };
}

function getIndicatorStyle(type: ExecutionBlock['type']): string {
  if (type === 'deep_work') return 'bg-[hsl(var(--primary))] shadow-[0_0_6px_rgba(0,115,153,0.5)]';
  if (type === 'shallow_work') return 'bg-slate-600';
  return 'bg-muted-foreground/50';
}

export function TaskExecutionGuide({ tasks, onComplete, externalOpen, onExternalOpenChange }: TaskExecutionGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [showSelection, setShowSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [activeBlockIdx, setActiveBlockIdx] = useState(0);
  const [activeTaskIdx, setActiveTaskIdx] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date());
  const [scheduleTime, setScheduleTime] = useState(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  });
  const pendingTasks = tasks.filter(t => t.status !== 'done');

  // Auto-advance blocks when all tasks in current block are done
  useEffect(() => {
    if (!plan) return;
    const currentBlock = plan.blocks[activeBlockIdx];
    if (!currentBlock) return;

    const allDone = (currentBlock.tasks || []).every(t => completedTasks.has(t.id));
    if (allDone && activeBlockIdx < plan.blocks.length - 1) {
      // Move to next block
      setActiveBlockIdx(prev => prev + 1);
      setActiveTaskIdx(0);
      setExpandedBlock(activeBlockIdx + 1);
      toast.info(`✅ Bloco "${currentBlock.title}" concluído! Avançando...`);
    }
  }, [completedTasks, plan, activeBlockIdx]);

  const openSelection = () => {
    setIsOpen(true);
    setShowSelection(true);
    setPlan(null);
    setError(null);
  };

  useEffect(() => {
    if (externalOpen) {
      openSelection();
      onExternalOpenChange?.(false);
    }
  }, [externalOpen]);

  const generatePlan = async (orderedIds: string[]) => {
    setShowSelection(false);
    setIsLoading(true);
    setError(null);
    const idSet = new Set(orderedIds);
    const tasksMap = new Map(pendingTasks.map(t => [t.id, t]));
    const tasksToSend = orderedIds.map(id => tasksMap.get(id)).filter(Boolean) as typeof pendingTasks;
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-execution-blocks', {
        body: {
          tasks: tasksToSend.map(t => ({
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
        const nextUnfinished = (currentBlock.tasks || []).findIndex(
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

  const handleScheduleToCalendar = async () => {
    if (!plan) return;
    setIsScheduling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const startDate = new Date(scheduleDate);
      const [hh, mm] = scheduleTime.split(':').map(Number);
      startDate.setHours(hh, mm, 0, 0);
      let cursor = startDate;
      const blockColors: Record<string, string> = {
        deep_work: '#007399',
        shallow_work: '#64748b',
        break: '#f59e0b',
      };

      const events = plan.blocks.map((block) => {
        const start = new Date(cursor);
        const end = new Date(start.getTime() + block.duration_minutes * 60 * 1000);
        cursor = end;
        const desc = (block.tasks || []).map(t => `• ${t.title} (${t.estimated_minutes}min)`).join('\n');
        return {
          title: `${block.type === 'break' ? '☕ ' : '🎯 '}${block.title}`,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          event_type: 'task',
          description: desc,
          color: blockColors[block.type] || '#007399',
          source: 'manual',
          provider: 'internal',
          workspace_id: '00000000-0000-0000-0000-000000000000',
        };
      });

      const { error } = await supabase.from('calendar_events').insert(events);
      if (error) throw error;
      toast.success('Blocos agendados no calendário!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao agendar no calendário');
    } finally {
      setIsScheduling(false);
    }
  };

  const totalTasks = plan?.blocks?.reduce((sum, b) => sum + (b.tasks?.length || 0), 0) || 0;
  const completedCount = completedTasks.size;
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

  return (
    <>
      <Button variant="outline" size="sm" onClick={openSelection} className="gap-1.5" disabled={pendingTasks.length === 0}>
        <Brain className="w-4 h-4" />
        <span className="hidden sm:inline">Modo Foco</span>
      </Button>

      <Portal>
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
              className="relative z-10 w-full max-w-5xl max-h-[70vh] my-auto flex flex-col rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl shadow-2xl"
              initial={{ scale: 0.95, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 16, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 z-20 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* HEADER */}
              <div className="shrink-0 px-6 pt-6 pb-4">
                <p className="text-[9px] uppercase tracking-[0.3em] text-primary/60 font-mono mb-2">
                  MODO FOCO · BLOCOS OTIMIZADOS COM IA
                  <span className="ml-4 text-muted-foreground/30">//HUB · {dateStr}</span>
                </p>

                <div className="flex items-end justify-between gap-6">
                  <h2 className="text-2xl font-light uppercase tracking-tight text-foreground">
                    Plano de Execução
                  </h2>

                  {plan && !isLoading && !error && (
                    <div className="flex items-center gap-0 border border-border/20 rounded-xl px-4 py-2">
                      <div className="text-center px-3">
                        <p className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50 font-mono">Blocos</p>
                        <p className="text-base font-light text-foreground">{plan.blocks.length}</p>
                      </div>
                      <div className="w-px h-6 bg-border/20" />
                      <div className="text-center px-3">
                        <p className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50 font-mono">Progresso</p>
                        <p className="text-base font-light text-foreground">{completedCount}/{totalTasks}</p>
                      </div>
                      <div className="w-px h-6 bg-border/20" />
                      <div className="text-center px-3">
                        <p className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50 font-mono">Tempo</p>
                        <p className="text-base font-light text-foreground">{formatEstimatedTime(plan.total_estimated_minutes)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CONTENT */}
              <div className="flex-1 overflow-y-auto min-h-0 px-6">
                {showSelection ? (
                  <TaskSelectionStep tasks={pendingTasks} onConfirm={generatePlan} />
                ) : isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
                    <p className="text-sm text-muted-foreground animate-pulse">Gerando plano de execução com IA...</p>
                    <p className="text-[10px] text-muted-foreground/40">Analisando {pendingTasks.length} tarefas</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <p className="text-sm text-destructive font-medium">Não foi possível gerar o plano</p>
                    <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
                    <Button variant="outline" size="sm" onClick={openSelection} className="gap-1.5 mt-2">
                      <Play className="w-3.5 h-3.5" /> Tentar novamente
                    </Button>
                  </div>
                ) : plan ? (
                  <div>
                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground/50 font-mono">Progresso Geral</span>
                        <span className="text-[9px] text-muted-foreground/40 font-mono">{totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}%</span>
                      </div>
                      <div className="w-full h-1 bg-border/15 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_140px_140px_100px] gap-2 px-3 pb-2 border-b border-border/10">
                      <span className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40 font-mono">Execução Estratégica</span>
                      <span className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40 font-mono">Método</span>
                      <span className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40 font-mono">Duração</span>
                      <span className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40 font-mono text-right">Status</span>
                    </div>

                    {plan.blocks.map((block, bIdx) => {
                      const tasks = block.tasks || [];
                      const blockCompleted = tasks.every(t => completedTasks.has(t.id));
                      const status = getBlockStatus(bIdx, activeBlockIdx, blockCompleted);
                      const isExpanded = expandedBlock === bIdx;
                      const methodLabel = block.type === 'break' ? 'BREAK' : block.type === 'deep_work' ? 'DEEP WORK' : 'SHALLOW WORK';
                      const blockDoneCount = tasks.filter(t => completedTasks.has(t.id)).length;

                      return (
                        <div key={block.id}>
                          <div
                            className={cn(
                              "grid grid-cols-[1fr_140px_140px_100px] gap-2 items-center px-3 py-3 border-b border-border/5 cursor-pointer transition-all duration-300",
                              bIdx === activeBlockIdx ? "bg-primary/5" : "hover:bg-accent/10"
                            )}
                            onClick={() => setExpandedBlock(isExpanded ? null : bIdx)}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", getIndicatorStyle(block.type))} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-[12px] font-medium text-foreground/80 truncate">{block.title}</p>
                                  <span className="text-[9px] text-muted-foreground/40 font-mono">{blockDoneCount}/{tasks.length}</span>
                                  <ChevronDown className={cn("w-3 h-3 text-muted-foreground/30 transition-transform shrink-0", isExpanded && "rotate-180")} />
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground/50 tracking-wider">{methodLabel}</span>
                            <span className="text-[10px] font-mono text-muted-foreground/50">{block.technique} {block.duration_minutes}min</span>
                            <span className={cn("text-[10px] font-mono text-right", status.className)}>{status.label}</span>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                                className="overflow-hidden bg-accent/5 border-b border-border/5"
                              >
                                <div className="px-3 py-2 pl-10 space-y-1">
                                  {tasks.map((task, tIdx) => {
                                    const isDone = completedTasks.has(task.id);
                                    return (
                                      <div
                                        key={task.id}
                                        className={cn(
                                          "flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-xs transition-all",
                                          isDone ? "opacity-35 line-through" : "hover:bg-accent/10"
                                        )}
                                      >
                                        <button
                                          onClick={(e) => { e.stopPropagation(); if (!isDone) completeTask(task.id); }}
                                          className={cn(
                                            "w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-all",
                                            isDone ? "bg-primary border-primary" : "border-border/40 hover:border-primary/50"
                                          )}
                                        />
                                        <span className="flex-1 text-[11px] text-foreground/70 font-medium">{task.title}</span>
                                        <span className="text-[9px] text-muted-foreground/40 font-mono">{task.estimated_minutes}min</span>
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
                <div className="shrink-0 px-6 py-4 border-t border-border/10">
                  {(plan.tips?.length ?? 0) > 0 && (
                    <div className="mb-3">
                      <p className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40 font-mono mb-2">Dicas de Produtividade</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {plan.tips.map((tip, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground/60 leading-relaxed">
                            <span className="text-primary/50 mr-1 font-mono">&gt;</span>
                            {tip}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground/30 font-mono">
                      powered by <span className="text-muted-foreground/40">SQUAD///HUB</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1.5 text-[9px] border-border/20" disabled={isExportingPdf}>
                            {isExportingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                            Exportar PDF
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="z-[60]">
                          <DropdownMenuItem onClick={() => handleExportPdf('landscape')}>A4 Horizontal</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportPdf('portrait')}>A4 Vertical</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-[9px] border-border/20"
                        onClick={handleSavePlan}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Salvar Plano
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1.5 text-[9px] border-border/20" disabled={isScheduling}>
                            {isScheduling ? <Loader2 className="w-3 h-3 animate-spin" /> : <CalendarPlus className="w-3 h-3" />}
                            Agendar
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[60]" align="end">
                          <div className="p-3 space-y-3">
                            <p className="text-xs font-medium text-foreground">Início dos blocos</p>
                            <Calendar
                              mode="single"
                              selected={scheduleDate}
                              onSelect={(d) => d && setScheduleDate(d)}
                              className="p-2 pointer-events-auto"
                              initialFocus
                            />
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-muted-foreground">Horário:</label>
                              <input
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs text-foreground"
                              />
                            </div>
                            <Button size="sm" className="w-full gap-1.5 text-xs hover-invert" onClick={handleScheduleToCalendar} disabled={isScheduling}>
                              {isScheduling ? <Loader2 className="w-3 h-3 animate-spin" /> : <CalendarPlus className="w-3 h-3" />}
                              Confirmar
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
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
