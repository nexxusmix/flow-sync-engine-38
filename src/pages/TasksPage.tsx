import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTasksUnified, Task, TASK_COLUMNS, TASK_CATEGORIES } from "@/hooks/useTasksUnified";
import { TasksBoard } from "@/components/tasks/TasksBoard";
import { TasksBoardView } from "@/components/tasks/TasksBoardView";
import { TasksDashboardBI } from "@/components/tasks/TasksDashboardBI";
import { TasksTimeline } from "@/components/tasks/TasksTimeline";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TaskBulkActions } from "@/components/tasks/TaskBulkActions";
import { TaskAnalysisPanel } from "@/components/tasks/TaskAnalysisPanel";
import { TaskExecutionGuide } from "@/components/tasks/TaskExecutionGuide";
import { SavedFocusPlans } from "@/components/tasks/SavedFocusPlans";
import { supabase } from "@/integrations/supabase/client";
import { useExportPdf } from "@/hooks/useExportPdf";
import { useUrlState } from "@/hooks/useUrlState";
import { useScrollPersistence } from "@/hooks/usePersistedState";
import {
  Plus, Sparkles, Loader2, LayoutDashboard, Columns3, Calendar as CalendarIcon, FileDown, List,
  Mic, Square as StopIcon, CheckSquare, Upload, X, FileText, Image, Music, Brain
} from "lucide-react";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface TaskFormData {
  title: string;
  description: string;
  status: Task['status'];
  category: Task['category'];
  priority: string;
  tags: string;
  due_date: string;
  start_date: string;
}

const defaultTaskForm: TaskFormData = {
  title: '',
  description: '',
  status: 'backlog',
  category: 'operacao',
  priority: 'normal',
  tags: '',
  due_date: '',
  start_date: '',
};

type ViewMode = 'board' | 'kanban' | 'timeline' | 'dashboard' | 'focus';

