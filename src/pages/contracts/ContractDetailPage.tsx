import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Contract, ContractTemplate, ContractVersion, ContractAddendum, ContractSignature,
  STATUS_CONFIG, SERVICE_TYPE_LABELS, RENEWAL_TYPE_LABELS, DEFAULT_CONTRACT_VARIABLES,
  ContractStatus, ServiceType, RenewalType
} from "@/types/contracts";
import {
  FileSignature, Save, Eye, Link2, Plus, ArrowLeft, History, FileText,
  Users, Calendar, DollarSign, AlertTriangle, Check, Upload, Banknote, Loader2, ScanLine,
  MoreVertical, Trash2, Archive, XCircle, CheckCircle2, Ban
} from "lucide-react";
import { SignatureScanPanel } from "@/components/contracts/SignatureScanPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ContractDetailPage() {
  const { contractId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get('tab') || 'variables';

  const [contract, setContract] = useState<Contract | null>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [addendums, setAddendums] = useState<ContractAddendum[]>([]);
  const [signatures, setSignatures] = useState<ContractSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractRevenues, setContractRevenues] = useState<any[]>([]);
  const [generatingMilestones, setGeneratingMilestones] = useState(false);

  const [variables, setVariables] = useState(DEFAULT_CONTRACT_VARIABLES);
  const [showAddendumModal, setShowAddendumModal] = useState(false);
  const [newAddendum, setNewAddendum] = useState({ title: "", body: "" });
  const [confirmAction, setConfirmAction] = useState<{ type: ContractStatus | 'delete'; label: string; description: string } | null>(null);

  const handleContractAction = async (action: ContractStatus | 'delete') => {
    if (!contract) return;

    if (action === 'delete') {
      // Delete contract and related data
      await supabase.from('contract_versions').delete().eq('contract_id', contract.id);
      await supabase.from('contract_addendums').delete().eq('contract_id', contract.id);
      await supabase.from('contract_links').delete().eq('contract_id', contract.id);
      await supabase.from('contract_signatures').delete().eq('contract_id', contract.id);
      await supabase.from('contract_alerts').delete().eq('contract_id', contract.id);
      const { error } = await supabase.from('contracts').delete().eq('id', contract.id);
      if (error) {
        toast.error("Erro ao excluir contrato");
        return;
      }
      toast.success("Contrato excluído");
      navigate('/contratos');
      return;
    }

    const { error } = await supabase
      .from('contracts')
      .update({ status: action, updated_at: new Date().toISOString() })
      .eq('id', contract.id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    const labels: Record<string, string> = {
      completed: 'concluído', cancelled: 'cancelado', terminated: 'encerrado', archived: 'arquivado',
    };
    toast.success(`Contrato ${labels[action] || action}!`);
    setConfirmAction(null);
    fetchContract();
  };

  useEffect(() => {
    if (contractId) {
      fetchContract();
      fetchTemplates();
      fetchContractRevenues();
    }
  }, [contractId]);

  const fetchContractRevenues = async () => {
    if (!contractId) return;
    const { data } = await supabase
      .from('revenues')
      .select('*')
      .eq('contract_id', contractId)
      .order('due_date');
    setContractRevenues(data || []);
  };

  const handleGenerateMilestones = async () => {
    if (!contract) return;
    setGeneratingMilestones(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-contract-milestones`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ contractId: contract.id }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Erro ao gerar parcelas');
        return;
      }
      if (result.created_count > 0) {
        toast.success(`${result.created_count} parcela(s) gerada(s) com sucesso!`);
      } else if (result.existing_count > 0) {
        toast.info('Parcelas já existem para este contrato');
      }
      fetchContractRevenues();
    } catch (error) {
      toast.error('Erro ao gerar parcelas');
    } finally {
      setGeneratingMilestones(false);
    }
  };

  const fetchContract = async () => {
    setLoading(true);

    const { data: contractData, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (error || !contractData) {
      toast.error("Contrato não encontrado");
      navigate('/contratos');
      return;
    }

    setContract(contractData as Contract);

    // Load variables from latest version or defaults
    const { data: versionsData } = await supabase
      .from('contract_versions')
      .select('*')
      .eq('contract_id', contractId)
      .order('version', { ascending: false });

    if (versionsData && versionsData.length > 0) {
      setVersions(versionsData as ContractVersion[]);
      const filledVars = versionsData[0].variables_filled as Record<string, unknown> || {};
      setVariables({ ...DEFAULT_CONTRACT_VARIABLES, ...filledVars } as typeof DEFAULT_CONTRACT_VARIABLES);
    } else {
      // Initialize from contract data
      setVariables({
        ...DEFAULT_CONTRACT_VARIABLES,
        contratante_nome: contractData.client_name || '',
        contratante_documento: (contractData as Contract).client_document || '',
        valor_total: contractData.total_value || 0,
        prazo_inicio: contractData.start_date || '',
      });
    }

    // Fetch addendums
    const { data: addendumsData } = await supabase
      .from('contract_addendums')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });

    if (addendumsData) setAddendums(addendumsData as ContractAddendum[]);

    // Fetch signatures
    const { data: signaturesData } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('contract_id', contractId)
      .order('signed_at', { ascending: false });

    if (signaturesData) setSignatures(signaturesData as ContractSignature[]);

    setLoading(false);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (data) setTemplates(data as ContractTemplate[]);
  };

  const handleSave = async () => {
    if (!contract) return;
    setSaving(true);

    try {
      // Update contract
      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          client_name: variables.contratante_nome,
          client_document: variables.contratante_documento,
          total_value: variables.valor_total,
          start_date: variables.prazo_inicio || null,
          end_date: variables.prazo_fim || null,
          renewal_type: contract.renewal_type,
          renewal_notice_days: contract.renewal_notice_days,
          
          updated_at: new Date().toISOString(),
        })
        .eq('id', contract.id);

      if (contractError) throw contractError;

      // Create new version
      const newVersion = (contract.current_version || 0) + 1;
      const selectedTemplate = templates.find(t => t.id === contract.template_id);
      let renderedBody = selectedTemplate?.body || '';

      // Replace variables in body
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        renderedBody = renderedBody.replace(regex, String(value));
      });

      const { error: versionError } = await supabase
        .from('contract_versions')
        .insert([{
          contract_id: contract.id,
          version: newVersion,
          body_rendered: renderedBody,
          variables_filled: variables,
        }]);

      if (versionError) throw versionError;

      // Update contract version number
      await supabase
        .from('contracts')
        .update({ current_version: newVersion })
        .eq('id', contract.id);

      toast.success(`Contrato salvo! Versão ${newVersion}`);
      fetchContract();
    } catch (error) {
      console.error("Error saving contract:", error);
      toast.error("Erro ao salvar contrato");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template || !contract) return;

    await supabase
      .from('contracts')
      .update({ template_id: templateId })
      .eq('id', contract.id);

    setContract({ ...contract, template_id: templateId });
    toast.success(`Template "${template.name}" aplicado`);
  };

  const handleGenerateLink = async () => {
    if (!contract) return;

    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 20);

    const { error } = await supabase
      .from('contract_links')
      .insert([{
        contract_id: contract.id,
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
      .eq('id', contract.id);

    const link = `${window.location.origin}/contratos/${contract.id}/client?token=${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado! Status alterado para 'Enviado'");
    fetchContract();
  };

  const handleCreateAddendum = async () => {
    if (!newAddendum.title || !contract) {
      toast.error("Título é obrigatório");
      return;
    }

    const { error } = await supabase
      .from('contract_addendums')
      .insert([{
        contract_id: contract.id,
        title: newAddendum.title,
        body: newAddendum.body,
        status: 'draft',
      }]);

    if (error) {
      toast.error("Erro ao criar aditivo");
      return;
    }

    toast.success("Aditivo criado!");
    setShowAddendumModal(false);
    setNewAddendum({ title: "", body: "" });
    fetchContract();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading || !contract) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando contrato...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isLocked = contract.status === 'signed';

  return (
    <DashboardLayout title={contract.project_name || "Contrato"}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/contratos')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Badge className={cn("text-xs", STATUS_CONFIG[contract.status as ContractStatus]?.color)}>
              {STATUS_CONFIG[contract.status as ContractStatus]?.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              v{contract.current_version || 1}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/contratos/${contractId}/preview`)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerateLink} disabled={isLocked}>
              <Link2 className="w-4 h-4 mr-2" />
              Gerar Link
            </Button>
            <Button onClick={handleSave} disabled={saving || isLocked}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {contract.status !== 'completed' && contract.status !== 'cancelled' && contract.status !== 'archived' && (
                  <DropdownMenuItem
                    onClick={() => setConfirmAction({
                      type: 'completed',
                      label: 'Concluir Contrato',
                      description: 'O contrato será marcado como concluído. Essa ação pode ser revertida.'
                    })}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                    Concluir
                  </DropdownMenuItem>
                )}
                {contract.status !== 'terminated' && contract.status !== 'cancelled' && contract.status !== 'archived' && (
                  <DropdownMenuItem
                    onClick={() => setConfirmAction({
                      type: 'terminated',
                      label: 'Encerrar Contrato',
                      description: 'O contrato será encerrado antecipadamente. Parcelas pendentes não serão afetadas.'
                    })}
                  >
                    <Ban className="w-4 h-4 mr-2 text-muted-foreground" />
                    Encerrar
                  </DropdownMenuItem>
                )}
                {contract.status !== 'cancelled' && contract.status !== 'archived' && (
                  <DropdownMenuItem
                    onClick={() => setConfirmAction({
                      type: 'cancelled',
                      label: 'Cancelar Contrato',
                      description: 'O contrato será cancelado. Essa ação pode ser revertida.'
                    })}
                  >
                    <XCircle className="w-4 h-4 mr-2 text-red-500" />
                    Cancelar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setConfirmAction({
                    type: 'archived',
                    label: 'Arquivar Contrato',
                    description: 'O contrato será arquivado e não aparecerá mais na listagem principal.'
                  })}
                >
                  <Archive className="w-4 h-4 mr-2 text-slate-500" />
                  Arquivar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmAction({
                    type: 'delete',
                    label: 'Excluir Contrato',
                    description: 'O contrato e todos os dados relacionados (versões, aditivos, assinaturas) serão excluídos permanentemente. Essa ação NÃO pode ser desfeita.'
                  })}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isLocked && (
          <Card className="p-4 bg-amber-500/10 border-amber-500/30">
            <p className="text-amber-500 text-sm">
              Este contrato foi assinado e não pode ser editado. Crie um aditivo para alterações.
            </p>
          </Card>
        )}

        {/* Milestones / Parcelas Financeiras */}
        {isLocked && (
          <Card className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Banknote className="w-4 h-4 text-primary" />
                Parcelas Financeiras
              </h3>
              {contractRevenues.length === 0 ? (
                <Button
                  size="sm"
                  onClick={handleGenerateMilestones}
                  disabled={generatingMilestones}
                >
                  {generatingMilestones ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Gerar parcelas do contrato
                </Button>
              ) : (
                <Badge variant="outline" className="text-xs">
                  {contractRevenues.length} parcela(s) gerada(s)
                </Badge>
              )}
            </div>
            {contractRevenues.length > 0 ? (
              <div className="space-y-2">
                {contractRevenues.map((rev, idx) => (
                  <div
                    key={rev.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{rev.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Vencimento: {new Date(rev.due_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rev.amount)}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", rev.status === 'received' ? 'text-emerald-500 border-emerald-500' : 'text-amber-500 border-amber-500')}
                      >
                        {rev.status === 'received' ? 'Recebido' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma parcela gerada. Clique no botão acima para gerar automaticamente.
              </p>
            )}
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="variables">Variáveis</TabsTrigger>
            <TabsTrigger value="versions">Versões ({versions.length})</TabsTrigger>
            <TabsTrigger value="addendums">Aditivos ({addendums.length})</TabsTrigger>
            <TabsTrigger value="signatures">Assinatura</TabsTrigger>
          </TabsList>

          <TabsContent value="variables" className="space-y-4">
            <div className="grid grid-cols-3 gap-6">
              {/* Variables Form */}
              <div className="col-span-2 space-y-4">
                {/* Template Selection */}
                <Card className="glass-card p-4">
                  <Label className="text-sm font-medium mb-3 block">Template</Label>
                  <Select 
                    value={contract.template_id || ""} 
                    onValueChange={handleApplyTemplate}
                    disabled={isLocked}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} {t.service_type && `(${SERVICE_TYPE_LABELS[t.service_type as ServiceType]})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>

                {/* Parties */}
                <Card className="glass-card p-4">
                  <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Partes
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Nome do Contratante</Label>
                      <Input
                        value={variables.contratante_nome}
                        onChange={(e) => setVariables({ ...variables, contratante_nome: e.target.value })}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">CPF/CNPJ</Label>
                      <Input
                        value={variables.contratante_documento}
                        onChange={(e) => setVariables({ ...variables, contratante_documento: e.target.value })}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs">Endereço</Label>
                      <Input
                        value={variables.contratante_endereco}
                        onChange={(e) => setVariables({ ...variables, contratante_endereco: e.target.value })}
                        disabled={isLocked}
                      />
                    </div>
                  </div>
                </Card>

                {/* Service */}
                <Card className="glass-card p-4">
                  <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Serviço
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Tipo de Serviço</Label>
                      <Input
                        value={variables.servico_tipo}
                        onChange={(e) => setVariables({ ...variables, servico_tipo: e.target.value })}
                        placeholder="Ex: Produção de vídeo institucional"
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Descrição do Serviço</Label>
                      <Textarea
                        value={variables.servico_descricao}
                        onChange={(e) => setVariables({ ...variables, servico_descricao: e.target.value })}
                        rows={3}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Entregáveis</Label>
                      <Textarea
                        value={Array.isArray(variables.entregaveis) ? variables.entregaveis.join('\n') : ''}
                        onChange={(e) => setVariables({ ...variables, entregaveis: e.target.value.split('\n').filter(Boolean) })}
                        placeholder="Um entregável por linha"
                        rows={4}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Revisões Incluídas</Label>
                        <Input
                          type="number"
                          value={variables.revisoes_incluidas}
                          onChange={(e) => setVariables({ ...variables, revisoes_incluidas: parseInt(e.target.value) || 0 })}
                          disabled={isLocked}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Local de Captação</Label>
                        <Input
                          value={variables.local_captacao}
                          onChange={(e) => setVariables({ ...variables, local_captacao: e.target.value })}
                          disabled={isLocked}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Dates */}
                <Card className="glass-card p-4">
                  <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Prazos
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Início</Label>
                      <Input
                        type="date"
                        value={variables.prazo_inicio}
                        onChange={(e) => setVariables({ ...variables, prazo_inicio: e.target.value })}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Fim</Label>
                      <Input
                        type="date"
                        value={variables.prazo_fim}
                        onChange={(e) => setVariables({ ...variables, prazo_fim: e.target.value })}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Entrega</Label>
                      <Input
                        type="date"
                        value={variables.prazo_entrega}
                        onChange={(e) => setVariables({ ...variables, prazo_entrega: e.target.value })}
                        disabled={isLocked}
                      />
                    </div>
                  </div>
                </Card>

                {/* Financial */}
                <Card className="glass-card p-4">
                  <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Financeiro
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Valor Total</Label>
                      <Input
                        type="number"
                        value={variables.valor_total}
                        onChange={(e) => setVariables({ ...variables, valor_total: parseFloat(e.target.value) || 0 })}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Multa Cancelamento</Label>
                      <Input
                        value={variables.multa_cancelamento}
                        onChange={(e) => setVariables({ ...variables, multa_cancelamento: e.target.value })}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs">Forma de Pagamento</Label>
                      <Textarea
                        value={variables.forma_pagamento}
                        onChange={(e) => setVariables({ ...variables, forma_pagamento: e.target.value })}
                        placeholder="Ex: 40% na assinatura, 40% na entrega parcial, 20% na entrega final"
                        rows={2}
                        disabled={isLocked}
                      />
                    </div>
                  </div>
                </Card>

                {/* Legal */}
                <Card className="glass-card p-4">
                  <h3 className="font-medium text-foreground mb-4">Cláusulas Legais</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Direitos Autorais</Label>
                      <Textarea
                        value={variables.direitos_autorais}
                        onChange={(e) => setVariables({ ...variables, direitos_autorais: e.target.value })}
                        rows={2}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Uso de Imagem</Label>
                      <Textarea
                        value={variables.uso_imagem}
                        onChange={(e) => setVariables({ ...variables, uso_imagem: e.target.value })}
                        rows={2}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">SLA de Atendimento</Label>
                      <Input
                        value={variables.sla_atendimento}
                        onChange={(e) => setVariables({ ...variables, sla_atendimento: e.target.value })}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={variables.confidencialidade}
                        onCheckedChange={(v) => setVariables({ ...variables, confidencialidade: v })}
                        disabled={isLocked}
                      />
                      <Label className="text-xs">Incluir cláusula de confidencialidade (NDA)</Label>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <Card className="glass-card p-4">
                  <h3 className="font-medium text-foreground mb-3">Renovação</h3>
                  <div className="space-y-4">
                    <Select
                      value={contract.renewal_type || "none"}
                      onValueChange={(v) => setContract({ ...contract, renewal_type: v as RenewalType })}
                      disabled={isLocked}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RENEWAL_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {contract.renewal_type !== 'none' && (
                      <div className="space-y-2">
                        <Label className="text-xs">Aviso prévio (dias)</Label>
                        <Input
                          type="number"
                          value={contract.renewal_notice_days}
                          onChange={(e) => setContract({ ...contract, renewal_notice_days: parseInt(e.target.value) || 30 })}
                          disabled={isLocked}
                        />
                      </div>
                    )}
                  </div>
                </Card>


                <Card className="glass-card p-4">
                  <h3 className="font-medium text-foreground mb-3">Resumo</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="font-medium text-foreground">{formatCurrency(variables.valor_total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revisões:</span>
                      <span className="text-foreground">{variables.revisoes_incluidas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Versão:</span>
                      <span className="text-foreground">v{contract.current_version || 1}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="versions" className="space-y-4">
            <Card className="glass-card p-4">
              <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <History className="w-4 h-4" />
                Histórico de Versões
              </h3>
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma versão salva ainda. Salve o contrato para criar a primeira versão.
                </p>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div 
                      key={version.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="font-medium text-foreground">Versão {version.version}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(version.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="addendums" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">Aditivos</h3>
              <Button size="sm" onClick={() => setShowAddendumModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Aditivo
              </Button>
            </div>
            {addendums.length === 0 ? (
              <Card className="glass-card p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhum aditivo</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {addendums.map((addendum) => (
                  <Card key={addendum.id} className="glass-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{addendum.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Criado em {format(new Date(addendum.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {addendum.status === 'signed' ? 'Assinado' : addendum.status === 'sent' ? 'Enviado' : 'Rascunho'}
                      </Badge>
                    </div>
                    {addendum.body && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{addendum.body}</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="signatures" className="space-y-4">
            <Card className="glass-card p-4">
              <h3 className="font-medium text-foreground mb-4">Assinaturas</h3>
              {signatures.length === 0 ? (
                <div className="text-center py-8">
                  <FileSignature className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma assinatura registrada</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Envie o link para o cliente assinar via gov.br
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {signatures.map((sig) => (
                    <div key={sig.id} className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium text-emerald-500">Assinado</span>
                        </div>
                        {(sig as any).provider === 'govbr' && (
                          <Badge className="bg-emerald-500/20 text-emerald-500 text-xs">
                            gov.br (ICP-Brasil)
                          </Badge>
                        )}
                        {(sig as any).provider === 'internal' && (
                          <Badge variant="outline" className="text-xs">
                            Upload Manual
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs">Nome:</span>
                          <p className="text-foreground">{sig.signer_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">E-mail:</span>
                          <p className="text-foreground">{sig.signer_email}</p>
                        </div>
                        {(sig as any).signer_cpf && (
                          <div>
                            <span className="text-muted-foreground text-xs">CPF:</span>
                            <p className="text-foreground">{(sig as any).signer_cpf}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground text-xs">Data/Hora:</span>
                          <p className="text-foreground">
                            {format(new Date(sig.signed_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      {(sig as any).document_hash && (
                        <div className="mt-3 pt-3 border-t border-emerald-500/20">
                          <span className="text-muted-foreground text-xs">Hash SHA-256:</span>
                          <p className="text-foreground font-mono text-xs break-all mt-1">
                            {(sig as any).document_hash}
                          </p>
                        </div>
                      )}

                      {sig.signature_type === 'upload_signed_pdf' && sig.signed_file_url && (
                        <Button variant="outline" size="sm" className="mt-3" asChild>
                          <a href={sig.signed_file_url} target="_blank" rel="noopener noreferrer">
                            Ver PDF assinado
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Signature Scan Panel */}
            <Card className="glass-card p-5">
              <div className="flex items-center gap-2 mb-5">
                <ScanLine className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-medium text-foreground">Validação Visual com IA</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Faça upload do PDF ou imagem assinados — a IA detecta assinaturas, carimbos e selos automaticamente
                  </p>
                </div>
              </div>
              <SignatureScanPanel
                contractId={contract.id}
                contractStatus={contract.status}
                clientName={contract.client_name}
                clientEmail={contract.client_email}
                onSigned={fetchContract}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Addendum Modal */}
      <Dialog open={showAddendumModal} onOpenChange={setShowAddendumModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Aditivo</DialogTitle>
            <DialogDescription>
              Aditivos permitem alterar termos do contrato sem criar uma nova versão completa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Aditivo de prazo"
                value={newAddendum.title}
                onChange={(e) => setNewAddendum({ ...newAddendum, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Corpo do Aditivo</Label>
              <Textarea
                value={newAddendum.body}
                onChange={(e) => setNewAddendum({ ...newAddendum, body: e.target.value })}
                rows={6}
                placeholder="Descreva as alterações..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddendumModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAddendum}>
              Criar Aditivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.label}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.type === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={() => confirmAction && handleContractAction(confirmAction.type)}
            >
              {confirmAction?.type === 'delete' ? 'Excluir permanentemente' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
