import { criticalAlerts } from "@/data/mockData";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle } from "lucide-react";

export function CriticalAlerts() {
  const totalAlerts = criticalAlerts.reduce((sum, a) => sum + a.count, 0);

  return (
    <section className="glass-card p-10 rounded-[3rem] border-primary/20 bg-gradient-to-br from-primary/5 to-transparent min-h-[200px]">
      <div className="flex items-start gap-5 mb-8">
        <div className="p-4 rounded-2xl bg-primary/20">
          <span className="material-symbols-outlined text-primary text-4xl">
            {totalAlerts === 0 ? 'check_circle' : 'warning'}
          </span>
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-normal text-foreground uppercase tracking-tighter">
            {totalAlerts === 0 
              ? <>Tudo certo, <span className="squad-logo-text font-light text-muted-foreground">operação estável</span></>
              : <>Se você ignorar isso, <span className="squad-logo-text font-light text-muted-foreground">você perde dinheiro</span></>
            }
          </h2>
          <p className="text-[10px] text-muted-foreground font-light uppercase tracking-widest mt-2">
            {totalAlerts === 0 
              ? 'Nenhum alerta crítico detectado'
              : `${totalAlerts} alertas que precisam de atenção`
            }
          </p>
        </div>
      </div>

      {totalAlerts > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {criticalAlerts.map((alert) => (
            <button
              key={alert.id}
              className="flex items-center justify-between p-5 rounded-2xl bg-background border border-white/5 hover:border-primary/30 transition-all duration-500 text-left group"
            >
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/20 text-primary text-sm font-normal">
                  {alert.count}
                </span>
                <span className="text-xs text-foreground font-normal uppercase tracking-wide">{alert.label}</span>
              </div>
              <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary transition-colors">chevron_right</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Pagamentos em dia</span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Entregas no prazo</span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Sem atrasos detectados</span>
          </div>
        </div>
      )}
    </section>
  );
}
