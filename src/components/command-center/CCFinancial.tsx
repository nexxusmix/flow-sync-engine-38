import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Clock } from 'lucide-react';
import { formatCurrencyBRL } from '@/utils/format';
import type { ExecutiveMetrics } from '@/hooks/useExecutiveDashboard';
import { CashRunwayIndicator } from '@/components/dashboard/CashRunwayIndicator';
import { RevenueForecaster } from '@/components/dashboard/RevenueForecaster';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

interface Props {
  metrics: ExecutiveMetrics;
}

export function CCFinancial({ metrics: m }: Props) {
  const cards = [
    { label: 'Receita do Mês', value: formatCurrencyBRL(m.revenueCurrentMonth), delta: m.revenueDelta, icon: DollarSign },
    { label: 'Despesas do Mês', value: formatCurrencyBRL(m.expenseCurrentMonth), delta: -m.expenseDelta, icon: DollarSign },
    { label: 'Saldo Atual', value: formatCurrencyBRL(m.balanceCurrent), icon: DollarSign, color: m.balanceCurrent >= 0 ? 'text-primary' : 'text-destructive' },
    { label: 'A Receber', value: formatCurrencyBRL(m.pendingRevenue), icon: TrendingUp },
    { label: 'Vencido', value: formatCurrencyBRL(m.overdueRevenue), icon: AlertTriangle, color: 'text-destructive', hide: m.overdueRevenue === 0 },
    { label: 'Burn Rate', value: formatCurrencyBRL(m.burnRateMonthly), icon: Clock },
  ].filter(c => !c.hide);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <Card key={c.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`w-4 h-4 ${c.color || 'text-primary'}`} />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{c.label}</p>
            </div>
            <p className={`text-lg font-semibold ${c.color || 'text-foreground'}`}>{c.value}</p>
            {c.delta !== undefined && (
              <p className={`text-[10px] mt-0.5 ${c.delta >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {c.delta >= 0 ? '↑' : '↓'} {Math.abs(c.delta).toFixed(1)}%
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Revenue vs Expense Chart */}
      <Card className="glass-card p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Receita vs Despesa (6 meses)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={m.revenueByMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrencyBRL(v)} />
            <Legend />
            <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Forecast + Runway */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueForecaster
            forecast30={m.revenueForecast30}
            forecast60={m.revenueForecast60}
            forecast90={m.revenueForecast90}
          />
        </div>
        <CashRunwayIndicator
          runwayMonths={m.cashRunwayMonths}
          burnRateMonthly={m.burnRateMonthly}
          balanceCurrent={m.balanceCurrent}
          pendingRevenue={m.pendingRevenue}
        />
      </div>
    </motion.div>
  );
}
