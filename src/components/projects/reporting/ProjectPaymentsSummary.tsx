/**
 * ProjectPaymentsSummary - Installment tracking inside project aside
 * Shows paid/pending/overdue milestones with totals
 * Falls back to revenues when no milestones exist
 */

import { useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFinancialStore } from "@/stores/financialStore";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  CircleDollarSign,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
} from "lucide-react";
import { toast } from "sonner";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRealtimeTable } from "@/hooks/useRealtimeSync";

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
    markRevenueReceived,
    getContractByProject,
    getRevenuesByProject,
  } = useFinancialStore();

  useEffect(() => {
    if (contracts.length === 0) fetchContracts();
    if (revenues.length === 0) fetchRevenues();
  }, []);

  // Realtime: refetch when revenues/contracts change
  const handleRevenueChange = useCallback(() => { fetchRevenues(); }, [fetchRevenues]);
  const handleContractChange = useCallback(() => { fetchContracts(); }, [fetchContracts]);
  useRealtimeTable('revenues', handleRevenueChange, handleRevenueChange, handleRevenueChange);
  useRealtimeTable('contracts', handleContractChange, handleContractChange, handleContractChange);

  const contract = getContractByProject(projectId);
  const projectRevenues = getRevenuesByProject(projectId);

  if (!contract && projectRevenues.length === 0) return null;

  const milestones = contract?.milestones || [];
  const totalContract = contract ? Number(contract.total_value) : 0;
  const hasMilestones = milestones.length > 0;

  // Calculate from milestones if available, otherwise from revenues
  const paidRevenues = projectRevenues.filter(r => r.status === 'received');
  const overdueRevenues = projectRevenues.filter(
    r => r.status !== 'received' && r.status !== 'cancelled' && isPast(new Date(r.due_date)) && !isToday(new Date(r.due_date))
  );

  let totalPaid: number;
  let totalOverdue: number;
  let overdueCount: number;

  if (hasMilestones) {
    const paid = milestones.filter(m => m.status === "paid");
    const overdue = milestones.filter(
      m => m.status !== "paid" && isPast(new Date(m.due_date)) && !isToday(new Date(m.due_date))
    );
    totalPaid = paid.reduce((s, m) => s + Number(m.amount), 0);
    totalOverdue = overdue.reduce((s, m) => s + Number(m.amount), 0);
    overdueCount = overdue.length;
  } else {
    totalPaid = paidRevenues.reduce((s, r) => s + Number(r.amount), 0);
    totalOverdue = overdueRevenues.reduce((s, r) => s + Number(r.amount), 0);
    overdueCount = overdueRevenues.length;
  }

  const remaining = Math.max(0, totalContract - totalPaid);
  const progressPct = totalContract > 0 ? Math.round((totalPaid / totalContract) * 100) : 0;

  // Health badge
  const healthStatus = overdueCount === 0 ? 'ok' : overdueCount === 1 ? 'attention' : 'critical';
  const healthConfig = {
    ok: { label: 'Saudável', icon: ShieldCheck, color: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' },
    attention: { label: 'Atenção', icon: ShieldAlert, color: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
    critical: { label: 'Crítico', icon: ShieldX, color: 'text-destructive border-destructive/30 bg-destructive/5' },
  };
  const health = healthConfig[healthStatus];
  const HealthIcon = health.icon;

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const fmtDate = (d: string) => {
    try {
      return format(new Date(d), "dd MMM yyyy", { locale: ptBR });
    } catch {
      return d;
    }
  };

  const handleConfirmMilestonePaid = async (milestoneId: string) => {
    try {
      await markMilestonePaid(milestoneId);
      toast.success("Parcela confirmada como paga!");
    } catch {
      toast.error("Erro ao confirmar parcela");
    }
  };

  const handleConfirmRevenuePaid = async (revenueId: string) => {
    try {
      await markRevenueReceived(revenueId);
      toast.success("Receita confirmada como paga!");
    } catch {
      toast.error("Erro ao confirmar receita");
    }
  };

  const getMilestoneStatus = (m: { status: string; due_date: string }) => {
    if (m.status === "paid") return "paid";
    if (isPast(new Date(m.due_date)) && !isToday(new Date(m.due_date))) return "overdue";
    return "pending";
  };

  const getRevenueStatus = (r: { status: string; due_date: string }) => {
    if (r.status === "received") return "paid";
    if (r.status === "overdue" || (r.status === "pending" && isPast(new Date(r.due_date)) && !isToday(new Date(r.due_date)))) return "overdue";
    return "pending";
  };

  const paidCount = hasMilestones
    ? milestones.filter(m => m.status === "paid").length
    : paidRevenues.length;
  const totalCount = hasMilestones ? milestones.length : projectRevenues.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Pagamentos do Projeto
          </span>
        </div>
        <Badge variant="outline" className={`text-[8px] px-2 py-0.5 ${health.color}`}>
          <HealthIcon className="w-3 h-3 mr-1" />
          {health.label}
        </Badge>
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
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
          <span className="text-[10px] text-destructive">
            {overdueCount} parcela{overdueCount > 1 ? "s" : ""} atrasada{overdueCount > 1 ? "s" : ""} ({fmt(totalOverdue)})
          </span>
        </div>
      )}

      <Separator />

      {/* Items list */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">
            {hasMilestones ? 'Parcelas' : 'Receitas'} ({paidCount}/{totalCount} pagas)
          </span>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {hasMilestones
              ? milestones.map((m, idx) => {
                  const status = getMilestoneStatus(m);
                  return (
                    <PaymentItem
                      key={m.id}
                      title={m.title || `Parcela ${idx + 1}`}
                      amount={Number(m.amount)}
                      dateLabel={
                        status === "paid" && m.paid_date
                          ? `Pago em ${fmtDate(m.paid_date)}`
                          : `Vence ${fmtDate(m.due_date)}`
                      }
                      status={status}
                      fmt={fmt}
                      onConfirmPaid={status !== "paid" ? () => handleConfirmMilestonePaid(m.id) : undefined}
                    />
                  );
                })
              : projectRevenues.map((r) => {
                  const status = getRevenueStatus(r);
                  return (
                    <PaymentItem
                      key={r.id}
                      title={r.description}
                      amount={Number(r.amount)}
                      dateLabel={
                        status === "paid" && r.received_date
                          ? `Pago ${fmtDate(r.received_date)}`
                          : `Vence ${fmtDate(r.due_date)}`
                      }
                      status={status}
                      fmt={fmt}
                      onConfirmPaid={status !== "paid" ? () => handleConfirmRevenuePaid(r.id) : undefined}
                    />
                  );
                })}
          </div>
        </div>
      )}

      {totalCount === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-2">
          Sem parcelas ou receitas cadastradas
        </p>
      )}
    </div>
  );
}

