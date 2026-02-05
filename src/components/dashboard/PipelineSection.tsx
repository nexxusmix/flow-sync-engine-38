import { ArrowRight, AlertCircle } from "lucide-react";
import { pipelineSummary, deals, getStageLabel } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function PipelineSection() {
  // Deals parados (sem atividade há 3+ dias)
  const stuckDeals = deals.filter((d) => d.lastActivityDays >= 3 && d.stage !== 'pos_venda' && d.stage !== 'fechado');

  return (
    <section className="card-flat">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-label">Vendas: Pipeline</h2>
        <button className="btn-subtle flex items-center gap-1">
          Ver CRM <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Mini Kanban */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
        {pipelineSummary.map((stage) => (
          <div key={stage.stage} className="kanban-stage flex-shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{stage.label}</p>
            <p className="text-xl font-semibold text-foreground">{stage.count}</p>
            <p className="text-xs text-muted-foreground">R$ {(stage.value / 1000).toFixed(0)}k</p>
          </div>
        ))}
      </div>

      {/* Deals parados */}
      {stuckDeals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span className="text-xs font-medium text-warning">Deals parados (3+ dias sem atividade)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Deal</th>
                  <th className="pb-2 font-medium">Conta</th>
                  <th className="pb-2 font-medium">Etapa</th>
                  <th className="pb-2 font-medium text-right">Valor</th>
                  <th className="pb-2 font-medium">Última atividade</th>
                  <th className="pb-2 font-medium">Próxima ação</th>
                  <th className="pb-2 font-medium">Resp.</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {stuckDeals.map((deal) => (
                  <tr key={deal.id} className="table-row-hover border-b border-border last:border-0">
                    <td className="py-3 font-medium text-foreground">{deal.title}</td>
                    <td className="py-3 text-muted-foreground">{deal.accountName}</td>
                    <td className="py-3">
                      <span className="badge-subtle">{getStageLabel(deal.stage)}</span>
                    </td>
                    <td className="py-3 text-right text-foreground">R$ {deal.value.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={cn(
                        "text-xs",
                        deal.lastActivityDays >= 5 ? "text-destructive" : "text-warning"
                      )}>
                        {deal.lastActivityDays} dias
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground text-xs">{deal.nextAction}</td>
                    <td className="py-3 text-muted-foreground">{deal.responsible}</td>
                    <td className="py-3">
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
