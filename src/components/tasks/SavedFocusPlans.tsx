import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Brain, Loader2, Trash2, FileDown, Clock, CheckCircle2, RotateCcw, Archive, Maximize2, Minimize2, Play, Pause, RotateCw, CheckSquare, Square, PartyPopper, Sparkles, Zap, Target, Timer, Flame, CloudRain, Music, VolumeX, TrendingUp, Award, Coffee, Headphones, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { exportFocusPDF } from '@/services/pdfExportService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useTasksUnified } from '@/hooks/useTasksUnified';
import { isToday, parseISO } from 'date-fns';
import { TaskSelectionStep } from './TaskSelectionStep';
import { AiAddTasksDialog } from './AiAddTasksDialog';
import type { GeneratedTask } from '@/types/tasks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

// ── 3D Tilt Card — refined, subtle ──────────────────────────
function TiltCard({ children, className, active = false }: { children: React.ReactNode; className?: string; active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [3, -3]), { stiffness: 250, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-3, 3]), { stiffness: 250, damping: 25 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={cn(
        "relative rounded-2xl border overflow-hidden transition-all duration-500",
        "bg-card",
        active
          ? "border-primary/25 shadow-[0_0_30px_-12px_hsl(var(--primary)/0.15)]"
          : "border-border/30 hover:border-primary/15",
        className
      )}
    >
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

// ── Focus Method Configs ────────────────────────────────────
const FOCUS_METHODS = [
  { key: 'pomodoro', label: 'Pomodoro', duration: 25, break: 5, icon: Timer, desc: '25min foco + 5min pausa' },
  { key: 'deep_work', label: 'Deep Work', duration: 90, break: 15, icon: Brain, desc: '90min sem interrupção' },
  { key: 'flowtime', label: 'Flowtime', duration: 0, break: 0, icon: Zap, desc: 'Sem timer — foque até cansar' },
  { key: '52_17', label: '52/17', duration: 52, break: 17, icon: Coffee, desc: '52min foco + 17min pausa' },
] as const;

const AMBIENT_SOUNDS = [
  { key: 'silence', label: 'Silêncio', icon: VolumeX },
  { key: 'rain', label: 'Chuva', icon: CloudRain },
  { key: 'lofi', label: 'Lo-fi', icon: Headphones },
] as const;

// ── Premium Timer — compact circular ────────────────────────
function PomodoroTimer({ className, durationMinutes, blockLabel, isFlowtime }: { className?: string; durationMinutes?: number; blockLabel?: string; isFlowtime?: boolean }) {
  const workDuration = durationMinutes || 25;
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [remaining, setRemaining] = useState(isFlowtime ? 0 : workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [flowtimeElapsed, setFlowtimeElapsed] = useState(0);

  useEffect(() => {
    if (!isFlowtime && mode === 'work') {
      setRemaining(workDuration * 60);
      setIsRunning(false);
    }
  }, [workDuration, isFlowtime]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      if (isFlowtime) {
        setFlowtimeElapsed(prev => prev + 1);
      } else {
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
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode, workDuration, isFlowtime]);

  const reset = () => {
    setIsRunning(false);
    if (isFlowtime) {
      if (flowtimeElapsed > 0) setSessions(s => s + 1);
      setFlowtimeElapsed(0);
    } else {
      setRemaining(mode === 'work' ? workDuration * 60 : 5 * 60);
    }
  };

  const displaySeconds = isFlowtime ? flowtimeElapsed : remaining;
  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;
  const totalSecs = isFlowtime ? Math.max(flowtimeElapsed, 1) : (mode === 'work' ? workDuration * 60 : 5 * 60);
  const pct = isFlowtime ? Math.min((flowtimeElapsed / (25 * 60)) * 100, 100) : ((totalSecs - remaining) / totalSecs) * 100;
  const circumference = 2 * Math.PI * 42;

  return (
    <div className={cn("p-3 flex flex-col items-center gap-3", className)}>
      {/* Circular Progress — compact */}
      <div className="relative w-28 h-28 shrink-0">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="2" className="text-border/20" />
          <motion.circle
            cx="48" cy="48" r="42" fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            strokeLinecap="round"
            initial={false}
            animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-light tracking-tight text-foreground">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          <span className="text-micro uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
            {mode === 'work' ? (blockLabel || 'Foco') : 'Pausa'}
          </span>
        </div>
      </div>

      {/* Session count */}
      <div className="flex items-center gap-1.5 text-mono text-muted-foreground">
        <Flame className="w-3 h-3 text-primary/50" />
        <span>{sessions} sessão{sessions !== 1 ? 'ões' : ''}</span>
      </div>

      {/* Controls — hover-invert style */}
      <div className="flex gap-2">
        <motion.button
          onClick={() => setIsRunning(!isRunning)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 hover-invert",
            isRunning
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-primary text-primary-foreground"
          )}
          whileTap={{ scale: 0.95 }}
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {isRunning ? 'Pausar' : 'Iniciar'}
        </motion.button>
        <motion.button
          onClick={reset}
          className="p-2 rounded-xl border border-border/30 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all"
          whileTap={{ scale: 0.9 }}
        >
          <RotateCw className="w-3 h-3" />
        </motion.button>
      </div>
    </div>
  );
}

// ── Today Tasks Panel — compact ─────────────────────────
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
      <div className="text-center py-6">
        <Target className="w-4 h-4 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Nenhuma tarefa para hoje</p>
        <p className="text-mono text-muted-foreground/40 mt-0.5">Mova tarefas para "Hoje"</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 h-full flex flex-col">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-primary/60" />
          <span className="text-caption uppercase tracking-[0.12em] text-muted-foreground font-medium">Hoje</span>
        </div>
        <span className="text-mono text-muted-foreground/40 font-mono">{completedCount}/{total}</span>
      </div>
      <div className="relative h-1 rounded-full bg-border/20 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${total > 0 ? (completedCount / total) * 100 : 0}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <ScrollArea className="flex-1 -mx-0.5">
        <div className="space-y-0.5 px-0.5">
          {todayTasks.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "flex items-center gap-2 p-1.5 rounded-lg transition-all duration-200 group cursor-pointer",
                t.status === 'done' ? "opacity-35" : "hover:bg-accent/20"
              )}
              onClick={() => toggleComplete(t.id)}
            >
              <div className="shrink-0">
                {t.status === 'done' ? (
                  <CheckSquare className="w-3 h-3 text-primary" />
                ) : (
                  <Square className="w-3 h-3 text-muted-foreground/25 group-hover:text-primary/50 transition-colors" />
                )}
              </div>
              <span className={cn("text-body-sm flex-1 leading-tight", t.status === 'done' && "line-through text-muted-foreground")}>
                {t.title}
              </span>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Focus Tools Panel — compact ─────────────────────────
