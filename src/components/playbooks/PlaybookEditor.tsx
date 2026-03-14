import { useState, useEffect } from 'react';
import { usePlaybookDetail, useSavePlaybook, PLAYBOOK_CATEGORIES } from '@/hooks/usePlaybooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Loader2, Save, ArrowLeft } from 'lucide-react';

interface PhaseForm {
  title: string;
  description: string;
  steps: StepForm[];
}

interface StepForm {
  title: string;
  description: string;
  step_type: string;
  is_required: boolean;
  assigned_role: string;
  relative_day_offset: number;
}

interface Props {
  playbookId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

const emptyStep = (): StepForm => ({ title: '', description: '', step_type: 'task', is_required: true, assigned_role: '', relative_day_offset: 0 });
const emptyPhase = (): PhaseForm => ({ title: '', description: '', steps: [emptyStep()] });

export function PlaybookEditor({ playbookId, onSaved, onCancel }: Props) {
  const { data: existing, isLoading: loadingDetail } = usePlaybookDetail(playbookId || undefined);
  const savePb = useSavePlaybook();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [category, setCategory] = useState('operacao');
  const [status, setStatus] = useState('draft');
  const [whenToUse, setWhenToUse] = useState('');
  const [tags, setTags] = useState('');
  const [phases, setPhases] = useState<PhaseForm[]>([emptyPhase()]);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description || '');
      setObjective(existing.objective || '');
      setCategory(existing.category);
      setStatus(existing.status);
      setWhenToUse(existing.when_to_use || '');
      setTags((existing.tags || []).join(', '));
      if (existing.phases && existing.phases.length > 0) {
        setPhases(existing.phases.map(ph => ({
          title: ph.title,
          description: ph.description || '',
          steps: (ph.steps || []).map(s => ({
            title: s.title,
            description: s.description || '',
            step_type: s.step_type,
            is_required: s.is_required,
            assigned_role: s.assigned_role || '',
            relative_day_offset: s.relative_day_offset || 0,
          })),
        })));
      }
    }
  }, [existing]);

  const updatePhase = (idx: number, partial: Partial<PhaseForm>) => {
    setPhases(p => p.map((ph, i) => i === idx ? { ...ph, ...partial } : ph));
  };

  const updateStep = (phaseIdx: number, stepIdx: number, partial: Partial<StepForm>) => {
    setPhases(p => p.map((ph, pi) => pi === phaseIdx ? {
      ...ph,
      steps: ph.steps.map((s, si) => si === stepIdx ? { ...s, ...partial } : s),
    } : ph));
  };

  const removePhase = (idx: number) => setPhases(p => p.filter((_, i) => i !== idx));
  const removeStep = (pi: number, si: number) => setPhases(p => p.map((ph, i) => i === pi ? { ...ph, steps: ph.steps.filter((_, j) => j !== si) } : ph));

  const handleSave = async () => {
    if (!title.trim()) return;
    await savePb.mutateAsync({
      playbook: {
        id: playbookId || undefined,
        title,
        description: description || null,
        objective: objective || null,
        category,
        playbook_type: 'process',
        when_to_use: whenToUse || null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        status,
      } as any,
      phases: phases.filter(ph => ph.title.trim()).map((ph, i) => ({
        title: ph.title,
        description: ph.description || undefined,
        sort_order: i,
        steps: ph.steps.filter(s => s.title.trim()).map((s, j) => ({
          title: s.title,
          description: s.description || undefined,
          step_type: s.step_type,
          is_required: s.is_required,
          sort_order: j,
          assigned_role: s.assigned_role || undefined,
          relative_day_offset: s.relative_day_offset,
        })),
      })),
    });
    onSaved();
  };

  if (playbookId && loadingDetail) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1"><ArrowLeft className="w-4 h-4" /> Voltar</Button>
        <h2 className="text-lg font-semibold">{playbookId ? 'Editar Playbook' : 'Novo Playbook'}</h2>
      </div>

      {/* Basic info */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label className="text-xs">Nome *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Onboarding de novo cliente" className="h-9 text-sm" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrição do playbook" rows={2} className="text-sm" />
          </div>
          <div>
            <Label className="text-xs">Objetivo</Label>
            <Input value={objective} onChange={e => setObjective(e.target.value)} placeholder="Qual o objetivo deste playbook?" className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Quando usar</Label>
            <Input value={whenToUse} onChange={e => setWhenToUse(e.target.value)} placeholder="Ex: ao fechar novo cliente" className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLAYBOOK_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Tags (vírgula)</Label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="ex: recorrente, premium" className="h-9 text-sm" />
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Fases e Etapas</h3>
          <Button variant="outline" size="sm" onClick={() => setPhases(p => [...p, emptyPhase()])} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> Fase
          </Button>
        </div>

        {phases.map((phase, pi) => (
          <div key={pi} className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground/40" />
              <span className="text-xs font-bold text-primary">Fase {pi + 1}</span>
              <Input
                value={phase.title}
                onChange={e => updatePhase(pi, { title: e.target.value })}
                placeholder="Nome da fase"
                className="h-8 text-sm flex-1"
              />
              {phases.length > 1 && (
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removePhase(pi)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {/* Steps */}
            <div className="pl-6 space-y-2">
              {phase.steps.map((step, si) => (
                <div key={si} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      value={step.title}
                      onChange={e => updateStep(pi, si, { title: e.target.value })}
                      placeholder="Título da etapa"
                      className="h-7 text-xs md:col-span-2"
                    />
                    <Select value={step.step_type} onValueChange={v => updateStep(pi, si, { step_type: v })}>
                      <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task">Tarefa</SelectItem>
                        <SelectItem value="checklist">Checklist</SelectItem>
                        <SelectItem value="approval">Aprovação</SelectItem>
                        <SelectItem value="milestone">Marco</SelectItem>
                        <SelectItem value="notification">Notificação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {phase.steps.length > 1 && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive/60" onClick={() => removeStep(pi, si)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => updatePhase(pi, { steps: [...phase.steps, emptyStep()] })} className="text-xs gap-1 h-7 text-muted-foreground">
                <Plus className="w-3 h-3" /> Etapa
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave} disabled={savePb.isPending || !title.trim()} className="gap-1.5">
          {savePb.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Playbook
        </Button>
      </div>
    </div>
  );
}
