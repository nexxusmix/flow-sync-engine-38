/**
 * AIExecutiveView - Executive summary of AI usage
 */

import { Brain, Zap, AlertTriangle, Clock, DollarSign, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sc } from "@/lib/colors";
import type { useAIGovernance } from "@/hooks/useAIGovernance";

interface Props {
  governance: ReturnType<typeof useAIGovernance>;
}

function MetricCard({ icon: Icon, label, value, sub, variant = "default" }: {
  icon: any; label: string; value: string | number; sub?: string;
  variant?: "default" | "success" | "error" | "warning";
}) {
  const variantClass = {
    default: "border-border",
    success: "border-primary/30",
    error: "border-destructive/30",
    warning: "border-border",
  }[variant];

  return (
    <div className={cn("bg-card border rounded-xl p-5 space-y-2", variantClass)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function AIExecutiveView({ governance }: Props) {
  const {
    totalCalls, successRate, errorCount, totalTokens, totalCost,
    avgExecutionTime, approvalCount, byModule, topActions, dailyUsage, alerts,
    isLoading,
  } = governance;

  const unresolvedAlerts = alerts.filter(a => !a.is_resolved);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts banner */}
      {unresolvedAlerts.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {unresolvedAlerts.length} alerta{unresolvedAlerts.length > 1 ? 's' : ''} ativo{unresolvedAlerts.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">{unresolvedAlerts[0]?.title}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Brain} label="Total de Chamadas" value={totalCalls.toLocaleString()} />
        <MetricCard icon={CheckCircle2} label="Taxa de Sucesso" value={`${successRate}%`} variant="success" />
        <MetricCard icon={XCircle} label="Erros" value={errorCount} variant={errorCount > 0 ? "error" : "default"} />
        <MetricCard icon={Clock} label="Tempo Médio" value={`${avgExecutionTime}ms`} />
        <MetricCard icon={Zap} label="Tokens Consumidos" value={totalTokens.toLocaleString()} />
        <MetricCard icon={DollarSign} label="Custo Estimado" value={`$${totalCost.toFixed(4)}`} />
        <MetricCard icon={ShieldCheck} label="Aprovações Humanas" value={approvalCount} />
        <MetricCard
          icon={AlertTriangle}
          label="Alertas Ativos"
          value={unresolvedAlerts.length}
          variant={unresolvedAlerts.length > 0 ? "warning" : "default"}
        />
      </div>

      {/* Daily usage chart (simplified bar representation) */}
      {dailyUsage.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Uso Diário</h3>
          <div className="flex items-end gap-1 h-32">
            {dailyUsage.map((day) => {
              const maxCalls = Math.max(...dailyUsage.map(d => d.calls), 1);
              const height = Math.max((day.calls / maxCalls) * 100, 4);
              const errorPct = day.calls > 0 ? (day.errors / day.calls) * 100 : 0;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className={cn(
                      "w-full rounded-t transition-colors",
                      errorPct > 20 ? "bg-destructive/60" : "bg-primary/60",
                      "group-hover:bg-primary"
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                    {day.date}: {day.calls} chamadas{day.errors > 0 ? `, ${day.errors} erros` : ""}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>{dailyUsage[0]?.date}</span>
            <span>{dailyUsage[dailyUsage.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Two columns: Top modules + Top actions */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Modules */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Top Módulos</h3>
          <div className="space-y-3">
            {byModule.slice(0, 8).map((mod) => (
              <div key={mod.module} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm text-foreground capitalize">{mod.module}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{mod.calls}</span>
                  {mod.errors > 0 && (
                    <Badge variant="destructive" className="text-[10px]">
                      {mod.errors} erros
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {byModule.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum dado no período</p>
            )}
          </div>
        </div>

        {/* Top Actions */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Ações Mais Usadas</h3>
          <div className="space-y-3">
            {topActions.slice(0, 8).map((action, idx) => (
              <div key={action.action} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                  <span className="text-sm text-foreground font-mono text-xs">{action.action}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{action.count}</span>
              </div>
            ))}
            {topActions.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum dado no período</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
