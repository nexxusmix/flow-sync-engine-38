import { TrendingUp, AlertCircle, Send } from "lucide-react";
import { invoices, cashFlowForecast } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function CashFlowSection() {
  // A vencer (D-3 e D0)
  const dueSoon = invoices.filter((inv) => inv.status === "pendente" && inv.daysOverdue === 0);

  // Inadimplentes por faixa
  const overdue = invoices.filter((inv) => inv.status === "vencido");
  const overdueByRange = {
    d1_3: overdue.filter((inv) => inv.daysOverdue >= 1 && inv.daysOverdue <= 3),
    d4_7: overdue.filter((inv) => inv.daysOverdue >= 4 && inv.daysOverdue <= 7),
    d8_15: overdue.filter((inv) => inv.daysOverdue >= 8 && inv.daysOverdue <= 15),
    d15plus: overdue.filter((inv) => inv.daysOverdue > 15),
  };

  const totalExpected = cashFlowForecast.reduce((sum, d) => sum + d.expected, 0);

  return (
    <section>
      <h2 className="section-label mb-3">Caixa</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Previsão 30 dias */}
        <div className="card-flat">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-foreground">Previsão 30 dias</span>
          </div>

          <div className="mb-4">
            <p className="text-3xl font-semibold text-foreground">R$ {totalExpected.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Total previsto</p>
          </div>

          {/* Simple bar chart */}
          <div className="space-y-2">
            {cashFlowForecast.slice(0, 6).map((day, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-12">{day.date}</span>
                <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-success/50 rounded-sm"
                    style={{ width: `${Math.min((day.expected / 25000) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right">
                  {day.expected > 0 ? `R$ ${(day.expected / 1000).toFixed(1)}k` : "-"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* A vencer */}
        <div className="card-flat">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-foreground">A Vencer (D-3 a D0)</span>
          </div>

          {dueSoon.length > 0 ? (
            <div className="space-y-2">
              {dueSoon.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.accountName}</p>
                    <p className="text-xs text-muted-foreground">Vence {new Date(inv.dueDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">R$ {inv.amount.toLocaleString()}</span>
                    <button className="btn-subtle text-xs flex items-center gap-1">
                      <Send className="h-3 w-3" /> Lembrete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma fatura a vencer nos próximos 3 dias</p>
            </div>
          )}
        </div>

        {/* Inadimplentes */}
        <div className="card-flat">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-foreground">Inadimplentes</span>
          </div>

          <div className="space-y-3">
            {[
              { label: "D+1 a D+3", data: overdueByRange.d1_3, color: "warning" },
              { label: "D+4 a D+7", data: overdueByRange.d4_7, color: "warning" },
              { label: "D+8 a D+15", data: overdueByRange.d8_15, color: "destructive" },
              { label: "D+15+", data: overdueByRange.d15plus, color: "destructive" },
            ].map((range) => {
              const total = range.data.reduce((sum, inv) => sum + inv.amount, 0);
              if (range.data.length === 0) return null;
              return (
                <div key={range.label} className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-xs font-medium",
                      range.color === "warning" ? "text-warning" : "text-destructive"
                    )}>{range.label}</span>
                    <span className="text-xs text-muted-foreground">{range.data.length} faturas</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-2">R$ {total.toLocaleString()}</p>
                  <div className="space-y-1">
                    {range.data.slice(0, 3).map((inv) => (
                      <p key={inv.id} className="text-xs text-muted-foreground truncate">
                        {inv.accountName} • R$ {inv.amount.toLocaleString()}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}

            {overdue.length === 0 && (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma fatura em atraso 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
