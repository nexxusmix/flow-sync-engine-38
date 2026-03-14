import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { ContractTemplate, SERVICE_TYPE_LABELS, ServiceType } from "@/types/contracts";
import {
  FileText, Plus, Edit, Trash2, Star, MoreHorizontal, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DEFAULT_TEMPLATE_BODY = `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS

**CONTRATANTE:** {{contratante_nome}}, inscrito sob CPF/CNPJ nº {{contratante_documento}}, com endereço em {{contratante_endereco}}.

**CONTRATADA:** {{contratada_nome}}, inscrita sob CNPJ nº {{contratada_documento}}.

## CLÁUSULA 1ª – DO OBJETO

O presente contrato tem por objeto a prestação de serviços de {{servico_tipo}}, conforme especificações:

{{servico_descricao}}

## CLÁUSULA 2ª – DOS ENTREGÁVEIS

{{entregaveis}}

## CLÁUSULA 3ª – DO PRAZO

- **Início:** {{prazo_inicio}}
- **Previsão de entrega:** {{prazo_entrega}}

## CLÁUSULA 4ª – DAS REVISÕES

Estão incluídas {{revisoes_incluidas}} rodada(s) de revisão. Revisões adicionais serão cobradas à parte.

## CLÁUSULA 5ª – DO VALOR E PAGAMENTO

**Valor total:** {{valor_total}}

**Forma de pagamento:** {{forma_pagamento}}

## CLÁUSULA 6ª – DO CANCELAMENTO

Em caso de cancelamento por parte do CONTRATANTE, será aplicada multa de {{multa_cancelamento}} sobre o valor total do contrato.

## CLÁUSULA 7ª – DOS DIREITOS AUTORAIS

{{direitos_autorais}}

## CLÁUSULA 8ª – DO USO DE IMAGEM

{{uso_imagem}}

## CLÁUSULA 9ª – DO FORO

Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer dúvidas oriundas do presente instrumento.

---

**Local e Data:** {{local}}, {{data}}

**CONTRATANTE:** ___________________________

**CONTRATADA:** ___________________________
`;

export default function ContractTemplatesPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [form, setForm] = useState({
    name: "",
    service_type: "" as ServiceType | "",
    body: DEFAULT_TEMPLATE_BODY,
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
    } else {
      setTemplates((data || []) as ContractTemplate[]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.body) {
      toast.error("Nome e corpo do template são obrigatórios");
      return;
    }

    // If setting as default, unset others of same service_type
    if (form.is_default && form.service_type) {
      await supabase
        .from('contract_templates')
        .update({ is_default: false })
        .eq('service_type', form.service_type);
    }

    if (editingTemplate) {
      const { error } = await supabase
        .from('contract_templates')
        .update({
          name: form.name,
          service_type: form.service_type || null,
          body: form.body,
          is_active: form.is_active,
          is_default: form.is_default,
        })
        .eq('id', editingTemplate.id);

      if (error) {
        toast.error("Erro ao atualizar template");
        return;
      }
      toast.success("Template atualizado!");
    } else {
      const { error } = await supabase
        .from('contract_templates')
        .insert([{
          name: form.name,
          service_type: form.service_type || null,
          body: form.body,
          is_active: form.is_active,
          is_default: form.is_default,
        }]);

      if (error) {
        toast.error("Erro ao criar template");
        return;
      }
      toast.success("Template criado!");
    }

    setShowModal(false);
    setEditingTemplate(null);
    setForm({ name: "", service_type: "", body: DEFAULT_TEMPLATE_BODY, is_active: true, is_default: false });
    fetchTemplates();
  };

  const handleEdit = (template: ContractTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      service_type: template.service_type || "",
      body: template.body,
      is_active: template.is_active,
      is_default: template.is_default,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('contract_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir template");
      return;
    }
    toast.success("Template excluído!");
    fetchTemplates();
  };

  const handleDuplicate = async (template: ContractTemplate) => {
    const { error } = await supabase
      .from('contract_templates')
      .insert([{
        name: `${template.name} (cópia)`,
        service_type: template.service_type,
        body: template.body,
        is_active: true,
        is_default: false,
      }]);

    if (error) {
      toast.error("Erro ao duplicar template");
      return;
    }
    toast.success("Template duplicado!");
    fetchTemplates();
  };

  const openNew = () => {
    setEditingTemplate(null);
    setForm({ name: "", service_type: "", body: DEFAULT_TEMPLATE_BODY, is_active: true, is_default: false });
    setShowModal(true);
  };

  return (
    <DashboardLayout title="Templates de Contrato">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-foreground">Templates de Contrato</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie modelos de contrato por tipo de serviço
            </p>
          </div>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-muted-foreground col-span-full text-center py-8">Carregando...</p>
          ) : templates.length === 0 ? (
            <Card className="glass-card p-8 col-span-full text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nenhum template criado</p>
              <Button variant="outline" className="mt-4" onClick={openNew}>
                Criar primeiro template
              </Button>
            </Card>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground flex items-center gap-2">
                        {template.name}
                        {template.is_default && (
                          <Star className="w-3 h-3 text-primary fill-primary" />
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {template.service_type && (
                          <Badge variant="outline" className="text-[9px]">
                            {SERVICE_TYPE_LABELS[template.service_type as ServiceType]}
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[9px]",
                            template.is_active ? "text-emerald-500 border-emerald-500" : "text-muted-foreground"
                          )}
                        >
                          {template.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(template.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                  {template.body.substring(0, 150)}...
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  v{template.version}
                </p>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Template Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Template" : "Novo Template"}
            </DialogTitle>
            <DialogDescription>
              Use variáveis como {"{{variavel}}"} que serão preenchidas automaticamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Template *</Label>
                <Input
                  placeholder="Ex: Contrato Filme Institucional"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Serviço</Label>
                <Select 
                  value={form.service_type} 
                  onValueChange={(v) => setForm({ ...form, service_type: v as ServiceType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label>Ativo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={form.is_default}
                  onCheckedChange={(v) => setForm({ ...form, is_default: v })}
                />
                <Label>Padrão para este tipo de serviço</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Corpo do Contrato (Markdown) *</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={20}
                className="font-mono text-sm"
              />
            </div>

            <Card className="p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground font-medium mb-2">Variáveis disponíveis:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'contratante_nome', 'contratante_documento', 'contratante_endereco',
                  'contratada_nome', 'contratada_documento', 'servico_tipo', 'servico_descricao',
                  'entregaveis', 'prazo_inicio', 'prazo_entrega', 'revisoes_incluidas',
                  'valor_total', 'forma_pagamento', 'multa_cancelamento', 'direitos_autorais',
                  'uso_imagem', 'local', 'data'
                ].map((v) => (
                  <Badge key={v} variant="outline" className="text-[9px] font-mono">
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingTemplate ? "Salvar" : "Criar Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
