import { useMemo } from 'react';
import { Task } from '@/hooks/useTasksUnified';
import { Card } from '@/components/ui/card';
import { Calendar, AlertTriangle, CheckCircle2, User, Briefcase, FolderKanban } from 'lucide-react';
import { format, parseISO, isToday, isPast, addDays, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TasksTimelineProps {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
}

const CATEGORY_CONFIG = {
  pessoal: { icon: User, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  operacao: { icon: Briefcase, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  projeto: { icon: FolderKanban, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
};

export function TasksTimeline({ tasks, onEditTask }: TasksTimelineProps) {
  const today = startOfDay(new Date());
  
  const groupedTasks = useMemo(() => {
    const days: { date: Date; tasks: Task[] }[] = [];
    
    // Get next 14 days
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const dayTasks = tasks.filter(t => 
        t.due_date && 
        t.status !== 'done' &&
        isSameDay(parseISO(t.due_date), date)
      );
      
      if (dayTasks.length > 0) {
        days.push({ date, tasks: dayTasks });
      }
    }
    
    // Also add overdue tasks
    const overdueTasks = tasks.filter(t => 
      t.due_date && 
      t.status !== 'done' &&
      isPast(parseISO(t.due_date)) &&
      !isToday(parseISO(t.due_date))
    );
    
    if (overdueTasks.length > 0) {
      days.unshift({ date: new Date(0), tasks: overdueTasks }); // Use epoch as marker for overdue
    }
    
    return days;
  }, [tasks, today]);

  const getDateLabel = (date: Date) => {
    if (date.getTime() === 0) return 'Vencidas';
    if (isToday(date)) return 'Hoje';
    if (isSameDay(date, addDays(today, 1))) return 'Amanhã';
    return format(date, "EEEE, dd 'de' MMM", { locale: ptBR });
  };

  if (groupedTasks.length === 0) {
    return (
      <Card className="glass-card p-8 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground mb-2">Sem tarefas agendadas</h3>
        <p className="text-sm text-muted-foreground">
          Adicione datas de vencimento às suas tarefas para visualizá-las na timeline
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groupedTasks.map(({ date, tasks: dayTasks }) => {
        const isOverdue = date.getTime() === 0;
        const isTodayDate = isToday(date);
        
        return (
          <div key={date.toISOString()} className="relative">
            {/* Date Header */}
            <div className="flex items-center gap-3 mb-3">
              <div 
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isOverdue ? 'bg-red-500/10' : 
                  isTodayDate ? 'bg-primary/10' : 
                  'bg-muted'
                }`}
              >
                {isOverdue ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <Calendar className={`w-5 h-5 ${isTodayDate ? 'text-primary' : 'text-muted-foreground'}`} />
                )}
              </div>
              <div>
                <h3 
                  className={`text-sm font-medium capitalize ${
                    isOverdue ? 'text-red-500' : 
                    isTodayDate ? 'text-primary' : 
                    'text-foreground'
                  }`}
                >
                  {getDateLabel(date)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {dayTasks.length} tarefa{dayTasks.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Tasks */}
            <div className="ml-5 pl-8 border-l-2 border-border space-y-2">
              {dayTasks.map(task => {
                const catConfig = CATEGORY_CONFIG[task.category];
                const CatIcon = catConfig.icon;
                
                return (
                  <Card 
                    key={task.id}
                    onClick={() => onEditTask?.(task)}
                    className={`glass-card p-4 cursor-pointer hover:border-primary/30 transition-all ${
                      isOverdue ? 'border-red-500/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${catConfig.bg}`}>
                        <CatIcon className={`w-4 h-4 ${catConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.slice(0, 3).map(tag => (
                              <span 
                                key={tag}
                                className="px-2 py-0.5 text-mono rounded-full bg-muted text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isOverdue && (
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
