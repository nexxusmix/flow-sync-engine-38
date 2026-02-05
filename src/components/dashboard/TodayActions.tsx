import { useState } from "react";
import { todayActions } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle } from "lucide-react";

export function TodayActions() {
  const [actions, setActions] = useState(todayActions);

  const toggleAction = (category: keyof typeof actions, actionId: string) => {
    setActions((prev) => ({
      ...prev,
      [category]: prev[category].map((a) => a.id === actionId ? { ...a, done: !a.done } : a),
    }));
  };

  const sections = [
    { key: "commercial" as const, label: "Comercial", icon: "trending_up", data: actions.commercial },
    { key: "financial" as const, label: "Financeiro", icon: "account_balance_wallet", data: actions.financial },
    { key: "operational" as const, label: "Operacional", icon: "movie_edit", data: actions.operational },
  ];

  const totalDone = [...actions.commercial, ...actions.financial, ...actions.operational].filter((a) => a.done).length;
  const totalActions = actions.commercial.length + actions.financial.length + actions.operational.length;
  const allDone = totalDone === totalActions && totalActions > 0;

  return (
    <section className="glass-card p-10 rounded-[3rem] min-h-[300px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-normal uppercase tracking-tighter text-foreground">
            {allDone 
              ? <>Dia ganho, <span className="squad-logo-text font-light text-muted-foreground">missão cumprida</span></>
              : <>Hoje eu ganho o dia <span className="squad-logo-text font-light text-muted-foreground">fazendo isso</span></>
            }
          </h2>
          <p className="text-[10px] text-muted-foreground font-light uppercase tracking-widest mt-1">{totalDone}/{totalActions} concluídas</p>
        </div>
        <button className="btn-subtle flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">refresh</span> Repriorizar
        </button>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.key}>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-sm">{section.icon}</span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-light">{section.label}</span>
            </div>
            <div className="space-y-2 min-h-[60px]">
              {section.data.length > 0 ? (
                section.data.map((action) => (
                  <div
                    key={action.id}
                    className={cn("flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group", action.done && "opacity-50")}
                    onClick={() => toggleAction(section.key, action.id)}
                  >
                    <span className={cn("material-symbols-outlined", action.done ? "text-success" : "text-muted-foreground group-hover:text-foreground")}>
                      {action.done ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <p className={cn("flex-1 text-sm text-foreground font-light", action.done && "line-through")}>{action.task}</p>
                    <span className="text-[10px] text-muted-foreground">{action.entityName}</span>
                    <span className="text-[10px] text-muted-foreground w-12 text-right font-normal">{action.deadline}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 py-3 px-4 text-muted-foreground/60">
                  <CheckCircle className="w-4 h-4 text-emerald-500/50" />
                  <span className="text-xs">Nenhuma ação pendente</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
