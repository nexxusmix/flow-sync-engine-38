import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useFinancialStore } from "@/stores/financialStore";
import { Expense, EXPENSE_CATEGORIES } from "@/types/financial";
import { 
  Plus, Search, MoreHorizontal, Check, Calendar, Filter,
  TrendingDown, AlertTriangle, CheckCircle, Clock, X,
  Users, Camera, Car, Home, Laptop, Box, Coffee, Megaphone, Receipt, Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'bg-amber-500', icon: Clock },
  paid: { label: 'Pago', color: 'bg-emerald-500', icon: CheckCircle },
  overdue: { label: 'Vencido', color: 'bg-red-500', icon: AlertTriangle },
};

const CATEGORY_ICONS: Record<string, any> = {
  equipe: Users,
  equipamento: Camera,
  deslocamento: Car,
  aluguel: Home,
  software: Laptop,
  locacao: Box,
  alimentacao: Coffee,
  marketing: Megaphone,
  impostos: Receipt,
  other: Circle,
};

export default function ExpensesPage() {
  const { 
    expenses, 
    fetchExpenses, 
    createExpense,
    updateExpense,
    deleteExpense,
    markExpensePaid,
  } = useFinancialStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    due_date: '',
    category: 'other',
    supplier: '',
    project_id: '',
    notes: '',
  });

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsNewDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
    }).format(value);
  };

  const filteredExpenses = expenses.filter(e => {
    if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.due_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    await createExpense({
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      due_date: newExpense.due_date,
      category: newExpense.category,
      supplier: newExpense.supplier || undefined,
      project_id: newExpense.project_id || undefined,
      notes: newExpense.notes || undefined,
    });

    setNewExpense({ description: '', amount: '', due_date: '', category: 'other', supplier: '', project_id: '', notes: '' });
    setIsNewDialogOpen(false);
    toast.success('Despesa criada');
  };

  const handleUpdate = async () => {
    if (!editingExpense) return;

    await updateExpense(editingExpense.id, {
      description: editingExpense.description,
      amount: editingExpense.amount,
      due_date: editingExpense.due_date,
      category: editingExpense.category,
      supplier: editingExpense.supplier,
      notes: editingExpense.notes,
    });

    setEditingExpense(null);
    toast.success('Despesa atualizada');
  };

  const handleMarkPaid = async (id: string) => {
    await markExpensePaid(id);
    toast.success('Despesa marcada como paga');
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    toast.success('Despesa excluída');
  };

  const totalPending = filteredExpenses
    .filter(e => e.status === 'pending' || e.status === 'overdue')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalPaid = filteredExpenses
    .filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <DashboardLayout title="Despesas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Despesas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredExpenses.length} despesas • {formatCurrency(totalPending)} pendente • {formatCurrency(totalPaid)} pago
            </p>
          </div>
          <Button onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Despesa
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar despesas..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="overdue">Vencidos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expenses List */}
        <Card className="glass-card divide-y divide-border">
          {filteredExpenses.map((expense) => {
            const status = STATUS_CONFIG[expense.status];
            const StatusIcon = status.icon;
            const CategoryIcon = CATEGORY_ICONS[expense.category] || Circle;
            const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
            const isOverdue = expense.status === 'overdue' || 
              (expense.status === 'pending' && expense.due_date < new Date().toISOString().split('T')[0]);

            return (
              <div 
                key={expense.id} 
                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    expense.status === 'paid' ? 'bg-emerald-500/10' : 
                    isOverdue ? 'bg-red-500/10' : 'bg-amber-500/10'
                  }`}>
                    <CategoryIcon className={`w-5 h-5 ${
                      expense.status === 'paid' ? 'text-emerald-500' : 
                      isOverdue ? 'text-red-500' : 'text-amber-500'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{expense.description}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {category?.label || expense.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Venc: {new Date(expense.due_date).toLocaleDateString('pt-BR')}
                      </span>
                      {expense.paid_date && (
                        <span className="text-xs text-emerald-500 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Pago: {new Date(expense.paid_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(Number(expense.amount))}</p>
                    <Badge variant="outline" className={`text-xs ${status.color} bg-opacity-10`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {expense.status !== 'paid' && (
                        <DropdownMenuItem onClick={() => handleMarkPaid(expense.id)}>
                          <Check className="w-4 h-4 mr-2" />
                          Marcar como pago
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setEditingExpense(expense)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(expense.id)}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}

          {filteredExpenses.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma despesa encontrada</p>
            </div>
          )}
        </Card>

        {/* New Expense Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Despesa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Descrição *</Label>
                <Input
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Ex: Aluguel de equipamento"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label>Vencimento *</Label>
                  <Input
                    type="date"
                    value={newExpense.due_date}
                    onChange={(e) => setNewExpense({ ...newExpense, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select 
                    value={newExpense.category} 
                    onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fornecedor</Label>
                  <Input
                    value={newExpense.supplier}
                    onChange={(e) => setNewExpense({ ...newExpense, supplier: e.target.value })}
                    placeholder="Nome do fornecedor"
                  />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  placeholder="Notas adicionais..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Expense Dialog */}
        <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Despesa</DialogTitle>
            </DialogHeader>
            {editingExpense && (
              <div className="space-y-4 py-4">
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={editingExpense.description}
                    onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      value={editingExpense.amount}
                      onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Vencimento</Label>
                    <Input
                      type="date"
                      value={editingExpense.due_date}
                      onChange={(e) => setEditingExpense({ ...editingExpense, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select 
                    value={editingExpense.category} 
                    onValueChange={(v) => setEditingExpense({ ...editingExpense, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={editingExpense.notes || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingExpense(null)}>Cancelar</Button>
              <Button onClick={handleUpdate}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
