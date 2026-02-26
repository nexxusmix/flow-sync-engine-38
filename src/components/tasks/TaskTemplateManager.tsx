import { useState } from 'react';
import { useTaskTemplates, TaskTemplate } from '@/hooks/useTaskTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { TASK_CATEGORIES } from '@/hooks/useTasksUnified';
import { FileText, Plus, Trash2, Copy, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskTemplateManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyTemplate: (template: TaskTemplate) => void;
}

export function TaskTemplateManager({ open, onOpenChange, onApplyTemplate }: TaskTemplateManagerProps) {
  const { templates, isLoading, createTemplate, deleteTemplate } = useTaskTemplates();
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'operacao',
    priority: 'normal',
    tags: '',
    checklistItems: '',
  });

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    await createTemplate.mutateAsync({
      title: form.title,
      description: form.description || null,
      category: form.category,
      priority: form.priority,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      checklist_items: form.checklistItems
        ? form.checklistItems.split('\n').filter(l => l.trim()).map(l => ({ title: l.trim() }))
        : [],
    });
    setForm({ title: '', description: '', category: 'operacao', priority: 'normal', tags: '', checklistItems: '' });
    setIsCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Templates de Tarefa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isCreating ? (
            <div className="space-y-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Nome do template"
                className="h-8 text-sm"
              />
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição padrão"
                rows={2}
                className="text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">🔥 Urgente</SelectItem>
                    <SelectItem value="high">↑ Alta</SelectItem>
                    <SelectItem value="normal">— Normal</SelectItem>
                    <SelectItem value="low">↓ Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                placeholder="Tags (vírgula)"
                className="h-8 text-xs"
              />
              <div>
                <Label className="text-xs">Subtarefas (uma por linha)</Label>
                <Textarea
                  value={form.checklistItems}
                  onChange={e => setForm({ ...form, checklistItems: e.target.value })}
                  placeholder={"Revisar briefing\nCriar wireframe\nTestar entrega"}
                  rows={3}
                  className="text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsCreating(false)} className="flex-1">Cancelar</Button>
                <Button size="sm" onClick={handleCreate} disabled={createTemplate.isPending} className="flex-1">
                  {createTemplate.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsCreating(true)} className="w-full gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Novo Template
            </Button>
          )}

          {isLoading ? (
            <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
          ) : templates.length === 0 && !isCreating ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum template criado ainda</p>
          ) : (
            templates.map(t => (
              <div key={t.id} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t.title}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { onApplyTemplate(t); onOpenChange(false); }}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteTemplate.mutate(t.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {t.description && <p className="text-body-sm text-muted-foreground line-clamp-1">{t.description}</p>}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-caption px-1.5 py-0.5 rounded bg-muted/50">{t.category}</span>
                  <span className="text-caption px-1.5 py-0.5 rounded bg-muted/50">{t.priority}</span>
                  {t.checklist_items?.length > 0 && (
                    <span className="text-caption text-muted-foreground">{t.checklist_items.length} subtarefas</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
