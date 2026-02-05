import { cn } from "@/lib/utils";

interface QuickStatProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

function QuickStat({ label, value, change, changeType = "neutral" }: QuickStatProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{value}</span>
        {change && (
          <span className={cn(
            "text-xs",
            changeType === "positive" && "text-success",
            changeType === "negative" && "text-destructive",
            changeType === "neutral" && "text-muted-foreground"
          )}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

export function QuickStats() {
  return (
    <div className="bento-card">
      <h3 className="font-medium mb-3">Resumo do Mês</h3>
      <div className="divide-y divide-border">
        <QuickStat label="Propostas enviadas" value="12" change="+3" changeType="positive" />
        <QuickStat label="Taxa de conversão" value="42%" change="+8%" changeType="positive" />
        <QuickStat label="Ticket médio" value="R$ 6.200" change="-5%" changeType="negative" />
        <QuickStat label="Tempo médio de fechamento" value="8 dias" changeType="neutral" />
      </div>
    </div>
  );
}
