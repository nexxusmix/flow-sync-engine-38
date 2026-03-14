import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useFinancialStore } from "@/stores/financialStore";
import { Contract, PaymentMilestone } from "@/types/financial";
import { 
  Plus, Search, MoreHorizontal, Check, Calendar, 
  Receipt, FileText, AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: 'bg-muted' },
  active: { label: 'Ativo', color: 'bg-primary' },
  completed: { label: 'Concluído', color: 'bg-primary' },
  cancelled: { label: 'Cancelado', color: 'bg-destructive' },
};

const MILESTONE_STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'bg-muted-foreground' },
  paid: { label: 'Pago', color: 'bg-primary' },
  overdue: { label: 'Vencido', color: 'bg-destructive' },
};

export default function ContractsPage() {
  const { 
    contracts, 
    fetchContracts, 
    createContract,
    updateContract,
    deleteContract,
    markMilestonePaid,
    createMilestone,
  } = useFinancialStore();

  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isNewMilestoneOpen, setIsNewMilestoneOpen] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const [newContract, setNewContract] = useState({
    project_id: '',
    project_name: '',
    client_name: '',
    total_value: '',
    payment_terms: '',
    start_date: '',
    end_date: '',
    notes: '',
  });
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    amount: '',
    due_date: '',
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
    }).format(value);
  };

  const filteredContracts = contracts.filter(c => {
    if (search && !c.project_name?.toLowerCase().includes(search.toLowerCase()) &&
        !c.client_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedContracts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedContracts(newExpanded);
  };

  const handleCreate = async () => {
    if (!newContract.project_name || !newContract.total_value) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    // Generate project_id if not provided
    const projectId = newContract.project_id || `proj-${Date.now()}`;

    await createContract({
      project_id: projectId,
      project_name: newContract.project_name,
      client_name: newContract.client_name || undefined,
      total_value: parseFloat(newContract.total_value),
      payment_terms: newContract.payment_terms || undefined,
      start_date: newContract.start_date || undefined,
      end_date: newContract.end_date || undefined,
      notes: newContract.notes || undefined,
      status: 'active',
    });

    setNewContract({ project_id: '', project_name: '', client_name: '', total_value: '', payment_terms: '', start_date: '', end_date: '', notes: '' });
    setIsNewDialogOpen(false);
    toast.success('Contrato criado');
  };

  const handleCreateMilestone = async (contractId: string) => {
    if (!newMilestone.title || !newMilestone.amount || !newMilestone.due_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    await createMilestone(contractId, {
      title: newMilestone.title,
      amount: parseFloat(newMilestone.amount),
      due_date: newMilestone.due_date,
    });

    setNewMilestone({ title: '', amount: '', due_date: '' });
    setIsNewMilestoneOpen(null);
    toast.success('Marco criado e receita gerada');
  };

  const handleMarkMilestonePaid = async (milestoneId: string) => {
    await markMilestonePaid(milestoneId);
    toast.success('Marco marcado como pago');
  };

  const handleDelete = async (id: string) => {
    await deleteContract(id);
    toast.success('Contrato excluído');
  };

  const getContractProgress = (contract: Contract) => {
    if (!contract.milestones || contract.milestones.length === 0) return 0;
    const paid = contract.milestones.filter(m => m.status === 'paid').length;
    return (paid / contract.milestones.length) * 100;
  };

  const getContractReceived = (contract: Contract) => {
    if (!contract.milestones) return 0;
    return contract.milestones
      .filter(m => m.status === 'paid')
      .reduce((sum, m) => sum + Number(m.amount), 0);
  };

  return (
    <DashboardLayout title="Contratos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Contratos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {contracts.length} contratos • Gerencie marcos de pagamento
            </p>
          </div>
          <Button onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Contrato
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contratos..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.map((contract) => {
            const status = STATUS_CONFIG[contract.status];
            const progress = getContractProgress(contract);
            const received = getContractReceived(contract);
            const isExpanded = expandedContracts.has(contract.id);

            return (
              <Card key={contract.id} className="glass-card overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(contract.id)}>
                  {/* Contract Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{contract.project_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {contract.client_name && (
                            <span className="text-sm text-muted-foreground">{contract.client_name}</span>
                          )}
                          <Badge variant="outline" className={`text-xs ${status.color} bg-opacity-10`}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatCurrency(Number(contract.total_value))}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(received)} recebido
                        </p>
                      </div>

                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </CollapsibleTrigger>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setIsNewMilestoneOpen(contract.id)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar marco
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(contract.id)}
                          >
                            Excluir contrato
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Milestones (Expandable) */}
                  <CollapsibleContent>
                    <div className="border-t border-border">
                      <div className="p-4 bg-muted/30">
                        <h4 className="text-sm font-medium text-foreground mb-3">Marcos de Pagamento</h4>
                        
                        {contract.milestones && contract.milestones.length > 0 ? (
                          <div className="space-y-2">
                            {contract.milestones.map((milestone) => {
                              const mStatus = MILESTONE_STATUS_CONFIG[milestone.status];
                              const isOverdue = milestone.status === 'pending' && 
                                milestone.due_date < new Date().toISOString().split('T')[0];

                              return (
                                <div 
                                  key={milestone.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                      milestone.status === 'paid' ? 'bg-emerald-500' :
                                      isOverdue ? 'bg-red-500' : 'bg-amber-500'
                                    }`} />
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{milestone.title}</p>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(milestone.due_date).toLocaleDateString('pt-BR')}
                                        {isOverdue && !milestone.paid_date && (
                                          <AlertTriangle className="w-3 h-3 text-red-500 ml-1" />
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-foreground">
                                      {formatCurrency(Number(milestone.amount))}
                                    </span>
                                    {milestone.status !== 'paid' && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleMarkMilestonePaid(milestone.id)}
                                      >
                                        <Check className="w-4 h-4 mr-1" />
                                        Pago
                                      </Button>
                                    )}
                                    {milestone.status === 'paid' && (
                                      <Badge className="bg-emerald-500">Pago</Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum marco de pagamento definido
                          </p>
                        )}

                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 w-full"
                          onClick={() => setIsNewMilestoneOpen(contract.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar marco
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}

          {filteredContracts.length === 0 && (
            <Card className="glass-card p-12">
              <div className="text-center text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum contrato encontrado</p>
              </div>
            </Card>
          )}
        </div>

        {/* New Contract Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Contrato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Projeto *</Label>
                  <Input
                    value={newContract.project_name}
                    onChange={(e) => setNewContract({ ...newContract, project_name: e.target.value })}
                    placeholder="Ex: Vídeo Institucional ABC"
                  />
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Input
                    value={newContract.client_name}
                    onChange={(e) => setNewContract({ ...newContract, client_name: e.target.value })}
                    placeholder="Nome do cliente"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Total *</Label>
                  <Input
                    type="number"
                    value={newContract.total_value}
                    onChange={(e) => setNewContract({ ...newContract, total_value: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label>Condições</Label>
                  <Input
                    value={newContract.payment_terms}
                    onChange={(e) => setNewContract({ ...newContract, payment_terms: e.target.value })}
                    placeholder="Ex: 40/40/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={newContract.start_date}
                    onChange={(e) => setNewContract({ ...newContract, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={newContract.end_date}
                    onChange={(e) => setNewContract({ ...newContract, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={newContract.notes}
                  onChange={(e) => setNewContract({ ...newContract, notes: e.target.value })}
                  placeholder="Notas adicionais..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Criar Contrato</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Milestone Dialog */}
        <Dialog open={!!isNewMilestoneOpen} onOpenChange={() => setIsNewMilestoneOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Marco de Pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  placeholder="Ex: Entrada, Entrega parcial, Entrega final"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    value={newMilestone.amount}
                    onChange={(e) => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label>Vencimento *</Label>
                  <Input
                    type="date"
                    value={newMilestone.due_date}
                    onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewMilestoneOpen(null)}>Cancelar</Button>
              <Button onClick={() => isNewMilestoneOpen && handleCreateMilestone(isNewMilestoneOpen)}>
                Criar Marco
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
