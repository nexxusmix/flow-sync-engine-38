import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useFinancialStore } from "@/stores/financialStore";
import { Revenue, PAYMENT_METHODS } from "@/types/financial";
import { 
  Plus, Search, MoreHorizontal, Check, Calendar, Filter,
  TrendingUp, AlertTriangle, CheckCircle, Clock, X
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
  pending: { label: 'Pendente', color: 'bg-muted-foreground', icon: Clock },
  received: { label: 'Recebido', color: 'bg-primary', icon: CheckCircle },
  overdue: { label: 'Vencido', color: 'bg-destructive', icon: AlertTriangle },
  cancelled: { label: 'Cancelado', color: 'bg-muted', icon: X },
};

export default function RevenuesPage() {
  const { 
    revenues, 
    fetchRevenues, 
    createRevenue,
    updateRevenue,
    deleteRevenue,
    markRevenueReceived,
  } = useFinancialStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newRevenue, setNewRevenue] = useState({
    description: '',
    amount: '',
    due_date: '',
    payment_method: '' as any,
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
    fetchRevenues();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
    }).format(value);
  };

  const filteredRevenues = revenues.filter(r => {
    if (search && !r.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!newRevenue.description || !newRevenue.amount || !newRevenue.due_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    await createRevenue({
      description: newRevenue.description,
      amount: parseFloat(newRevenue.amount),
      due_date: newRevenue.due_date,
      payment_method: newRevenue.payment_method || undefined,
      project_id: newRevenue.project_id || undefined,
      notes: newRevenue.notes || undefined,
    });

    setNewRevenue({ description: '', amount: '', due_date: '', payment_method: '', project_id: '', notes: '' });
    setIsNewDialogOpen(false);
    toast.success('Receita criada');
  };

  const handleUpdate = async () => {
    if (!editingRevenue) return;

    await updateRevenue(editingRevenue.id, {
      description: editingRevenue.description,
      amount: editingRevenue.amount,
      due_date: editingRevenue.due_date,
      payment_method: editingRevenue.payment_method,
      notes: editingRevenue.notes,
    });

    setEditingRevenue(null);
    toast.success('Receita atualizada');
  };

  const handleMarkReceived = async (id: string) => {
    await markRevenueReceived(id);
    toast.success('Receita marcada como recebida');
  };

  const handleDelete = async (id: string) => {
    await deleteRevenue(id);
    toast.success('Receita excluída');
  };

  const totalPending = filteredRevenues
    .filter(r => r.status === 'pending' || r.status === 'overdue')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const totalReceived = filteredRevenues
    .filter(r => r.status === 'received')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <DashboardLayout title="Receitas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Receitas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredRevenues.length} receitas • {formatCurrency(totalPending)} pendente • {formatCurrency(totalReceived)} recebido
            </p>
          </div>
          <Button onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Receita
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar receitas..."
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
              <SelectItem value="received">Recebidos</SelectItem>
              <SelectItem value="overdue">Vencidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Revenues List */}
        <Card className="glass-card divide-y divide-border">
          {filteredRevenues.map((revenue) => {
            const status = STATUS_CONFIG[revenue.status];
            const StatusIcon = status.icon;
            const isOverdue = revenue.status === 'overdue' || 
              (revenue.status === 'pending' && revenue.due_date < new Date().toISOString().split('T')[0]);

            return (
              <div 
                key={revenue.id} 
                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    revenue.status === 'received' ? 'bg-primary/10' : 
                    isOverdue ? 'bg-destructive/10' : 'bg-muted'
                  }`}>
                    <TrendingUp className={`w-5 h-5 ${
                      revenue.status === 'received' ? 'text-primary' : 
                      isOverdue ? 'text-destructive' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{revenue.description}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Venc: {new Date(revenue.due_date).toLocaleDateString('pt-BR')}
                      </span>
                      {revenue.received_date && (
                        <span className="text-xs text-primary flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Rec: {new Date(revenue.received_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(Number(revenue.amount))}</p>
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
                      {revenue.status !== 'received' && (
                        <DropdownMenuItem onClick={() => handleMarkReceived(revenue.id)}>
                          <Check className="w-4 h-4 mr-2" />
                          Marcar como recebido
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setEditingRevenue(revenue)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(revenue.id)}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}

          {filteredRevenues.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma receita encontrada</p>
            </div>
          )}
        </Card>

        {/* New Revenue Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Receita</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Descrição *</Label>
                <Input
                  value={newRevenue.description}
                  onChange={(e) => setNewRevenue({ ...newRevenue, description: e.target.value })}
                  placeholder="Ex: Entrada projeto X"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    value={newRevenue.amount}
                    onChange={(e) => setNewRevenue({ ...newRevenue, amount: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label>Vencimento *</Label>
                  <Input
                    type="date"
                    value={newRevenue.due_date}
                    onChange={(e) => setNewRevenue({ ...newRevenue, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Método de Pagamento</Label>
                <Select 
                  value={newRevenue.payment_method} 
                  onValueChange={(v) => setNewRevenue({ ...newRevenue, payment_method: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={newRevenue.notes}
                  onChange={(e) => setNewRevenue({ ...newRevenue, notes: e.target.value })}
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

        {/* Edit Revenue Dialog */}
        <Dialog open={!!editingRevenue} onOpenChange={() => setEditingRevenue(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Receita</DialogTitle>
            </DialogHeader>
            {editingRevenue && (
              <div className="space-y-4 py-4">
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={editingRevenue.description}
                    onChange={(e) => setEditingRevenue({ ...editingRevenue, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      value={editingRevenue.amount}
                      onChange={(e) => setEditingRevenue({ ...editingRevenue, amount: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Vencimento</Label>
                    <Input
                      type="date"
                      value={editingRevenue.due_date}
                      onChange={(e) => setEditingRevenue({ ...editingRevenue, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={editingRevenue.notes || ''}
                    onChange={(e) => setEditingRevenue({ ...editingRevenue, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRevenue(null)}>Cancelar</Button>
              <Button onClick={handleUpdate}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
