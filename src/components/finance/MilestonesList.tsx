import { useState, useMemo } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Edit2, Trash2, Plus, Calendar, DollarSign, MoreVertical, Clock, XCircle, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface MilestonesListProps {
  contractId: string;
  milestones: PaymentMilestone[];
  onRefresh: () => void;
}

type FilterType = 'all' | 'pending' | 'paid' | 'overdue';

export function MilestonesList({ contractId, milestones, onRefresh }: MilestonesListProps) {
  const { createMilestone, updateMilestone, deleteMilestone, markMilestonePaid } = useFinancialStore();
  
  const [editingMilestone, setEditingMilestone] = useState<PaymentMilestone | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  // Payment confirmation modal
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
    }).format(value);
  };

  // Calculate status with overdue detection
  const getMilestoneDisplayStatus = (milestone: PaymentMilestone): MilestoneStatus => {
    if (milestone.status === 'paid') return 'paid';
    const today = new Date().toISOString().split('T')[0];
    if (milestone.due_date < today) return 'overdue';
    return milestone.status || 'pending';
  };

  // Filter milestones
  const filteredMilestones = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    return milestones
      .map(m => ({
        ...m,
        displayStatus: getMilestoneDisplayStatus(m),
      }))
      .filter(m => {
        switch (filter) {
          case 'pending':
            return m.displayStatus === 'pending';
          case 'paid':
            return m.displayStatus === 'paid';
          case 'overdue':
            return m.displayStatus === 'overdue';
          default:
            return true;
        }
      })
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [milestones, filter]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const pending = milestones.filter(m => m.status !== 'paid' && m.due_date >= today);
    const paid = milestones.filter(m => m.status === 'paid');
    const overdue = milestones.filter(m => m.status !== 'paid' && m.due_date < today);
    
    return {
      total: milestones.length,
      pending: pending.length,
      paid: paid.length,
      overdue: overdue.length,
      pendingValue: pending.reduce((sum, m) => sum + Number(m.amount), 0),
      paidValue: paid.reduce((sum, m) => sum + Number(m.amount), 0),
      overdueValue: overdue.reduce((sum, m) => sum + Number(m.amount), 0),
    };
  }, [milestones]);

  const handleOpenEdit = (milestone: PaymentMilestone) => {
    setEditingMilestone(milestone);
    setTitle(milestone.title);
    setAmount(String(milestone.amount));
    setDueDate(milestone.due_date);
    setDescription('');
  };

  const handleOpenNew = () => {
    setIsAddingNew(true);
    setTitle('');
    setAmount('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setDescription('');
  };

  const handleCloseDialog = () => {
    setEditingMilestone(null);
    setIsAddingNew(false);
    setTitle('');
    setAmount('');
    setDueDate('');
    setDescription('');
  };

  const handleSave = async () => {
    if (!title || !amount || !dueDate) {
      toast.error('Preencha todos os campos obrigatórios');
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
        const newMilestone = await createMilestone(contractId, {
          title,
          amount: parseFloat(amount),
          due_date: dueDate,
        });
        if (newMilestone) {
          toast.success('Parcela criada com sucesso!');
        } else {
          toast.error('Erro ao criar parcela');
          return;
        }
      }
      handleCloseDialog();
      // Call onRefresh to update totals in parent component
      onRefresh();
    } catch (error) {
      console.error('Error saving milestone:', error);
      toast.error('Erro ao salvar parcela');
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirmPaymentId) return;
    
    try {
      await markMilestonePaid(confirmPaymentId, paymentDate);
      toast.success('Pagamento confirmado');
      setConfirmPaymentId(null);
      onRefresh();
    } catch (error) {
      toast.error('Erro ao confirmar pagamento');
    }
  };

  const handleMarkPending = async (milestoneId: string) => {
    try {
      await updateMilestone(milestoneId, { status: 'pending', paid_date: null });
      toast.success('Parcela marcada como pendente');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao atualizar parcela');
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

  const getStatusBadge = (status: MilestoneStatus) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-primary text-primary-foreground">Pago</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive text-white">Vencido</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Parcelas ({milestones.length})
        </h4>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Pagas</SelectItem>
              <SelectItem value="overdue">Vencidas</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={handleOpenNew}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      {milestones.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">A receber</p>
            <p className="text-sm font-medium text-muted-foreground">{formatCurrency(stats.pendingValue + stats.overdueValue)}</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="text-sm font-medium text-primary">{formatCurrency(stats.paidValue)}</p>
          </div>
          <div className="p-2 rounded-lg bg-destructive/10">
            <p className="text-xs text-muted-foreground">Vencido</p>
            <p className="text-sm font-medium text-destructive">{formatCurrency(stats.overdueValue)}</p>
          </div>
        </div>
      )}

      {/* Milestones list */}
      <div className="space-y-2">
        {filteredMilestones.map((milestone) => {
          const isPaid = milestone.displayStatus === 'paid';
          const isOverdue = milestone.displayStatus === 'overdue';

          return (
            <div
              key={milestone.id}
              className={`p-3 rounded-lg border transition-colors ${
                isPaid 
                  ? 'bg-primary/5 border-primary/20' 
                  : isOverdue 
                    ? 'bg-destructive/5 border-destructive/20'
                    : 'bg-muted/30 border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium text-sm ${isPaid ? 'text-primary' : ''}`}>
                  {milestone.title}
                </span>
                <div className="flex items-center gap-2">
                  {getStatusBadge(milestone.displayStatus)}
                  
                  {/* Actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!isPaid && (
                        <>
                          <DropdownMenuItem onClick={() => {
                            setConfirmPaymentId(milestone.id);
                            setPaymentDate(new Date().toISOString().split('T')[0]);
                          }}>
                            <Check className="w-4 h-4 mr-2 text-primary" />
                            Marcar como Pago
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {isPaid && (
                        <>
                          <DropdownMenuItem onClick={() => handleMarkPending(milestone.id)}>
                            <Undo2 className="w-4 h-4 mr-2 text-muted-foreground" />
                            Marcar como Pendente
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => handleOpenEdit(milestone)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeletingId(milestone.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(milestone.due_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  {isPaid && milestone.paid_date && (
                    <span className="text-primary ml-2">
                      (pago em {format(new Date(milestone.paid_date), "dd/MM", { locale: ptBR })})
                    </span>
                  )}
                </div>
                <div className={`font-semibold ${isPaid ? 'text-primary' : isOverdue ? 'text-destructive' : ''}`}>
                  {formatCurrency(Number(milestone.amount))}
                </div>
              </div>

              {/* Quick action for unpaid */}
              {!isPaid && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full h-7 text-xs"
                    onClick={() => {
                      setConfirmPaymentId(milestone.id);
                      setPaymentDate(new Date().toISOString().split('T')[0]);
                    }}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Confirmar Recebimento
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {filteredMilestones.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {milestones.length === 0 
              ? 'Nenhuma parcela cadastrada'
              : 'Nenhuma parcela encontrada com esse filtro'
            }
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
              <label className="text-sm font-medium text-foreground">Título *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Entrada, 2ª Parcela..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground">Valor *</label>
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
              <label className="text-sm font-medium text-foreground">Vencimento *</label>
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

      {/* Payment Confirmation Dialog */}
      <Dialog open={!!confirmPaymentId} onOpenChange={() => setConfirmPaymentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              Confirmar Recebimento
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Informe a data em que o pagamento foi recebido:
            </p>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPaymentId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayment} className="bg-primary hover:bg-primary/90">
              <Check className="w-4 h-4 mr-2" />
              Confirmar
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
              Tem certeza que deseja excluir esta parcela? A receita vinculada também será removida. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
