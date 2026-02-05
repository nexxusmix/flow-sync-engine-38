import { useState, useEffect } from 'react';
import { useFinancialStore } from '@/stores/financialStore';
import { Contract } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Calendar, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';

interface ProjectContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  clientName?: string | null;
  existingContract?: Contract | null;
  onSuccess: () => void;
}

const PAYMENT_PRESETS = [
  { value: '100', label: '100% à vista' },
  { value: '50/50', label: '50% entrada + 50% entrega' },
  { value: '40/30/30', label: '40% + 30% + 30%' },
  { value: '30/30/40', label: '30% + 30% + 40%' },
  { value: 'custom', label: 'Personalizado' },
];

export function ProjectContractModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  clientName,
  existingContract,
  onSuccess,
}: ProjectContractModalProps) {
  const { createContractForProject, updateContract, createMilestone } = useFinancialStore();
  
  const [totalValue, setTotalValue] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('50/50');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (existingContract) {
      setTotalValue(String(existingContract.total_value));
      setPaymentTerms(existingContract.payment_terms || '50/50');
      setStartDate(existingContract.start_date || new Date().toISOString().split('T')[0]);
      setNotes(existingContract.notes || '');
    } else {
      setTotalValue('');
      setPaymentTerms('50/50');
      setStartDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [existingContract, open]);

  const generateInstallments = (total: number, terms: string) => {
    if (terms === 'custom' || !terms) return [];
    
    const percentages = terms.split('/').map(p => parseInt(p));
    return percentages.map((pct, index) => ({
      title: percentages.length === 1 
        ? 'Pagamento Único' 
        : index === 0 
          ? 'Entrada' 
          : index === percentages.length - 1 
            ? 'Parcela Final' 
            : `${index + 1}ª Parcela`,
      amount: total * (pct / 100),
      due_date: addDays(new Date(startDate), index * 30).toISOString().split('T')[0],
    }));
  };

  const handleSubmit = async () => {
    if (!totalValue || parseFloat(totalValue) <= 0) {
      toast.error('Informe o valor do contrato');
      return;
    }

    setIsLoading(true);
    
    try {
      const value = parseFloat(totalValue);
      
      if (existingContract) {
        // Update existing contract
        await updateContract(existingContract.id, {
          total_value: value,
          payment_terms: paymentTerms,
          start_date: startDate,
          notes,
        });
        toast.success('Contrato atualizado');
      } else {
        // Create new contract with milestones
        const contract = await createContractForProject(
          projectId,
          projectName,
          clientName || null,
          value,
          paymentTerms
        );

        if (contract && paymentTerms !== 'custom') {
          // Generate and create milestones
          const installments = generateInstallments(value, paymentTerms);
          for (const installment of installments) {
            await createMilestone(contract.id, installment);
          }
        }
        
        toast.success('Contrato criado com parcelas');
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar contrato');
    } finally {
      setIsLoading(false);
    }
  };

  const previewInstallments = paymentTerms !== 'custom' && totalValue
    ? generateInstallments(parseFloat(totalValue) || 0, paymentTerms)
    : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {existingContract ? 'Editar Contrato' : 'Novo Contrato'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Info */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium text-foreground">{projectName}</p>
            {clientName && (
              <p className="text-xs text-muted-foreground">{clientName}</p>
            )}
          </div>

          {/* Total Value */}
          <div className="space-y-2">
            <Label>Valor Total do Contrato</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                placeholder="0.00"
                className="pl-9"
              />
            </div>
          </div>

          {/* Payment Terms */}
          <div className="space-y-2">
            <Label>Condições de Pagamento</Label>
            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Data de Início</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condições especiais, informações adicionais..."
              rows={2}
            />
          </div>

          {/* Preview Installments */}
          {previewInstallments.length > 0 && !existingContract && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Parcelas a serem criadas
              </Label>
              <div className="space-y-1 p-3 rounded-lg bg-primary/5 border border-primary/10">
                {previewInstallments.map((inst, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {inst.title} ({format(new Date(inst.due_date), 'dd/MM')})
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(inst.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Salvando...' : existingContract ? 'Salvar' : 'Criar Contrato'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
