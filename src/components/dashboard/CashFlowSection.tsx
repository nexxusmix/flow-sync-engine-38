import { invoices, cashFlowForecast } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function CashFlowSection() {
  const dueSoon = invoices.filter((inv) => inv.status === "pendente" && inv.daysOverdue === 0);
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
      <h2 className="section-label mb-6">Caixa</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Previsão 30 dias */}
        <div className="glass-card p-10 rounded-[3rem]">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-success text-2xl">trending_up</span>
            <span className="text-lg font-black uppercase tracking-tighter text-foreground">Previsão 30 dias</span>
          </div>
          <div className="mb-6">
            <p className="text-4xl font-bold text-foreground tracking-tighter">R$ {totalExpected.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Total previsto</p>
          </div>
          <div className="space-y-3">
            {cashFlowForecast.slice(0, 6).map((day, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-12 font-bold">{day.date}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/50 rounded-full" style={{ width: `${Math.min((day.expected / 25000) * 100, 100)}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-16 text-right font-bold">
                  {day.expected > 0 ? `R$ ${(day.expected / 1000).toFixed(1)}k` : "-"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* A vencer */}
        <div className="glass-card p-10 rounded-[3rem]">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-warning text-2xl">schedule</span>
            <span className="text-lg font-black uppercase tracking-tighter text-foreground">A Vencer</span>
          </div>
          {dueSoon.length > 0 ? (
            <div className="space-y-3">
              {dueSoon.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-foreground">{inv.accountName}</p>
                    <p className="text-[10px] text-muted-foreground">Vence {new Date(inv.dueDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground">R$ {inv.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhuma fatura a vencer</p>
          )}
        </div>

        {/* Inadimplentes */}
        <div className="glass-card p-10 rounded-[3rem]">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-destructive text-2xl">warning</span>
            <span className="text-lg font-black uppercase tracking-tighter text-foreground">Inadimplentes</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "D+1 a D+3", data: overdueByRange.d1_3, color: "warning" },
              { label: "D+15+", data: overdueByRange.d15plus, color: "destructive" },
            ].map((range) => {
              const total = range.data.reduce((sum, inv) => sum + inv.amount, 0);
              if (range.data.length === 0) return null;
              return (
                <div key={range.label} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[10px] font-black uppercase", range.color === "warning" ? "text-warning" : "text-destructive")}>{range.label}</span>
                    <span className="text-[10px] text-muted-foreground">{range.data.length} faturas</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">R$ {total.toLocaleString()}</p>
                </div>
              );
            })}
            {overdue.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhuma fatura em atraso 🎉</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
