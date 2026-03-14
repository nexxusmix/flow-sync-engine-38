import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInstagramAI, useProfileConfig, useProfileSnapshots } from '@/hooks/useInstagramEngine';
import { Loader2, Sparkles, TrendingUp, DollarSign, Users, Zap } from 'lucide-react';

export function ProjectionsTab() {
  const { data: config } = useProfileConfig();
  const { data: snapshots } = useProfileSnapshots();
  const aiMutation = useInstagramAI();
  const latest = snapshots?.[0];

  const [freq, setFreq] = useState('1');
  const [engagement, setEngagement] = useState(latest?.avg_engagement?.toString() || '3.2');
  const [followers, setFollowers] = useState(latest?.followers?.toString() || '70');
  const [ticket, setTicket] = useState('15000');
  const [projections, setProjections] = useState<any>(null);

  const handleGenerate = async () => {
    try {
      const result = await aiMutation.mutateAsync({
        action: 'generate_projections',
        data: {
          current_frequency: parseInt(freq),
          avg_engagement: parseFloat(engagement),
          followers: parseInt(followers),
          ticket_medio: parseInt(ticket),
        },
      });
      setProjections(result);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Projeções de Crescimento</h3>
        <p className="text-xs text-muted-foreground">Instagram → Leads → Receita</p>
      </div>

      {/* Input Parameters */}
      <Card className="glass-card p-5">
        <h4 className="text-xs font-medium text-foreground mb-3 uppercase tracking-wide">Parâmetros Atuais</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Posts/semana</label>
            <Input type="number" value={freq} onChange={e => setFreq(e.target.value)} className="text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Engajamento (%)</label>
            <Input type="number" step="0.1" value={engagement} onChange={e => setEngagement(e.target.value)} className="text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Seguidores</label>
            <Input type="number" value={followers} onChange={e => setFollowers(e.target.value)} className="text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Ticket Médio (R$)</label>
            <Input type="number" value={ticket} onChange={e => setTicket(e.target.value)} className="text-sm" />
          </div>
        </div>
        <Button className="mt-4 gap-1.5" onClick={handleGenerate} disabled={aiMutation.isPending}>
          {aiMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Gerar Projeções
        </Button>
      </Card>

      {/* Results */}
      {projections && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Current vs Optimized */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card p-5 border-muted-foreground/20">
              <h4 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">📉 Ritmo Atual</h4>
              <div className="space-y-3">
                <ProjectionRow icon={Users} label="Leads/mês" value={projections.current_pace?.leads_per_month || 0} />
                <ProjectionRow icon={TrendingUp} label="Crescimento" value={`${projections.current_pace?.growth_rate || 0}%`} />
                <ProjectionRow icon={Users} label="Seguidores 30d" value={projections.current_pace?.projected_followers_30d || 0} />
                <ProjectionRow icon={Users} label="Seguidores 90d" value={projections.current_pace?.projected_followers_90d || 0} />
              </div>
            </Card>

            <Card className="glass-card p-5 border-primary/30">
              <h4 className="text-xs font-medium text-primary mb-4 uppercase tracking-wide">🚀 Ritmo Otimizado</h4>
              <div className="space-y-3">
                <ProjectionRow icon={Zap} label="Frequência recomendada" value={`${projections.optimized_pace?.recommended_frequency || 3} posts/semana`} highlight />
                <ProjectionRow icon={Users} label="Leads/mês" value={projections.optimized_pace?.leads_per_month || 0} highlight />
                <ProjectionRow icon={TrendingUp} label="Crescimento" value={`${projections.optimized_pace?.growth_rate || 0}%`} highlight />
                <ProjectionRow icon={Users} label="Seguidores 90d" value={projections.optimized_pace?.projected_followers_90d || 0} highlight />
                <ProjectionRow icon={DollarSign} label="Receita projetada 90d" value={`R$ ${(projections.optimized_pace?.projected_revenue_90d || 0).toLocaleString()}`} highlight />
              </div>
            </Card>
          </div>

          {/* Insights */}
          {projections.insights?.length > 0 && (
            <Card className="glass-card p-5">
              <h4 className="text-xs font-medium text-foreground mb-3">💡 Insights</h4>
              <ul className="space-y-2">
                {projections.insights.map((ins: string, i: number) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span> {ins}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Quick Wins */}
          {projections.quick_wins?.length > 0 && (
            <Card className="glass-card p-5 border-primary/20">
              <h4 className="text-xs font-medium text-primary mb-3">⚡ Quick Wins</h4>
              <ul className="space-y-2">
                {projections.quick_wins.map((qw: string, i: number) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span> {qw}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectionRow({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: any; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${highlight ? 'text-foreground' : 'text-muted-foreground'}`}>{value}</span>
    </div>
  );
}
