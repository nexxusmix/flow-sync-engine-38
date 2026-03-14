import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InstagramCampaign, useCampaignTasks, useCampaignTaskMutations } from '@/hooks/useInstagramEngine';
import { KanbanSquare, Plus, X, GripVertical, User, AlertTriangle, Loader2 } from 'lucide-react';
import { sc } from '@/lib/colors';
import { cn } from '@/lib/utils';

interface Props {
  campaign: InstagramCampaign;
}

const COLUMNS = [
  { key: 'todo' as const, label: 'A Fazer', color: 'text-muted-foreground' },
  { key: 'doing' as const, label: 'Em Andamento', color: 'text-primary' },
  { key: 'review' as const, label: 'Revisão', color: 'text-muted-foreground' },
  { key: 'done' as const, label: 'Concluído', color: 'text-primary' },
];

export function CampaignCollaborationBoard({ campaign }: Props) {
  const { data: tasks = [], isLoading } = useCampaignTasks(campaign.id);
  const { create, update, remove } = useCampaignTaskMutations(campaign.id);
  const [newTask, setNewTask] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);

  const addTask = () => {
    if (!newTask.trim()) return;
    create.mutate({ title: newTask.trim(), status: 'todo', priority: 'normal', assignee: '', due_date: '', position: tasks.length });
    setNewTask('');
  };

  const moveTask = (taskId: string, newStatus: string) => {
    update.mutate({ id: taskId, status: newStatus } as any);
  };

  const removeTask = (taskId: string) => {
    remove.mutate(taskId);
  };

  const updatePriority = (taskId: string, priority: string) => {
    update.mutate({ id: taskId, priority } as any);
  };

  const updateAssignee = (taskId: string, assignee: string) => {
    update.mutate({ id: taskId, assignee } as any);
  };

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary/40" /></div>;
  }

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

      <div className="flex gap-2">
        <Input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Nova tarefa..."
          className="h-8 text-xs"
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <Button size="sm" className="h-8 gap-1 text-xs" onClick={addTask} disabled={create.isPending}>
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div
              key={col.key}
              className="space-y-2"
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragging) { moveTask(dragging, col.key); setDragging(null); } }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-semibold uppercase ${col.color}`}>{col.label}</span>
                <Badge variant="outline" className="text-[9px] h-4">{colTasks.length}</Badge>
              </div>

              <div className="space-y-1.5 min-h-[80px]">
                {colTasks.map(task => {
                  const prioStyle = sc.priority(task.priority);
                  return (
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
                            <Badge variant="outline" className={cn("text-[8px] h-4", prioStyle.bg, prioStyle.text)}>
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
                        <button onClick={() => removeTask(task.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex gap-1 mt-1.5 pl-4">
                        <Select value={task.priority} onValueChange={v => updatePriority(task.id, v)}>
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
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
