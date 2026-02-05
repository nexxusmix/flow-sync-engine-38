import { useState } from "react";
import { CheckCircle, Circle, RefreshCw, TrendingUp, Wallet, FolderKanban } from "lucide-react";
import { todayActions } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function TodayActions() {
  const [actions, setActions] = useState(todayActions);

  const toggleAction = (category: keyof typeof actions, actionId: string) => {
    setActions((prev) => ({
      ...prev,
      [category]: prev[category].map((a) =>
        a.id === actionId ? { ...a, done: !a.done } : a
      ),
    }));
  };

  const sections = [
    { key: "commercial" as const, label: "Comercial", icon: TrendingUp, data: actions.commercial },
    { key: "financial" as const, label: "Financeiro", icon: Wallet, data: actions.financial },
    { key: "operational" as const, label: "Operacional", icon: FolderKanban, data: actions.operational },
  ];

  const totalDone = [...actions.commercial, ...actions.financial, ...actions.operational].filter((a) => a.done).length;
  const totalActions = actions.commercial.length + actions.financial.length + actions.operational.length;

  return (
    <section className="card-flat">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">Hoje eu ganho o dia fazendo isso</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{totalDone}/{totalActions} concluídas</p>
        </div>
        <button className="btn-subtle flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Repriorizar
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.key}>
            <div className="flex items-center gap-2 mb-2">
              <section.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{section.label}</span>
            </div>

            <div className="space-y-1">
              {section.data.map((action) => (
                <div
                  key={action.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group",
                    action.done && "opacity-50"
                  )}
                  onClick={() => toggleAction(section.key, action.id)}
                >
                  <button className="flex-shrink-0">
                    {action.done ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm text-foreground truncate",
                      action.done && "line-through"
                    )}>{action.task}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{action.entityName}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 w-12 text-right">{action.deadline}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
