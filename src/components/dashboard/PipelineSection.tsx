import { pipelineSummary, deals, getStageLabel } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function PipelineSection() {
  // Deals parados (sem atividade há 3+ dias)
  const stuckDeals = deals.filter((d) => d.lastActivityDays >= 3 && d.stage !== 'pos_venda' && d.stage !== 'fechado');

  return (
    <section className="glass-card p-10 rounded-[3rem]">
      <div className="flex items-center justify-between mb-8">
        <h2 className="section-label">Pipeline de Vendas</h2>
        <button className="btn-subtle flex items-center gap-2">
          Ver CRM <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      {/* Mini Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
        {pipelineSummary.map((stage) => (
          <div key={stage.stage} className="kanban-stage flex-shrink-0">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-3">{stage.label}</p>
            <p className="text-3xl font-bold text-foreground tracking-tighter">{stage.count}</p>
            <p className="text-[10px] text-primary font-bold">R$ {(stage.value / 1000).toFixed(0)}k</p>
          </div>
        ))}
      </div>

      {/* Deals parados */}
      {stuckDeals.length > 0 && (
        <div className="mt-8 pt-8 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-warning">priority_high</span>
            <span className="text-[10px] font-black text-warning uppercase tracking-widest">Deals parados (3+ dias sem atividade)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[9px] text-muted-foreground uppercase tracking-widest border-b border-white/5">
                  <th className="pb-4 font-black">Deal</th>
                  <th className="pb-4 font-black">Conta</th>
                  <th className="pb-4 font-black">Etapa</th>
                  <th className="pb-4 font-black text-right">Valor</th>
                  <th className="pb-4 font-black">Última</th>
                  <th className="pb-4 font-black">Próxima ação</th>
                  <th className="pb-4 font-black">Resp.</th>
                  <th className="pb-4"></th>
                </tr>
              </thead>
              <tbody>
                {stuckDeals.map((deal) => (
                  <tr key={deal.id} className="table-row-hover border-b border-white/5 last:border-0">
                    <td className="py-4 font-bold text-foreground">{deal.title}</td>
                    <td className="py-4 text-muted-foreground">{deal.accountName}</td>
                    <td className="py-4">
                      <span className="badge-subtle">{getStageLabel(deal.stage)}</span>
                    </td>
                    <td className="py-4 text-right text-foreground font-bold">R$ {deal.value.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={cn(
                        "text-[10px] font-black uppercase",
                        deal.lastActivityDays >= 5 ? "text-destructive" : "text-warning"
                      )}>
                        {deal.lastActivityDays} dias
                      </span>
                    </td>
                    <td className="py-4 text-muted-foreground text-xs">{deal.nextAction}</td>
                    <td className="py-4 text-muted-foreground">{deal.responsible}</td>
                    <td className="py-4">
                      <button className="btn-subtle text-xs">Abrir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
