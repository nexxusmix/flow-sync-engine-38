import { useBillingSubscriptions, useBillingPlans } from '@/hooks/useBilling';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusMap: Record<string, { label: string; cls: string }> = {
  active: { label: 'Ativa', cls: 'bg-emerald-500/15 text-emerald-400' },
  trialing: { label: 'Trial', cls: 'bg-amber-500/15 text-amber-400' },
  canceled: { label: 'Cancelada', cls: 'bg-destructive/15 text-destructive' },
  past_due: { label: 'Inadimplente', cls: 'bg-orange-500/15 text-orange-400' },
  suspended: { label: 'Suspensa', cls: 'bg-muted text-muted-foreground' },
};

export function BillingSubscriptions() {
  const { data: subs = [], isLoading } = useBillingSubscriptions();
  const { data: plans = [] } = useBillingPlans();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  if (subs.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <span className="material-symbols-rounded text-4xl text-muted-foreground/40">card_membership</span>
        <p className="text-sm text-muted-foreground">Nenhuma assinatura registrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subs.map(sub => {
        const plan = plans.find(p => p.id === sub.plan_id);
        const st = statusMap[sub.status] || statusMap.active;
        return (
          <div key={sub.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-rounded text-lg text-primary">card_membership</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-foreground">{plan?.name || 'Plano removido'}</span>
                <Badge className={`text-[10px] py-0 px-1.5 border-0 ${st.cls}`}>{st.label}</Badge>
                <Badge variant="outline" className="text-[10px] py-0">{sub.billing_cycle === 'yearly' ? 'Anual' : 'Mensal'}</Badge>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>Workspace: {sub.workspace_id.slice(0, 8)}...</span>
                <span>•</span>
                <span>Período: {format(new Date(sub.current_period_start), 'dd/MM', { locale: ptBR })} — {format(new Date(sub.current_period_end), 'dd/MM/yy', { locale: ptBR })}</span>
                {sub.trial_ends_at && <><span>•</span><span>Trial até {format(new Date(sub.trial_ends_at), 'dd/MM/yy')}</span></>}
              </div>
            </div>
            {sub.cancel_at_period_end && (
              <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Cancela no fim do ciclo</Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
