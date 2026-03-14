import { useBillingInvoices } from '@/hooks/useBilling';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendente', cls: 'bg-amber-500/15 text-amber-400' },
  paid: { label: 'Pago', cls: 'bg-emerald-500/15 text-emerald-400' },
  overdue: { label: 'Vencida', cls: 'bg-destructive/15 text-destructive' },
  canceled: { label: 'Cancelada', cls: 'bg-muted text-muted-foreground' },
  refunded: { label: 'Reembolsada', cls: 'bg-blue-500/15 text-blue-400' },
};

export function BillingInvoices() {
  const { data: invoices = [], isLoading } = useBillingInvoices();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  if (invoices.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <span className="material-symbols-rounded text-4xl text-muted-foreground/40">receipt_long</span>
        <p className="text-sm text-muted-foreground">Nenhuma fatura registrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_100px_100px_90px_100px] gap-2 px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">
        <span>Descrição</span><span>Valor</span><span>Vencimento</span><span>Status</span><span>Pago em</span>
      </div>
      {invoices.map(inv => {
        const st = statusMap[inv.status] || statusMap.pending;
        return (
          <div key={inv.id} className="glass-card rounded-lg px-4 py-3 grid grid-cols-[1fr_100px_100px_90px_100px] gap-2 items-center text-sm">
            <span className="text-foreground truncate">{inv.description || 'Fatura'}</span>
            <span className="font-medium text-foreground">{fmt(Number(inv.amount))}</span>
            <span className="text-muted-foreground text-xs">{inv.due_date ? format(new Date(inv.due_date), 'dd/MM/yy', { locale: ptBR }) : '—'}</span>
            <Badge className={`text-[10px] py-0 px-1.5 border-0 w-fit ${st.cls}`}>{st.label}</Badge>
            <span className="text-muted-foreground text-xs">{inv.paid_at ? format(new Date(inv.paid_at), 'dd/MM/yy') : '—'}</span>
          </div>
        );
      })}
    </div>
  );
}
