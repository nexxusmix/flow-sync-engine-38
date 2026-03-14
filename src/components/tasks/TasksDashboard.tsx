import { useMemo } from 'react';
import { Task } from '@/hooks/useTasksUnified';
import { useExecutionPlans } from '@/hooks/useExecutionPlans';
import { DailyPlanWidget } from '@/components/tasks/DailyPlanWidget';
import { Card } from '@/components/ui/card';
import { 
  CheckCircle2, Clock, AlertTriangle, ListTodo,
  TrendingUp, User, Briefcase, FolderKanban
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { isToday, isPast, parseISO, format, addDays, isWithinInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TasksDashboardProps {
  tasks: Task[];
}

const STATUS_COLORS: Record<string, string> = {
  backlog: 'hsl(var(--muted-foreground))',
  week: 'hsl(var(--primary))',
  today: 'hsl(45, 93%, 47%)',
  done: 'hsl(142, 76%, 36%)',
};

const CATEGORY_COLORS: Record<string, string> = {
  pessoal: 'hsl(280, 60%, 50%)',
  operacao: 'hsl(var(--primary))',
  projeto: 'hsl(200, 80%, 50%)',
};

export function TasksDashboard({ tasks }: TasksDashboardProps) {
  const { plans, getPlanForTask } = useExecutionPlans();
  const today = startOfDay(new Date());
  
  const metrics = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status !== 'done').length;
    const overdue = tasks.filter(t => 
      t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'done'
    ).length;
    const completedToday = tasks.filter(t => 
      t.completed_at && isToday(parseISO(t.completed_at))
    ).length;
    
    return { total, pending, overdue, completedToday };
  }, [tasks]);

  const statusData = useMemo(() => {
    const counts = { backlog: 0, week: 0, today: 0, done: 0 };
    tasks.forEach(t => { counts[t.status]++; });
    return [
      { name: 'Backlog', value: counts.backlog, fill: STATUS_COLORS.backlog },
      { name: 'Semana', value: counts.week, fill: STATUS_COLORS.week },
      { name: 'Hoje', value: counts.today, fill: STATUS_COLORS.today },
      { name: 'Concluído', value: counts.done, fill: STATUS_COLORS.done },
    ];
  }, [tasks]);

  const categoryData = useMemo(() => {
    const counts = { pessoal: 0, operacao: 0, projeto: 0 };
    tasks.forEach(t => { counts[t.category]++; });
    return [
      { name: 'Pessoal', value: counts.pessoal, fill: CATEGORY_COLORS.pessoal },
      { name: 'Operação', value: counts.operacao, fill: CATEGORY_COLORS.operacao },
      { name: 'Projeto', value: counts.projeto, fill: CATEGORY_COLORS.projeto },
    ].filter(d => d.value > 0);
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    const next7Days = addDays(today, 7);
    return tasks
      .filter(t => 
        t.due_date && 
        t.status !== 'done' &&
        isWithinInterval(parseISO(t.due_date), { start: today, end: next7Days })
      )
      .sort((a, b) => 
        new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
      )
      .slice(0, 6);
  }, [tasks, today]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pessoal': return <User className="w-3 h-3" />;
      case 'operacao': return <Briefcase className="w-3 h-3" />;
      case 'projeto': return <FolderKanban className="w-3 h-3" />;
      default: return null;
    }
  };

  const todayTasks = useMemo(() => 
    tasks.filter(t => t.status === 'today'), [tasks]
  );

  return (
    <div className="space-y-6">
      {/* Daily Plan Widget */}
      <DailyPlanWidget todayTasks={todayTasks} plans={plans} getPlanForTask={getPlanForTask} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metrics.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metrics.pending}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metrics.overdue}</p>
              <p className="text-xs text-muted-foreground">Vencidas</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metrics.completedToday}</p>
              <p className="text-xs text-muted-foreground">Concluídas Hoje</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Bar Chart */}
        <Card className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">Tarefas por Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Pie Chart */}
        <Card className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Por Categoria</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              Sem tarefas
            </div>
          )}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {categoryData.map(cat => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.fill }} />
                <span className="text-xs text-muted-foreground">{cat.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Upcoming Tasks Timeline */}
      <Card className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">Próximos 7 Dias</h3>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </div>
        {upcomingTasks.length > 0 ? (
          <div className="space-y-3">
            {upcomingTasks.map(task => {
              const dueDate = parseISO(task.due_date!);
              const isOverdue = isPast(dueDate);
              const isDueToday = isToday(dueDate);
              
              return (
                <div 
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div 
                    className="w-1 h-10 rounded-full" 
                    style={{ backgroundColor: CATEGORY_COLORS[task.category] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className={`text-xs ${
                          isOverdue ? 'text-red-500' : 
                          isDueToday ? 'text-amber-500' : 
                          'text-muted-foreground'
                        }`}
                      >
                        {format(dueDate, "dd 'de' MMM", { locale: ptBR })}
                      </span>
                      <span className="text-muted-foreground">
                        {getCategoryIcon(task.category)}
                      </span>
                    </div>
                  </div>
                  {isOverdue && (
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma tarefa com prazo nos próximos 7 dias
          </div>
        )}
      </Card>
    </div>
  );
}
