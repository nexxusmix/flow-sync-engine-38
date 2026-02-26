import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Brain, Loader2, Trash2, FileDown, Clock, CheckCircle2, RotateCcw, Archive, Maximize2, Minimize2, Play, Pause, RotateCw, CheckSquare, Square, PartyPopper, Sparkles, Zap, Target, Timer, Flame, CloudRain, Music, VolumeX, TrendingUp, Award, Coffee, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { exportFocusPDF } from '@/services/pdfExportService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
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

// ── 3D Tilt Card Wrapper ────────────────────────────────────
function TiltCard({ children, className, active = false }: { children: React.ReactNode; className?: string; active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 20 });

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
      initial={{ opacity: 0, rotateX: -8, y: 20 }}
      animate={{ opacity: 1, rotateX: 0, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      className={cn(
        "relative rounded-2xl border overflow-hidden transition-shadow duration-500",
        "bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-2xl",
        active
          ? "border-primary/40 shadow-[0_0_50px_-10px_hsl(var(--primary)/0.3)]"
          : "border-border/40 hover:border-primary/25 hover:shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.2)]",
        className
      )}
    >
      {/* Animated border glow */}
      {active && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'conic-gradient(from var(--angle, 0deg), transparent 60%, hsl(var(--primary) / 0.3) 80%, transparent 100%)' }}
          animate={{ '--angle': ['0deg', '360deg'] } as any}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

// ── Floating Particles ──────────────────────────────────────
function FloatingParticles({ active }: { active: boolean }) {
  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 2,
  })), []);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [-10, 10, -10], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
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

