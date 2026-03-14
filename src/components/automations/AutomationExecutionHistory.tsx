import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, RotateCcw, XCircle, Clock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAutomationExecutions, type AutomationExecution, type ExecutionStatus } from "@/hooks/useAutomations";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { sc } from "@/lib/colors";

const STATUS_MAP: Record<ExecutionStatus, { label: string; icon: typeof CheckCircle2 }> = {
  running: { label: "Em execução", icon: Loader2 },
  success: { label: "Sucesso", icon: CheckCircle2 },
  error: { label: "Erro", icon: AlertTriangle },
  awaiting_approval: { label: "Aguardando aprovação", icon: Clock },
  cancelled: { label: "Cancelada", icon: XCircle },
};

export function AutomationExecutionHistory() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const { data: executions = [], isLoading } = useAutomationExecutions();

  const filtered = filterStatus === "all"
    ? executions
    : executions.filter((e) => e.status === filterStatus);

  const { data: logs = [] } = useQuery({
    queryKey: ["execution-logs", selectedExecution],
    enabled: !!selectedExecution,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_execution_logs")
        .select("*")
        .eq("execution_id", selectedExecution!)
        .order("step_order");
      if (error) throw error;
      return data as any[];
    },
  });

  const getStatusStyle = (status: ExecutionStatus) => {
    switch (status) {
      case "success": return sc.status("completed");
      case "error": return sc.status("error");
      case "running": return sc.status("in_progress");
      case "awaiting_approval": return sc.status("pending");
      case "cancelled": return sc.status("cancelled");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground text-sm">Carregando histórico...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px] bg-card/50"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} execuções</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Nenhuma execução encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((exec) => {
            const style = getStatusStyle(exec.status);
            const statusInfo = STATUS_MAP[exec.status];
            const Icon = statusInfo.icon;

            return (
              <div
                key={exec.id}
                className="glass-card rounded-xl p-4 hover:border-primary/20 transition-all cursor-pointer"
                onClick={() => setSelectedExecution(exec.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${style.text} ${exec.status === "running" ? "animate-spin" : ""}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {(exec.automation as any)?.name || "Automação"}
                      </h3>
                      <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${style.text} ${style.border}`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{format(new Date(exec.started_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      {exec.entity_type && <span>· {exec.entity_type}: {exec.entity_id?.slice(0, 8)}</span>}
                      {exec.retry_count > 0 && <span>· Tentativa {exec.retry_count + 1}</span>}
                    </div>
                  </div>
                  {exec.error_message && (
                    <p className="text-xs text-destructive max-w-[200px] truncate hidden md:block">
                      {exec.error_message}
                    </p>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedExecution(exec.id); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedExecution} onOpenChange={() => setSelectedExecution(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Execução</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum log registrado</p>
            ) : (
              logs.map((log, i) => {
                const logStyle = log.status === "success"
                  ? sc.status("completed")
                  : log.status === "error"
                    ? sc.status("error")
                    : sc.status("pending");
                return (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full ${logStyle.bg} flex items-center justify-center`}>
                        <span className="text-[10px] font-bold text-foreground">{i + 1}</span>
                      </div>
                      {i < logs.length - 1 && <div className="w-px h-6 bg-border" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm font-medium text-foreground">{log.action_label || log.action_type}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className={`text-[10px] py-0 ${logStyle.text}`}>
                          {log.status}
                        </Badge>
                        {log.duration_ms && <span>{log.duration_ms}ms</span>}
                      </div>
                      {log.error_message && (
                        <p className="text-xs text-destructive mt-1 bg-destructive/5 rounded p-1.5">{log.error_message}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
