/**
 * PortalPaymentsAside - Próximos pagamentos sidebar (Portal do Cliente)
 * Somente leitura - dados reais do banco
 */

import { memo, useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFinancialStore } from "@/stores/financialStore";
import { isPast, isToday } from "date-fns";

interface PortalPaymentsAsideProps {
  projectId: string;
  hasPaymentBlock?: boolean;
}

function PortalPaymentsAsideComponent({ projectId, hasPaymentBlock }: PortalPaymentsAsideProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { revenues, contracts, fetchRevenues, fetchContracts, getRevenuesByProject, getContractByProject } = useFinancialStore();

  useEffect(() => {
    if (revenues.length === 0) fetchRevenues();
    if (contracts.length === 0) fetchContracts();
  }, []);

  const projectRevenues = getRevenuesByProject(projectId);
  const contract = getContractByProject(projectId);

  // Filter to show only pending/overdue (not cancelled, not received)
  const pendingPayments = projectRevenues.filter(r =>
    r.status !== 'received' && r.status !== 'cancelled'
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isOverdue = (r: { status: string; due_date: string }) => {
    return r.status === 'overdue' || (r.status === 'pending' && isPast(new Date(r.due_date)) && !isToday(new Date(r.due_date)));
  };

  const handleCopyPix = (paymentId: string) => {
    const pixKey = contract?.pix_key;
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopiedId(paymentId);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (pendingPayments.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-light text-white">Próximos Pagamentos</h3>

      <div className="space-y-3">
        {pendingPayments.map((payment) => {
          const overdue = isOverdue(payment);
          return (
            <div
              key={payment.id}
              className={cn(
                "bg-[#0a0a0a] border rounded-2xl p-4",
                overdue
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-[#1a1a1a]"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  {overdue && (
                    <span className="text-mono px-2 py-0.5 uppercase tracking-wider font-bold bg-red-500/20 text-red-400 inline-block mb-2">
                      Atrasado
                    </span>
                  )}
                  <p className="text-xs text-gray-500">{formatDate(payment.due_date)}</p>
                </div>
                {overdue && contract?.pix_key && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyPix(payment.id)}
                    className="text-cyan-400 hover:text-cyan-300 text-xs h-auto p-0"
                  >
                    {copiedId === payment.id ? 'Copiado!' : 'Copiar Pix'}
                  </Button>
                )}
              </div>
              <p className={cn(
                "text-lg font-semibold",
                overdue ? "text-red-400" : "text-white"
              )}>
                {formatCurrency(Number(payment.amount))}
              </p>
              {payment.description && (
                <p className="text-xs text-gray-500 mt-1">{payment.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const PortalPaymentsAside = memo(PortalPaymentsAsideComponent);
