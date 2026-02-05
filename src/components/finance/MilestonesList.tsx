import { useState } from 'react';
import { PaymentMilestone, MilestoneStatus } from '@/types/financial';
import { useFinancialStore } from '@/stores/financialStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check, Edit2, Trash2, Plus, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface MilestonesListProps {
  contractId: string;
  milestones: PaymentMilestone[];
  onRefresh: () => void;
}

export function MilestonesList({ contractId, milestones, onRefresh }: MilestonesListProps) {
  const { createMilestone, updateMilestone, deleteMilestone, markMilestonePaid } = useFinancialStore();
  
  const [editingMilestone, setEditingMilestone] = useState<PaymentMilestone | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
    }).format(value);
  };

  const handleOpenEdit = (milestone: PaymentMilestone) => {
    setEditingMilestone(milestone);
    setTitle(milestone.title);
    setAmount(String(milestone.amount));
    setDueDate(milestone.due_date);
  };

  const handleOpenNew = () => {
    setIsAddingNew(true);
    setTitle('');
    setAmount('');
    setDueDate(new Date().toISOString().split('T')[0]);
  };

  const handleCloseDialog = () => {
    setEditingMilestone(null);
    setIsAddingNew(false);
    setTitle('');
    setAmount('');
    setDueDate('');
  };

  const handleSave = async () => {
    if (!title || !amount || !dueDate) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      if (editingMilestone) {
        await updateMilestone(editingMilestone.id, {
          title,
          amount: parseFloat(amount),
          due_date: dueDate,
        });
        toast.success('Parcela atualizada');
      } else {
        await createMilestone(contractId, {
          title,
          amount: parseFloat(amount),
          due_date: dueDate,
        });
        toast.success('Parcela criada');
      }
      handleCloseDialog();
      onRefresh();
    } catch (error) {
      toast.error('Erro ao salvar parcela');
    }
  };

  const handleConfirmPayment = async (milestoneId: string) => {
    try {
      await markMilestonePaid(milestoneId);
      toast.success('Pagamento confirmado');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao confirmar pagamento');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    
    try {
      await deleteMilestone(deletingId);
      toast.success('Parcela excluída');
      setDeletingId(null);
      onRefresh();
    } catch (error) {
      toast.error('Erro ao excluir parcela');
    }
  };

  const getStatusBadge = (status: MilestoneStatus, dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = status === 'pending' && dueDate < today;
    
    if (status === 'paid') {
      return <Badge className="bg-emerald-500 text-white">Pago</Badge>;
    }
    if (isOverdue || status === 'overdue') {
      return <Badge className="bg-red-500 text-white">Vencido</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Parcelas ({milestones.length})
        </h4>
        <Button size="sm" variant="ghost" onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      </div>

      <div className="space-y-2">
        {sortedMilestones.map((milestone) => {
          const isPaid = milestone.status === 'paid';
          const today = new Date().toISOString().split('T')[0];
          const isOverdue = !isPaid && milestone.due_date < today;

          return (
            <div
              key={milestone.id}
              className={`p-3 rounded-lg border transition-colors ${
                isPaid 
                  ? 'bg-emerald-500/5 border-emerald-500/20' 
                  : isOverdue 
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-muted/30 border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium text-sm ${isPaid ? 'text-emerald-600' : ''}`}>
                  {milestone.title}
                </span>
                {getStatusBadge(milestone.status, milestone.due_date)}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {format(new Date(milestone.due_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                </div>
                <div className={`font-semibold ${isPaid ? 'text-emerald-600' : isOverdue ? 'text-red-500' : ''}`}>
                  {formatCurrency(Number(milestone.amount))}
                </div>
              </div>

              {!isPaid && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 h-8"
                    onClick={() => handleConfirmPayment(milestone.id)}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => handleOpenEdit(milestone)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-red-500 hover:text-red-600"
                    onClick={() => setDeletingId(milestone.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {milestones.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Nenhuma parcela cadastrada
          </div>
        )}
      </div>

      {/* Edit/Add Dialog */}
      <Dialog open={!!editingMilestone || isAddingNew} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? 'Editar Parcela' : 'Nova Parcela'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">Título</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Entrada, 2ª Parcela..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground">Valor</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-9"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground">Vencimento</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingMilestone ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Parcela</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta parcela? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
