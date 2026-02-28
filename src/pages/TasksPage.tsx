import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTasksUnified, Task, TASK_COLUMNS, TASK_CATEGORIES } from "@/hooks/useTasksUnified";
import { useProjects } from "@/hooks/useProjects";
import { TasksBoard } from "@/components/tasks/TasksBoard";
import { TasksBoardView } from "@/components/tasks/TasksBoardView";
import { TasksDashboardBI } from "@/components/tasks/TasksDashboardBI";
import { TasksTimeline } from "@/components/tasks/TasksTimeline";
import { TasksCalendarView } from "@/components/tasks/TasksCalendarView";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TaskBulkActions } from "@/components/tasks/TaskBulkActions";
import { TaskAnalysisPanel } from "@/components/tasks/TaskAnalysisPanel";
import { TaskExecutionGuide } from "@/components/tasks/TaskExecutionGuide";
import { SavedFocusPlans } from "@/components/tasks/SavedFocusPlans";
import { TaskAIDailySummary } from "@/components/tasks/TaskAIDailySummary";
import { TaskAIPrioritySuggestions } from "@/components/tasks/TaskAIPrioritySuggestions";
import { TaskAIDeadlineSuggestions } from "@/components/tasks/TaskAIDeadlineSuggestions";
import { TaskAIPreviewPanel } from "@/components/tasks/TaskAIPreviewPanel";
import type { GeneratedTask } from "@/types/tasks";
import { TaskDuplicateDetection } from "@/components/tasks/TaskDuplicateDetection";
import { TaskTemplateManager } from "@/components/tasks/TaskTemplateManager";
import { TaskGanttView } from "@/components/tasks/TaskGanttView";
import { TaskAutomationManager } from "@/components/tasks/TaskAutomationManager";
import { supabase } from "@/integrations/supabase/client";
import { useExportPdf } from "@/hooks/useExportPdf";
import { useUrlState } from "@/hooks/useUrlState";
import { useScrollPersistence } from "@/hooks/usePersistedState";
import {
  Plus, Sparkles, Loader2, LayoutDashboard, Columns3, Calendar as CalendarIcon, FileDown, List,
  Mic, Square as StopIcon, CheckSquare, Upload, X, FileText, Image, Music, Brain, BarChart3, Zap,
  Settings2, ChevronRight, SlidersHorizontal, ChevronDown, Archive, Trash2, Lightbulb,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { Button } from "@/components/ui/button";
// Tabs removed — view mode uses dropdown now
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DailyPlanDialog } from "@/components/tasks/DailyPlanDialog";
import { ArchivedTasksSection } from "@/components/tasks/ArchivedTasksSection";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskFormData {
  title: string;
  description: string;
  status: Task['status'];
  category: Task['category'];
  priority: string;
  tags: string;
  due_date: string;
  start_date: string;
  project_id: string;
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
  project_id: '',
};

type ViewMode = 'board' | 'kanban' | 'timeline' | 'calendar' | 'dashboard' | 'focus' | 'gantt';

