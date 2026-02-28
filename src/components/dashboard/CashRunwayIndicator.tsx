import { Card } from '@/components/ui/card';
import { Fuel, AlertTriangle } from 'lucide-react';
import { formatCurrencyBRL } from '@/utils/format';

interface CashRunwayIndicatorProps {
  runwayMonths: number;
  burnRateMonthly: number;
  balanceCurrent: number;
  pendingRevenue: number;
}

export function CashRunwayIndicator({ runwayMonths, burnRateMonthly, balanceCurrent, pendingRevenue }: CashRunwayIndicatorProps) {
  const isAlert = runwayMonths < 2;
  const isWarning = runwayMonths >= 2 && runwayMonths < 4;
  const cappedMonths = Math.min(runwayMonths, 12);
  const pct = (cappedMonths / 12) * 100;

  return (
    <Card className={`glass-card p-4 ${isAlert ? 'border-destructive/30' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <Fuel className={`w-4 h-4 ${isAlert ? 'text-destructive' : 'text-primary'}`} />
        <h3 className="text-xs font-medium text-foreground uppercase tracking-wide">Cash Runway</h3>
        {isAlert && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
      </div>
      
      <div className="flex items-end gap-2 mb-3">
        <span className={`text-2xl font-bold ${isAlert ? 'text-destructive' : isWarning ? 'text-yellow-500' : 'text-foreground'}`}>
          {runwayMonths === Infinity ? '∞' : runwayMonths.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground mb-1">meses</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isAlert ? 'bg-destructive' : isWarning ? 'bg-yellow-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
        <div>
          <p>Burn Rate</p>
          <p className="text-xs font-medium text-foreground">{formatCurrencyBRL(burnRateMonthly)}/mês</p>
        </div>
        <div>
          <p>Liquidez</p>
          <p className="text-xs font-medium text-foreground">{formatCurrencyBRL(balanceCurrent + pendingRevenue)}</p>
        </div>
      </div>
    </Card>
  );
}
