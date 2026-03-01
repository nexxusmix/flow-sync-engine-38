import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useProspectingStore } from "@/stores/prospectingStore";
import { Cadence, CadenceStep, CHANNELS } from "@/types/prospecting";
import { useProspectAI } from "@/hooks/useProspectAI";
import { 
  Plus, Trash2, GripVertical, Play, Pause, 
  MessageSquare, Sparkles, ChevronDown, ChevronRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";

function CadenceCard({ 
  cadence, 
  onToggleActive,
  onAddStep,
  onDeleteStep,
  onUpdateStepTemplate,
  onEdit,
  onDelete,
}: { 
  cadence: Cadence;
  onToggleActive: () => void;
  onAddStep: (step: Partial<CadenceStep>) => void;
  onDeleteStep: (stepId: string) => void;
  onUpdateStepTemplate: (stepId: string, template: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [generatingStepId, setGeneratingStepId] = useState<string | null>(null);
  const [newStep, setNewStep] = useState({
    day_offset: '0',
    channel: 'whatsapp' as const,
    template: '',
  });

  const { generateMessages, isGenerating: isAIGenerating } = useProspectAI();

  const handleAddStep = () => {
    if (!newStep.template) {
      toast.error('Mensagem é obrigatória');
      return;
    }
    
    onAddStep({
      step_order: (cadence.steps?.length || 0) + 1,
      day_offset: Number(newStep.day_offset),
      channel: newStep.channel,
      template: newStep.template,
    });
    
    setNewStep({ day_offset: '0', channel: 'whatsapp', template: '' });
    setIsAddingStep(false);
  };

  const handleGenerateForStep = async (stepId: string, channel: string) => {
    setGeneratingStepId(stepId);
    const result = await generateMessages(undefined, undefined, {
      goal: 'prospecting',
      channel,
      cadence_name: cadence.name,
      niche: cadence.target_niche || '',
    });
    if (result?.variant_media) {
      onUpdateStepTemplate(stepId, result.variant_media);
      toast.success('Mensagem gerada com IA!');
    }
    setGeneratingStepId(null);
  };

  const handleGenerateForNewStep = async () => {
    const result = await generateMessages(undefined, undefined, {
      goal: 'prospecting',
      channel: newStep.channel,
      cadence_name: cadence.name,
      niche: cadence.target_niche || '',
      day_offset: newStep.day_offset,
    });
    if (result?.variant_media) {
      setNewStep(prev => ({ ...prev, template: result.variant_media }));
      toast.success('Mensagem gerada com IA!');
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-medium text-foreground truncate">{cadence.name}</h3>
                <span className={`text-[9px] px-2 py-0.5 rounded font-medium ${
                  cadence.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {cadence.is_active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              {cadence.target_niche && (
                <p className="text-[10px] text-primary font-medium uppercase tracking-wider mt-1">
                  {cadence.target_niche}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                {cadence.steps?.length || 0} passos • Limite: {cadence.daily_limit}/dia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={cadence.is_active} onCheckedChange={onToggleActive} />
            <Button variant="ghost" size="sm" onClick={onEdit}>Editar</Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-8 w-8 p-0" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-6 pb-6 space-y-4">
            <div className="border-t border-border pt-4">
              <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Passos da Cadência
              </h4>

              {cadence.steps && cadence.steps.length > 0 ? (
                <div className="space-y-3">
                  {cadence.steps
                    .sort((a, b) => a.step_order - b.step_order)
                    .map((step, idx) => (
                      <div 
                        key={step.id} 
                        className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-medium flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-[9px] text-muted-foreground">Dia {step.day_offset}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-muted-foreground capitalize">
                              {CHANNELS.find(c => c.type === step.channel)?.name || step.channel}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{step.template}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs text-primary mt-2 p-0"
                            onClick={() => handleGenerateForStep(step.id, step.channel)}
                            disabled={generatingStepId === step.id}
                          >
                            {generatingStepId === step.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            {generatingStepId === step.id ? 'Gerando...' : '✨ Gerar com IA'}
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteStep(step.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum passo definido
                </p>
              )}

              {isAddingStep ? (
                <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-primary/20 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[10px]">Dia</Label>
                      <Input
                        type="number"
                        min="0"
                        value={newStep.day_offset}
                        onChange={(e) => setNewStep({ ...newStep, day_offset: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Canal</Label>
                      <Select 
                        value={newStep.channel} 
                        onValueChange={(v: any) => setNewStep({ ...newStep, channel: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANNELS.filter(c => c.type !== 'in_person').map((c) => (
                            <SelectItem key={c.type} value={c.type}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px]">Mensagem *</Label>
                    <Textarea
                      value={newStep.template}
                      onChange={(e) => setNewStep({ ...newStep, template: e.target.value })}
                      placeholder="Olá {nome}, tudo bem?..."
                      rows={4}
                    />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={handleGenerateForNewStep} disabled={isAIGenerating}>
                        {isAIGenerating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                        ✨ Gerar com IA
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsAddingStep(false)}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={handleAddStep}>
                        Adicionar Passo
                      </Button>
                    </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setIsAddingStep(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Passo
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default function CadencesPage() {
  const { 
    cadences, 
    fetchCadences, 
    createCadence,
    updateCadence,
    deleteCadence,
    addCadenceStep,
    updateCadenceStep,
    deleteCadenceStep,
  } = useProspectingStore();

  const { planCampaign, isGenerating } = useProspectAI();

  const [isNewCadenceOpen, setIsNewCadenceOpen] = useState(false);
  const [editingCadence, setEditingCadence] = useState<Cadence | null>(null);
  const [newCadence, setNewCadence] = useState({
    name: '',
    description: '',
    target_niche: '',
    daily_limit: '20',
  });

  useEffect(() => {
    fetchCadences();
  }, []);

  const handleCreateCadence = async () => {
    if (!newCadence.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    await createCadence({
      name: newCadence.name,
      description: newCadence.description,
      target_niche: newCadence.target_niche,
      daily_limit: Number(newCadence.daily_limit) || 20,
    });

    setNewCadence({ name: '', description: '', target_niche: '', daily_limit: '20' });
    setIsNewCadenceOpen(false);
    toast.success('Cadência criada');
  };

  const handleEditCadence = async () => {
    if (!editingCadence || !editingCadence.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    await updateCadence(editingCadence.id, {
      name: editingCadence.name,
      description: editingCadence.description,
      target_niche: editingCadence.target_niche,
      daily_limit: editingCadence.daily_limit,
    });

    setEditingCadence(null);
    toast.success('Cadência atualizada');
  };

  const handleToggleActive = async (cadence: Cadence) => {
    await updateCadence(cadence.id, { is_active: !cadence.is_active });
    toast.success(cadence.is_active ? 'Cadência desativada' : 'Cadência ativada');
  };

  const handleAddStep = async (cadenceId: string, step: Partial<CadenceStep>) => {
    await addCadenceStep(cadenceId, step);
    toast.success('Passo adicionado');
  };

  const handleDeleteStep = async (stepId: string) => {
    await deleteCadenceStep(stepId);
    toast.success('Passo removido');
  };

  const handleUpdateStepTemplate = async (stepId: string, template: string) => {
    await updateCadenceStep(stepId, { template });
  };

  const handleGenerateWithAI = async () => {
    toast.info('Gerando cadência com IA...');
    const result = await planCampaign(undefined, { goal: 'prospecting' });
    
    if (!result) return;

    // Create cadence from AI result
    const newCad = await createCadence({
      name: result.objective || 'Cadência IA',
      description: result.notes || `Canal: ${result.best_channel} • Horário: ${result.best_time}`,
      target_niche: '',
      daily_limit: 20,
    });

    if (newCad && result.cadence_steps) {
      for (const step of result.cadence_steps) {
        await addCadenceStep(newCad.id, {
          step_order: step.day_offset + 1,
          day_offset: step.day_offset,
          channel: step.channel as any,
          template: step.template_hint || step.action,
        });
      }
    }

    toast.success('Cadência gerada com IA!');
  };

  return (
    <DashboardLayout title="Cadências">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Cadências</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {cadences.length} cadências • {cadences.filter(c => c.is_active).length} ativas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateWithAI} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Gerar com IA
            </Button>
            <Button onClick={() => setIsNewCadenceOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Cadência
            </Button>
          </div>
        </div>

        {/* Cadences List */}
        <div className="space-y-4">
          {cadences.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Nenhuma cadência criada</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsNewCadenceOpen(true)}>
                Criar primeira cadência
              </Button>
            </div>
          ) : (
            cadences.map((cadence) => (
              <CadenceCard
                key={cadence.id}
                cadence={cadence}
                onToggleActive={() => handleToggleActive(cadence)}
                onAddStep={(step) => handleAddStep(cadence.id, step)}
                onDeleteStep={handleDeleteStep}
                onUpdateStepTemplate={handleUpdateStepTemplate}
                onEdit={() => setEditingCadence(cadence)}
                onDelete={async () => {
                  await deleteCadence(cadence.id);
                  toast.success('Cadência excluída');
                }}
              />
            ))
          )}
        </div>

        {/* New Cadence Dialog */}
        <Dialog open={isNewCadenceOpen} onOpenChange={setIsNewCadenceOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Cadência</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={newCadence.name}
                  onChange={(e) => setNewCadence({ ...newCadence, name: e.target.value })}
                  placeholder="Ex: Prospecção Incorporadoras"
                />
              </div>
              <div>
                <Label>Nicho Alvo</Label>
                <Input
                  value={newCadence.target_niche}
                  onChange={(e) => setNewCadence({ ...newCadence, target_niche: e.target.value })}
                  placeholder="Ex: Incorporadoras"
                />
              </div>
              <div>
                <Label>Limite Diário</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={newCadence.daily_limit}
                  onChange={(e) => setNewCadence({ ...newCadence, daily_limit: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={newCadence.description}
                  onChange={(e) => setNewCadence({ ...newCadence, description: e.target.value })}
                  placeholder="Descreva o objetivo desta cadência..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewCadenceOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateCadence}>Criar Cadência</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Cadence Dialog */}
        <Dialog open={!!editingCadence} onOpenChange={(open) => { if (!open) setEditingCadence(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cadência</DialogTitle>
            </DialogHeader>
            {editingCadence && (
              <>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Nome *</Label>
                    <Input
                      value={editingCadence.name}
                      onChange={(e) => setEditingCadence({ ...editingCadence, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Nicho Alvo</Label>
                    <Input
                      value={editingCadence.target_niche || ''}
                      onChange={(e) => setEditingCadence({ ...editingCadence, target_niche: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Limite Diário</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={editingCadence.daily_limit || 20}
                      onChange={(e) => setEditingCadence({ ...editingCadence, daily_limit: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={editingCadence.description || ''}
                      onChange={(e) => setEditingCadence({ ...editingCadence, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingCadence(null)}>Cancelar</Button>
                  <Button onClick={handleEditCadence}>Salvar</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
