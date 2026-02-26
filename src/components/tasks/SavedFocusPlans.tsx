import { useState, useEffect, useCallback, useMemo } from 'react';
import { Brain, Loader2, Trash2, FileDown, Clock, CheckCircle2, RotateCcw, Archive, Maximize2, Minimize2, Play, Pause, RotateCw, CheckSquare, Square, PartyPopper, Sparkles, Zap, Target, Timer, Flame } from 'lucide-react';
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

// ── Premium Pomodoro Timer ──────────────────────────────────
function PomodoroTimer({ className, durationMinutes, blockLabel }: { className?: string; durationMinutes?: number; blockLabel?: string }) {
  const workDuration = durationMinutes || 25;
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [remaining, setRemaining] = useState(workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

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
  const circumference = 2 * Math.PI * 44;

  return (
    <motion.div
      className={cn(
        "relative group rounded-2xl border border-border/50 overflow-hidden transition-all duration-500",
        "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl",
        "hover:border-primary/30 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]",
        isRunning && "border-primary/40 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.2)]",
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Ambient glow when running */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-primary/[0.02]" />
            <motion.div
              className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 p-5 flex items-center gap-5">
        {/* Circular Progress */}
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-24 h-24 -rotate-90 drop-shadow-lg" viewBox="0 0 96 96">
            {/* Background track */}
            <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
            {/* Glow filter */}
            <defs>
              <filter id="glow-timer">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Progress arc */}
            <motion.circle
              cx="48" cy="48" r="44" fill="none"
              stroke="currentColor" strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              className={mode === 'work' ? 'text-primary' : 'text-emerald-500'}
              strokeLinecap="round"
              filter="url(#glow-timer)"
              initial={false}
              animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
              transition={{ duration: 0.5 }}
            />
            {/* Dot indicator */}
            {pct > 0 && (
              <motion.circle
                cx="48" cy="4" r="3" fill="currentColor"
                className={mode === 'work' ? 'text-primary' : 'text-emerald-500'}
                filter="url(#glow-timer)"
                style={{
                  transformOrigin: '48px 48px',
                  rotate: `${pct * 3.6}deg`,
                }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="font-mono text-2xl font-bold tracking-tight"
              key={remaining}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.1 }}
            >
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </motion.span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <motion.div
                className={cn(
                  "w-2 h-2 rounded-full",
                  mode === 'work' ? "bg-primary" : "bg-emerald-500",
                  isRunning && "shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                )}
                animate={isRunning ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80">
                {mode === 'work' ? (blockLabel || 'Foco') : 'Descanso'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-primary/60" />
              {sessions} sessão{sessions !== 1 ? 'ões' : ''} · {workDuration}min cada
            </p>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <motion.button
              onClick={() => setIsRunning(!isRunning)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300",
                isRunning
                  ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              )}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isRunning ? 'Pausar' : 'Iniciar'}
            </motion.button>
            <motion.button
              onClick={reset}
              className="p-2 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/50 transition-all duration-200"
              whileHover={{ scale: 1.05, rotate: -90 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Today Tasks Panel ───────────────────────────────────
function TodayTasksPanel({ onAllComplete }: { onAllComplete: () => void }) {
  const { tasks, toggleComplete } = useTasksUnified();

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
      <div className="text-center py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted/30 mb-3"
        >
          <Target className="w-5 h-5 text-muted-foreground/50" />
        </motion.div>
        <p className="text-sm text-muted-foreground font-light">Nenhuma tarefa para hoje</p>
        <p className="text-xs text-muted-foreground/50 mt-1">Mova tarefas para "Hoje" no quadro</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary/70" />
          <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Tarefas de Hoje</h4>
        </div>
        <span className="text-[10px] text-muted-foreground/50 font-mono">{completedCount}/{total}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/70"
          initial={{ width: 0 }}
          animate={{ width: `${total > 0 ? (completedCount / total) * 100 : 0}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {/* Shimmer on progress */}
        <motion.div
          className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ left: ['-20%', '120%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
        />
      </div>
      <div className="space-y-1">
        {todayTasks.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              "flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-300 group cursor-pointer",
              "border border-transparent",
              t.status === 'done'
                ? "opacity-50"
                : "hover:bg-accent/40 hover:border-border/50 hover:shadow-sm"
            )}
            onClick={() => toggleComplete(t.id)}
          >
            <div className="shrink-0 relative">
              {t.status === 'done' ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                </motion.div>
              ) : (
                <Square className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/70 transition-colors duration-200" />
              )}
            </div>
            <span className={cn(
              "text-sm flex-1 transition-all duration-200",
              t.status === 'done' && "line-through text-muted-foreground"
            )}>
              {t.title}
            </span>
          </motion.div>
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

  const handleToggleTaskInPlan = async (planId: string, taskId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const wasCompleted = plan.completed_tasks.includes(taskId);
    const newCompleted = wasCompleted
      ? plan.completed_tasks.filter(id => id !== taskId)
      : [...plan.completed_tasks, taskId];

    setPlans(prev => prev.map(p => p.id === planId ? { ...p, completed_tasks: newCompleted } : p));

    try {
      await supabase
        .from('saved_focus_plans')
        .update({ completed_tasks: newCompleted as any })
        .eq('id', planId);
      toggleComplete(taskId);
      if (!wasCompleted) toast.success('Tarefa concluída!');
    } catch {
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

  const blockTypeConfig: Record<string, { color: string; bg: string; icon: typeof Brain; glow: string }> = {
    deep_work: { color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Brain, glow: 'shadow-purple-500/10' },
    shallow_work: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Zap, glow: 'shadow-blue-500/10' },
    break: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Timer, glow: 'shadow-emerald-500/10' },
  };

  const activePlans = plans.filter(p => p.status === 'active');
  const archivedPlans = plans.filter(p => p.status === 'archived');

  const activeExecPlan = activeExecutionPlanId ? plans.find(p => p.id === activeExecutionPlanId) : null;
  const activeBlock = useMemo(() => {
    if (!activeExecPlan) return null;
    const blocks = activeExecPlan.plan_data?.blocks || [];
    for (const block of blocks) {
      const hasIncomplete = block.tasks?.some((t: any) => !activeExecPlan.completed_tasks.includes(t.id));
      if (hasIncomplete) return block;
    }
    return blocks[0] || null;
  }, [activeExecPlan]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Brain className="w-8 h-8 text-primary/50" />
        </motion.div>
        <motion.p
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Carregando planos de foco...
        </motion.p>
      </div>
    );
  }

  const renderPlanCard = (plan: FocusPlan, index: number) => {
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
          "group relative rounded-2xl border overflow-hidden transition-all duration-500",
          "bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl",
          isExecuting
            ? "border-primary/40 shadow-[0_0_40px_-8px_hsl(var(--primary)/0.25)]"
            : "border-border/50 hover:border-primary/20 hover:shadow-[0_8px_30px_-10px_hsl(var(--primary)/0.15)]"
        )}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: index * 0.06, duration: 0.4 }}
        whileHover={{ y: -2 }}
      >
        {/* Top accent line */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-px transition-all duration-500",
          isExecuting
            ? "bg-gradient-to-r from-transparent via-primary to-transparent"
            : "bg-gradient-to-r from-transparent via-border to-transparent group-hover:via-primary/50"
        )} />

        <div className="relative z-10 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : plan.id)}>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary/90 transition-colors duration-300">
                  {plan.title}
                </h3>
                {allDone && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                  </motion.div>
                )}
              </div>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{dateStr}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {plan.status === 'active' && !allDone && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={isExecuting ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-7 text-[10px] gap-1 rounded-lg",
                      isExecuting && "shadow-lg shadow-primary/20"
                    )}
                    onClick={() => setActiveExecutionPlanId(isExecuting ? null : plan.id)}
                  >
                    <Play className="w-3 h-3" />
                    {isExecuting ? 'Pausar' : 'Retomar'}
                  </Button>
                </motion.div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-accent/50">
                    <FileDown className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportFocusPDF(plan.plan_data, 'landscape')}>PDF Horizontal</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportFocusPDF(plan.plan_data, 'portrait')}>PDF Vertical</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {plan.status === 'active' ? (
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-accent/50" onClick={() => handleArchive(plan.id)}>
                  <Archive className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-accent/50" onClick={() => handleRestore(plan.id)}>
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(plan.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3">
            {[
              { icon: Brain, label: `${blocks.length} blocos`, color: 'text-primary/70' },
              { icon: CheckCircle2, label: `${completedCount}/${totalTasks}`, color: 'text-emerald-500/70' },
              { icon: Clock, label: timeStr, color: 'text-muted-foreground' },
            ].map((stat, si) => (
              <div key={si} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <stat.icon className={cn("w-3 h-3", stat.color)} />
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="relative h-1.5 rounded-full bg-muted/20 overflow-hidden">
            <motion.div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full",
                allDone
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : "bg-gradient-to-r from-primary to-primary/70"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>

          {/* Expanded blocks */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className="space-y-2 pt-3 border-t border-border/30"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {blocks.map((block: any, bIdx: number) => {
                  const cfg = blockTypeConfig[block.type] || blockTypeConfig.shallow_work;
                  const BlockIcon = cfg.icon;
                  return (
                    <motion.div
                      key={block.id || bIdx}
                      className={cn(
                        "rounded-xl p-3 space-y-1.5 border border-transparent transition-all duration-300",
                        cfg.bg,
                        `hover:border-${block.type === 'deep_work' ? 'purple' : block.type === 'break' ? 'emerald' : 'blue'}-500/20`,
                        `hover:shadow-lg ${cfg.glow}`
                      )}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: bIdx * 0.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BlockIcon className={cn("w-3.5 h-3.5", cfg.color)} />
                          <span className={cn("text-xs font-semibold", cfg.color)}>{block.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{block.duration_minutes}min</span>
                      </div>
                      {block.tasks?.map((task: any) => {
                        const isDone = plan.completed_tasks.includes(task.id);
                        return (
                          <motion.div
                            key={task.id}
                            className={cn(
                              "flex items-center gap-2 text-xs cursor-pointer group/task py-1 px-1 rounded-lg transition-all duration-200",
                              isDone ? "opacity-50" : "hover:bg-background/50"
                            )}
                            onClick={() => plan.status === 'active' && handleToggleTaskInPlan(plan.id, task.id)}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="shrink-0">
                              {isDone ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                                </motion.div>
                              ) : (
                                <Square className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/task:text-foreground transition-colors" />
                              )}
                            </div>
                            <span className={cn("flex-1", isDone && "line-through")}>{task.title}</span>
                            <span className="text-muted-foreground/50 font-mono">{task.estimated_minutes}min</span>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      <ConfettiCelebration show={showConfetti} />

      {/* Focus toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10"
            animate={{ boxShadow: ['0 0 0 0 hsl(var(--primary) / 0)', '0 0 0 8px hsl(var(--primary) / 0.1)', '0 0 0 0 hsl(var(--primary) / 0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </motion.div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Modo Foco</h3>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs hover:bg-accent/50 rounded-xl" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          {isFullscreen ? 'Sair' : 'Tela cheia'}
        </Button>
      </div>

      {/* Pomodoro + Today tasks */}
      <div className="grid gap-4 md:grid-cols-2">
        <PomodoroTimer
          durationMinutes={activeBlock?.duration_minutes}
          blockLabel={activeBlock?.title}
        />
        <motion.div
          className="rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-5 hover:border-primary/20 hover:shadow-[0_8px_30px_-10px_hsl(var(--primary)/0.1)] transition-all duration-500"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <TodayTasksPanel onAllComplete={handleAllComplete} />
        </motion.div>
      </div>

      {/* Saved plans */}
      {activePlans.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-primary/60" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Planos Ativos</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">{activePlans.length}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activePlans.map((p, i) => renderPlanCard(p, i))}
          </div>
        </div>
      )}

      {plans.length === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center py-16 gap-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Brain className="w-7 h-7 text-primary/40" />
          </motion.div>
          <p className="text-sm text-muted-foreground">Nenhum plano de foco salvo</p>
          <p className="text-xs text-muted-foreground/60 max-w-xs">Use o <strong>Modo Foco</strong> para gerar um plano e salve-o aqui.</p>
        </motion.div>
      )}

      {archivedPlans.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Arquivados</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-50 hover:opacity-70 transition-opacity duration-500">
            {archivedPlans.map((p, i) => renderPlanCard(p, i))}
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-xl">
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
