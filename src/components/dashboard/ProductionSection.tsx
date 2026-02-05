import { ArrowRight, AlertTriangle, Calendar } from "lucide-react";
import { projects, deliveries, getProjectStageLabel } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function ProductionSection() {
  // Projetos em risco ou atrasados
  const riskProjects = projects.filter((p) => p.status !== "ok").slice(0, 8);

  // Próximas entregas (7 dias)
  const upcomingDeliveries = deliveries.filter((d) => d.status !== "entregue").slice(0, 5);

  return (
    <section>
      <h2 className="section-label mb-3">Produção</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Projetos em risco */}
        <div className="lg:col-span-2 card-flat">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-foreground">Projetos em Risco</span>
            </div>
            <button className="btn-subtle flex items-center gap-1">
              Ver Projetos <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {riskProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="pb-2 font-medium">Projeto</th>
                    <th className="pb-2 font-medium">Cliente</th>
                    <th className="pb-2 font-medium">Etapa</th>
                    <th className="pb-2 font-medium">Prazo</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Bloqueio</th>
                    <th className="pb-2 font-medium">Resp.</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {riskProjects.map((proj) => (
                    <tr key={proj.id} className="table-row-hover border-b border-border last:border-0">
                      <td className="py-3 font-medium text-foreground">{proj.title}</td>
                      <td className="py-3 text-muted-foreground">{proj.accountName}</td>
                      <td className="py-3">
                        <span className="badge-subtle">{getProjectStageLabel(proj.stage)}</span>
                      </td>
                      <td className="py-3 text-muted-foreground">{new Date(proj.deadline).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3">
                        <span className={cn(
                          proj.status === "em_risco" ? "badge-warning" : "badge-danger"
                        )}>
                          {proj.status === "em_risco" ? "Em risco" : "Atrasado"}
                        </span>
                      </td>
                      <td className="py-3">
                        {proj.blockage && (
                          <span className="text-xs text-muted-foreground capitalize">{proj.blockage}</span>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">{proj.responsible}</td>
                      <td className="py-3">
                        <button className="btn-subtle text-xs">Detalhe</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Todos os projetos estão em dia 🎉</p>
            </div>
          )}
        </div>

        {/* Próximas entregas */}
        <div className="card-flat">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-info" />
            <span className="text-sm font-medium text-foreground">Entregas (7 dias)</span>
          </div>

          <div className="space-y-3">
            {upcomingDeliveries.map((del) => (
              <div key={del.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-sm font-medium text-foreground mb-1">{del.projectTitle}</p>
                <p className="text-xs text-muted-foreground mb-2">{del.accountName}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{del.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground">{new Date(del.dueDate).toLocaleDateString('pt-BR')}</span>
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      del.status === "pronto" ? "bg-success" :
                      del.status === "em_andamento" ? "bg-warning" : "bg-muted-foreground"
                    )} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
