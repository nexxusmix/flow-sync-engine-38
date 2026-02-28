import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Gauge } from 'lucide-react';

interface CapacityForecastProps {
  weeklyLoad: Array<{ week: string; loadPct: number }>;
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

export function CapacityForecast({ weeklyLoad }: CapacityForecastProps) {
  if (!weeklyLoad || weeklyLoad.length === 0) return null;

  return (
    <Card className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">Previsão de Capacidade (4 semanas)</h3>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={weeklyLoad}>
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, (max: number) => Math.max(max, 120)]}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(0)}%`} />
          <ReferenceLine y={100} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: '100%', position: 'right', fontSize: 10, fill: 'hsl(var(--destructive))' }} />
          <Bar dataKey="loadPct" name="Carga" radius={[4, 4, 0, 0]}>
            {weeklyLoad.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.loadPct > 100 ? 'hsl(var(--destructive))' : entry.loadPct > 80 ? 'hsl(40, 90%, 50%)' : 'hsl(var(--primary))'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
