import { useState, useEffect, useCallback, useMemo } from 'react';
import { Brain, Loader2, Trash2, FileDown, Clock, CheckCircle2, RotateCcw, Archive, Maximize2, Minimize2, Play, Pause, RotateCw, CheckSquare, Square, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { exportFocusPDF } from '@/services/pdfExportService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasksUnified } from '@/hooks/useTasksUnified';
import { isToday, parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FocusPlan {
  id: string;
  title: string;
  plan_data: any;
  completed_tasks: string[];
  status: string;
  created_at: string;
}

// ── Pomodoro Timer ──────────────────────────────────────
function PomodoroTimer({ className, durationMinutes, blockLabel }: { className?: string; durationMinutes?: number; blockLabel?: string }) {
  const workDuration = durationMinutes || 25;
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [remaining, setRemaining] = useState(workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  // Reset timer when durationMinutes changes
  useEffect(() => {
    if (mode === 'work') {
      setRemaining(workDuration * 60);
      setIsRunning(false);
    }
  }, [workDuration]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          if (mode === 'work') {
            setSessions(s => s + 1);
            setMode('break');
            toast.success('🎉 Sessão completa! Hora de descansar.');
            return 5 * 60;
          } else {
            setMode('work');
            toast.info('💪 Descanso acabou! Hora de focar.');
            return workDuration * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode, workDuration]);

  const reset = () => {
    setIsRunning(false);
    setRemaining(mode === 'work' ? workDuration * 60 : 5 * 60);
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const totalSecs = mode === 'work' ? workDuration * 60 : 5 * 60;
  const pct = ((totalSecs - remaining) / totalSecs) * 100;

  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]", className)}>
      <div className="relative w-14 h-14 shrink-0">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted-foreground/10" />
          <circle
            cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
            className={mode === 'work' ? 'text-primary' : 'text-emerald-500'}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-semibold">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{mode === 'work' ? (blockLabel ? `🔥 ${blockLabel}` : '🔥 Foco') : '☕ Descanso'}</p>
        <p className="text-[10px] text-muted-foreground">{sessions} sessão{sessions !== 1 ? 'ões' : ''} · {workDuration}min</p>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={reset}>
          <RotateCw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Today Tasks Panel ───────────────────────────────────
function TodayTasksPanel({ onAllComplete }: { onAllComplete: () => void }) {
  const { tasks, toggleComplete } = useTasksUnified();

  // BUG FIX: Include tasks completed today (status=done + completed_at is today)
  const todayTasks = useMemo(
    () => tasks.filter(t =>
      t.status === 'today' ||
      (t.status === 'done' && t.completed_at && isToday(parseISO(t.completed_at)))
    ),
    [tasks]
  );

  const completedCount = todayTasks.filter(t => t.status === 'done').length;
  const total = todayTasks.length;
  const allDone = total > 0 && completedCount === total;

  useEffect(() => {
    if (allDone) onAllComplete();
  }, [allDone, onAllComplete]);

  if (todayTasks.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground font-light">Nenhuma tarefa para hoje</p>
        <p className="text-xs text-muted-foreground/50 mt-1">Mova tarefas para "Hoje" no quadro</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-light">Tarefas de Hoje</h4>
        <span className="text-[10px] text-muted-foreground/50">{completedCount}/{total}</span>
      </div>
      <Progress value={total > 0 ? (completedCount / total) * 100 : 0} className="h-1.5" />
      <div className="space-y-1">
        {todayTasks.map(t => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-2 p-2.5 rounded-lg transition-colors",
              "bg-white/[0.02] border border-white/[0.04]",
              t.status === 'done' && "opacity-50"
            )}
          >
            <button onClick={() => toggleComplete(t.id)} className="shrink-0">
              {t.status === 'done' ? (
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              ) : (
                <Square className="w-4 h-4 text-muted-foreground/40 hover:text-foreground transition-colors" />
              )}
            </button>
            <span className={cn("text-sm flex-1", t.status === 'done' && "line-through text-muted-foreground")}>
              {t.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Confetti ────────────────────────────────────────────
function ConfettiCelebration({ show }: { show: boolean }) {
  if (!show) return null;

  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#34D399', '#F472B6'][Math.floor(Math.random() * 6)],
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-3 rounded-sm"
          style={{ left: `${p.x}%`, backgroundColor: p.color }}
          initial={{ top: '-5%', rotate: 0, opacity: 1 }}
          animate={{ top: '110%', rotate: p.rotation + 720, opacity: 0 }}
          transition={{ duration: 2 + Math.random(), delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────
export function SavedFocusPlans() {
  const [plans, setPlans] = useState<FocusPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeExecutionPlanId, setActiveExecutionPlanId] = useState<string | null>(null);

  const { toggleComplete } = useTasksUnified();

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_focus_plans')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPlans((data || []).map(p => ({
        ...p,
        completed_tasks: Array.isArray(p.completed_tasks) ? p.completed_tasks as string[] : [],
      })));
    } catch {
      toast.error('Erro ao carregar planos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await supabase.from('saved_focus_plans').delete().eq('id', deleteId);
      setPlans(prev => prev.filter(p => p.id !== deleteId));
      toast.success('Plano excluído');
    } catch { toast.error('Erro ao excluir'); }
    setDeleteId(null);
  };

  const handleArchive = async (id: string) => {
    try {
      await supabase.from('saved_focus_plans').update({ status: 'archived' }).eq('id', id);
      setPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'archived' } : p));
      toast.success('Plano arquivado');
    } catch { toast.error('Erro ao arquivar'); }
  };

  const handleRestore = async (id: string) => {
    try {
      await supabase.from('saved_focus_plans').update({ status: 'active' }).eq('id', id);
      setPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'active' } : p));
      toast.success('Plano restaurado');
    } catch { toast.error('Erro ao restaurar'); }
  };

  // Toggle task completion within a saved plan — persists to DB + syncs real task
  const handleToggleTaskInPlan = async (planId: string, taskId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const wasCompleted = plan.completed_tasks.includes(taskId);
    const newCompleted = wasCompleted
      ? plan.completed_tasks.filter(id => id !== taskId)
      : [...plan.completed_tasks, taskId];

    // Optimistic update
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, completed_tasks: newCompleted } : p));

    // Persist to DB
    try {
      await supabase
        .from('saved_focus_plans')
        .update({ completed_tasks: newCompleted as any })
        .eq('id', planId);

      // Also toggle the real task status
      toggleComplete(taskId);

      if (!wasCompleted) {
        toast.success('Tarefa concluída!');
      }
    } catch {
      // Rollback
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, completed_tasks: plan.completed_tasks } : p));
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const handleAllComplete = useCallback(() => {
    setShowConfetti(true);
    toast.success('🎉 Todas as tarefas de hoje concluídas!');
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const blockTypeConfig: Record<string, { color: string; bg: string }> = {
    deep_work: { color: 'text-purple-500', bg: 'bg-purple-500/10' },
    shallow_work: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
    break: { color: 'text-green-500', bg: 'bg-green-500/10' },
  };

  const activePlans = plans.filter(p => p.status === 'active');
  const archivedPlans = plans.filter(p => p.status === 'archived');

  // Get active execution plan's current block for Pomodoro
  const activeExecPlan = activeExecutionPlanId ? plans.find(p => p.id === activeExecutionPlanId) : null;
  const activeBlock = useMemo(() => {
    if (!activeExecPlan) return null;
    const blocks = activeExecPlan.plan_data?.blocks || [];
    // Find first block with incomplete tasks
    for (const block of blocks) {
      const hasIncomplete = block.tasks?.some((t: any) => !activeExecPlan.completed_tasks.includes(t.id));
      if (hasIncomplete) return block;
    }
    return blocks[0] || null;
  }, [activeExecPlan]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderPlanCard = (plan: FocusPlan) => {
    const blocks = plan.plan_data?.blocks || [];
    const totalTasks = blocks.reduce((s: number, b: any) => s + (b.tasks?.length || 0), 0);
    const completedCount = plan.completed_tasks.length;
    const progressPct = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
    const totalMinutes = plan.plan_data?.total_estimated_minutes || 0;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
    const isExpanded = expandedId === plan.id;
    const isExecuting = activeExecutionPlanId === plan.id;
    const dateStr = new Date(plan.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const allDone = totalTasks > 0 && completedCount === totalTasks;

    return (
      <motion.div
        key={plan.id}
        className={cn(
          "rounded-xl border bg-card p-4 space-y-3 transition-all hover:border-primary/20",
          isExecuting ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
        )}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : plan.id)}>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">{plan.title}</h3>
              {allDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Resume / Execute button */}
            {plan.status === 'active' && !allDone && (
              <Button
                variant={isExecuting ? "default" : "outline"}
                size="sm"
                className="h-7 text-[10px] gap-1"
                onClick={() => setActiveExecutionPlanId(isExecuting ? null : plan.id)}
              >
                <Play className="w-3 h-3" />
                {isExecuting ? 'Pausar' : 'Retomar'}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <FileDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportFocusPDF(plan.plan_data, 'landscape')}>PDF Horizontal</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportFocusPDF(plan.plan_data, 'portrait')}>PDF Vertical</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {plan.status === 'active' ? (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleArchive(plan.id)}>
                <Archive className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleRestore(plan.id)}>
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteId(plan.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> {blocks.length} blocos</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {completedCount}/{totalTasks}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeStr}</span>
        </div>
        <Progress value={progressPct} className="h-1.5" />

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="space-y-2 pt-2 border-t border-border"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {blocks.map((block: any, bIdx: number) => {
                const cfg = blockTypeConfig[block.type] || blockTypeConfig.shallow_work;
                return (
                  <div key={block.id || bIdx} className={cn("rounded-lg p-2.5 space-y-1", cfg.bg)}>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-semibold", cfg.color)}>{block.title}</span>
                      <span className="text-[10px] text-muted-foreground">{block.duration_minutes}min</span>
                    </div>
                    {block.tasks?.map((task: any) => {
                      const isDone = plan.completed_tasks.includes(task.id);
                      return (
                        <div
                          key={task.id}
                          className={cn("flex items-center gap-2 text-xs cursor-pointer group", isDone && "line-through text-muted-foreground")}
                          onClick={() => plan.status === 'active' && handleToggleTaskInPlan(plan.id, task.id)}
                        >
                          <button className="shrink-0">
                            {isDone ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                            )}
                          </button>
                          <span className="flex-1">{task.title}</span>
                          <span className="text-muted-foreground">{task.estimated_minutes}min</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <ConfettiCelebration show={showConfetti} />

      {/* Focus toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Modo Foco</h3>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          {isFullscreen ? 'Sair' : 'Tela cheia'}
        </Button>
      </div>

      {/* Pomodoro + Today tasks side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        <PomodoroTimer
          durationMinutes={activeBlock?.duration_minutes}
          blockLabel={activeBlock?.title}
        />
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <TodayTasksPanel onAllComplete={handleAllComplete} />
        </div>
      </div>

      {/* Saved plans */}
      {activePlans.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Planos Ativos</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activePlans.map(renderPlanCard)}
          </div>
        </div>
      )}

      {plans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Brain className="w-10 h-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nenhum plano de foco salvo</p>
          <p className="text-xs text-muted-foreground max-w-xs">Use o <strong>Modo Foco</strong> para gerar um plano e salve-o aqui.</p>
        </div>
      )}

      {archivedPlans.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Arquivados</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 opacity-60">
            {archivedPlans.map(renderPlanCard)}
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano de foco?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
