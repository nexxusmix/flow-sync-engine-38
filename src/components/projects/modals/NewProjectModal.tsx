import { useState } from "react";
import { useProjectsStore } from "@/stores/projectsStore";
import { Project, ProjectTemplate } from "@/types/projects";
import { PROJECT_TEMPLATES } from "@/data/projectTemplates";
import { CLIENTS, TEAM_MEMBERS } from "@/data/projectsMockData";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProjectModal({ open, onOpenChange }: NewProjectModalProps) {
  const { addProject } = useProjectsStore();
  
  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    template: "" as ProjectTemplate | "",
    startDate: new Date().toISOString().split('T')[0],
    estimatedDelivery: "",
    ownerId: TEAM_MEMBERS[0].id,
    contractValue: "",
    blockPaymentEnabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.clientId || !formData.template) {
      return;
    }

    const owner = TEAM_MEMBERS.find(m => m.id === formData.ownerId) || TEAM_MEMBERS[0];
    const template = PROJECT_TEMPLATES.find(t => t.id === formData.template);
    
    addProject({
      title: formData.title,
      clientId: formData.clientId,
      template: formData.template as ProjectTemplate,
      startDate: new Date(formData.startDate).toISOString(),
      estimatedDelivery: formData.estimatedDelivery 
        ? new Date(formData.estimatedDelivery).toISOString()
        : new Date(Date.now() + (template?.defaultSLADays || 30) * 24 * 60 * 60 * 1000).toISOString(),
      owner,
      team: [owner],
      contractValue: parseFloat(formData.contractValue) || 0,
      blockPaymentEnabled: formData.blockPaymentEnabled,
    });

    // Reset form
    setFormData({
      title: "",
      clientId: "",
      template: "",
      startDate: new Date().toISOString().split('T')[0],
      estimatedDelivery: "",
      ownerId: TEAM_MEMBERS[0].id,
      contractValue: "",
      blockPaymentEnabled: true,
    });

    onOpenChange(false);
  };

  const handleTemplateChange = (value: string) => {
    const template = PROJECT_TEMPLATES.find(t => t.id === value);
    setFormData(prev => ({
      ...prev,
      template: value as ProjectTemplate,
      estimatedDelivery: template 
        ? new Date(Date.now() + template.defaultSLADays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : prev.estimatedDelivery,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Nome do Projeto *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Campanha Institucional 2025"
              required
            />
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {CLIENTS.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company} - {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label>Template *</Label>
            <Select
              value={formData.template}
              onValueChange={handleTemplateChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o template" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span>{template.name}</span>
                      <span className="text-xs text-muted-foreground">
                        SLA: {template.defaultSLADays} dias • {template.defaultRevisionLimit} revisões
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedDelivery">Entrega Estimada</Label>
              <Input
                id="estimatedDelivery"
                type="date"
                value={formData.estimatedDelivery}
                onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
              />
            </div>
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <Label>Responsável Principal</Label>
            <Select
              value={formData.ownerId}
              onValueChange={(value) => setFormData({ ...formData, ownerId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_MEMBERS.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contract Value */}
          <div className="space-y-2">
            <Label htmlFor="contractValue">Valor do Contrato (R$)</Label>
            <Input
              id="contractValue"
              type="number"
              value={formData.contractValue}
              onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
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
              checked={formData.blockPaymentEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, blockPaymentEnabled: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Projeto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
