import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrencyBRL } from '@/utils/format';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(210 80% 60%)',
  'hsl(160 60% 50%)',
  'hsl(45 90% 55%)',
  'hsl(0 70% 55%)',
  'hsl(280 60% 55%)',
  'hsl(200 70% 50%)',
  'hsl(120 50% 45%)',
];

export function PipelineChart() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['pipeline-chart', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('crm_deals')
        .select('stage_key, value')
        .eq('created_by', user.id);

      if (error) throw error;

      const stages: Record<string, { value: number; count: number }> = {};
      (data || []).forEach(d => {
        const key = d.stage_key || 'lead';
        if (!stages[key]) stages[key] = { value: 0, count: 0 };
        stages[key].value += Number(d.value) || 0;
        stages[key].count += 1;
      });

      return Object.entries(stages).map(([key, val]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
        value: val.value,
        count: val.count,
      })).filter(d => d.count > 0);
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <Skeleton className="h-[280px] rounded-2xl" />;

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <motion.div
      className="glass-card rounded-2xl p-6 cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      onClick={() => navigate('/crm')}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">Pipeline por Estágio</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total: {formatCurrencyBRL(total)}</p>
        </div>
      </div>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-xs">Nenhum deal no pipeline</div>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={200}>
            <PieChart>
              <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrencyBRL(value)}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-muted-foreground flex-1 truncate">{d.name}</span>
                <span className="text-[10px] font-medium text-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
