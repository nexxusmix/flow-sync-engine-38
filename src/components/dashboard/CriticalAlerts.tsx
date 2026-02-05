import { criticalAlerts } from "@/data/mockData";

export function CriticalAlerts() {
  const totalAlerts = criticalAlerts.reduce((sum, a) => sum + a.count, 0);

  return (
    <section className="glass-card p-10 rounded-[3rem] border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-start gap-5 mb-8">
        <div className="p-4 rounded-2xl bg-primary/20">
          <span className="material-symbols-outlined text-primary text-4xl">warning</span>
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground uppercase tracking-tighter">
            Se você ignorar isso, <span className="squad-logo-text font-normal text-muted-foreground">você perde dinheiro</span>
          </h2>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-2">{totalAlerts} alertas que precisam de atenção</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {criticalAlerts.map((alert) => (
          <button
            key={alert.id}
            className="flex items-center justify-between p-5 rounded-2xl bg-background border border-white/5 hover:border-primary/30 transition-all duration-500 text-left group"
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/20 text-primary text-sm font-black">
                {alert.count}
              </span>
              <span className="text-xs text-foreground font-bold uppercase tracking-wide">{alert.label}</span>
            </div>
            <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary transition-colors">chevron_right</span>
          </button>
        ))}
      </div>
    </section>
  );
}
