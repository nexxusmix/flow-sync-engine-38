/**
 * PortalFinancialTab - Visão financeira do cliente no portal
 * Exibe faturas, pagamentos e status financeiro do projeto
 */

import { memo, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, Clock, CheckCircle2, AlertTriangle,
  FileText, ExternalLink, Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectInfo } from "@/hooks/useClientPortalEnhanced";

interface FinancialItem {
  id: string;
  description: string;
  amount: number;
  due_date: string | null;
  status: "paid" | "pending" | "overdue";
  paid_at?: string | null;
  project_name?: string;
}

interface PortalFinancialTabProps {
  project: ProjectInfo;
  financialItems?: FinancialItem[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getStatusConfig(status: string) {
  switch (status) {
    case "paid":
      return { label: "Pago", icon: CheckCircle2, class: "bg-primary/15 text-primary border-primary/30" };
    case "overdue":
      return { label: "Vencida", icon: AlertTriangle, class: "bg-destructive/15 text-destructive border-destructive/30" };
    default:
      return { label: "Pendente", icon: Clock, class: "bg-muted text-muted-foreground border-border" };
  }
}

function PortalFinancialTabComponent({ project, financialItems = [] }: PortalFinancialTabProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "overdue">("all");

  // Use contract_value from project as fallback summary
  const contractValue = project.contract_value || 0;
  const hasPaymentBlock = project.has_payment_block;

  const filtered = financialItems.filter(item => filter === "all" || item.status === filter);
  const totalPaid = financialItems.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = financialItems.filter(i => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  const overdueCount = financialItems.filter(i => i.status === "overdue").length;

  return (
    <div className="space-y-6">
      {/* Payment block warning */}
      {hasPaymentBlock && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Atenção: Pagamento pendente</p>
            <p className="text-xs text-muted-foreground mt-1">
              Existem faturas em atraso neste projeto. Entre em contato com a equipe para regularizar.
            </p>
          </div>
        </motion.div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Receipt className="w-4 h-4" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Valor do Contrato</span>
          </div>
          <p className="text-lg font-bold text-foreground">{formatCurrency(contractValue)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Total Pago</span>
          </div>
          <p className="text-lg font-bold text-primary">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Falta Pagar</span>
          </div>
          <p className="text-lg font-bold text-foreground">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Vencidas</span>
          </div>
          <p className={cn("text-lg font-bold", overdueCount > 0 ? "text-destructive" : "text-foreground")}>
            {overdueCount}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      {financialItems.length > 0 && (
        <div className="flex items-center gap-2">
          {(["all", "pending", "paid", "overdue"] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todas" : f === "pending" ? "Pendentes" : f === "paid" ? "Pagas" : "Vencidas"}
            </Button>
          ))}
        </div>
      )}

      {/* Financial items list */}
      {financialItems.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((item) => {
            const config = getStatusConfig(item.status);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", config.class)}>
                    <config.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{item.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.due_date && (
                        <span className="text-[10px] text-muted-foreground">
                          Venc: {format(new Date(item.due_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                      <Badge variant="outline" className={cn("text-[10px]", config.class)}>
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground whitespace-nowrap">
                  {formatCurrency(item.amount)}
                </p>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-12 text-center"
        >
          <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Financeiro</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            As informações financeiras do projeto aparecerão aqui quando disponíveis.
            {contractValue > 0 && (
              <span className="block mt-2 text-foreground font-medium">
                Valor do contrato: {formatCurrency(contractValue)}
              </span>
            )}
          </p>
        </motion.div>
      )}
    </div>
  );
}

export const PortalFinancialTab = memo(PortalFinancialTabComponent);
