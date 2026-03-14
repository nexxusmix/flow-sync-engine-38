import { useBillingMetrics, useBillingPlans } from '@/hooks/useBilling';
import { Loader2 } from 'lucide-react';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export function BillingRevenue() {
  const m = useBillingMetrics();
  const { data: plans = [], isLoading } = useBillingPlans();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const metrics = [
    { label: 'MRR', value: fmt(m.mrr), desc: 'Receita recorrente mensal' },
    { label: 'ARR', value: fmt(m.arr), desc: 'Receita recorrente anual estimada' },
    { label: 'Receita do mês', value: fmt(m.revenueThisMonth), desc: 'Total pago este mês' },
    { label: 'Assinaturas ativas', value: String(m.activeSubs), desc: 'Workspaces pagantes' },
    { label: 'Trials ativos', value: String(m.trialSubs), desc: 'Em período de avaliação' },
    { label: 'Churn', value: String(m.canceledSubs), desc: 'Cancelamentos registrados' },
    { label: 'Inadimplência', value: fmt(m.overdueAmount), desc: `${m.overdueCount} faturas vencidas` },
    { label: 'Ticket médio', value: m.activeSubs > 0 ? fmt(m.mrr / m.activeSubs) : 'R$ 0,00', desc: 'MRR / assinaturas ativas' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(met => (
          <div key={met.label} className="glass-card rounded-xl p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{met.label}</p>
            <p className="text-xl font-bold text-foreground">{met.value}</p>
            <p className="text-[11px] text-muted-foreground/70">{met.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Receita por Plano</h3>
        {plans.filter(p => p.status === 'active').length === 0 ? (
          <p className="text-xs text-muted-foreground">Cadastre planos para ver a distribuição de receita.</p>
        ) : (
          <div className="space-y-3">
            {plans.filter(p => p.status === 'active').map(plan => (
              <div key={plan.id} className="flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full ${plan.is_highlighted ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{plan.name}</span>
                    <span className="text-sm font-bold text-foreground">{fmt(plan.price_monthly)}/mês</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] text-muted-foreground">{plan.price_yearly > 0 ? `${fmt(plan.price_yearly)}/ano` : 'Sem plano anual'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