export default function TasksPage() {
  const {
    tasks, isLoading, isCreating, isGenerating, stats,
    createTask, updateTask, toggleComplete, deleteTask, moveTask,
    createTasksFromAI, timelineItems,
    bulkArchiveDone, bulkDeleteDone, isArchiving, isDeleting,
    archivedTasks, isLoadingArchived, restoreTask, deleteArchivedTask,
  } = useTasksUnified();

  const { isExporting, exportTasks } = useExportPdf();
  const { projects } = useProjects();
  const [viewMode, setViewMode] = useUrlState('view', 'board') as [ViewMode, (v: ViewMode) => void];
  useScrollPersistence('tasks');

  const [searchParams, setSearchParams] = useSearchParams();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isAISheetOpen, setIsAISheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>(defaultTaskForm);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isAutomationOpen, setIsAutomationOpen] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showExecutionGuide, setShowExecutionGuide] = useState(false);
  const [showDailyPlan, setShowDailyPlan] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPrioritySuggestions, setShowPrioritySuggestions] = useState(false);
  const [showDeadlineSuggestions, setShowDeadlineSuggestions] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [aiText, setAiText] = useState(() => {
    try { return localStorage.getItem('tasks-ai-text') || ''; } catch { return ''; }
  });
  const [aiCategory, setAiCategory] = useState<Task['category']>('operacao');
  const [aiColumn, setAiColumn] = useState<Task['status']>('backlog');
  const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; status: 'pending' | 'processing' | 'done' | 'error'; extractedText?: string }[]>([]);
  const [isProcessingUploads, setIsProcessingUploads] = useState(false);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const [aiGuidancePrompt, setAiGuidancePrompt] = useState('');
  const [previewTasks, setPreviewTasks] = useState<GeneratedTask[] | null>(null);

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
    if (!open) { cancelRecording(); setPreviewTasks(null); }
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
        project_id: taskForm.project_id || null,
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
    if (isProcessingUploads) { toast.error('Aguarde o processamento dos arquivos'); return; }
    if (isConfirmingAI) return; // Prevent concurrent
    setIsGeneratingLocal(true);
    try {
      const extractedTexts = uploadedFiles.filter(f => f.extractedText).map(f => f.extractedText!);
      const { data, error } = await supabase.functions.invoke('generate-tasks-from-text', {
        body: { rawText: aiText, extractedTexts, defaultCategory: aiCategory, defaultColumn: aiColumn, guidancePrompt: aiGuidancePrompt || undefined },
      });
      if (error) {
        const msg = typeof error === 'object' && error.message ? error.message : String(error);
        if (msg.includes('429') || msg.toLowerCase().includes('rate')) {
          toast.error('Limite de requisições atingido. Aguarde alguns segundos e tente novamente.', { action: { label: 'Tentar novamente', onClick: handleGenerateFromAI } });
        } else if (msg.includes('402') || msg.toLowerCase().includes('quota')) {
          toast.error('Cota de IA esgotada. Entre em contato com o administrador.');
        } else {
          throw error;
        }
        return;
      }
      if (!data?.tasks || data.tasks.length === 0) { toast.error('Nenhuma tarefa identificada no texto'); return; }
      if (data.warnings && data.warnings.length > 0) {
        toast.info(`${data.warnings.length} item(ns) descartado(s) pela IA`);
      }
      setPreviewTasks(data.tasks as GeneratedTask[]);
    } catch (err: any) {
      console.error('Error generating tasks:', err);
      toast.error(err.message || 'Erro ao gerar tarefas');
    } finally {
      setIsGeneratingLocal(false);
    }
  };

  const [isConfirmingAI, setIsConfirmingAI] = useState(false);

  const handleConfirmAITasks = async (tasks: GeneratedTask[]) => {
    setIsConfirmingAI(true);
    try {
      const created = await createTasksFromAI(tasks as any);
      // Build category breakdown for toast
      const catCounts: Record<string, number> = {};
      tasks.forEach(t => {
        const label = TASK_CATEGORIES.find(c => c.key === t.category)?.label || t.category;
        catCounts[label] = (catCounts[label] || 0) + 1;
      });
      const breakdown = Object.entries(catCounts).map(([k, v]) => `${v} ${k}`).join(', ');
      toast.success(`${created.length} tarefas criadas (${breakdown})`);
      setIsAISheetOpen(false);
      setAiText('');
      setUploadedFiles([]);
      setPreviewTasks(null);
      setAiGuidancePrompt('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar tarefas');
    } finally {
      setIsConfirmingAI(false);
    }
  };

  const VIEW_MODES: { key: ViewMode; label: string; icon: typeof List }[] = [
    { key: 'board', label: 'Quadro', icon: List },
    { key: 'kanban', label: 'Kanban', icon: Columns3 },
    { key: 'timeline', label: 'Timeline', icon: CalendarIcon },
    { key: 'calendar', label: 'Calendário', icon: CalendarIcon },
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'focus', label: 'Foco', icon: Brain },
    { key: 'gantt', label: 'Gantt', icon: BarChart3 },
  ];

  const [showToolbar, setShowToolbar] = useState(false);
  const activeView = VIEW_MODES.find(v => v.key === viewMode) || VIEW_MODES[0];
  const hasToolbarActive = showAnalysis || showExecutionGuide || showPrioritySuggestions || showDeadlineSuggestions || showDuplicates || isTemplateOpen || isAutomationOpen;

  return (
    <DashboardLayout title="Tarefas">
      <div className="space-y-4 md:space-y-6 max-w-[1600px] 2xl:max-w-[1800px] mx-auto w-full min-w-0 overflow-x-hidden">
        {/* Header — Primary row */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 md:gap-3">
            {/* View Selector — compact dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-10 px-3 rounded-xl shrink-0">
                  <activeView.icon className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">{activeView.label}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {VIEW_MODES.map(v => (
                  <DropdownMenuItem
                    key={v.key}
                    onClick={() => setViewMode(v.key)}
                    className={cn("gap-2", viewMode === v.key && "bg-accent font-medium")}
                  >
                    <v.icon className="w-4 h-4" />
                    {v.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Stats pill */}
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {tasks.filter(t => t.status !== 'done').length} pendentes · {tasks.filter(t => t.status === 'done').length} concluídas
            </span>

            <div className="flex items-center gap-2 ml-auto">
              {/* Toolbar toggle */}
              <Button
                variant={showToolbar ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setShowToolbar(!showToolbar)}
                className="h-10 w-10 rounded-xl relative shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {hasToolbarActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>

              {/* Unified CTA */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-10 px-5 rounded-xl gap-2 shadow-lg shadow-primary/20 shrink-0">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nova Tarefa</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsNewTaskOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar manualmente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsAISheetOpen(true)}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Criar com IA
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Collapsible Toolbar — Ferramentas */}
          {showToolbar && (
            <div className="glass-card rounded-2xl p-3 animate-fade-in">
              <div className="flex flex-wrap gap-2 items-center">
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-lg" onClick={() => setShowAnalysis(true)}>
                  <BarChart3 className="w-3.5 h-3.5" /> Análise IA
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-lg" onClick={() => setShowExecutionGuide(true)}>
                  <Brain className="w-3.5 h-3.5" /> Modo Foco
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-lg" onClick={() => setShowPrioritySuggestions(true)}>
                  <Sparkles className="w-3.5 h-3.5" /> Prioridades
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-lg" onClick={() => setShowDeadlineSuggestions(true)}>
                  <CalendarIcon className="w-3.5 h-3.5" /> Prazos
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-lg" onClick={() => setShowDuplicates(true)}>
                  <CheckSquare className="w-3.5 h-3.5" /> Duplicatas
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-lg" onClick={() => setIsTemplateOpen(true)}>
                  <FileText className="w-3.5 h-3.5" /> Templates
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-lg" onClick={() => setIsAutomationOpen(true)}>
                  <Zap className="w-3.5 h-3.5" /> Automações
                </Button>

                <div className="w-px h-5 bg-border mx-1" />

                <Button
                  variant="ghost" size="sm"
                  className="h-8 gap-1.5 text-xs rounded-lg"
                  onClick={() => setShowDailyPlan(true)}
                >
                  <Lightbulb className="w-3.5 h-3.5" /> Plano do Dia
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="h-8 gap-1.5 text-xs rounded-lg"
                  onClick={() => bulkArchiveDone()}
                  disabled={isArchiving || tasks.filter(t => t.status === 'done').length === 0}
                >
                  {isArchiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                  Arquivar Concluídas
                </Button>
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 gap-1.5 text-xs rounded-lg text-destructive hover:text-destructive"
                      disabled={isDeleting || tasks.filter(t => t.status === 'done').length === 0}
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Apagar Concluídas
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apagar tarefas concluídas?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso vai excluir permanentemente {tasks.filter(t => t.status === 'done').length} tarefa(s) concluída(s). Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => bulkDeleteDone()}
                      >
                        Apagar permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="w-px h-5 bg-border mx-1" />

                <Button
                  variant="ghost" size="sm"
                  className="h-8 gap-1.5 text-xs rounded-lg"
                  onClick={() => exportTasks()}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                  Exportar PDF
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* AI Daily Summary — always collapsible */}
        {viewMode !== 'dashboard' && viewMode !== 'focus' && (
          <TaskAIDailySummary />
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'focus' ? (
          <SavedFocusPlans />
        ) : viewMode === 'calendar' ? (
          <TasksCalendarView
            tasks={tasks}
            onEditTask={handleEditTask}
            onCreateTask={(date) => {
              setTaskForm({ ...defaultTaskForm, due_date: date });
              setIsNewTaskOpen(true);
            }}
          />
        ) : viewMode === 'board' ? (
          <TasksBoardView
            tasks={tasks}
            onEditTask={handleEditTask}
            onToggleComplete={toggleComplete}
            onDeleteTask={deleteTask}
            onMoveTask={moveTask}
            onReorder={(taskId, newPos) => updateTask(taskId, { position: newPos } as any)}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        ) : viewMode === 'dashboard' ? (
          <TasksDashboardBI tasks={tasks} stats={stats} />
        ) : viewMode === 'timeline' ? (
          <TasksTimeline tasks={tasks} onEditTask={handleEditTask} />
        ) : viewMode === 'gantt' ? (
          <TaskGanttView tasks={tasks} onEditTask={handleEditTask} />
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

        {/* Archived Tasks */}
        <ArchivedTasksSection
          archivedTasks={archivedTasks}
          isLoading={isLoadingArchived}
          onRestore={restoreTask}
          onDeletePermanently={deleteArchivedTask}
        />

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
                      <SelectItem value="urgent">🔥 Urgente</SelectItem>
                      <SelectItem value="high">↑ Alta</SelectItem>
                      <SelectItem value="normal">— Normal</SelectItem>
                      <SelectItem value="low">↓ Baixa</SelectItem>
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
                <Label>Projeto (opcional)</Label>
                <Select value={taskForm.project_id || '_none'} onValueChange={(v) => setTaskForm({ ...taskForm, project_id: v === '_none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Sem projeto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sem projeto</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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

        {/* Template Manager */}
        <TaskTemplateManager
          open={isTemplateOpen}
          onOpenChange={setIsTemplateOpen}
          onApplyTemplate={(template) => {
            setTaskForm({
              ...defaultTaskForm,
              title: template.title,
              description: template.description || '',
              category: template.category as any,
              priority: template.priority,
              tags: template.tags?.join(', ') || '',
            });
            setIsNewTaskOpen(true);
          }}
        />

        {/* Automation Manager */}
        <TaskAutomationManager open={isAutomationOpen} onOpenChange={setIsAutomationOpen} />

        {/* AI Sheet */}
        <Sheet open={isAISheetOpen} onOpenChange={handleAISheetChange}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Criar Tarefas com IA
              </SheetTitle>
            </SheetHeader>
            {previewTasks ? (
              /* Step 2: Preview */
              <div className="py-6">
                <TaskAIPreviewPanel
                  tasks={previewTasks}
                  isRegenerating={isGeneratingLocal}
                  isConfirming={isConfirmingAI}
                  onConfirm={handleConfirmAITasks}
                  onRegenerate={handleGenerateFromAI}
                  onBack={() => setPreviewTasks(null)}
                />
              </div>
            ) : (
              /* Step 1: Input */
              <>
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
                            {uf.file.type.startsWith('image/') ? <Image className="w-3.5 h-3.5 text-primary shrink-0" /> :
                             uf.file.type.startsWith('audio/') ? <Music className="w-3.5 h-3.5 text-primary shrink-0" /> :
                             <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                            <span className="truncate flex-1">{uf.file.name}</span>
                            {uf.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                            {uf.status === 'done' && <span className="text-primary text-[10px] font-medium">✓</span>}
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
                        rows={6}
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

                  {/* Guidance Prompt */}
                  <div>
                    <Label>Orientação para a IA (opcional)</Label>
                    <Textarea
                      value={aiGuidancePrompt}
                      onChange={(e) => setAiGuidancePrompt(e.target.value)}
                      placeholder="Ex: Priorize tarefas urgentes, ignore itens já feitos, use categoria 'projeto' para entregas..."
                      rows={2}
                      className="text-sm mt-1"
                    />
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
                  <Button onClick={handleGenerateFromAI} disabled={isGeneratingLocal || isRecording || isProcessingUploads || isConfirmingAI || (!aiText.trim() && uploadedFiles.length === 0)}>
                    {isGeneratingLocal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Gerar Tarefas
                  </Button>
                </SheetFooter>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* External tool components rendered outside dropdown */}
        <TaskAnalysisPanel tasks={tasks} externalOpen={showAnalysis} onExternalOpenChange={setShowAnalysis} />
        <TaskExecutionGuide
          tasks={tasks}
          externalOpen={showExecutionGuide}
          onExternalOpenChange={setShowExecutionGuide}
          onComplete={(id) => {
            const t = tasks.find(t => t.id === id);
            if (t) updateTask(id, { status: 'done', completed_at: new Date().toISOString() } as any);
          }}
        />
        <TaskAIPrioritySuggestions externalOpen={showPrioritySuggestions} onExternalOpenChange={setShowPrioritySuggestions} />
        <TaskAIDeadlineSuggestions externalOpen={showDeadlineSuggestions} onExternalOpenChange={setShowDeadlineSuggestions} />
        <TaskDuplicateDetection externalOpen={showDuplicates} onExternalOpenChange={setShowDuplicates} />
        <DailyPlanDialog
          open={showDailyPlan}
          onOpenChange={setShowDailyPlan}
          tasks={tasks}
          onApply={(taskIds) => {
            taskIds.forEach((id, i) => {
              updateTask(id, { status: 'today', position: i } as any);
            });
          }}
        />
      </div>
    </DashboardLayout>
  );
}
