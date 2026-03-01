import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Proposal, STATUS_LABELS, ProposalStatus } from "@/types/proposals";
import {
  FileText, Plus, Search, Filter, Copy, Link2, Archive,
  Eye, MoreHorizontal, Calendar, DollarSign, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProposalsListPage() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: "",
    client_name: "",
    client_email: "",
  });

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching proposals:", error);
      toast.error("Erro ao carregar propostas");
    } else {
      setProposals((data || []) as Proposal[]);
    }
    setLoading(false);
  };

  const handleCreateProposal = async () => {
    if (!newProposal.title || !newProposal.client_name) {
      toast.error("Título e cliente são obrigatórios");
      return;
    }

    const { data, error } = await supabase
      .from('proposals')
      .insert([{
        title: newProposal.title,
        client_name: newProposal.client_name,
        client_email: newProposal.client_email || null,
        status: 'draft',
        total_value: 0,
      }])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar proposta");
      return;
    }

    toast.success("Proposta criada!");
    setShowNewModal(false);
    setNewProposal({ title: "", client_name: "", client_email: "" });
    navigate(`/propostas/${data.id}`);
  };

  const handleDuplicate = async (proposal: Proposal) => {
    const { data, error } = await supabase
      .from('proposals')
      .insert([{
        title: `${proposal.title} (cópia)`,
        client_name: proposal.client_name,
        client_email: proposal.client_email,
        status: 'draft',
        total_value: proposal.total_value,
        notes_internal: proposal.notes_internal,
      }])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao duplicar proposta");
      return;
    }

    toast.success("Proposta duplicada!");
    fetchProposals();
    navigate(`/propostas/${data.id}`);
  };

  const handleNewVersion = async (proposal: Proposal) => {
    const { data, error } = await supabase
      .from('proposals')
      .insert([{
        title: proposal.title,
        client_name: proposal.client_name,
        client_email: proposal.client_email,
        status: 'draft',
        total_value: proposal.total_value,
        notes_internal: proposal.notes_internal,
        version: proposal.version + 1,
      }])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar nova versão");
      return;
    }

    toast.success(`Versão ${proposal.version + 1} criada!`);
    fetchProposals();
    navigate(`/propostas/${data.id}`);
  };

  const handleGenerateLink = async (proposalId: string) => {
    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    
    const { error } = await supabase
      .from('proposal_links')
      .insert([{
        proposal_id: proposalId,
        share_token: token,
        is_active: true,
      }]);

    if (error) {
      toast.error("Erro ao gerar link");
      return;
    }

    const link = `${window.location.origin}/propostas/${proposalId}/client?token=${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                         p.client_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <DashboardLayout title="Propostas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar propostas..."
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
                <SelectItem value="sent">Enviada</SelectItem>
                <SelectItem value="viewed">Visualizada</SelectItem>
                <SelectItem value="approved">Aprovada</SelectItem>
                <SelectItem value="rejected">Recusada</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Proposta
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold text-foreground">{proposals.length}</p>
          </Card>
          <Card className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Aguardando</p>
            <p className="text-2xl font-semibold text-muted-foreground">
              {proposals.filter(p => ['sent', 'viewed'].includes(p.status)).length}
            </p>
          </Card>
          <Card className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Aprovadas</p>
            <p className="text-2xl font-semibold text-primary">
              {proposals.filter(p => p.status === 'approved').length}
            </p>
          </Card>
          <Card className="glass-card p-4">
            <p className="text-xs text-muted-foreground">Valor Total Aprovado</p>
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(proposals.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.total_value, 0))}
            </p>
          </Card>
        </div>

        {/* Table */}
        <Card className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proposta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Atualização</TableHead>
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
              ) : filteredProposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma proposta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredProposals.map((proposal) => (
                  <TableRow 
                    key={proposal.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/propostas/${proposal.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{proposal.title}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{proposal.client_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">
                          {formatCurrency(proposal.total_value)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", STATUS_LABELS[proposal.status as ProposalStatus].color)}>
                        {STATUS_LABELS[proposal.status as ProposalStatus].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">v{proposal.version}</Badge>
                    </TableCell>
                    <TableCell>
                      {proposal.valid_until ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(proposal.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(proposal.updated_at), 'dd/MM HH:mm', { locale: ptBR })}
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
                          <DropdownMenuItem onClick={() => navigate(`/propostas/${proposal.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Abrir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/propostas/${proposal.id}/preview`)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDuplicate(proposal)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleNewVersion(proposal)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Versão
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateLink(proposal.id)}>
                            <Link2 className="w-4 h-4 mr-2" />
                            Gerar Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-muted-foreground">
                            <Archive className="w-4 h-4 mr-2" />
                            Arquivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* New Proposal Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Proposta</DialogTitle>
            <DialogDescription>
              Crie uma nova proposta comercial
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título da Proposta *</Label>
              <Input
                placeholder="Ex: Vídeo Institucional - Empresa XYZ"
                value={newProposal.title}
                onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do Cliente *</Label>
              <Input
                placeholder="Ex: João Silva"
                value={newProposal.client_name}
                onChange={(e) => setNewProposal({ ...newProposal, client_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail do Cliente</Label>
              <Input
                type="email"
                placeholder="cliente@email.com"
                value={newProposal.client_email}
                onChange={(e) => setNewProposal({ ...newProposal, client_email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProposal}>
              Criar Proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
