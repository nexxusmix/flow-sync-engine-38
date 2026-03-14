import { useBillingMetrics, useBillingPlans, useBillingSubscriptions } from '@/hooks/useBilling';
import { Loader2 } from 'lucide-react';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export function BillingOverview() {
  const m = useBillingMetrics();
  const { data: plans = [], isLoading } = useBillingPlans();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const cards = [
    { label: 'MRR', value: fmt(m.mrr), icon: 'trending_up', accent: 'text-primary' },
    { label: 'ARR estimado', value: fmt(m.arr), icon: 'calendar_month', accent: 'text-primary' },
    { label: 'Receita do mês', value: fmt(m.revenueThisMonth), icon: 'payments', accent: 'text-emerald-400' },
    { label: 'Assinaturas ativas', value: String(m.activeSubs), icon: 'card_membership', accent: 'text-primary' },
    { label: 'Trials ativos', value: String(m.trialSubs), icon: 'hourglass_top', accent: 'text-amber-400' },
    { label: 'Cancelamentos', value: String(m.canceledSubs), icon: 'cancel', accent: 'text-destructive' },
    { label: 'Inadimplência', value: fmt(m.overdueAmount), icon: 'warning', accent: 'text-destructive' },
    { label: 'Faturas vencidas', value: String(m.overdueCount), icon: 'receipt_long', accent: 'text-orange-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="glass-card rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`material-symbols-rounded text-[16px] ${c.accent}`}>{c.icon}</span>
              {c.label}
            </div>
            <p className="text-xl font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Distribution by plan */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Distribuição por Plano</h3>
        {plans.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum plano cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {plans.filter(p => p.status === 'active').map(plan => {
              const count = m.activeSubs; // simplified — in production, count per plan
              return (
                <div key={plan.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${plan.is_highlighted ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                    <span className="text-sm text-foreground">{plan.name}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{fmt(plan.price_monthly)}/mês</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
