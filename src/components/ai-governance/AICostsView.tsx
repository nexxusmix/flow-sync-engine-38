/**
 * AICostsView - Costs breakdown and workspace limits
 */

import { DollarSign, Gauge, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { useAIGovernance } from "@/hooks/useAIGovernance";

interface Props {
  governance: ReturnType<typeof useAIGovernance>;
}

export function AICostsView({ governance }: Props) {
  const { totalCost, byModule, dailyUsage, limits, isLoading } = governance;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const modulesWithCost = byModule.filter(m => m.cost > 0).sort((a, b) => b.cost - a.cost);
  const dailyCosts = dailyUsage.filter(d => d.cost > 0);
  const maxDailyCost = Math.max(...dailyCosts.map(d => d.cost), 0.001);

  return (
    <div className="space-y-6">
      {/* Cost summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Custo Total (Período)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${totalCost.toFixed(4)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Custo Médio/Dia</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            ${dailyUsage.length > 0 ? (totalCost / dailyUsage.length).toFixed(4) : "0.0000"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Gauge className="w-4 h-4" />
            <span className="text-xs font-medium">Módulos com Custo</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{modulesWithCost.length}</p>
        </div>
      </div>

      {/* Cost by module */}
      {modulesWithCost.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Custo por Módulo</h3>
          <div className="space-y-3">
            {modulesWithCost.map((mod) => {
              const pct = totalCost > 0 ? Math.round((mod.cost / totalCost) * 100) : 0;
              return (
                <div key={mod.module}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground capitalize">{mod.module}</span>
                    <span className="text-sm font-medium text-foreground">${mod.cost.toFixed(4)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily cost chart */}
      {dailyCosts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Custo Diário</h3>
          <div className="flex items-end gap-1 h-24">
            {dailyCosts.map((day) => {
              const height = Math.max((day.cost / maxDailyCost) * 100, 4);
              return (
                <div key={day.date} className="flex-1 group relative">
                  <div
                    className="w-full bg-primary/50 group-hover:bg-primary rounded-t transition-colors"
                    style={{ height: `${height}%` }}
                  />
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                    {day.date}: ${day.cost.toFixed(4)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workspace Limits */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Limites do Workspace</h3>
        {limits.length > 0 ? (
          <div className="space-y-4">
            {limits.map((limit) => {
              const pct = limit.max_value > 0 ? Math.round((limit.current_value / limit.max_value) * 100) : 0;
              const isNearLimit = pct >= 80;
              return (
                <div key={limit.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{limit.limit_type.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {limit.current_value} / {limit.max_value}
                      </span>
                      {isNearLimit && (
                        <Badge variant="destructive" className="text-[10px]">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {pct}%
                        </Badge>
                      )}
                      <Badge variant={limit.is_active ? "default" : "secondary"} className="text-[10px]">
                        {limit.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-primary/80" : "bg-primary"
                      )}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum limite configurado. Configure limites na aba Governança.</p>
        )}
      </div>
    </div>
  );
}
