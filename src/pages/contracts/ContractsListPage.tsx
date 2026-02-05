import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Contract, STATUS_CONFIG, ContractStatus, RENEWAL_TYPE_LABELS, RenewalType } from "@/types/contracts";
import {
  FileSignature, Plus, Search, Filter, Copy, Link2, FileText,
  MoreHorizontal, Calendar, AlertTriangle, Bell, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ContractsListPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [alerts, setAlerts] = useState<{ contract_id: string; type: string; due_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newContract, setNewContract] = useState({
    project_name: "",
    client_name: "",
    client_email: "",
    total_value: "",
  });

  useEffect(() => {
    fetchContracts();
    fetchAlerts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Erro ao carregar contratos");
    } else {
      setContracts((data || []) as Contract[]);
    }
    setLoading(false);
  };

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('contract_alerts')
      .select('contract_id, type, due_at')
      .eq('status', 'open')
      .order('due_at');
    
    if (data) setAlerts(data);
  };

  const handleCreateContract = async () => {
    if (!newContract.project_name || !newContract.total_value) {
      toast.error("Nome do projeto e valor são obrigatórios");
      return;
    }

    const { data, error } = await supabase
      .from('contracts')
      .insert([{
        project_id: `proj-${Date.now()}`,
        project_name: newContract.project_name,
        client_name: newContract.client_name || null,
        client_email: newContract.client_email || null,
        total_value: parseFloat(newContract.total_value),
        status: 'draft',
      }])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar contrato");
      return;
    }

    toast.success("Contrato criado!");
    setShowNewModal(false);
    setNewContract({ project_name: "", client_name: "", client_email: "", total_value: "" });
    navigate(`/contratos/${data.id}`);
  };

  const handleGenerateLink = async (contractId: string) => {
    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 20);

    const { error } = await supabase
      .from('contract_links')
      .insert([{
        contract_id: contractId,
        share_token: token,
        is_active: true,
      }]);

    if (error) {
      toast.error("Erro ao gerar link");
      return;
    }

    await supabase
      .from('contracts')
      .update({ status: 'sent' })
      .eq('id', contractId);

    const link = `${window.location.origin}/contratos/${contractId}/client?token=${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado! Status alterado para 'Enviado'");
    fetchContracts();
  };

  const handleDuplicate = async (contract: Contract) => {
    const { data, error } = await supabase
      .from('contracts')
      .insert([{
        project_id: contract.project_id,
        project_name: `${contract.project_name} (cópia)`,
        client_name: contract.client_name,
        client_email: contract.client_email,
        total_value: contract.total_value,
        status: 'draft',
        renewal_type: contract.renewal_type,
        payment_terms: contract.payment_terms,
      }])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao duplicar contrato");
      return;
    }

    toast.success("Contrato duplicado!");
    navigate(`/contratos/${data.id}`);
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      (c.project_name?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (c.client_name?.toLowerCase().includes(search.toLowerCase()) || false);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const renewingSoon = contracts.filter(c => {
    if (!c.end_date || c.renewal_type === 'none') return false;
    const daysUntil = differenceInDays(new Date(c.end_date), new Date());
    return daysUntil > 0 && daysUntil <= 30;
  });

  return (
    <DashboardLayout title="Contratos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contratos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="signed">Assinado</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/contratos/templates')}>
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button onClick={() => setShowNewModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        </div>

        {/* Alerts Banner */}
        {renewingSoon.length > 0 && (
          <Card className="p-4 bg-amber-500/10 border-amber-500/30">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-500">
                  {renewingSoon.length} contrato(s) vencendo nos próximos 30 dias
                </p>
                <p className="text-xs text-muted-foreground">
                  {renewingSoon.map(c => c.project_name).join(', ')}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold text-foreground">{contracts.length}</p>
          </Card>
          <Card className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Aguardando Assinatura</p>
            <p className="text-2xl font-semibold text-amber-500">
              {contracts.filter(c => ['sent', 'viewed'].includes(c.status)).length}
            </p>
          </Card>
          <Card className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-2xl font-semibold text-emerald-500">
              {contracts.filter(c => c.status === 'signed' || c.status === 'active').length}
            </p>
          </Card>
          <Card className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Valor Total Ativo</p>
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(
                contracts
                  .filter(c => ['signed', 'active'].includes(c.status))
                  .reduce((sum, c) => sum + Number(c.total_value), 0)
              )}
            </p>
          </Card>
        </div>

        {/* Table */}
        <Card className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Renovação</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum contrato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract) => {
                  const hasAlert = alerts.some(a => a.contract_id === contract.id);
                  return (
                    <TableRow
                      key={contract.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/contratos/${contract.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileSignature className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{contract.project_name}</p>
                            {hasAlert && (
                              <Badge variant="outline" className="text-[9px] text-amber-500 border-amber-500">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Alerta
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{contract.client_name || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">
                          {formatCurrency(Number(contract.total_value))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", STATUS_CONFIG[contract.status as ContractStatus]?.color)}>
                          {STATUS_CONFIG[contract.status as ContractStatus]?.label || contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contract.start_date ? (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(contract.start_date), 'dd/MM/yyyy')}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {contract.end_date ? (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(contract.end_date), 'dd/MM/yyyy')}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {contract.renewal_type ? RENEWAL_TYPE_LABELS[contract.renewal_type as RenewalType] : '-'}
                        </span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/contratos/${contract.id}`)}>
                              Abrir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/contratos/${contract.id}/preview`)}>
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleGenerateLink(contract.id)}>
                              <Link2 className="w-4 h-4 mr-2" />
                              Gerar Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(contract)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/contratos/${contract.id}?tab=addendums`)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Criar Aditivo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* New Contract Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Contrato</DialogTitle>
            <DialogDescription>
              Crie um novo contrato. Você pode usar um template depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Projeto *</Label>
              <Input
                placeholder="Ex: Vídeo Institucional ABC"
                value={newContract.project_name}
                onChange={(e) => setNewContract({ ...newContract, project_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input
                placeholder="Nome do cliente"
                value={newContract.client_name}
                onChange={(e) => setNewContract({ ...newContract, client_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail do Cliente</Label>
              <Input
                type="email"
                placeholder="cliente@email.com"
                value={newContract.client_email}
                onChange={(e) => setNewContract({ ...newContract, client_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Total *</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={newContract.total_value}
                onChange={(e) => setNewContract({ ...newContract, total_value: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateContract}>
              Criar Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
