import { CheckCircle } from "lucide-react";

interface CriticalAlert {
  id: string;
  label: string;
  count: number;
}

export function CriticalAlerts() {
  // Empty state - no alerts
  const criticalAlerts: CriticalAlert[] = [];
  const totalAlerts = criticalAlerts.reduce((sum, a) => sum + a.count, 0);

  return (
    <section className="glass-card p-10 rounded-[3rem] border-primary/20 bg-gradient-to-br from-primary/5 to-transparent min-h-[200px]">
      <div className="flex items-start gap-5 mb-8">
        <div className="p-4 rounded-2xl bg-primary/20">
          <span className="material-symbols-outlined text-primary text-4xl">
            check_circle
          </span>
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-normal text-foreground uppercase tracking-tighter">
            Tudo certo, <span className="squad-logo-text font-light text-muted-foreground">operação estável</span>
          </h2>
          <p className="text-[10px] text-muted-foreground font-light uppercase tracking-widest mt-2">
            Nenhum alerta crítico detectado
          </p>
        </div>
      </div>

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
    </section>
  );
}
