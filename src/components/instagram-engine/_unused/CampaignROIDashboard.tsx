import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, Target, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell } from 'recharts';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

interface Goal {
  id: string;
  metric_key: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
}

export function CampaignROIDashboard({ campaign, posts }: Props) {
  const { data: goals } = useQuery({
    queryKey: ['campaign-goals', campaign.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_campaign_goals' as any)
        .select('*')
        .eq('campaign_id', campaign.id);
      if (error) throw error;
      return (data || []) as unknown as Goal[];
    },
  });

  const budget = campaign.budget || 0;

  const stats = useMemo(() => {
    const published = posts.filter(p => p.status === 'published');
    const total = posts.length;
    const costPerPost = total > 0 && budget > 0 ? budget / total : 0;
    const costPerPublished = published.length > 0 && budget > 0 ? budget / published.length : 0;

    // Estimate engagement from goals
    const engagementGoal = goals?.find(g => g.metric_key === 'engagement');
    const reachGoal = goals?.find(g => g.metric_key === 'reach');
    const leadsGoal = goals?.find(g => g.metric_key === 'leads');
    const salesGoal = goals?.find(g => g.metric_key === 'sales');

    const costPerEngagement = engagementGoal && engagementGoal.current_value > 0 && budget > 0
      ? budget / engagementGoal.current_value : null;
    const costPerLead = leadsGoal && leadsGoal.current_value > 0 && budget > 0
      ? budget / leadsGoal.current_value : null;
    const roi = salesGoal && salesGoal.current_value > 0 && budget > 0
      ? ((salesGoal.current_value - budget) / budget) * 100 : null;
    const cpm = reachGoal && reachGoal.current_value > 0 && budget > 0
      ? (budget / reachGoal.current_value) * 1000 : null;

    // Budget allocation by status
    const statusCounts = posts.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Budget allocation by pillar
    const pillarCounts = posts.reduce((acc, p) => {
      const key = p.pillar || 'sem_pilar';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Budget usage estimation (proportional to posts progress)
    const completionRate = total > 0 ? published.length / total : 0;
    const estimatedSpend = budget * completionRate;
    const remaining = budget - estimatedSpend;

    return {
      total, published: published.length, costPerPost, costPerPublished,
      costPerEngagement, costPerLead, roi, cpm,
      statusCounts, pillarCounts, estimatedSpend, remaining, completionRate,
    };
  }, [posts, budget, goals]);

  const statusData = useMemo(() =>
    Object.entries(stats.statusCounts).map(([key, count]) => ({
      name: key === 'published' ? 'Publicado' : key === 'ready' ? 'Pronto' : key === 'in_production' ? 'Produção' : key === 'scheduled' ? 'Agendado' : key === 'planned' ? 'Planejado' : 'Ideia',
      value: count,
      cost: stats.total > 0 ? (count / stats.total * budget).toFixed(0) : 0,
    }))
  , [stats.statusCounts, stats.total, budget]);

  const pillarData = useMemo(() =>
    Object.entries(stats.pillarCounts).map(([key, count]) => ({
      name: key === 'sem_pilar' ? 'Sem pilar' : key.charAt(0).toUpperCase() + key.slice(1),
      value: count,
    }))
  , [stats.pillarCounts]);

  const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--primary) / 0.7)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--muted-foreground))', 'hsl(var(--primary) / 0.3)', 'hsl(var(--muted-foreground) / 0.6)'];

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Dashboard de ROI & Budget</h4>
        {budget > 0 && <Badge variant="outline" className="text-[9px]">Budget: {formatCurrency(budget)}</Badge>}
      </div>

      {budget === 0 ? (
        <Card className="glass-card p-6 text-center">
          <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Defina um orçamento na campanha para ativar o tracking de ROI</p>
        </Card>
      ) : (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="glass-card p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Custo/Post</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(stats.costPerPost)}</p>
              <p className="text-[9px] text-muted-foreground">{stats.total} posts totais</p>
            </Card>
            <Card className="glass-card p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Custo/Publicado</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(stats.costPerPublished)}</p>
              <p className="text-[9px] text-muted-foreground">{stats.published} publicados</p>
            </Card>
            <Card className="glass-card p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Gasto Estimado</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(stats.estimatedSpend)}</p>
              <p className="text-[9px] text-muted-foreground">{Math.round(stats.completionRate * 100)}% executado</p>
            </Card>
            <Card className="glass-card p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Saldo Restante</p>
              <p className={`text-lg font-bold ${stats.remaining >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(stats.remaining)}
              </p>
              <p className="text-[9px] text-muted-foreground">
                {stats.remaining >= 0 ? 'Dentro do budget' : 'Acima do budget'}
              </p>
            </Card>
          </div>

          {/* Advanced metrics from goals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="glass-card p-3">
              <div className="flex items-center gap-1 mb-1">
                <Zap className="w-3 h-3 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase">CPM</p>
              </div>
              <p className="text-sm font-bold text-foreground">
                {stats.cpm !== null ? formatCurrency(stats.cpm) : '—'}
              </p>
              <p className="text-[9px] text-muted-foreground">Custo por 1.000 alcance</p>
            </Card>
            <Card className="glass-card p-3">
              <div className="flex items-center gap-1 mb-1">
                <Target className="w-3 h-3 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase">CPL</p>
              </div>
              <p className="text-sm font-bold text-foreground">
                {stats.costPerLead !== null ? formatCurrency(stats.costPerLead) : '—'}
              </p>
              <p className="text-[9px] text-muted-foreground">Custo por lead</p>
            </Card>
            <Card className="glass-card p-3">
              <div className="flex items-center gap-1 mb-1">
                <BarChart3 className="w-3 h-3 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase">CPE</p>
              </div>
              <p className="text-sm font-bold text-foreground">
                {stats.costPerEngagement !== null ? formatCurrency(stats.costPerEngagement) : '—'}
              </p>
              <p className="text-[9px] text-muted-foreground">Custo por engajamento</p>
            </Card>
            <Card className="glass-card p-3">
              <div className="flex items-center gap-1 mb-1">
                {stats.roi !== null && stats.roi >= 0 ? <TrendingUp className="w-3 h-3 text-primary" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
                <p className="text-[10px] text-muted-foreground uppercase">ROI</p>
              </div>
              <p className={`text-sm font-bold ${stats.roi !== null && stats.roi >= 0 ? 'text-primary' : stats.roi !== null ? 'text-destructive' : 'text-foreground'}`}>
                {stats.roi !== null ? `${stats.roi.toFixed(1)}%` : '—'}
              </p>
              <p className="text-[9px] text-muted-foreground">Retorno sobre investimento</p>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card p-4">
              <h5 className="text-[10px] text-muted-foreground uppercase mb-3">Investimento por Status</h5>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                      formatter={(v: any) => [`${v} posts`, 'Qtd']}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="glass-card p-4">
              <h5 className="text-[10px] text-muted-foreground uppercase mb-3">Distribuição por Pilar</h5>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie data={pillarData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value">
                      {pillarData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                    />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {pillarData.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Budget gauge */}
          <Card className="glass-card p-4">
            <h5 className="text-[10px] text-muted-foreground uppercase mb-2">Consumo do Budget</h5>
            <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${stats.completionRate > 0.9 ? 'bg-destructive' : stats.completionRate > 0.7 ? 'bg-muted-foreground' : 'bg-primary'}`}
                style={{ width: `${Math.min(stats.completionRate * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground">
              <span>{formatCurrency(stats.estimatedSpend)} gastos</span>
              <span>{formatCurrency(budget)} total</span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
