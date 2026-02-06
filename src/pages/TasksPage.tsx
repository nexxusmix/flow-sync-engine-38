import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Task, TASK_COLUMNS, TASK_CATEGORIES, useTasksStore } from "@/stores/tasksStore";
import { TasksBoard } from "@/components/tasks/TasksBoard";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, Sparkles, Loader2, Calendar, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface TaskFormData {
  title: string;
  description: string;
  status: Task['status'];
  category: Task['category'];
  tags: string;
  due_date: string;
}

const defaultTaskForm: TaskFormData = {
  title: '',
  description: '',
  status: 'backlog',
  category: 'operacao',
  tags: '',
  due_date: '',
};

export default function TasksPage() {
  const { tasks, isLoading, isCreating, isGenerating, fetchTasks, createTask, updateTask, createTasksFromAI } = useTasksStore();
  
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isAISheetOpen, setIsAISheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>(defaultTaskForm);
  const [aiText, setAiText] = useState('');
  const [aiCategory, setAiCategory] = useState<Task['category']>('operacao');
  const [aiColumn, setAiColumn] = useState<Task['status']>('backlog');
  const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const newTask = await createTask({
      title: taskForm.title,
      description: taskForm.description || null,
      status: taskForm.status,
      category: taskForm.category,
      tags: taskForm.tags ? taskForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      due_date: taskForm.due_date || null,
    });

    if (newTask) {
      toast.success('Tarefa criada!');
      setIsNewTaskOpen(false);
      setTaskForm(defaultTaskForm);
    } else {
      toast.error('Erro ao criar tarefa');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      category: task.category,
      tags: task.tags?.join(', ') || '',
      due_date: task.due_date || '',
    });
    setIsEditTaskOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !taskForm.title.trim()) return;

    await updateTask(editingTask.id, {
      title: taskForm.title,
      description: taskForm.description || null,
      status: taskForm.status,
      category: taskForm.category,
      tags: taskForm.tags ? taskForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      due_date: taskForm.due_date || null,
    });

    toast.success('Tarefa atualizada!');
    setIsEditTaskOpen(false);
    setEditingTask(null);
    setTaskForm(defaultTaskForm);
  };

  const handleGenerateFromAI = async () => {
    if (!aiText.trim()) {
      toast.error('Cole ou digite o texto com as tarefas');
      return;
    }

    setIsGeneratingLocal(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-tasks-from-text', {
        body: {
          rawText: aiText,
          defaultCategory: aiCategory,
          defaultColumn: aiColumn,
        }
      });

      if (error) throw error;

      if (!data?.tasks || data.tasks.length === 0) {
        toast.error('Nenhuma tarefa identificada no texto');
        return;
      }

      const count = await createTasksFromAI(data.tasks);
      toast.success(`${count} tarefas criadas!`);
      setIsAISheetOpen(false);
      setAiText('');
    } catch (err: any) {
      console.error('Error generating tasks:', err);
      toast.error(err.message || 'Erro ao gerar tarefas');
    } finally {
      setIsGeneratingLocal(false);
    }
  };

  return (
    <DashboardLayout title="Tarefas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Minhas Tarefas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tasks.filter(t => t.status !== 'done').length} pendentes • {tasks.filter(t => t.status === 'done').length} concluídas
            </p>
          </div>
          <div className="flex gap-2">
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

        {/* Board */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <TasksBoard tasks={tasks} onEditTask={handleEditTask} />
        )}

        {/* New Task Dialog */}
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="O que precisa ser feito?"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Detalhes adicionais..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Coluna</Label>
                  <Select 
                    value={taskForm.status} 
                    onValueChange={(v) => setTaskForm({ ...taskForm, status: v as Task['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_COLUMNS.map((col) => (
                        <SelectItem key={col.key} value={col.key}>{col.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Categoria</Label>
                  <Select 
                    value={taskForm.category} 
                    onValueChange={(v) => setTaskForm({ ...taskForm, category: v as Task['category'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data Limite</Label>
                  <Input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Tags (vírgula)</Label>
                  <Input
                    value={taskForm.tags}
                    onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })}
                    placeholder="urgente, cliente"
                  />
                </div>
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

        {/* Edit Task Dialog */}
        <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Coluna</Label>
                  <Select 
                    value={taskForm.status} 
                    onValueChange={(v) => setTaskForm({ ...taskForm, status: v as Task['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_COLUMNS.map((col) => (
                        <SelectItem key={col.key} value={col.key}>{col.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Categoria</Label>
                  <Select 
                    value={taskForm.category} 
                    onValueChange={(v) => setTaskForm({ ...taskForm, category: v as Task['category'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data Limite</Label>
                  <Input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Tags (vírgula)</Label>
                  <Input
                    value={taskForm.tags}
                    onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditTaskOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateTask}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Sheet */}
        <Sheet open={isAISheetOpen} onOpenChange={setIsAISheetOpen}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Criar Tarefas com IA
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-6">
              <p className="text-sm text-muted-foreground">
                Cole uma lista de tarefas, um e-mail, ou qualquer texto. A IA vai transformar em tarefas estruturadas automaticamente.
              </p>

              <div>
                <Label>Texto com tarefas</Label>
                <Textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder={`Exemplo:\n- Revisar contrato do cliente X\n- Ligar para contador sobre impostos\n- Comprar presente de aniversário\n- Reunião com equipe às 15h`}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria padrão</Label>
                  <Select value={aiCategory} onValueChange={(v) => setAiCategory(v as Task['category'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Coluna padrão</Label>
                  <Select value={aiColumn} onValueChange={(v) => setAiColumn(v as Task['status'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_COLUMNS.filter(c => c.key !== 'done').map((col) => (
                        <SelectItem key={col.key} value={col.key}>{col.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setIsAISheetOpen(false)}>Cancelar</Button>
              <Button onClick={handleGenerateFromAI} disabled={isGeneratingLocal || !aiText.trim()}>
                {isGeneratingLocal ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Gerar Tarefas
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
