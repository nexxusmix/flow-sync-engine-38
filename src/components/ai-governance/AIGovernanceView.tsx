/**
 * AIGovernanceView - Policies, alerts and governance controls
 */

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShieldCheck, AlertTriangle, CheckCircle2, ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { useAIGovernance } from "@/hooks/useAIGovernance";

interface Props {
  governance: ReturnType<typeof useAIGovernance>;
}

export function AIGovernanceView({ governance }: Props) {
  const { policies, alerts, isLoading, togglePolicy, resolveAlert } = governance;

  const unresolvedAlerts = alerts.filter(a => !a.is_resolved);
  const resolvedAlerts = alerts.filter(a => a.is_resolved);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Policies */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Políticas de Governança</h3>
          <Badge variant="secondary" className="ml-auto text-[10px]">{policies.length}</Badge>
        </div>

        {policies.length > 0 ? (
          <div className="space-y-3">
            {policies.map((policy) => (
              <div key={policy.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{policy.name}</p>
                  {policy.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{policy.description}</p>
                  )}
                  <Badge variant="outline" className="text-[10px] mt-1">{policy.policy_type}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePolicy.mutate({ id: policy.id, enabled: !policy.is_enabled })}
                >
                  {policy.is_enabled ? (
                    <ToggleRight className="w-6 h-6 text-primary" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma política configurada ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Políticas controlam limites de uso, aprovações obrigatórias e restrições de módulos.
            </p>
          </div>
        )}
      </div>

      {/* Active Alerts */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h3 className="text-sm font-medium text-foreground">Alertas Ativos</h3>
          {unresolvedAlerts.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">{unresolvedAlerts.length}</Badge>
          )}
        </div>

        {unresolvedAlerts.length > 0 ? (
          <div className="space-y-3">
            {unresolvedAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={alert.severity === "critical" ? "destructive" : "outline"}
                      className="text-[10px]"
                    >
                      {alert.severity}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">{alert.title}</span>
                  </div>
                  {alert.message && (
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(alert.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    {alert.source_module && ` • ${alert.source_module}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs shrink-0"
                  onClick={() => resolveAlert.mutate(alert.id)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Resolver
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum alerta ativo. Tudo operacional.</p>
          </div>
        )}
      </div>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Alertas Resolvidos ({resolvedAlerts.length})</h3>
          <div className="space-y-2">
            {resolvedAlerts.slice(0, 10).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-2 rounded-lg text-xs text-muted-foreground">
                <span>{alert.title}</span>
                <span>{format(new Date(alert.created_at), "dd/MM", { locale: ptBR })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
