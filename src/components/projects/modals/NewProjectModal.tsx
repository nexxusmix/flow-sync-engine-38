import { useState } from "react";
import { useProjects, CreateProjectInput } from "@/hooks/useProjects";
import { PROJECT_TEMPLATES } from "@/data/projectTemplates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wand2 } from "lucide-react";

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProjectModal({ open, onOpenChange }: NewProjectModalProps) {
  const { createProject, isCreating } = useProjects();
  
  const [formData, setFormData] = useState<{
    name: string;
    client_name: string;
    description: string;
    template: string;
    start_date: string;
    due_date: string;
    contract_value: string;
    has_payment_block: boolean;
  }>({
    name: "",
    client_name: "",
    description: "",
    template: "",
    start_date: new Date().toISOString().split('T')[0],
    due_date: "",
    contract_value: "",
    has_payment_block: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      client_name: "",
      description: "",
      template: "",
      start_date: new Date().toISOString().split('T')[0],
      due_date: "",
      contract_value: "",
      has_payment_block: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.client_name) {
      return;
    }

    const projectData: CreateProjectInput = {
      name: formData.name,
      client_name: formData.client_name,
      description: formData.description || undefined,
      template: formData.template || undefined,
      start_date: formData.start_date || undefined,
      due_date: formData.due_date || undefined,
      contract_value: formData.contract_value ? parseFloat(formData.contract_value) : undefined,
      has_payment_block: formData.has_payment_block,
    };

    createProject(projectData);
    resetForm();
    onOpenChange(false);
  };

  const handleTemplateChange = (value: string) => {
    const template = PROJECT_TEMPLATES.find(t => t.id === value);
    setFormData(prev => ({
      ...prev,
      template: value,
      due_date: template 
        ? new Date(Date.now() + template.defaultSLADays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : prev.due_date,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Novo Projeto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Campanha Institucional 2025"
              required
            />
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label htmlFor="client_name">Nome do Cliente *</Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="Ex: Empresa ABC"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o escopo do projeto..."
              rows={3}
            />
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label>Template do Projeto</Label>
            <Select value={formData.template} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.defaultSLADays} dias)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Entrega Estimada</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          {/* Contract Value */}
          <div className="space-y-2">
            <Label htmlFor="contract_value">Valor do Contrato (R$)</Label>
            <Input
              id="contract_value"
              type="number"
              value={formData.contract_value}
              onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
              placeholder="0"
            />
          </div>

          {/* Block Payment Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label>Bloquear entrega se inadimplente</Label>
              <p className="text-xs text-muted-foreground">
                Impede entrega final se houver fatura em atraso
              </p>
            </div>
            <Switch
              checked={formData.has_payment_block}
              onCheckedChange={(checked) => setFormData({ ...formData, has_payment_block: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Criando...' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