/** Shared payment item row */
function PaymentItem({
  title,
  amount,
  dateLabel,
  status,
  fmt,
  onConfirmPaid,
}: {
  title: string;
  amount: number;
  dateLabel: string;
  status: 'paid' | 'overdue' | 'pending';
  fmt: (v: number) => string;
  onConfirmPaid?: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors ${
        status === "paid"
          ? "bg-emerald-500/5 border-emerald-500/15"
          : status === "overdue"
          ? "bg-destructive/5 border-destructive/20"
          : "bg-muted/20 border-border"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {status === "paid" ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        ) : status === "overdue" ? (
          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-foreground truncate">{title}</span>
          <span
            className={`text-xs font-mono font-medium shrink-0 ${
              status === "paid" ? "text-emerald-500" : status === "overdue" ? "text-destructive" : "text-foreground"
            }`}
          >
            {fmt(amount)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{dateLabel}</span>
          <Badge
            variant="outline"
            className={`text-[8px] h-4 px-1.5 ${
              status === "paid"
                ? "text-emerald-500 border-emerald-500/30"
                : status === "overdue"
                ? "text-destructive border-destructive/30"
                : "text-muted-foreground"
            }`}
          >
            {status === "paid" ? "PAGO" : status === "overdue" ? "ATRASADO" : "ABERTO"}
          </Badge>
        </div>
        {onConfirmPaid && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2 h-6 text-[10px]"
            onClick={onConfirmPaid}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmar Pagamento
          </Button>
        )}
      </div>
    </div>
  );
}
