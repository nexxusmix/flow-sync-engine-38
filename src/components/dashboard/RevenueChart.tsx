import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrencyBRL } from '@/utils/format';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export function RevenueChart() {
  const { user } = useAuth();

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['revenue-chart', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);

      const { data, error } = await supabase
        .from('revenues')
        .select('amount, due_date, status')
        .gte('due_date', sixMonthsAgo.toISOString().split('T')[0])
        .eq('created_by', user.id);

      if (error) throw error;

      // Group by month
      const months: Record<string, { received: number; pending: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months[key] = { received: 0, pending: 0 };
      }

      (data || []).forEach(r => {
        const key = r.due_date?.substring(0, 7);
        if (key && months[key]) {
          if (r.status === 'received') months[key].received += Number(r.amount) || 0;
          else months[key].pending += Number(r.amount) || 0;
        }
      });

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return Object.entries(months).map(([key, val]) => ({
        month: monthNames[parseInt(key.split('-')[1]) - 1],
        received: val.received,
        pending: val.pending,
      }));
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <Skeleton className="h-[280px] rounded-2xl" />;

  return (
    <motion.div
      className="glass-card rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">Receita Mensal</h3>
          <p className="text-mono text-muted-foreground uppercase tracking-wider">Últimos 6 meses</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value: number) => formatCurrencyBRL(value)}
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 11 }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
          />
          <Area type="monotone" dataKey="received" stroke="hsl(var(--primary))" fill="url(#colorReceived)" strokeWidth={2} name="Recebido" />
          <Area type="monotone" dataKey="pending" stroke="hsl(var(--destructive))" fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="Pendente" />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
