import { useState, useCallback, useEffect, useRef } from "react";
import { Task, TASK_COLUMNS, TASK_CATEGORIES } from "@/hooks/useTasksUnified";
import { useExecutionPlans } from "@/hooks/useExecutionPlans";
import { ExecutionPlanPanel } from "@/components/tasks/ExecutionPlanPanel";
import { supabase } from "@/integrations/supabase/client";
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
  AlertTriangle, Flame, Image, FileVideo, FileIcon, CheckCircle, Timer,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { TaskTimer } from "./TaskTimer";

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

interface TaskDetailModalProps {
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

// AI Refinement preview
interface AiPreview {
  action: string;
  original: string;
  refined: string;
  summary: string;
}

export function TaskDetailModal({ task, open, onOpenChange, onUpdate, onDelete }: TaskDetailModalProps) {
  const { getPlanForTask, generatePlan, isGenerating: isPlanGenerating, updatePlan, togglePin } = useExecutionPlans();
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
  const [aiPreview, setAiPreview] = useState<AiPreview | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

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
      setAiPreview(null);
    }
  }, [task]);

  const save = useCallback((field: string, value: any) => {
    if (!task) return;
    onUpdate(task.id, { [field]: value } as any);
  }, [task, onUpdate]);

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
    const newLink: TaskLink = { url, title: new URL(url).hostname, type: detectLinkType(url) };
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
      const { data: signedData } = await supabase.storage.from('project-files').createSignedUrl(filePath, 60 * 60 * 24 * 7);
      const fileUrl = signedData?.signedUrl || '';
      const att: TaskAttachment = { fileUrl, fileName: file.name, fileType: file.type, size: file.size };
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
        // Show preview before applying
        setAiPreview({
          action,
          original: description || title,
          refined: result,
          summary: action === 'grammar' ? 'Correção gramatical aplicada' : action === 'refine' ? 'Texto refinado e melhorado' : 'Reescrito em tom profissional',
        });
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

  const applyAiPreview = () => {
    if (!aiPreview) return;
    setDescription(aiPreview.refined);
    save('description', aiPreview.refined);
    save('ai_refined', true);
    toast.success('Texto atualizado com IA');
    setAiPreview(null);
  };

  const priorityConfig: Record<TaskPriority, { label: string; icon: any; color: string }> = {
    normal: { label: 'Normal', icon: null, color: 'text-muted-foreground' },
    alta: { label: 'Alta', icon: AlertTriangle, color: 'text-amber-500' },
    urgente: { label: 'Urgente', icon: Flame, color: 'text-destructive' },
  };

  // Render file preview
  const renderAttachmentPreview = (att: TaskAttachment, idx: number) => {
    const isImage = att.fileType?.startsWith('image/');
    const isVideo = att.fileType?.startsWith('video/');
    const isPdf = att.fileType === 'application/pdf';

    return (
      <div key={idx} className="relative group/att rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {isImage ? (
          <img
            src={att.fileUrl}
            alt={att.fileName}
            className="w-full h-24 object-cover cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setLightboxUrl(att.fileUrl)}
          />
        ) : isVideo ? (
          <video src={att.fileUrl} controls className="w-full h-24 object-cover" />
        ) : isPdf ? (
          <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-24 hover:bg-white/[0.04] transition-colors">
            <FileText className="w-8 h-8 text-red-400" />
          </a>
        ) : (
          <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-24 hover:bg-white/[0.04] transition-colors">
            <FileIcon className="w-8 h-8 text-muted-foreground" />
          </a>
        )}
        <div className="px-2 py-1.5 flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground truncate flex-1">{att.fileName}</span>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover/att:opacity-100" onClick={() => removeAttachment(idx)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={backdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { if (e.target === backdropRef.current) onOpenChange(false); }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-background/95 backdrop-blur-xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overscroll-contain"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-white/[0.06] px-5 md:px-6 py-3 flex items-center gap-3">
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="text-lg font-semibold border-none px-0 focus-visible:ring-0 shadow-none bg-transparent flex-1"
                placeholder="Título da tarefa"
              />
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-full p-1.5 bg-white/[0.06] hover:bg-white/[0.12] transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 md:p-6 space-y-5">

              {/* Priority + Progress */}
              <div className="flex items-center gap-3">
                <Select value={priority} onValueChange={(v) => handlePriorityChange(v as TaskPriority)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
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

              {/* Task Timer */}
              <TaskTimer
                initialSeconds={(task as any).time_spent_seconds || 0}
                onTimeUpdate={(secs) => save('time_spent_seconds', secs)}
              />
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
                  rows={4}
                  className="text-sm"
                  placeholder="Detalhes da tarefa..."
                />
              </div>

              {/* AI Actions */}
              <div>
                <Label className="text-xs mb-2 block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Ações com IA
                </Label>
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

              {/* AI Preview Panel */}
              <AnimatePresence>
                {aiPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{aiPreview.summary}</span>
                    </div>
                    <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg bg-black/20 p-3">
                      {aiPreview.refined}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={applyAiPreview}>
                        <CheckCircle className="w-3 h-3" /> Aplicar
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAiPreview(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Execution Plan (AI) */}
              <ExecutionPlanPanel
                task={task}
                plan={getPlanForTask(task.id)}
                isGenerating={isPlanGenerating}
                onGenerate={generatePlan}
                onUpdate={updatePlan}
                onTogglePin={togglePin}
              />

              {/* Links */}
              <div>
                <Label className="text-xs mb-2 block flex items-center gap-1">
                  <Link2 className="w-3 h-3" /> Links
                </Label>
                {links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
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

              {/* Attachments with Preview */}
              <div>
                <Label className="text-xs mb-2 block flex items-center gap-1">
                  <Paperclip className="w-3 h-3" /> Arquivos
                </Label>
                {attachments.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {attachments.map((att, i) => renderAttachmentPreview(att, i))}
                  </div>
                )}
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-white/[0.1] text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 cursor-pointer transition-colors">
                  <Paperclip className="w-3 h-3" />
                  Upload de arquivo
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {/* Delete */}
              <div className="pt-4 border-t border-white/[0.06]">
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
          </motion.div>

          {/* Lightbox for images */}
          <AnimatePresence>
            {lightboxUrl && (
              <motion.div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLightboxUrl(null)}
              >
                <motion.img
                  src={lightboxUrl}
                  className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
