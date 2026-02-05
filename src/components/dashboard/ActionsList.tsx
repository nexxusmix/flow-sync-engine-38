import { CheckCircle2, Clock, AlertCircle, LucideIcon } from "lucide-react";

interface ActionItem {
  icon: LucideIcon;
  color: string;
  title: string;
  sub: string;
  extra?: string;
  action?: string;
}

const actions: ActionItem[] = [
  { 
    icon: CheckCircle2, 
    color: 'text-emerald-500', 
    title: 'Aprovar Roteiro "BMW"', 
    sub: '10:00 - Cliente aguardando' 
  },
  { 
    icon: Clock, 
    color: 'text-amber-500', 
    title: 'Call de Follow-up (IA)', 
    sub: '14:30 - Coco Bambu', 
    extra: 'Auto' 
  },
  { 
    icon: AlertCircle, 
    color: 'text-red-500', 
    title: 'Fatura em Atraso', 
    sub: 'D+3 - Clínica Bem Estar', 
    action: 'Cobrança IA' 
  }
];

export function ActionsList() {
  return (
    <div className="glass-card rounded-[2rem] p-6 space-y-4">
      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Próximas Ações</h3>
      
      <div className="space-y-1">
        {actions.map((item, idx) => (
          <div 
            key={idx}
            className="flex items-start gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer group"
          >
            <div className={`icon-box ${item.color.replace('text-', 'bg-').replace('-500', '-500/20')}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">{item.sub}</p>
              {item.extra && (
                <span className="badge-info">{item.extra}</span>
              )}
              {item.action && (
                <span className="badge-warning cursor-pointer hover:opacity-80">
                  {item.action} →
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
