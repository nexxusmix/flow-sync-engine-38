import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  CartesianGrid, AreaChart, Area, ReferenceLine, Cell
} from 'recharts';
import { ListTodo, Zap, Timer, Flame, Gauge } from 'lucide-react';
import type { ExecutiveMetrics } from '@/hooks/useExecutiveDashboard';
import { CapacityForecast } from '@/components/dashboard/CapacityForecast';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

interface Props {
  metrics: ExecutiveMetrics;
}

export function CCOperations({ metrics: m }: Props) {
  const stats = [
    { label: 'Total Tarefas', value: m.tasksTotal, icon: ListTodo },
    { label: 'Pendentes', value: m.tasksPending, icon: ListTodo },
    { label: 'Concluídas (mês)', value: m.tasksCompletedThisMonth, icon: Zap, delta: m.tasksDelta },
    { label: 'Velocity', value: `${m.velocityPerDay.toFixed(1)}/dia`, icon: Flame },
    { label: 'Tempo Médio', value: `${m.avgCompletionDays.toFixed(1)}d`, icon: Timer },
    { label: 'Backlog Clear', value: m.backlogClearDate || 'N/A', icon: Gauge },
  ];

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
            </div>
            <p className="text-lg font-semibold text-foreground">{s.value}</p>
            {s.delta !== undefined && (
              <p className={`text-[10px] mt-0.5 ${s.delta >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {s.delta >= 0 ? '↑' : '↓'} {Math.abs(s.delta).toFixed(1)}% vs anterior
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Burndown */}
        <Card className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Burndown (14 dias)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={m.burndownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={2} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="ideal" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} name="Ideal" />
              <Line type="monotone" dataKey="remaining" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Real" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Completion Trend */}
        <Card className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Conclusões / Dia (30 dias)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={m.completionTrend}>
              <defs>
                <linearGradient id="ccCompGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#ccCompGrad)" strokeWidth={2} name="Concluídas" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Capacity Forecast */}
      <CapacityForecast weeklyLoad={m.capacityLoadWeekly} />
    </motion.div>
  );
}
