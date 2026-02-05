import { useState, useEffect } from "react";
import { useProjects, ProjectWithStages, DBProject } from "@/hooks/useProjects";
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
  project: ProjectWithStages;
}

export function EditProjectModal({ open, onOpenChange, project }: EditProjectModalProps) {
  const { updateProject } = useProjects();
  
  const [formData, setFormData] = useState({
    name: project.name,
    client_name: project.client_name || '',
    template: project.template || '',
    start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
    due_date: project.due_date ? new Date(project.due_date).toISOString().split('T')[0] : '',
    contract_value: (project.contract_value || 0).toString(),
    has_payment_block: project.has_payment_block || false,
  });

  useEffect(() => {
    setFormData({
      name: project.name,
      client_name: project.client_name || '',
      template: project.template || '',
      start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
      due_date: project.due_date ? new Date(project.due_date).toISOString().split('T')[0] : '',
      contract_value: (project.contract_value || 0).toString(),
      has_payment_block: project.has_payment_block || false,
    });
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateProject({
      id: project.id,
      data: {
        name: formData.name,
        client_name: formData.client_name || null,
        template: formData.template || null,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
        contract_value: parseFloat(formData.contract_value) || 0,
        has_payment_block: formData.has_payment_block,
      },
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
            <Label htmlFor="client_name">Nome do Cliente</Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="Ex: Empresa ABC"
            />
          </div>

          {/* Template (Read-only for existing projects) */}
          <div className="space-y-2">
            <Label>Template</Label>
            <Input value={formData.template || 'Não definido'} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Template não pode ser alterado após criação</p>
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
            <Button type="submit">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
