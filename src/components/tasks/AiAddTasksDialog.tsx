import { useState, useRef, useCallback } from 'react';
import { Brain, Loader2, Plus, Trash2, Upload, FileText, Image, X, RefreshCw, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { GeneratedTask } from '@/types/tasks';

interface AiAddTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
  defaultColumn?: string;
  onConfirm: (tasks: GeneratedTask[]) => void;
}

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  type: 'text' | 'image';
  extractedText?: string;
  base64?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
}

const CATEGORY_OPTIONS = [
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'operacao', label: 'Operação' },
  { value: 'projeto', label: 'Projeto' },
];

async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao converter imagem'));
    reader.readAsDataURL(file);
  });
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

function isTextFile(file: File): boolean {
  const textTypes = ['text/', 'application/pdf', 'application/vnd.openxmlformats', 'application/msword', 'application/json', 'text/csv'];
  return textTypes.some(t => file.type.startsWith(t)) || /\.(txt|md|csv|json|log)$/i.test(file.name);
}

export function AiAddTasksDialog({ open, onOpenChange, defaultCategory = 'operacao', defaultColumn = 'backlog', onConfirm }: AiAddTasksDialogProps) {
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [rawText, setRawText] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [guidancePrompt, setGuidancePrompt] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('input');
    setRawText('');
    setFiles([]);
    setGeneratedTasks([]);
    setGuidancePrompt('');
    setProcessingProgress(0);
    setIsGenerating(false);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (files.length + newFiles.length > 10) {
      toast.error('Máximo de 10 arquivos');
      return;
    }

    const uploadedFiles: UploadedFile[] = newFiles.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      type: isImageFile(f) ? 'image' : 'text',
      status: 'pending' as const,
    }));

    setFiles(prev => [...prev, ...uploadedFiles]);

    // Process each file
    for (const uf of uploadedFiles) {
      setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'processing' } : f));
      try {
        if (uf.type === 'image') {
          const base64 = await fileToBase64(uf.file);
          setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, base64, status: 'done' } : f));
        } else {
          const text = await extractTextFromFile(uf.file);
          setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, extractedText: text, status: 'done' } : f));
        }
      } catch {
        setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'error' } : f));
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleGenerate = async () => {
    const extractedTexts = files.filter(f => f.type === 'text' && f.extractedText).map(f => f.extractedText!);
    const imageBase64 = files.filter(f => f.type === 'image' && f.base64).map(f => f.base64!);

    if (!rawText.trim() && extractedTexts.length === 0 && imageBase64.length === 0) {
      toast.error('Adicione texto ou arquivos para gerar tarefas');
      return;
    }

    setIsGenerating(true);
    setProcessingProgress(10);

    // Realistic progressive progress
    const progressSteps = [
      { target: 25, delay: 400 },
      { target: 40, delay: 1200 },
      { target: 55, delay: 2500 },
      { target: 70, delay: 4000 },
      { target: 80, delay: 6000 },
      { target: 88, delay: 9000 },
    ];
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const step of progressSteps) {
      timers.push(setTimeout(() => setProcessingProgress(step.target), step.delay));
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-tasks-from-text', {
        body: {
          rawText: rawText.trim(),
          extractedTexts,
          imageBase64: imageBase64.length > 0 ? imageBase64 : undefined,
          defaultCategory,
          defaultColumn,
          guidancePrompt: guidancePrompt.trim() || undefined,
        },
      });

      timers.forEach(clearTimeout);
      setProcessingProgress(95);

      if (error) {
        // Check for rate limit or quota errors
        const errMsg = typeof error === 'object' && error.message ? error.message : String(error);
        if (errMsg.includes('429') || errMsg.toLowerCase().includes('rate')) {
          toast.error('Limite de requisições atingido. Aguarde alguns segundos e tente novamente.');
        } else if (errMsg.includes('402') || errMsg.toLowerCase().includes('quota')) {
          toast.error('Cota de IA esgotada. Entre em contato com o administrador.');
        } else {
          throw error;
        }
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const tasks = (data?.tasks || []) as GeneratedTask[];
      if (tasks.length === 0) {
        toast.warning('Nenhuma tarefa foi identificada. Tente descrever com mais detalhes ou enviar outro arquivo.');
        return;
      }

      setGeneratedTasks(tasks);
      setStep('preview');
      setProcessingProgress(100);
      toast.success(`${tasks.length} tarefa(s) gerada(s)!`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao gerar tarefas');
    } finally {
      timers.forEach(clearTimeout);
      setIsGenerating(false);
      setTimeout(() => setProcessingProgress(0), 500);
    }
  };

  const handleRegenerate = async () => {
    setStep('input');
    await handleGenerate();
  };

  const updateTask = (index: number, updates: Partial<GeneratedTask>) => {
    setGeneratedTasks(prev => prev.map((t, i) => i === index ? { ...t, ...updates } : t));
  };

  const removeTask = (index: number) => {
    setGeneratedTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (generatedTasks.length === 0) {
      toast.error('Nenhuma tarefa para confirmar');
      return;
    }
    onConfirm(generatedTasks);
    handleOpenChange(false);
  };

  const allFilesReady = files.every(f => f.status === 'done' || f.status === 'error');
  const hasContent = rawText.trim().length > 0 || files.some(f => f.status === 'done');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border-border/30 bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Adicionar Tarefas com IA
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'input' ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto space-y-4"
            >
              {/* Text input */}
              <div className="space-y-1.5">
                <label className="text-caption text-muted-foreground uppercase tracking-wider font-medium">
                  Texto / Prompt
                </label>
                <Textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Cole aqui suas tarefas, anotações ou descreva o que precisa fazer..."
                  className="min-h-[120px] bg-background/50 border-border/40 resize-none text-sm"
                />
              </div>

              {/* File upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-caption text-muted-foreground uppercase tracking-wider font-medium">
                    Arquivos (opcional)
                  </label>
                  <span className="text-micro text-muted-foreground/50">{files.length}/10</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.md,.csv,.json,.pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.gif"
                  onChange={handleFileAdd}
                  className="hidden"
                />

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 border-dashed border-border/40 hover:border-primary/30 hover:bg-primary/5 h-9"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= 10 || isGenerating}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Anexar Arquivos
                </Button>

                {/* File list */}
                {files.length > 0 && (
                  <div className="space-y-1">
                    {files.map(f => (
                      <div
                        key={f.id}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm",
                          f.status === 'error' ? "border-destructive/30 bg-destructive/5" :
                          f.status === 'done' ? "border-border/30 bg-muted/10" :
                          "border-border/20 bg-muted/5"
                        )}
                      >
                        {f.type === 'image' ? (
                          <Image className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="flex-1 truncate text-card-title">{f.name}</span>
                        {f.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />}
                        {f.status === 'error' && <span className="text-micro text-destructive">Erro</span>}
                        <button onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-foreground shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Guidance prompt */}
              <div className="space-y-1.5">
                <label className="text-caption text-muted-foreground uppercase tracking-wider font-medium">
                  Orientação para IA (opcional)
                </label>
                <Input
                  value={guidancePrompt}
                  onChange={e => setGuidancePrompt(e.target.value)}
                  placeholder="Ex: Foque em tarefas de marketing, priorize urgentes..."
                  className="h-8 text-sm bg-background/50 border-border/40"
                />
              </div>

              {/* Progress */}
              {isGenerating && (
                <div className="space-y-1">
                  <Progress value={processingProgress} className="h-1" />
                  <p className="text-micro text-muted-foreground text-center">Processando com IA...</p>
                </div>
              )}

              {/* Generate button */}
              <Button
                onClick={handleGenerate}
                disabled={!hasContent || !allFilesReady || isGenerating}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                {isGenerating ? 'Gerando...' : 'Gerar Tarefas com IA'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 overflow-hidden flex flex-col space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-caption text-muted-foreground uppercase tracking-wider font-medium">
                  {generatedTasks.length} tarefa(s) gerada(s)
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-caption gap-1"
                  onClick={() => setStep('input')}
                >
                  Voltar
                </Button>
              </div>

              {/* Task list */}
              <ScrollArea className="flex-1 -mx-1 max-h-[40vh]">
                <div className="space-y-2 px-1">
                  {generatedTasks.map((task, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="rounded-lg border border-border/30 bg-muted/5 p-3 space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <Input
                          value={task.title}
                          onChange={e => updateTask(idx, { title: e.target.value })}
                          className="flex-1 h-7 text-sm font-medium bg-transparent border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <button
                          onClick={() => removeTask(idx)}
                          className="text-muted-foreground/40 hover:text-destructive shrink-0 mt-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <Input
                        value={task.description || ''}
                        onChange={e => updateTask(idx, { description: e.target.value || null })}
                        placeholder="Descrição (opcional)"
                        className="h-6 text-xs text-muted-foreground bg-transparent border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />

                      <div className="flex items-center gap-2 flex-wrap">
                        <Select
                          value={task.category}
                          onValueChange={val => updateTask(idx, { category: val as any })}
                        >
                          <SelectTrigger className="h-6 w-28 text-micro border-border/30 bg-background/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {task.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {task.tags.map((tag, tIdx) => (
                              <span key={tIdx} className="text-micro px-1.5 py-0.5 rounded bg-primary/8 text-primary font-mono">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {task.due_date && (
                          <span className="text-micro text-muted-foreground font-mono">
                            📅 {task.due_date}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              {/* Regenerate with guidance */}
              <div className="space-y-2 border-t border-border/15 pt-3">
                <div className="flex gap-2">
                  <Input
                    value={guidancePrompt}
                    onChange={e => setGuidancePrompt(e.target.value)}
                    placeholder="Orientar regeneração: ex. 'Divida em tarefas menores'"
                    className="flex-1 h-8 text-sm bg-background/50 border-border/40"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 shrink-0"
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Regenerar
                  </Button>
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={generatedTasks.length === 0}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Confirmar {generatedTasks.length} Tarefa(s)
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
