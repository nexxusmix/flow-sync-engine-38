import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import {
  ListTodo, Clock, AlertTriangle, CheckCircle2, CalendarDays, Timer,
  User, Briefcase, FolderKanban, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Task } from '@/hooks/useTasksUnified';

interface Props {
  tasks: Task[];
  stats: {
    total: number;
    pending: number;
    overdue: number;
    completedToday: number;
    dueNext7: number;
    completionsByDay: { date: string; count: number }[];
    byCategory: Record<string, number>;
    avgCompletionDays: number;
    statusByPeriod: { period: string; backlog: number; week: number; today: number; done: number }[];
    heatmap: { day: number; hour: number; count: number }[];
    oldestPending: Task[];
    nextExpiring: Task[];
  };
}

const STATUS_COLORS = {
  backlog: 'hsl(var(--muted-foreground))',
  week: 'hsl(var(--info))',
  today: 'hsl(var(--warning))',
  done: 'hsl(var(--success))',
};

const CATEGORY_COLORS: Record<string, string> = {
  pessoal: 'hsl(280, 60%, 50%)',
  operacao: 'hsl(var(--primary))',
  projeto: 'hsl(var(--info))',
};

const CATEGORY_LABELS: Record<string, string> = {
  pessoal: 'Pessoal',
  operacao: 'Operação',
  projeto: 'Projeto',
};

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