// ── Premium Pomodoro Timer ──────────────────────────────────
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
  const circumference = 2 * Math.PI * 44;

  return (
    <div className={cn("p-4 flex flex-col items-center gap-4", className)}>
      {/* Circular Progress */}
      <div className="relative w-32 h-32 shrink-0">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/15" />
          <defs>
            <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.5)" />
            </linearGradient>
            <filter id="glow-timer">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <motion.circle
            cx="48" cy="48" r="44" fill="none"
            stroke="url(#timer-grad)" strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            strokeLinecap="round"
            filter="url(#glow-timer)"
            initial={false}
            animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
            transition={{ duration: 0.5 }}
          />
          {pct > 0 && (
            <motion.circle
              cx="48" cy="4" r="3.5"
              fill="hsl(var(--primary))"
              filter="url(#glow-timer)"
              style={{ transformOrigin: '48px 48px', rotate: `${pct * 3.6}deg` }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-mono text-3xl font-bold tracking-tight text-foreground"
            key={displaySeconds}
            initial={{ scale: 1.08, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.12 }}
          >
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </motion.span>
          <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
            {mode === 'work' ? (blockLabel || 'Foco') : 'Pausa'}
          </span>
        </div>
      </div>

      {/* Session count */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Flame className="w-3 h-3 text-primary/60" />
        <span>{sessions} sessão{sessions !== 1 ? 'ões' : ''}</span>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <motion.button
          onClick={() => setIsRunning(!isRunning)}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300",
            isRunning
              ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
          )}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isRunning ? 'Pausar' : 'Iniciar'}
        </motion.button>
        <motion.button
          onClick={reset}
          className="p-2.5 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/50 transition-all"
          whileHover={{ scale: 1.08, rotate: -90 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
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
      <div className="text-center py-6">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-muted/20 mb-2">
          <Target className="w-4 h-4 text-muted-foreground/40" />
        </motion.div>
        <p className="text-xs text-muted-foreground">Nenhuma tarefa para hoje</p>
        <p className="text-[10px] text-muted-foreground/40 mt-0.5">Mova tarefas para "Hoje"</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 h-full flex flex-col">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-primary/70" />
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium">Hoje</span>
        </div>
        <span className="text-[10px] text-muted-foreground/40 font-mono">{completedCount}/{total}</span>
      </div>
      <div className="relative h-1 rounded-full bg-muted/20 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/60"
          initial={{ width: 0 }}
          animate={{ width: `${total > 0 ? (completedCount / total) * 100 : 0}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ left: ['-20%', '120%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
        />
      </div>
      <ScrollArea className="flex-1 -mx-1">
        <div className="space-y-0.5 px-1">
          {todayTasks.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg transition-all duration-200 group cursor-pointer",
                t.status === 'done' ? "opacity-40" : "hover:bg-accent/30"
              )}
              onClick={() => toggleComplete(t.id)}
            >
              <div className="shrink-0">
                {t.status === 'done' ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                  </motion.div>
                ) : (
                  <Square className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/60 transition-colors" />
                )}
              </div>
              <span className={cn("text-xs flex-1 leading-tight", t.status === 'done' && "line-through text-muted-foreground")}>
                {t.title}
              </span>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Right Column: Focus Tools ───────────────────────────
function FocusToolsPanel({ focusMethod, setFocusMethod, ambientSound, setAmbientSound, sessions, totalMinutes, completedTasks }: {
  focusMethod: string;
  setFocusMethod: (m: string) => void;
  ambientSound: string;
  setAmbientSound: (s: string) => void;
  sessions: number;
  totalMinutes: number;
  completedTasks: number;
}) {
  const streak = 7; // Mock streak — future: persist to DB

  return (
    <div className="space-y-4 p-4 h-full flex flex-col">
      {/* Focus Method Selector */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium flex items-center gap-1.5">
          <Brain className="w-3 h-3 text-primary/60" /> Método
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {FOCUS_METHODS.map(m => {
            const Icon = m.icon;
            const isActive = focusMethod === m.key;
            return (
              <motion.button
                key={m.key}
                onClick={() => setFocusMethod(m.key)}
                className={cn(
                  "relative flex flex-col items-start gap-0.5 p-2 rounded-lg text-left transition-all duration-300 border",
                  isActive
                    ? "bg-primary/10 border-primary/30 text-foreground"
                    : "bg-transparent border-border/30 text-muted-foreground hover:border-border/60 hover:bg-accent/20"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={cn("w-3 h-3", isActive ? "text-primary" : "text-muted-foreground/50")} />
                  <span className="text-[10px] font-semibold">{m.label}</span>
                </div>
                <span className="text-[8px] text-muted-foreground/50 leading-tight">{m.desc}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Ambient Sound */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium flex items-center gap-1.5">
          <Music className="w-3 h-3 text-primary/60" /> Ambiente
        </span>
        <div className="flex gap-1.5">
          {AMBIENT_SOUNDS.map(s => {
            const Icon = s.icon;
            const isActive = ambientSound === s.key;
            return (
              <motion.button
                key={s.key}
                onClick={() => setAmbientSound(s.key)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border transition-all duration-200",
                  isActive
                    ? "bg-primary/10 border-primary/30"
                    : "border-border/30 hover:border-border/60 hover:bg-accent/20"
                )}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground/50")} />
                <span className="text-[9px] text-muted-foreground">{s.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-orange-500/5 to-amber-500/5 border border-orange-500/10">
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-lg"
        >
          🔥
        </motion.div>
        <div className="flex-1">
          <span className="text-xs font-semibold text-foreground">{streak} dias</span>
          <p className="text-[9px] text-muted-foreground/60">Streak consecutivo</p>
        </div>
        <Award className="w-4 h-4 text-amber-500/40" />
      </div>

      {/* Mini Stats */}
      <div className="mt-auto space-y-1.5">
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-primary/60" /> Hoje
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Tempo', value: `${totalMinutes}m`, color: 'text-primary' },
            { label: 'Sessões', value: String(sessions), color: 'text-emerald-500' },
            { label: 'Tarefas', value: String(completedTasks), color: 'text-amber-500' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center p-2 rounded-lg bg-muted/10 border border-border/20">
              <span className={cn("text-sm font-bold font-mono", s.color)}>{s.value}</span>
              <span className="text-[8px] text-muted-foreground/50">{s.label}</span>
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
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 0.5,
    color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#34D399', '#F472B6'][Math.floor(Math.random() * 6)],
    rotation: Math.random() * 360,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {pieces.map(p => (
        <motion.div key={p.id} className="absolute w-2 h-3 rounded-sm"
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

  const [timerIsRunning, setTimerIsRunning] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Brain className="w-8 h-8 text-primary/50" />
        </motion.div>
        <motion.p className="text-sm text-muted-foreground" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
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
          "group relative rounded-xl border overflow-hidden transition-all duration-500",
          "bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl",
          isExecuting
            ? "border-primary/40 shadow-[0_0_30px_-8px_hsl(var(--primary)/0.2)]"
            : "border-border/40 hover:border-primary/20 hover:shadow-[0_6px_24px_-8px_hsl(var(--primary)/0.12)]"
        )}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: index * 0.05, duration: 0.35 }}
        whileHover={{ y: -1 }}
      >
        <div className="relative z-10 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : plan.id)}>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-foreground truncate">{plan.title}</h3>
                {allDone && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </motion.div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">{dateStr}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {plan.status === 'active' && !allDone && (
                <Button
                  variant={isExecuting ? "default" : "outline"}
                  size="sm"
                  className={cn("h-6 text-[9px] gap-1 rounded-lg px-2", isExecuting && "shadow-md shadow-primary/20")}
                  onClick={() => setActiveExecutionPlanId(isExecuting ? null : plan.id)}
                >
                  <Play className="w-2.5 h-2.5" />
                  {isExecuting ? 'Pausar' : 'Executar'}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><FileDown className="w-3 h-3" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportFocusPDF(plan.plan_data, 'landscape')}>PDF Horizontal</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportFocusPDF(plan.plan_data, 'portrait')}>PDF Vertical</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {plan.status === 'active' ? (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleArchive(plan.id)}><Archive className="w-3 h-3" /></Button>
              ) : (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRestore(plan.id)}><RotateCcw className="w-3 h-3" /></Button>
              )}
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteId(plan.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Brain className="w-2.5 h-2.5 text-primary/50" />{blocks.length} blocos</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5 text-emerald-500/50" />{completedCount}/{totalTasks}</span>
            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{timeStr}</span>
          </div>

          <div className="relative h-1 rounded-full bg-muted/15 overflow-hidden">
            <motion.div
              className={cn("absolute inset-y-0 left-0 rounded-full", allDone ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-primary to-primary/60")}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className="space-y-1.5 pt-2 border-t border-border/20"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {blocks.map((block: any, bIdx: number) => {
                  const cfg = blockTypeConfig[block.type] || blockTypeConfig.shallow_work;
                  const BlockIcon = cfg.icon;
                  return (
                    <div key={block.id || bIdx} className={cn("rounded-lg p-2.5 space-y-1", cfg.bg)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <BlockIcon className={cn("w-3 h-3", cfg.color)} />
                          <span className={cn("text-[10px] font-semibold", cfg.color)}>{block.title}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono">{block.duration_minutes}min</span>
                      </div>
                      {block.tasks?.map((task: any) => {
                        const isDone = plan.completed_tasks.includes(task.id);
                        return (
                          <div
                            key={task.id}
                            className={cn("flex items-center gap-1.5 text-[10px] cursor-pointer py-0.5 px-1 rounded transition-all", isDone ? "opacity-40" : "hover:bg-background/40")}
                            onClick={() => plan.status === 'active' && handleToggleTaskInPlan(plan.id, task.id)}
                          >
                            {isDone ? <CheckSquare className="w-3 h-3 text-emerald-500 shrink-0" /> : <Square className="w-3 h-3 text-muted-foreground/30 shrink-0" />}
                            <span className={cn("flex-1", isDone && "line-through")}>{task.title}</span>
                            <span className="text-muted-foreground/40 font-mono">{task.estimated_minutes}m</span>
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
    <div className="space-y-5">
      <ConfettiCelebration show={showConfetti} />

      {/* Focus toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.div
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10"
            animate={{ boxShadow: ['0 0 0 0 hsl(var(--primary) / 0)', '0 0 0 6px hsl(var(--primary) / 0.08)', '0 0 0 0 hsl(var(--primary) / 0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </motion.div>
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-[0.12em]">Modo Foco</h3>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-[10px] hover:bg-accent/40 rounded-lg h-7" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          {isFullscreen ? 'Sair' : 'Expandir'}
        </Button>
      </div>

      {/* ═══ 3-Column Premium Layout ═══ */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3" style={{ minHeight: 340 }}>
        {/* Col 1: Timer */}
        <TiltCard active={timerIsRunning}>
          <FloatingParticles active={timerIsRunning} />
          <PomodoroTimer
            durationMinutes={isFlowtime ? 0 : (activeBlock?.duration_minutes || currentMethodConfig.duration)}
            blockLabel={activeBlock?.title || currentMethodConfig.label}
            isFlowtime={isFlowtime}
          />
        </TiltCard>

        {/* Col 2: Today Tasks */}
        <TiltCard>
          <div className="p-4 h-full">
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3 text-primary/50" />
            <h3 className="text-[10px] font-semibold text-foreground uppercase tracking-[0.12em]">Planos Ativos</h3>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono">{activePlans.length}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activePlans.map((p, i) => renderPlanCard(p, i))}
          </div>
        </div>
      )}

      {plans.length === 0 && (
        <motion.div className="flex flex-col items-center justify-center py-12 gap-3 text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Brain className="w-5 h-5 text-primary/30" />
          </motion.div>
          <p className="text-xs text-muted-foreground">Nenhum plano de foco salvo</p>
          <p className="text-[10px] text-muted-foreground/50 max-w-xs">Use o <strong>Modo Foco</strong> para gerar um plano.</p>
        </motion.div>
      )}

      {archivedPlans.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.12em]">Arquivados</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 opacity-40 hover:opacity-60 transition-opacity duration-500">
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