function FocusToolsPanel({ focusMethod, setFocusMethod, ambientSound, setAmbientSound, sessions, totalMinutes, completedTasks }: {
  focusMethod: string;
  setFocusMethod: (m: string) => void;
  ambientSound: string;
  setAmbientSound: (s: string) => void;
  sessions: number;
  totalMinutes: number;
  completedTasks: number;
}) {
  const streak = 7;

  return (
    <div className="space-y-3 p-3 h-full flex flex-col">
      {/* Focus Method Selector */}
      <div className="space-y-1.5">
        <span className="text-caption uppercase tracking-[0.12em] text-muted-foreground font-medium flex items-center gap-1.5">
          <Brain className="w-2.5 h-2.5 text-primary/50" /> Método
        </span>
        <div className="grid grid-cols-2 gap-1">
          {FOCUS_METHODS.map(m => {
            const Icon = m.icon;
            const isActive = focusMethod === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setFocusMethod(m.key)}
                className={cn(
                  "flex flex-col items-start gap-0.5 p-2 rounded-lg text-left transition-all duration-300 border",
                  isActive
                    ? "bg-primary/8 border-primary/20 text-foreground"
                    : "bg-transparent border-border/20 text-muted-foreground hover:border-border/40"
                )}
              >
                <div className="flex items-center gap-1">
                  <Icon className={cn("w-2.5 h-2.5", isActive ? "text-primary" : "text-muted-foreground/40")} />
                  <span className="text-caption font-semibold">{m.label}</span>
                </div>
                <span className="text-micro text-muted-foreground/40 leading-tight">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ambient Sound */}
      <div className="space-y-1.5">
        <span className="text-caption uppercase tracking-[0.12em] text-muted-foreground font-medium flex items-center gap-1.5">
          <Music className="w-2.5 h-2.5 text-primary/50" /> Ambiente
        </span>
        <div className="flex gap-1">
          {AMBIENT_SOUNDS.map(s => {
            const Icon = s.icon;
            const isActive = ambientSound === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setAmbientSound(s.key)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg border transition-all duration-200",
                  isActive
                    ? "bg-primary/8 border-primary/20"
                    : "border-border/20 hover:border-border/40"
                )}
              >
                <Icon className={cn("w-3 h-3", isActive ? "text-primary" : "text-muted-foreground/40")} />
                <span className="text-micro text-muted-foreground">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Streak — minimal */}
      <div className="flex items-center gap-2 p-2 rounded-lg border border-border/15 bg-muted/5">
        <span className="text-sm">🔥</span>
        <div className="flex-1">
          <span className="text-body-sm font-semibold text-foreground">{streak} dias</span>
          <p className="text-micro text-muted-foreground/50">Streak consecutivo</p>
        </div>
        <Award className="w-3.5 h-3.5 text-muted-foreground/20" />
      </div>

      {/* Mini Stats */}
      <div className="mt-auto space-y-1.5">
        <span className="text-caption uppercase tracking-[0.12em] text-muted-foreground font-medium flex items-center gap-1.5">
          <TrendingUp className="w-2.5 h-2.5 text-primary/50" /> Hoje
        </span>
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: 'Tempo', value: `${totalMinutes}m`, color: 'text-primary' },
            { label: 'Sessões', value: String(sessions), color: 'text-foreground' },
            { label: 'Tarefas', value: String(completedTasks), color: 'text-foreground' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center p-1.5 rounded-lg border border-border/15">
              <span className={cn("text-xs font-semibold font-mono", s.color)}>{s.value}</span>
              <span className="text-micro text-muted-foreground/40">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Confetti ────────────────────────────────────────────
function ConfettiCelebration({ show }: { show: boolean }) {
  if (!show) return null;
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 0.5,
    color: ['hsl(var(--primary))', '#34D399', '#F472B6', '#FFE66D', '#A78BFA'][Math.floor(Math.random() * 5)],
    rotation: Math.random() * 360,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {pieces.map(p => (
        <motion.div key={p.id} className="absolute w-1.5 h-2.5 rounded-sm"
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
  const [focusMethod, setFocusMethod] = useState('pomodoro');
  const [ambientSound, setAmbientSound] = useState('silence');

  const [addingTasksToPlanId, setAddingTasksToPlanId] = useState<string | null>(null);
  const [regeneratingPlanId, setRegeneratingPlanId] = useState<string | null>(null);

  const { toggleComplete, tasks } = useTasksUnified();

  const todayCompleted = useMemo(() =>
    tasks.filter(t => t.status === 'done' && t.completed_at && isToday(parseISO(t.completed_at))).length
  , [tasks]);

  const currentMethodConfig = FOCUS_METHODS.find(m => m.key === focusMethod) || FOCUS_METHODS[0];
  const isFlowtime = focusMethod === 'flowtime';

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
      await supabase.from('saved_focus_plans').update({ completed_tasks: newCompleted as any }).eq('id', planId);
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

  // ── Dynamic Plan Actions ──────────────────────────────
  const getTaskIdsFromPlan = (plan: FocusPlan): string[] => {
    const blocks = plan.plan_data?.blocks || [];
    return blocks.flatMap((b: any) => (b.tasks || []).map((t: any) => t.id));
  };

  const handleAddTasks = async (planId: string, orderedIds: string[]) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const newTasks = orderedIds
      .map(id => tasks.find(t => t.id === id))
      .filter(Boolean)
      .map(t => ({
        id: t!.id,
        title: t!.title,
        estimated_minutes: ({ urgent: 45, high: 35, normal: 25, low: 15 }[t!.priority] || 25),
        cognitive_type: t!.priority === 'urgent' || t!.priority === 'high' ? 'deep' : 'shallow',
      }));

    if (newTasks.length === 0) return;

    const updatedPlanData = {
      ...plan.plan_data,
      blocks: [
        ...(plan.plan_data?.blocks || []),
        {
          id: `block_added_${Date.now()}`,
          title: 'Novas Tarefas',
          type: 'shallow_work',
          technique: 'Adicionadas manualmente',
          duration_minutes: newTasks.reduce((s, t) => s + t.estimated_minutes, 0),
          tasks: newTasks,
        },
      ],
      total_estimated_minutes: (plan.plan_data?.total_estimated_minutes || 0) + newTasks.reduce((s, t) => s + t.estimated_minutes, 0),
    };

    try {
      await supabase.from('saved_focus_plans').update({ plan_data: updatedPlanData as any }).eq('id', planId);
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, plan_data: updatedPlanData } : p));
      toast.success(`${newTasks.length} tarefa(s) adicionada(s) ao plano`);
    } catch {
      toast.error('Erro ao adicionar tarefas');
    }
    setAddingTasksToPlanId(null);
  };

  const handleAddAiTasks = async (planId: string, generatedTasks: GeneratedTask[]) => {
    // 1. Insert tasks into the tasks table
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Não autenticado'); return; }

    const inserts = generatedTasks.map(t => ({
      user_id: user.id,
      title: t.title,
      description: t.description || null,
      category: t.category,
      tags: t.tags,
      due_date: t.due_date || null,
      status: t.status,
      priority: 'normal',
      position: 0,
    }));

    const { data: inserted, error } = await supabase.from('tasks').insert(inserts).select();
    if (error || !inserted) { toast.error('Erro ao criar tarefas'); return; }

    // 2. Add to plan as a new block
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const newBlockTasks = inserted.map((t: any) => ({
      id: t.id,
      title: t.title,
      estimated_minutes: 25,
      cognitive_type: 'shallow',
    }));

    const updatedPlanData = {
      ...plan.plan_data,
      blocks: [
        ...(plan.plan_data?.blocks || []),
        {
          id: `block_ai_${Date.now()}`,
          title: 'Tarefas via IA',
          type: 'shallow_work',
          technique: 'Geradas por IA',
          duration_minutes: newBlockTasks.length * 25,
          tasks: newBlockTasks,
        },
      ],
      total_estimated_minutes: (plan.plan_data?.total_estimated_minutes || 0) + newBlockTasks.length * 25,
    };

    await supabase.from('saved_focus_plans').update({ plan_data: updatedPlanData as any }).eq('id', planId);
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, plan_data: updatedPlanData } : p));
    toast.success(`${inserted.length} tarefa(s) criada(s) e adicionada(s) ao plano!`);
    setAddingTasksToPlanId(null);
  };

  const handleRegenerate = async (planId: string, excludeCompleted: boolean) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setRegeneratingPlanId(planId);
    try {
      let taskIds = getTaskIdsFromPlan(plan);
      if (excludeCompleted) {
        taskIds = taskIds.filter(id => !plan.completed_tasks.includes(id));
      }

      const planTasks = taskIds
        .map(id => tasks.find(t => t.id === id))
        .filter(Boolean)
        .map(t => ({
          id: t!.id,
          title: t!.title,
          priority: t!.priority,
          category: t!.category,
          due_date: t!.due_date,
          tags: t!.tags,
        }));

      if (planTasks.length === 0) {
        toast.error('Nenhuma tarefa pendente para regenerar');
        setRegeneratingPlanId(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-execution-blocks', {
        body: { tasks: planTasks },
      });

      if (error) throw error;

      const newCompleted = excludeCompleted ? [] : plan.completed_tasks;
      await supabase.from('saved_focus_plans').update({
        plan_data: data as any,
        completed_tasks: newCompleted as any,
      }).eq('id', planId);

      setPlans(prev => prev.map(p => p.id === planId ? { ...p, plan_data: data, completed_tasks: newCompleted } : p));
      toast.success('Plano regenerado com sucesso!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao regenerar plano');
    }
    setRegeneratingPlanId(null);
  };

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

  const blockTypeConfig: Record<string, { color: string; bg: string; icon: typeof Brain }> = {
    deep_work: { color: 'text-primary', bg: 'bg-primary/5', icon: Brain },
    shallow_work: { color: 'text-muted-foreground', bg: 'bg-muted/10', icon: Zap },
    break: { color: 'text-primary/60', bg: 'bg-primary/3', icon: Timer },
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

  const [timerIsRunning] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary/60" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-[0.12em]">Modo Foco</h3>
        </div>
        <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border/20 bg-card/30 p-4 space-y-3 h-[280px]"
            >
              <Skeleton className="h-28 w-28 rounded-full mx-auto bg-muted/20" />
              <Skeleton className="h-3 w-20 mx-auto bg-muted/30" />
              <Skeleton className="h-2 w-16 mx-auto bg-muted/15" />
              <div className="flex gap-2 justify-center pt-2">
                <Skeleton className="h-8 w-20 rounded-xl bg-muted/20" />
                <Skeleton className="h-8 w-8 rounded-xl bg-muted/15" />
              </div>
            </motion.div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-24 bg-muted/20" />
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="rounded-xl border border-border/15 bg-card/30 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-32 bg-muted/30" />
                  <Skeleton className="h-5 w-14 rounded-md bg-muted/15" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-2 w-14 bg-muted/15" />
                  <Skeleton className="h-2 w-10 bg-muted/15" />
                  <Skeleton className="h-2 w-12 bg-muted/15" />
                </div>
                <Skeleton className="h-0.5 w-full rounded-full bg-muted/10" />
              </motion.div>
            ))}
          </div>
        </div>
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
          "group relative rounded-xl border overflow-hidden transition-all duration-500 bg-card",
          isExecuting
            ? "border-primary/20 shadow-[0_0_20px_-10px_hsl(var(--primary)/0.1)]"
            : "border-border/20 hover:border-primary/10"
        )}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
      >
        <div className="relative z-10 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : plan.id)}>
              <div className="flex items-center gap-1.5">
                <h3 className="text-body-sm font-semibold text-foreground truncate">{plan.title}</h3>
                {allDone && <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />}
              </div>
              <p className="text-caption text-muted-foreground/40 mt-0.5">{dateStr}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {plan.status === 'active' && !allDone && (
                <Button
                  variant={isExecuting ? "default" : "outline"}
                  size="sm"
                  className={cn("h-5 text-micro gap-0.5 rounded-md px-1.5", isExecuting && "bg-primary")}
                  onClick={() => setActiveExecutionPlanId(isExecuting ? null : plan.id)}
                >
                  <Play className="w-2 h-2" />
                  {isExecuting ? 'Parar' : 'Executar'}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0"><FileDown className="w-2.5 h-2.5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportFocusPDF(plan.plan_data, 'landscape')}>PDF Horizontal</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportFocusPDF(plan.plan_data, 'portrait')}>PDF Vertical</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {plan.status === 'active' ? (
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => handleArchive(plan.id)}><Archive className="w-2.5 h-2.5" /></Button>
              ) : (
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => handleRestore(plan.id)}><RotateCcw className="w-2.5 h-2.5" /></Button>
              )}
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteId(plan.id)}>
                <Trash2 className="w-2.5 h-2.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-caption text-muted-foreground/50">
            <span className="flex items-center gap-1"><Brain className="w-2 h-2" />{blocks.length} blocos</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-2 h-2" />{completedCount}/{totalTasks}</span>
            <span className="flex items-center gap-1"><Clock className="w-2 h-2" />{timeStr}</span>
          </div>

          <div className="relative h-0.5 rounded-full bg-border/15 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className="space-y-2 pt-2 border-t border-border/10"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              >
                {/* ── Plan Action Buttons ── */}
                {plan.status === 'active' && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-caption gap-1 rounded-lg border-border/30 hover:border-primary/30 hover:bg-primary/5"
                      onClick={() => setAddingTasksToPlanId(plan.id)}
                    >
                      <Plus className="w-2.5 h-2.5" />
                      Adicionar Tarefas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-caption gap-1 rounded-lg border-border/30 hover:border-primary/30 hover:bg-primary/5"
                      disabled={regeneratingPlanId === plan.id}
                      onClick={() => handleRegenerate(plan.id, false)}
                    >
                      {regeneratingPlanId === plan.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RefreshCw className="w-2.5 h-2.5" />}
                      Regenerar
                    </Button>
                    {completedCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-caption gap-1 rounded-lg border-border/30 hover:border-primary/30 hover:bg-primary/5"
                        disabled={regeneratingPlanId === plan.id}
                        onClick={() => handleRegenerate(plan.id, true)}
                      >
                        {regeneratingPlanId === plan.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RefreshCw className="w-2.5 h-2.5" />}
                        Só Pendentes
                      </Button>
                    )}
                  </div>
                )}

                {blocks.map((block: any, bIdx: number) => {
                  const cfg = blockTypeConfig[block.type] || blockTypeConfig.shallow_work;
                  const BlockIcon = cfg.icon;
                  return (
                    <div key={block.id || bIdx} className={cn("rounded-lg p-2 space-y-1", cfg.bg)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <BlockIcon className={cn("w-2.5 h-2.5", cfg.color)} />
                          <span className={cn("text-caption font-semibold", cfg.color)}>{block.title}</span>
                        </div>
                        <span className="text-micro text-muted-foreground/40 font-mono">{block.duration_minutes}min</span>
                      </div>
                      {block.tasks?.map((task: any) => {
                        const isDone = plan.completed_tasks.includes(task.id);
                        return (
                          <div
                            key={task.id}
                            className={cn("flex items-center gap-1 text-caption cursor-pointer py-0.5 px-1 rounded transition-all", isDone ? "opacity-30" : "hover:bg-background/30")}
                            onClick={() => plan.status === 'active' && handleToggleTaskInPlan(plan.id, task.id)}
                          >
                            {isDone ? <CheckSquare className="w-2.5 h-2.5 text-primary shrink-0" /> : <Square className="w-2.5 h-2.5 text-muted-foreground/20 shrink-0" />}
                            <span className={cn("flex-1", isDone && "line-through")}>{task.title}</span>
                            <span className="text-muted-foreground/30 font-mono">{task.estimated_minutes}m</span>
                          </div>
                        );
                      })}
                    </div>
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
    <div className="space-y-4">
      <ConfettiCelebration show={showConfetti} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary/60" />
          <h3 className="text-section text-foreground">Modo Foco</h3>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-caption hover:bg-accent/30 rounded-lg h-6 px-2" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          {isFullscreen ? 'Sair' : 'Expandir'}
        </Button>
      </div>

      {/* 3-Column Premium Layout — compact */}
      <div className="grid gap-2 grid-cols-1 md:grid-cols-3" style={{ minHeight: 280 }}>
        {/* Col 1: Timer */}
        <TiltCard active={timerIsRunning}>
          <PomodoroTimer
            durationMinutes={isFlowtime ? 0 : (activeBlock?.duration_minutes || currentMethodConfig.duration)}
            blockLabel={activeBlock?.title || currentMethodConfig.label}
            isFlowtime={isFlowtime}
          />
        </TiltCard>

        {/* Col 2: Today Tasks */}
        <TiltCard>
          <div className="p-3 h-full">
            <TodayTasksPanel onAllComplete={handleAllComplete} />
          </div>
        </TiltCard>

        {/* Col 3: Focus Tools */}
        <TiltCard>
          <FocusToolsPanel
            focusMethod={focusMethod}
            setFocusMethod={setFocusMethod}
            ambientSound={ambientSound}
            setAmbientSound={setAmbientSound}
            sessions={0}
            totalMinutes={0}
            completedTasks={todayCompleted}
          />
        </TiltCard>
      </div>

      {/* Saved plans */}
      {activePlans.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3 text-primary/40" />
            <h3 className="text-caption text-foreground uppercase tracking-[0.12em] font-semibold">Planos Ativos</h3>
            <span className="text-micro px-1.5 py-0.5 rounded-full bg-primary/8 text-primary font-mono">{activePlans.length}</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {activePlans.map((p, i) => renderPlanCard(p, i))}
          </div>
        </div>
      )}

      {plans.length === 0 && (
        <motion.div className="flex flex-col items-center justify-center py-10 gap-2 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Brain className="w-5 h-5 text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground">Nenhum plano de foco salvo</p>
          <p className="text-mono text-muted-foreground/40 max-w-xs">Use o <strong>Modo Foco</strong> para gerar um plano.</p>
        </motion.div>
      )}

      {archivedPlans.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-caption font-medium text-muted-foreground/50 uppercase tracking-[0.12em]">Arquivados</h3>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 opacity-35 hover:opacity-50 transition-opacity duration-500">
            {archivedPlans.map((p, i) => renderPlanCard(p, i))}
          </div>
        </div>
      )}

      {/* Add Tasks with AI Dialog */}
      {addingTasksToPlanId && (
        <AiAddTasksDialog
          open={!!addingTasksToPlanId}
          onOpenChange={(open) => !open && setAddingTasksToPlanId(null)}
          onConfirm={(generatedTasks) => handleAddAiTasks(addingTasksToPlanId!, generatedTasks)}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="border-border/30 bg-card">
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
