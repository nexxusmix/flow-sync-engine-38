/**
 * PortalPaymentsAside - Próximos pagamentos sidebar
 * Estilo exato do HTML de referência
 */

import { memo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid';
  description?: string;
}

interface PortalPaymentsAsideProps {
  payments?: Payment[];
  hasPaymentBlock?: boolean;
}

// Mock payments for demonstration
const mockPayments: Payment[] = [
  { id: '1', amount: 7795, dueDate: '2026-01-15', status: 'overdue', description: 'Parcela 01' },
  { id: '2', amount: 3897.50, dueDate: '2026-02-05', status: 'pending', description: 'Parcela 02' },
];

function PortalPaymentsAsideComponent({ payments = mockPayments, hasPaymentBlock }: PortalPaymentsAsideProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopyPix = (paymentId: string) => {
    // Mock PIX code
    navigator.clipboard.writeText('00020126580014br.gov.bcb.pix0136...');
    setCopiedId(paymentId);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-light text-white">Próximos Pagamentos</h3>
      
      <div className="space-y-3">
        {payments.map((payment) => (
          <div 
            key={payment.id}
            className={cn(
              "bg-[#0a0a0a] border rounded-2xl p-4",
              payment.status === 'overdue' 
                ? "border-red-500/30 bg-red-500/5" 
                : "border-[#1a1a1a]"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                {payment.status === 'overdue' && (
                  <span className="text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold bg-red-500/20 text-red-400 inline-block mb-2">
                    Atrasado
                  </span>
                )}
                <p className="text-xs text-gray-500">{formatDate(payment.dueDate)}</p>
              </div>
              {payment.status === 'overdue' && (
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
              payment.status === 'overdue' ? "text-red-400" : "text-white"
            )}>
              {formatCurrency(payment.amount)}
            </p>
            {payment.description && (
              <p className="text-xs text-gray-500 mt-1">{payment.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const PortalPaymentsAside = memo(PortalPaymentsAsideComponent);