export default function TasksPage() {
  const {
    tasks, isLoading, isCreating, isGenerating, stats,
    createTask, updateTask, toggleComplete, deleteTask, moveTask,
    createTasksFromAI, timelineItems,
  } = useTasksUnified();

  const { isExporting, exportTasks } = useExportPdf();
  const [viewMode, setViewMode] = useUrlState('view', 'board') as [ViewMode, (v: ViewMode) => void];
  useScrollPersistence('tasks');

  const [searchParams, setSearchParams] = useSearchParams();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isAISheetOpen, setIsAISheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>(defaultTaskForm);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [aiText, setAiText] = useState(() => {
    try { return localStorage.getItem('tasks-ai-text') || ''; } catch { return ''; }
  });
  const [aiCategory, setAiCategory] = useState<Task['category']>('operacao');
  const [aiColumn, setAiColumn] = useState<Task['status']>('backlog');
  const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; status: 'pending' | 'processing' | 'done' | 'error'; extractedText?: string }[]>([]);
  const [isProcessingUploads, setIsProcessingUploads] = useState(false);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  // Persist AI text to localStorage
  useEffect(() => {
    try { localStorage.setItem('tasks-ai-text', aiText); } catch {}
  }, [aiText]);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsNewTaskOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Speech-to-text hook
  const handleSpeechResult = useCallback((text: string, isFinal: boolean) => {
    if (isFinal && text) {
      setAiText(prev => prev ? prev + '\n' + text : text);
    }
  }, []);

  const {
    isSupported: isMicSupported,
    isRecording,
    isTranscribing,
    error: speechError,
    start: startRecording,
    stop: stopRecording,
    cancel: cancelRecording,
  } = useSpeechToText({
    lang: 'pt-BR',
    continuous: true,
    onResult: handleSpeechResult,
    onError: (msg) => toast.error(msg),
  });

  const handleAISheetChange = useCallback((open: boolean) => {
    if (!open) cancelRecording();
    setIsAISheetOpen(open);
  }, [cancelRecording]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isRecording) cancelRecording();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, cancelRecording]);

  // Selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === tasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tasks.map(t => t.id)));
    }
  }, [tasks, selectedIds.size]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) { toast.error('Título é obrigatório'); return; }
    try {
      await createTask({
        title: taskForm.title,
        description: taskForm.description || null,
        status: taskForm.status,
        category: taskForm.category,
        tags: taskForm.tags ? taskForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        due_date: taskForm.due_date || null,
        priority: taskForm.priority,
        start_date: taskForm.start_date || null,
      } as any);
      toast.success('Tarefa criada!');
      setIsNewTaskOpen(false);
      setTaskForm(defaultTaskForm);
    } catch {
      toast.error('Erro ao criar tarefa');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDrawerOpen(true);
  };

  // File upload handler for AI sheet
  const handleAIFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).map(f => ({ file: f, status: 'pending' as const }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsProcessingUploads(true);

    for (let i = 0; i < newFiles.length; i++) {
      const entry = newFiles[i];
      const file = entry.file;
      setUploadedFiles(prev => prev.map(f => f.file === file ? { ...f, status: 'processing' } : f));

      try {
        let extractedText = '';
        if (file.type.startsWith('audio/')) {
          // Transcribe audio
          const filePath = `ai-uploads/${Date.now()}-${file.name}`;
          await supabase.storage.from('project-files').upload(filePath, file);
          const { data: signedData } = await supabase.storage.from('project-files').createSignedUrl(filePath, 600);
          if (signedData?.signedUrl) {
            const { data } = await supabase.functions.invoke('transcribe-media', { body: { fileUrl: signedData.signedUrl, fileName: file.name } });
            extractedText = data?.text || data?.content || '';
          }
        } else if (file.type === 'application/pdf' || file.type.includes('word') || file.name.endsWith('.txt') || file.name.endsWith('.rtf')) {
          // Text extraction - for txt read directly, for others use transcribe-media
          if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
            extractedText = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsText(file);
            });
          } else {
            const filePath = `ai-uploads/${Date.now()}-${file.name}`;
            await supabase.storage.from('project-files').upload(filePath, file);
            const { data: signedData } = await supabase.storage.from('project-files').createSignedUrl(filePath, 600);
            if (signedData?.signedUrl) {
              const { data } = await supabase.functions.invoke('transcribe-media', { body: { fileUrl: signedData.signedUrl, fileName: file.name } });
              extractedText = data?.text || data?.content || '';
            }
          }
        } else if (file.type.startsWith('image/')) {
          extractedText = `[Imagem: ${file.name}]`;
        }
        setUploadedFiles(prev => prev.map(f => f.file === file ? { ...f, status: 'done', extractedText } : f));
      } catch {
        setUploadedFiles(prev => prev.map(f => f.file === file ? { ...f, status: 'error' } : f));
        toast.error(`Erro ao processar ${file.name}`);
      }
    }
    setIsProcessingUploads(false);
    if (aiFileInputRef.current) aiFileInputRef.current.value = '';
  };

  const removeUploadedFile = (idx: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx));

  const handleGenerateFromAI = async () => {
    if (!aiText.trim() && uploadedFiles.length === 0) { toast.error('Cole ou digite o texto com as tarefas'); return; }
    setIsGeneratingLocal(true);
    try {
      const extractedTexts = uploadedFiles.filter(f => f.extractedText).map(f => f.extractedText!);
      const { data, error } = await supabase.functions.invoke('generate-tasks-from-text', {
        body: { rawText: aiText, extractedTexts, defaultCategory: aiCategory, defaultColumn: aiColumn },
      });
      if (error) throw error;
      if (!data?.tasks || data.tasks.length === 0) { toast.error('Nenhuma tarefa identificada no texto'); return; }
      const newTasks = await createTasksFromAI(data.tasks);
      toast.success(`${newTasks.length} tarefas criadas!`);
      setIsAISheetOpen(false);
      setAiText('');
      setUploadedFiles([]);
    } catch (err: any) {
      console.error('Error generating tasks:', err);
      toast.error(err.message || 'Erro ao gerar tarefas');
    } finally {
      setIsGeneratingLocal(false);
    }
  };

  return (
    <DashboardLayout title="Tarefas">
      <div className="space-y-4 md:space-y-6 max-w-[1600px] 2xl:max-w-[1800px] mx-auto w-full min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-medium text-foreground tracking-tight">Minhas Tarefas</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {tasks.filter(t => t.status !== 'done').length} pendentes • {tasks.filter(t => t.status === 'done').length} concluídas
              </p>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <Button size="sm" variant="outline" onClick={() => setIsAISheetOpen(true)}>
                <Sparkles className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => setIsNewTaskOpen(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 min-w-0">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="board" className="gap-1.5">
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Quadro</span>
                </TabsTrigger>
                <TabsTrigger value="kanban" className="gap-1.5">
                  <Columns3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Kanban</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="gap-1.5">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Timeline</span>
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="gap-1.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="focus" className="gap-1.5">
                  <Brain className="w-4 h-4" />
                  <span className="hidden sm:inline">Foco</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="hidden md:flex items-center gap-3">
              {/* Select All */}
              {viewMode !== 'dashboard' && (
                <Button variant="outline" size="sm" onClick={selectAll} className="gap-1.5">
                  <CheckSquare className="w-4 h-4" />
                  {selectedIds.size === tasks.length && tasks.length > 0 ? 'Desmarcar' : 'Selecionar Tudo'}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => exportTasks()} disabled={isExporting}>
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                Exportar PDF
              </Button>
              <TaskAnalysisPanel tasks={tasks} />
              <TaskExecutionGuide
                tasks={tasks}
                onComplete={(id) => {
                  const t = tasks.find(t => t.id === id);
                  if (t) updateTask(id, { status: 'done', completed_at: new Date().toISOString() } as any);
                }}
              />
              <Button variant="outline" onClick={() => setIsAISheetOpen(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Criar com IA
              </Button>
              <Button onClick={() => setIsNewTaskOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'focus' ? (
          <SavedFocusPlans />
        ) : viewMode === 'board' ? (
          <TasksBoardView
            tasks={tasks}
            onEditTask={handleEditTask}
            onToggleComplete={toggleComplete}
            onDeleteTask={deleteTask}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        ) : viewMode === 'dashboard' ? (
          <TasksDashboardBI tasks={tasks} stats={stats} />
        ) : viewMode === 'timeline' ? (
          <TasksTimeline tasks={tasks} onEditTask={handleEditTask} />
        ) : (
          <TasksBoard
            tasks={tasks}
            onEditTask={handleEditTask}
            onMoveTask={moveTask}
            onToggleComplete={toggleComplete}
            onDeleteTask={deleteTask}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        )}

        {/* Bulk Actions Bar */}
        <TaskBulkActions
          selectedIds={selectedIds}
          tasks={tasks}
          onClearSelection={clearSelection}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />

        {/* New Task Dialog */}
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título *</Label>
                <Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="O que precisa ser feito?" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Detalhes adicionais..." rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Coluna</Label>
                  <Select value={taskForm.status} onValueChange={(v) => setTaskForm({ ...taskForm, status: v as Task['status'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TASK_COLUMNS.map((col) => <SelectItem key={col.key} value={col.key}>{col.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={taskForm.category} onValueChange={(v) => setTaskForm({ ...taskForm, category: v as Task['category'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TASK_CATEGORIES.map((cat) => <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data Início</Label>
                  <Input type="date" value={taskForm.start_date} onChange={(e) => setTaskForm({ ...taskForm, start_date: e.target.value })} />
                </div>
                <div>
                  <Label>Data Limite</Label>
                  <Input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Tags (vírgula)</Label>
                <Input value={taskForm.tags} onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })} placeholder="urgente, cliente" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewTaskOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateTask} disabled={isCreating}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Tarefa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task Detail Modal */}
        <TaskDetailModal
          task={editingTask}
          open={isEditDrawerOpen}
          onOpenChange={(open) => {
            setIsEditDrawerOpen(open);
            if (!open) setEditingTask(null);
          }}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />

        {/* AI Sheet */}
        <Sheet open={isAISheetOpen} onOpenChange={handleAISheetChange}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Criar Tarefas com IA
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-6">
              <p className="text-sm text-muted-foreground">
                Cole uma lista de tarefas, um e-mail, ou qualquer texto — ou use o <strong>microfone</strong> para ditar. Você também pode <strong>enviar arquivos</strong> (PDF, áudio, imagens, documentos).
              </p>

              {/* File Upload */}
              <div>
                <input
                  ref={aiFileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.txt,.rtf,.mp3,.wav,.m4a,.ogg,.csv"
                  onChange={handleAIFileUpload}
                  className="hidden"
                />
                <Button variant="outline" size="sm" onClick={() => aiFileInputRef.current?.click()} disabled={isProcessingUploads} className="gap-1.5 w-full">
                  {isProcessingUploads ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Enviar Arquivos
                </Button>
                {uploadedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedFiles.map((uf, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border text-xs">
                        {uf.file.type.startsWith('image/') ? <Image className="w-3.5 h-3.5 text-blue-500 shrink-0" /> :
                         uf.file.type.startsWith('audio/') ? <Music className="w-3.5 h-3.5 text-purple-500 shrink-0" /> :
                         <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                        <span className="truncate flex-1">{uf.file.name}</span>
                        {uf.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                        {uf.status === 'done' && <span className="text-green-500 text-[10px] font-medium">✓</span>}
                        {uf.status === 'error' && <span className="text-destructive text-[10px] font-medium">✗</span>}
                        <button onClick={() => removeUploadedFile(idx)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Texto com tarefas</Label>
                  {isMicSupported ? (
                    <Button
                      type="button"
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isTranscribing}
                    >
                      {isTranscribing ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" />Transcrevendo…</>
                      ) : isRecording ? (
                        <><StopIcon className="w-3.5 h-3.5" /><span className="animate-pulse">Gravando…</span></>
                      ) : (
                        <><Mic className="w-3.5 h-3.5" />Ditar</>
                      )}
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Microfone não suportado</span>
                  )}
                </div>
                <div className="relative">
                  <Textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder={`Exemplo:\n- Revisar contrato do cliente X\n- Ligar para contador sobre impostos`}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  {isRecording && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-medium">
                      <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      REC
                    </div>
                  )}
                </div>
                {speechError && (
                  <div className="flex items-center justify-between mt-1.5 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
                    <span>{speechError}</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={startRecording}>
                      Tentar novamente
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria padrão</Label>
                  <Select value={aiCategory} onValueChange={(v) => setAiCategory(v as Task['category'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TASK_CATEGORIES.map((cat) => <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Coluna padrão</Label>
                  <Select value={aiColumn} onValueChange={(v) => setAiColumn(v as Task['status'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TASK_COLUMNS.filter(c => c.key !== 'done').map((col) => <SelectItem key={col.key} value={col.key}>{col.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => handleAISheetChange(false)}>Cancelar</Button>
              <Button onClick={handleGenerateFromAI} disabled={isGeneratingLocal || isRecording || !aiText.trim()}>
                {isGeneratingLocal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Gerar Tarefas
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
