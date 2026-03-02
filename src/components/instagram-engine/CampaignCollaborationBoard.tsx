import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstagramCampaign } from '@/hooks/useInstagramEngine';
import { KanbanSquare, Plus, X, GripVertical, Clock, User, CheckCircle, Circle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaign: InstagramCampaign;
}

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueDate: string;
}

const COLUMNS = [
  { key: 'todo' as const, label: 'A Fazer', color: 'text-muted-foreground' },
  { key: 'doing' as const, label: 'Em Andamento', color: 'text-blue-400' },
  { key: 'review' as const, label: 'Revisão', color: 'text-amber-400' },
  { key: 'done' as const, label: 'Concluído', color: 'text-emerald-400' },
];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-400/10 text-red-400',
  high: 'bg-amber-400/10 text-amber-400',
  normal: 'bg-blue-400/10 text-blue-400',
  low: 'bg-muted/20 text-muted-foreground',
};

const DEFAULT_TASKS: Task[] = [
  { id: '1', title: 'Definir briefing visual', assignee: '', status: 'todo', priority: 'high', dueDate: '' },
  { id: '2', title: 'Gravar vídeos', assignee: '', status: 'todo', priority: 'normal', dueDate: '' },
  { id: '3', title: 'Editar conteúdos', assignee: '', status: 'todo', priority: 'normal', dueDate: '' },
  { id: '4', title: 'Escrever legendas', assignee: '', status: 'todo', priority: 'normal', dueDate: '' },
  { id: '5', title: 'Aprovação final', assignee: '', status: 'todo', priority: 'high', dueDate: '' },
];

export function CampaignCollaborationBoard({ campaign }: Props) {
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [newTask, setNewTask] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, {
      id: Date.now().toString(),
      title: newTask.trim(),
      assignee: '',
      status: 'todo',
      priority: 'normal',
      dueDate: '',
    }]);
    setNewTask('');
    toast.success('Tarefa adicionada');
  };

  const moveTask = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const updatePriority = (taskId: string, priority: Task['priority']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority } : t));
  };

  const updateAssignee = (taskId: string, assignee: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignee } : t));
  };

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KanbanSquare className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Collaboration Board</h3>
          <Badge variant="outline" className="text-[10px]">{completedCount}/{tasks.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-muted/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground">{progress}%</span>
        </div>
      </div>

      {/* Add task */}
      <div className="flex gap-2">
        <Input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Nova tarefa..."
          className="h-8 text-xs"
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <Button size="sm" className="h-8 gap-1 text-xs" onClick={addTask}>
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </Button>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-4 gap-3">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div
              key={col.key}
              className="space-y-2"
              onDragOver={e => e.preventDefault()}
              onDrop={() => {
                if (dragging) {
                  moveTask(dragging, col.key);
                  setDragging(null);
                }
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-semibold uppercase ${col.color}`}>{col.label}</span>
                <Badge variant="outline" className="text-[9px] h-4">{colTasks.length}</Badge>
              </div>

              <div className="space-y-1.5 min-h-[80px]">
                {colTasks.map(task => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => setDragging(task.id)}
                    className="p-2 bg-card/50 border-border/30 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical className="w-3 h-3 text-muted-foreground/30 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-foreground leading-tight">{task.title}</p>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <Badge variant="outline" className={`text-[8px] h-4 ${PRIORITY_COLORS[task.priority]}`}>
                            {task.priority === 'urgent' && <AlertTriangle className="w-2 h-2 mr-0.5" />}
                            {task.priority}
                          </Badge>
                          {task.assignee && (
                            <Badge variant="outline" className="text-[8px] h-4">
                              <User className="w-2 h-2 mr-0.5" /> {task.assignee}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <button onClick={() => removeTask(task.id)} className="text-muted-foreground/30 hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-1 mt-1.5 pl-4">
                      <Select value={task.priority} onValueChange={v => updatePriority(task.id, v as Task['priority'])}>
                        <SelectTrigger className="h-5 text-[8px] w-16 px-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={task.assignee}
                        onChange={e => updateAssignee(task.id, e.target.value)}
                        placeholder="@quem"
                        className="h-5 text-[8px] flex-1 px-1"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
