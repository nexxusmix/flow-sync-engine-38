import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, ListTodo, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TodayAction {
  id: string;
  task: string;
  entityName: string;
  deadline: string;
  done: boolean;
}

interface TodayActions {
  commercial: TodayAction[];
  financial: TodayAction[];
  operational: TodayAction[];
}

export function TodayActions() {
  // Empty state - no actions yet
  const [actions, setActions] = useState<TodayActions>({
    commercial: [],
    financial: [],
    operational: [],
  });

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

  return (
    <section className="glass-card p-10 rounded-[3rem] min-h-[300px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-normal uppercase tracking-tighter text-foreground">
            {totalActions === 0 
              ? <>Pronto para <span className="squad-logo-text font-light text-muted-foreground">começar</span></>
              : <>Hoje eu ganho o dia <span className="squad-logo-text font-light text-muted-foreground">fazendo isso</span></>
            }
          </h2>
          <p className="text-mono text-muted-foreground font-light uppercase tracking-widest mt-1">
            {totalActions === 0 ? 'Nenhuma ação pendente' : `${totalDone}/${totalActions} concluídas`}
          </p>
        </div>
        <button className="btn-subtle flex items-center gap-2" disabled={totalActions === 0}>
          <span className="material-symbols-outlined text-sm">refresh</span> Repriorizar
        </button>
      </div>

      {totalActions === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <ListTodo className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-sm font-normal text-foreground mb-2">Nenhuma ação do dia</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            As ações prioritárias serão geradas automaticamente com base nos seus projetos, deals e financeiro.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Comece criando seu primeiro projeto ou deal
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.key}>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-sm">{section.icon}</span>
                <span className="text-caption uppercase tracking-widest text-muted-foreground font-light">{section.label}</span>
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
                      <span className="text-mono text-muted-foreground">{action.entityName}</span>
                      <span className="text-mono text-muted-foreground w-12 text-right font-normal">{action.deadline}</span>
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
      )}
    </section>
  );
}
