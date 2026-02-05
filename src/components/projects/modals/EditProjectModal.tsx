import { useState, useEffect } from "react";
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

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function EditProjectModal({ open, onOpenChange, project }: EditProjectModalProps) {
  const { updateProject } = useProjectsStore();
  
  const [formData, setFormData] = useState({
    title: project.title,
    clientId: project.clientId,
    template: project.template,
    startDate: new Date(project.startDate).toISOString().split('T')[0],
    estimatedDelivery: new Date(project.estimatedDelivery).toISOString().split('T')[0],
    ownerId: project.owner.id,
    contractValue: project.contractValue.toString(),
    blockPaymentEnabled: project.blockPaymentEnabled,
  });

  useEffect(() => {
    setFormData({
      title: project.title,
      clientId: project.clientId,
      template: project.template,
      startDate: new Date(project.startDate).toISOString().split('T')[0],
      estimatedDelivery: new Date(project.estimatedDelivery).toISOString().split('T')[0],
      ownerId: project.owner.id,
      contractValue: project.contractValue.toString(),
      blockPaymentEnabled: project.blockPaymentEnabled,
    });
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const owner = TEAM_MEMBERS.find(m => m.id === formData.ownerId) || project.owner;
    const client = CLIENTS.find(c => c.id === formData.clientId) || project.client;
    
    updateProject(project.id, {
      title: formData.title,
      clientId: formData.clientId,
      client,
      template: formData.template as ProjectTemplate,
      startDate: new Date(formData.startDate).toISOString(),
      estimatedDelivery: new Date(formData.estimatedDelivery).toISOString(),
      owner,
      contractValue: parseFloat(formData.contractValue) || 0,
      blockPaymentEnabled: formData.blockPaymentEnabled,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
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

          {/* Template (Read-only for existing projects) */}
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={formData.template} disabled>
              <SelectTrigger className="opacity-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Template não pode ser alterado após criação</p>
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
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
