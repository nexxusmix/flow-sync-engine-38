import { AlertTriangle, ChevronRight } from "lucide-react";
import { criticalAlerts } from "@/data/mockData";

export function CriticalAlerts() {
  const totalAlerts = criticalAlerts.reduce((sum, a) => sum + a.count, 0);

  return (
    <section className="card-flat border-warning/30 bg-warning/5">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-warning/20">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Se você ignorar isso, você perde dinheiro</h2>
          <p className="text-sm text-muted-foreground">{totalAlerts} alertas que precisam de atenção</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {criticalAlerts.map((alert) => (
          <button
            key={alert.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-warning/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-warning/20 text-warning text-sm font-semibold">
                {alert.count}
              </span>
              <span className="text-sm text-foreground">{alert.label}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-warning transition-colors" />
          </button>
        ))}
      </div>
    </section>
  );
}
