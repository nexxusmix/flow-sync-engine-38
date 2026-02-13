/**
 * ProjectPaymentsSummary - Installment tracking inside project aside
 * Shows paid/pending/overdue milestones with totals
 */

import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFinancialStore } from "@/stores/financialStore";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectPaymentsSummaryProps {
  projectId: string;
}

export function ProjectPaymentsSummary({ projectId }: ProjectPaymentsSummaryProps) {
  const {
    contracts,
    revenues,
    fetchContracts,
    fetchRevenues,
    markMilestonePaid,
    getContractByProject,
    getRevenuesByProject,
  } = useFinancialStore();

  useEffect(() => {
    if (contracts.length === 0) fetchContracts();
    if (revenues.length === 0) fetchRevenues();
  }, []);

  const contract = getContractByProject(projectId);
  const projectRevenues = getRevenuesByProject(projectId);

  if (!contract && projectRevenues.length === 0) return null;

  const milestones = contract?.milestones || [];
  const totalContract = contract ? Number(contract.total_value) : 0;

  // Calculate totals from milestones
  const paid = milestones.filter((m) => m.status === "paid");
  const pending = milestones.filter((m) => m.status === "pending");
  const overdue = milestones.filter(
    (m) => m.status !== "paid" && isPast(new Date(m.due_date)) && !isToday(new Date(m.due_date))
  );

  const totalPaid = paid.reduce((s, m) => s + Number(m.amount), 0);
  const totalPending = pending.reduce((s, m) => s + Number(m.amount), 0);
  const totalOverdue = overdue.reduce((s, m) => s + Number(m.amount), 0);
  const remaining = totalContract - totalPaid;
  const progressPct = totalContract > 0 ? Math.round((totalPaid / totalContract) * 100) : 0;

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const fmtDate = (d: string) => {
    try {
      return format(new Date(d), "dd MMM yyyy", { locale: ptBR });
    } catch {
      return d;
    }
  };

  const handleConfirmPaid = async (milestoneId: string) => {
    try {
      await markMilestonePaid(milestoneId);
      toast.success("Parcela confirmada como paga!");
    } catch {
      toast.error("Erro ao confirmar parcela");
    }
  };

  const getMilestoneStatus = (m: { status: string; due_date: string }) => {
    if (m.status === "paid") return "paid";
    if (isPast(new Date(m.due_date)) && !isToday(new Date(m.due_date))) return "overdue";
    return "pending";
  };

  return (
    <div className="space-y-4">
      {/* Header com totais */}
      <div className="flex items-center gap-2 mb-1">
        <CircleDollarSign className="w-4 h-4 text-muted-foreground" />
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          Pagamentos do Projeto
        </span>
      </div>

      {/* Progress bar */}
      {totalContract > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Progresso financeiro</span>
            <span className="font-mono">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/30 border border-border rounded-lg p-3">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-1">
            Total Pago
          </span>
          <span className="text-sm font-semibold text-emerald-500 font-mono">
            {fmt(totalPaid)}
          </span>
        </div>
        <div className="bg-muted/30 border border-border rounded-lg p-3">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-1">
            Falta Pagar
          </span>
          <span className="text-sm font-semibold text-foreground font-mono">
            {fmt(remaining)}
          </span>
        </div>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
          <span className="text-[10px] text-destructive">
            {overdue.length} parcela{overdue.length > 1 ? "s" : ""} atrasada{overdue.length > 1 ? "s" : ""} ({fmt(totalOverdue)})
          </span>
        </div>
      )}

      <Separator />

      {/* Milestones list */}
      {milestones.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
            Parcelas ({paid.length}/{milestones.length} pagas)
          </span>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {milestones.map((m, idx) => {
              const status = getMilestoneStatus(m);
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors ${
                    status === "paid"
                      ? "bg-emerald-500/5 border-emerald-500/15"
                      : status === "overdue"
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-muted/20 border-border"
                  }`}
                >
                  {/* Status icon */}
                  <div className="mt-0.5 shrink-0">
                    {status === "paid" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : status === "overdue" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-foreground truncate">
                        {m.title || `Parcela ${idx + 1}`}
                      </span>
                      <span
                        className={`text-xs font-mono font-medium shrink-0 ${
                          status === "paid"
                            ? "text-emerald-500"
                            : status === "overdue"
                            ? "text-destructive"
                            : "text-foreground"
                        }`}
                      >
                        {fmt(Number(m.amount))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {status === "paid" && m.paid_date
                          ? `Pago em ${fmtDate(m.paid_date)}`
                          : `Vence ${fmtDate(m.due_date)}`}
                      </span>
                      {status === "paid" ? (
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 text-emerald-500 border-emerald-500/30">
                          PAGO
                        </Badge>
                      ) : status === "overdue" ? (
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 text-destructive border-destructive/30">
                          ATRASADO
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 text-muted-foreground">
                          ABERTO
                        </Badge>
                      )}
                    </div>
                    {/* Confirm button for unpaid */}
                    {status !== "paid" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 h-6 text-[10px]"
                        onClick={() => handleConfirmPaid(m.id)}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Confirmar Pagamento
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* If no milestones but has revenues */}
      {milestones.length === 0 && projectRevenues.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
            Receitas ({projectRevenues.filter(r => r.status === 'received').length}/{projectRevenues.length})
          </span>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {projectRevenues.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border ${
                  r.status === "received"
                    ? "bg-emerald-500/5 border-emerald-500/15"
                    : r.status === "overdue"
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-muted/20 border-border"
                }`}
              >
                <div className="min-w-0">
                  <span className="text-xs text-foreground truncate block">{r.description}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {r.status === "received" && r.received_date
                      ? `Pago ${fmtDate(r.received_date)}`
                      : `Vence ${fmtDate(r.due_date)}`}
                  </span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className={`text-xs font-mono font-medium ${
                    r.status === "received" ? "text-emerald-500" : 
                    r.status === "overdue" ? "text-destructive" : "text-foreground"
                  }`}>
                    {fmt(Number(r.amount))}
                  </span>
                  <Badge variant="outline" className={`text-[8px] h-4 px-1.5 block mt-0.5 ${
                    r.status === "received" ? "text-emerald-500 border-emerald-500/30" :
                    r.status === "overdue" ? "text-destructive border-destructive/30" : 
                    "text-muted-foreground"
                  }`}>
                    {r.status === "received" ? "PAGO" : r.status === "overdue" ? "ATRASADO" : "PENDENTE"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {milestones.length === 0 && projectRevenues.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-2">
          Sem parcelas ou receitas cadastradas
        </p>
      )}
    </div>
  );
}
