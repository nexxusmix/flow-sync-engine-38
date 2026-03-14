import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Users, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrencyBRL } from '@/utils/format';
import type { ExecutiveMetrics } from '@/hooks/useExecutiveDashboard';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

interface Props {
  metrics: ExecutiveMetrics;
}

export function CCCommercial({ metrics: m }: Props) {
  const kpis = [
    { label: 'Pipeline Total', value: formatCurrencyBRL(m.pipelineValue), icon: DollarSign },
    { label: 'Forecast', value: formatCurrencyBRL(m.forecast), icon: TrendingUp },
    { label: 'Deals Ativos', value: String(m.dealsActive), icon: Users },
    { label: 'Deals Fechados', value: String(m.wonDeals), icon: Target },
    { label: 'Valor Fechado', value: formatCurrencyBRL(m.wonValue), icon: DollarSign },
    { label: 'Conversão', value: `${m.conversionRate.toFixed(1)}%`, icon: Target },
  ];

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <k.icon className="w-4 h-4 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{k.label}</p>
            </div>
            <p className="text-lg font-semibold text-foreground">{k.value}</p>
          </Card>
        ))}
      </div>

      {/* Funnel */}
      <Card className="glass-card p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Funil de Vendas</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={m.dealsByStage} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis type="category" dataKey="stage" width={100} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => name === 'value' ? formatCurrencyBRL(v) : v} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Deals" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </motion.div>
  );
}
