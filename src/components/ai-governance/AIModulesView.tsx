/**
 * AIModulesView - AI usage breakdown by module
 */

import { cn } from "@/lib/utils";
import type { useAIGovernance } from "@/hooks/useAIGovernance";

const MODULE_LABELS: Record<string, string> = {
  crm: "CRM",
  projects: "Projetos",
  finance: "Financeiro",
  contracts: "Contratos",
  portal: "Portal do Cliente",
  automations: "Automações",
  inbox: "Inbox",
  marketing: "Marketing",
  content: "Conteúdo",
  system: "Sistema",
  generate: "Geração IA",
};

interface Props {
  governance: ReturnType<typeof useAIGovernance>;
}

export function AIModulesView({ governance }: Props) {
  const { byModule, isLoading } = governance;
  const maxCalls = Math.max(...byModule.map(m => m.calls), 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (byModule.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground">Nenhum dado de uso por módulo no período selecionado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {byModule.map((mod) => {
        const pct = Math.round((mod.calls / maxCalls) * 100);
        const errorRate = mod.calls > 0 ? Math.round((mod.errors / mod.calls) * 100) : 0;
        const label = MODULE_LABELS[mod.module] || mod.module;

        return (
          <div key={mod.module} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground capitalize">{label}</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{mod.calls} chamadas</span>
                {mod.cost > 0 && <span>${mod.cost.toFixed(4)}</span>}
                {errorRate > 0 && (
                  <span className="text-destructive">{errorRate}% erros</span>
                )}
              </div>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  errorRate > 20 ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
