import { projects, deliveries, getProjectStageLabel } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function ProductionSection() {
  // Projetos em risco ou atrasados
  const riskProjects = projects.filter((p) => p.status !== "ok").slice(0, 8);

  // Próximas entregas (7 dias)
  const upcomingDeliveries = deliveries.filter((d) => d.status !== "entregue").slice(0, 5);

  return (
    <section>
      <h2 className="section-label mb-6">Produção</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Projetos em risco */}
        <div className="lg:col-span-8 glass-card p-10 rounded-[3rem]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-warning text-2xl">priority_high</span>
              <span className="text-lg font-black uppercase tracking-tighter text-foreground">Próximos Marcos de Produção</span>
            </div>
            <button className="btn-subtle">
              Ver Cronograma <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
            </button>
          </div>

          {riskProjects.length > 0 ? (
            <div className="space-y-4">
              {riskProjects.map((proj) => (
                <div key={proj.id} className="glass-card p-6 rounded-[2rem] flex items-center justify-between hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground font-black text-[10px]">
                      SF-{proj.id.slice(-3)}
                    </div>
                    <div>
                      <h5 className="text-base font-bold text-foreground uppercase tracking-tight">{proj.title}</h5>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">{proj.accountName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <span className="text-[9px] text-muted-foreground block uppercase font-black">Etapa Atual</span>
                      <span className="text-foreground font-bold">{getProjectStageLabel(proj.stage)}</span>
                    </div>
                    <span className={cn(
                      "material-symbols-outlined",
                      proj.status === "em_risco" ? "text-warning" : "text-destructive"
                    )}>
                      {proj.status === "em_risco" ? "schedule" : "priority_high"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Todos os projetos estão em dia 🎉</p>
            </div>
          )}
        </div>

        {/* Entregas próximas */}
        <div className="lg:col-span-4 glass-card p-10 rounded-[3rem] bg-gradient-to-br from-[#080808] to-black border-primary/10">
          <div className="flex items-center gap-4 mb-8">
            <span className="material-symbols-outlined text-primary animate-pulse text-3xl">local_shipping</span>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">Entregas</h3>
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Próximos 7 dias</span>
            </div>
          </div>

          <div className="space-y-4">
            {upcomingDeliveries.map((del) => (
              <div key={del.id} className="p-5 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-sm font-bold text-foreground mb-1">{del.projectTitle}</p>
                <p className="text-[10px] text-muted-foreground mb-3">{del.accountName}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{del.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground font-bold">{new Date(del.dueDate).toLocaleDateString('pt-BR')}</span>
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