export function TasksDashboardBI({ tasks, stats }: Props) {
  // Donut data
  const categoryData = useMemo(() =>
    Object.entries(stats.byCategory)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        name: CATEGORY_LABELS[key] || key,
        value,
        fill: CATEGORY_COLORS[key] || 'hsl(var(--muted-foreground))',
      })),
    [stats.byCategory]
  );

  const maxHeat = useMemo(() => Math.max(...stats.heatmap.map(h => h.count), 1), [stats.heatmap]);

  return (
    <motion.div className="space-y-6" variants={stagger} initial="hidden" animate="show">
      {/* ── Row 1: KPI Cards ──────────────────────────────── */}
      <motion.div className="grid grid-cols-2 md:grid-cols-5 gap-3" variants={stagger}>
        <KPICard icon={ListTodo} label="Total" value={stats.total} color="primary" variants={fadeUp} />
        <KPICard icon={Clock} label="Pendentes" value={stats.pending} color="warning" variants={fadeUp} />
        <KPICard icon={CheckCircle2} label="Hoje" value={stats.completedToday} color="success" variants={fadeUp} />
        <KPICard icon={AlertTriangle} label="Vencidas" value={stats.overdue} color="destructive" variants={fadeUp} />
        <KPICard icon={CalendarDays} label="Próx. 7 dias" value={stats.dueNext7} color="info" variants={fadeUp} />
      </motion.div>

      {/* ── Row 2: Charts ─────────────────────────────────── */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4" variants={stagger}>
        {/* Stacked bar — status by period */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="glass-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Status por Período</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.statusByPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="backlog" stackId="a" fill={STATUS_COLORS.backlog} name="Backlog" radius={[0, 0, 0, 0]} />
                <Bar dataKey="week" stackId="a" fill={STATUS_COLORS.week} name="Semana" />
                <Bar dataKey="today" stackId="a" fill={STATUS_COLORS.today} name="Hoje" />
                <Bar dataKey="done" stackId="a" fill={STATUS_COLORS.done} name="Concluído" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Donut — category */}
        <motion.div variants={fadeUp}>
          <Card className="glass-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Por Categoria</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value" animationDuration={800}>
                    {categoryData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            )}
            <div className="flex flex-wrap gap-3 justify-center mt-1">
              {categoryData.map(c => (
                <div key={c.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.fill }} />
                  <span className="text-xs text-muted-foreground">{c.name} ({c.value})</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Row 3: Area chart + KPI ───────────────────────── */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-4 gap-4" variants={stagger}>
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <Card className="glass-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">Conclusões / Dia (30 dias)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.completionsByDay}>
                <defs>
                  <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--success))" fill="url(#completionGrad)" strokeWidth={2} name="Concluídas" animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="glass-card p-5 flex flex-col items-center justify-center h-full gap-2">
            <Timer className="w-8 h-8 text-muted-foreground" />
            <p className="text-3xl font-bold text-foreground">{stats.avgCompletionDays.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground text-center">Dias médios para concluir</p>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Row 4: Heatmap ────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Heatmap Semanal (conclusões)</h3>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `auto repeat(16, 1fr)` }}>
              {/* Header row */}
              <div />
              {Array.from({ length: 16 }, (_, i) => (
                <div key={i} className="text-[9px] text-muted-foreground text-center w-7">{i + 6}h</div>
              ))}
              {/* Day rows */}
              {DAY_LABELS.map((label, dayIdx) => (
                <>
                  <div key={`label-${dayIdx}`} className="text-[10px] text-muted-foreground pr-2 flex items-center">{label}</div>
                  {Array.from({ length: 16 }, (_, hourOffset) => {
                    const hour = hourOffset + 6;
                    const cell = stats.heatmap.find(h => h.day === dayIdx && h.hour === hour);
                    const intensity = cell ? cell.count / maxHeat : 0;
                    return (
                      <div
                        key={`${dayIdx}-${hour}`}
                        className="w-7 h-5 rounded-sm transition-colors"
                        style={{
                          backgroundColor: intensity > 0
                            ? `hsla(var(--success), ${0.15 + intensity * 0.7})`
                            : 'hsl(var(--muted))',
                        }}
                        title={`${label} ${hour}h — ${cell?.count || 0} tarefas`}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Row 5: Lists ──────────────────────────────────── */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={stagger}>
        <motion.div variants={fadeUp}>
          <Card className="glass-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-3">Top 10 Pendentes Mais Antigas</h3>
            {stats.oldestPending.length > 0 ? (
              <div className="space-y-2">
                {stats.oldestPending.map((task, i) => (
                  <TaskListItem key={task.id} task={task} index={i} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma tarefa pendente 🎉</p>
            )}
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">Próximas 10 a Vencer</h3>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            {stats.nextExpiring.length > 0 ? (
              <div className="space-y-2">
                {stats.nextExpiring.map((task, i) => (
                  <TaskListItem key={task.id} task={task} index={i} showDueDate />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma tarefa com prazo</p>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ── Sub-components ───────────────────────────────────────
function KPICard({ icon: Icon, label, value, color, variants }: {
  icon: any; label: string; value: number; color: string; variants: any;
}) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-yellow-500/10 text-yellow-500',
    success: 'bg-emerald-500/10 text-emerald-500',
    destructive: 'bg-red-500/10 text-red-500',
    info: 'bg-blue-500/10 text-blue-500',
  };
  const cls = colorMap[color] || colorMap.primary;
  const [bg, text] = cls.split(' ');

  return (
    <motion.div variants={variants}>
      <Card className="glass-card p-4 hover:scale-[1.02] transition-transform">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
            <Icon className={`w-5 h-5 ${text}`} />
          </div>
          <div>
            <motion.p
              className="text-2xl font-bold text-foreground"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              {value}
            </motion.p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function TaskListItem({ task, index, showDueDate }: { task: Task; index: number; showDueDate?: boolean }) {
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && task.status !== 'done';
  const catIcon = task.category === 'pessoal' ? User : task.category === 'projeto' ? FolderKanban : Briefcase;
  const CatIcon = catIcon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <span className="text-xs text-muted-foreground w-5 text-right font-mono">{index + 1}</span>
      <CatIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <p className="text-sm text-foreground truncate flex-1">{task.title}</p>
      {showDueDate && task.due_date && (
        <span className={`text-[10px] whitespace-nowrap ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
          {format(parseISO(task.due_date), "dd MMM", { locale: ptBR })}
        </span>
      )}
      {!showDueDate && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {format(parseISO(task.created_at), "dd MMM", { locale: ptBR })}
        </span>
      )}
    </motion.div>
  );
}
