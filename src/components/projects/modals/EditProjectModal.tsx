import { useState, useEffect } from "react";
import { useProjects, ProjectWithStages, DBProject } from "@/hooks/useProjects";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { ProjectLogoUpload } from "@/components/projects/ProjectLogoUpload";
import { BANNER_STYLES } from "@/data/bannerStyles";
import { Wand2, Loader2, ImagePlus } from "lucide-react";

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithStages;
}

export function EditProjectModal({ open, onOpenChange, project }: EditProjectModalProps) {
  const { updateProject } = useProjects();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: project.name,
    client_name: project.client_name || '',
    brand_name: (project as any).brand_name || '',
    template: project.template || '',
    start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
    due_date: project.due_date ? new Date(project.due_date).toISOString().split('T')[0] : '',
    contract_value: (project.contract_value || 0).toString(),
    has_payment_block: project.has_payment_block || false,
    logo_url: (project as any).logo_url || null,
    banner_url: (project as any).banner_url || null,
  });
  
  const [bannerStyle, setBannerStyle] = useState('texture_pattern');
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);

  useEffect(() => {
    setFormData({
      name: project.name,
      client_name: project.client_name || '',
      brand_name: (project as any).brand_name || '',
      template: project.template || '',
      start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
      due_date: project.due_date ? new Date(project.due_date).toISOString().split('T')[0] : '',
      contract_value: (project.contract_value || 0).toString(),
      has_payment_block: project.has_payment_block || false,
      logo_url: (project as any).logo_url || null,
      banner_url: (project as any).banner_url || null,
    });
  }, [project]);

  const handleGenerateBanner = async () => {
    setIsGeneratingBanner(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-project-art', {
        body: {
          project_id: project.id,
          art_type: 'banner',
          style: bannerStyle,
        },
      });

      if (error) throw error;

      if (data?.public_url) {
        setFormData(prev => ({ ...prev, banner_url: data.public_url }));
        queryClient.invalidateQueries({ queryKey: ['project', project.id] });
        toast.success('Banner gerado com sucesso!');
      }
    } catch (error) {
      console.error('Error generating banner:', error);
      toast.error('Erro ao gerar banner com IA');
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateProject({
      id: project.id,
      data: {
        name: formData.name,
        client_name: formData.client_name || null,
        brand_name: (formData.brand_name || null) as any,
        template: formData.template || null,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
        contract_value: parseFloat(formData.contract_value) || 0,
        has_payment_block: formData.has_payment_block,
        logo_url: formData.logo_url,
        banner_url: formData.banner_url,
      } as any,
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
          {/* Banner com Geração IA */}
          <div className="space-y-3">
            <Label>Banner do Projeto</Label>
            
            {/* Preview do Banner */}
            <div className="aspect-[8/1] bg-muted/30 rounded-xl overflow-hidden border border-dashed border-border">
              {formData.banner_url ? (
                <img 
                  src={formData.banner_url} 
                  alt="Banner" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                  <ImagePlus className="w-4 h-4" />
                  <span className="text-xs">Sem banner</span>
                </div>
              )}
            </div>
            
            {/* Seletor de Estilo + Botão Gerar */}
            <div className="flex gap-2">
              <Select value={bannerStyle} onValueChange={setBannerStyle}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Estilo do banner" />
                </SelectTrigger>
                <SelectContent>
                  {BANNER_STYLES.map(style => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleGenerateBanner}
                disabled={isGeneratingBanner}
                className="gap-2"
              >
                {isGeneratingBanner ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Gerar com IA
              </Button>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo do Projeto</Label>
            <ProjectLogoUpload
              projectId={project.id}
              currentLogoUrl={formData.logo_url}
              onUpload={(url) => setFormData({ ...formData, logo_url: url })}
            />
          </div>

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

          {/* Brand Name */}
          <div className="space-y-2">
            <Label htmlFor="brand_name">Nome da Marca do Cliente</Label>
            <Input
              id="brand_name"
              value={formData.brand_name}
              onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
              placeholder="Ex: Nike, Apple, Coca-Cola..."
            />
            <p className="text-xs text-muted-foreground">
              Usado como âncora para detecção automática de paleta — a IA prioriza assets com esta marca
            </p>
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
