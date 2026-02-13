import { useState, useCallback, useEffect } from "react";
import { Task, TASK_COLUMNS, TASK_CATEGORIES } from "@/hooks/useTasksUnified";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sparkles, Loader2, Type, PenLine, FileText, BarChart3,
  ListChecks, Link2, Paperclip, X, ExternalLink, Trash2,
  AlertTriangle, Flame,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type TaskPriority = 'normal' | 'alta' | 'urgente';

interface TaskLink {
  url: string;
  title: string;
  type: 'youtube' | 'drive' | 'website' | 'outro';
}

interface TaskAttachment {
  fileUrl: string;
  fileName: string;
  fileType: string;
  size: number;
}

interface TaskEditDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

function detectLinkType(url: string): TaskLink['type'] {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/drive\.google|docs\.google/i.test(url)) return 'drive';
  return 'website';
}

export function TaskEditDrawer({ task, open, onOpenChange, onUpdate, onDelete }: TaskEditDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('backlog');
  const [category, setCategory] = useState<Task['category']>('operacao');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Load task data
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setCategory(task.category);
      setPriority((task as any).priority || 'normal');
      setProgress((task as any).progress || 0);
      setStartDate((task as any).start_date || '');
      setDueDate(task.due_date || '');
      setTags(task.tags?.join(', ') || '');
      setLinks((task as any).links || []);
      setAttachments((task as any).attachments || []);
    }
  }, [task]);

  const save = useCallback((field: string, value: any) => {
    if (!task) return;
    onUpdate(task.id, { [field]: value } as any);
  }, [task, onUpdate]);

  // Debounced auto-save for text fields
  const handleTitleBlur = () => { if (task && title !== task.title) save('title', title); };
  const handleDescBlur = () => { if (task && description !== (task.description || '')) save('description', description || null); };

  const handleStatusChange = (v: Task['status']) => {
    setStatus(v);
    const updates: any = { status: v };
    if (v === 'done') updates.completed_at = new Date().toISOString();
    else if (task?.status === 'done') updates.completed_at = null;
    if (task) onUpdate(task.id, updates);
  };

  const handleCategoryChange = (v: Task['category']) => { setCategory(v); save('category', v); };
  const handlePriorityChange = (v: TaskPriority) => { setPriority(v); save('priority', v); };
  const handleProgressChange = (v: number[]) => { setProgress(v[0]); save('progress', v[0]); };
  const handleStartDateChange = (v: string) => { setStartDate(v); save('start_date', v || null); };
  const handleDueDateChange = (v: string) => { setDueDate(v); save('due_date', v || null); };
  const handleTagsBlur = () => {
    const arr = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    save('tags', arr);
  };

  // Links
  const addLink = () => {
    if (!newLinkUrl.trim()) return;
    const url = newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`;
    const newLink: TaskLink = {
      url,
      title: new URL(url).hostname,
      type: detectLinkType(url),
    };
    const updated = [...links, newLink];
    setLinks(updated);
    setNewLinkUrl('');
    save('links', updated);
  };

  const removeLink = (idx: number) => {
    const updated = links.filter((_, i) => i !== idx);
    setLinks(updated);
    save('links', updated);
  };

  // File upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !task) return;

    for (const file of Array.from(files)) {
      const filePath = `task-attachments/${task.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('project-files').upload(filePath, file);
      if (error) { toast.error(`Erro ao enviar ${file.name}`); continue; }

      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
      const att: TaskAttachment = {
        fileUrl: urlData.publicUrl,
        fileName: file.name,
        fileType: file.type,
        size: file.size,
      };
      const updated = [...attachments, att];
      setAttachments(updated);
      save('attachments', updated);
    }
    e.target.value = '';
  };

  const removeAttachment = (idx: number) => {
    const updated = attachments.filter((_, i) => i !== idx);
    setAttachments(updated);
    save('attachments', updated);
  };

  // AI Actions
  const runAi = async (action: string) => {
    if (!task) return;
    const text = action === 'estimate_progress'
      ? `${title}\n${description}`
      : (action === 'checklist' ? `${title}\n${description}` : (description || title));

    if (!text.trim()) { toast.error('Sem texto para processar'); return; }

    setAiLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke('refine-task-ai', {
        body: { action, text },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result = data.result;

      if (action === 'grammar' || action === 'refine' || action === 'rewrite_professional') {
        // Result is refined text — split into title (first line) and description (rest)
        const lines = result.split('\n').filter((l: string) => l.trim());
        if (lines.length > 0) {
          setDescription(result);
          save('description', result);
          save('ai_refined', true);
          toast.success('Texto refinado com IA');
        }
      } else if (action === 'checklist') {
        if (Array.isArray(result)) {
          const checklistText = result.map((item: string) => `☐ ${item}`).join('\n');
          const newDesc = description ? `${description}\n\n${checklistText}` : checklistText;
          setDescription(newDesc);
          save('description', newDesc);
          toast.success('Checklist gerado');
        }
      } else if (action === 'estimate_progress') {
        const val = typeof result === 'number' ? result : 50;
        setProgress(val);
        save('progress', val);
        toast.success(`Progresso estimado: ${val}%`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro na IA');
    } finally {
      setAiLoading(null);
    }
  };

  const priorityConfig: Record<TaskPriority, { label: string; icon: any; color: string }> = {
    normal: { label: 'Normal', icon: null, color: 'text-muted-foreground' },
    alta: { label: 'Alta', icon: AlertTriangle, color: 'text-amber-500' },
    urgente: { label: 'Urgente', icon: Flame, color: 'text-destructive' },
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-sm text-muted-foreground">Editar Tarefa</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-4">
          {/* Title */}
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-lg font-semibold border-none px-0 focus-visible:ring-0 shadow-none"
            placeholder="Título da tarefa"
          />

          {/* Priority + Progress inline */}
          <div className="flex items-center gap-3">
            <Select value={priority} onValueChange={(v) => handlePriorityChange(v as TaskPriority)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['normal', 'alta', 'urgente'] as TaskPriority[]).map(p => {
                  const PIcon = priorityConfig[p].icon;
                  return (
                    <SelectItem key={p} value={p}>
                      <span className={cn("flex items-center gap-1.5", priorityConfig[p].color)}>
                        {PIcon && <PIcon className="w-3 h-3" />}
                        {priorityConfig[p].label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{progress}%</span>
              <Slider value={[progress]} onValueChange={handleProgressChange} max={100} step={5} className="flex-1" />
            </div>
          </div>

          <Progress value={progress} className="h-1.5" />

          {/* Status + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => handleStatusChange(v as Task['status'])}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_COLUMNS.map(c => <SelectItem key={c.key} value={c.key}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={category} onValueChange={(v) => handleCategoryChange(v as Task['category'])}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data Início</Label>
              <Input type="date" value={startDate} onChange={e => handleStartDateChange(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Prazo</Label>
              <Input type="date" value={dueDate} onChange={e => handleDueDateChange(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-xs">Tags (vírgula)</Label>
            <Input value={tags} onChange={e => setTags(e.target.value)} onBlur={handleTagsBlur} className="h-8 text-xs" placeholder="urgente, cliente" />
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={handleDescBlur}
              rows={5}
              className="text-sm"
              placeholder="Detalhes da tarefa..."
            />
          </div>

          {/* AI Actions */}
          <div>
            <Label className="text-xs mb-2 block">IA</Label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'grammar', label: 'Gramática', icon: Type },
                { key: 'refine', label: 'Refinar', icon: PenLine },
                { key: 'rewrite_professional', label: 'Profissional', icon: FileText },
                { key: 'checklist', label: 'Checklist', icon: ListChecks },
                { key: 'estimate_progress', label: 'Estimar %', icon: BarChart3 },
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] gap-1"
                  disabled={!!aiLoading}
                  onClick={() => runAi(key)}
                >
                  {aiLoading === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <Label className="text-xs mb-2 block flex items-center gap-1">
              <Link2 className="w-3 h-3" /> Links
            </Label>
            {links.map((link, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5 p-2 rounded-lg bg-muted/30">
                <Badge variant="outline" className="text-[9px] shrink-0">{link.type}</Badge>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate flex-1">
                  {link.title || link.url}
                </a>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => removeLink(i)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-1.5">
              <Input
                value={newLinkUrl}
                onChange={e => setNewLinkUrl(e.target.value)}
                placeholder="Cole um link..."
                className="h-7 text-xs flex-1"
                onKeyDown={e => e.key === 'Enter' && addLink()}
              />
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addLink} disabled={!newLinkUrl.trim()}>
                Adicionar
              </Button>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <Label className="text-xs mb-2 block flex items-center gap-1">
              <Paperclip className="w-3 h-3" /> Arquivos
            </Label>
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5 p-2 rounded-lg bg-muted/30">
                <span className="text-xs truncate flex-1">{att.fileName}</span>
                <span className="text-[9px] text-muted-foreground">{(att.size / 1024).toFixed(0)}KB</span>
                <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </a>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => removeAttachment(i)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 cursor-pointer transition-colors">
              <Paperclip className="w-3 h-3" />
              Upload de arquivo
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          {/* Delete */}
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 gap-1.5"
              onClick={() => { onDelete(task.id); onOpenChange(false); }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir Tarefa
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
