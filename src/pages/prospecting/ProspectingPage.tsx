import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useProspectingStore } from "@/stores/prospectingStore";
import { Link } from "react-router-dom";
import { 
  Users, Target, MessageSquare, TrendingUp, 
  AlertTriangle, CheckCircle, Clock, ArrowRight,
  Phone, Mail, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OPPORTUNITY_STAGES, ACTIVITY_TYPES } from "@/types/prospecting";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = "text-primary" 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: string;
  color?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-medium text-foreground">{value}</p>
    </div>
  );
}

function TodayActivityCard({ 
  activity, 
  onComplete 
}: { 
  activity: any; 
  onComplete: () => void;
}) {
  const isOverdue = activity.due_at && new Date(activity.due_at) < new Date();
  const activityType = ACTIVITY_TYPES.find(t => t.type === activity.type);
  
  return (
    <div className={`glass-card rounded-xl p-4 border ${isOverdue ? 'border-red-500/30' : 'border-transparent'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
          }`}>
            <span className="material-symbols-outlined text-lg">{activityType?.icon || 'task'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {activity.opportunity?.prospect?.company_name || 'Prospect'}
            </p>
            {activity.due_at && (
              <p className={`text-[10px] mt-1 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                {new Date(activity.due_at).toLocaleString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={onComplete}
        >
          <CheckCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ProspectingPage() {
  const { 
    fetchProspects, 
    fetchOpportunities, 
    fetchActivities,
    fetchTodayActivities,
    completeActivity,
    getStats,
    activities,
  } = useProspectingStore();

  useEffect(() => {
    fetchProspects();
    fetchOpportunities();
    fetchActivities();
  }, []);

  const stats = getStats();
  const todayActivities = activities.filter(a => {
    if (a.completed) return false;
    if (!a.due_at) return false;
    const dueDate = new Date(a.due_at);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return dueDate <= today;
  }).sort((a, b) => {
    if (!a.due_at || !b.due_at) return 0;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <DashboardLayout title="Prospecção">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-medium text-foreground tracking-tight">
              Prospecção
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie targets, cadências e oportunidades
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/prospeccao/targets">
                <Target className="w-4 h-4 mr-2" />
                Targets
              </Link>
            </Button>
            <Button asChild>
              <Link to="/prospeccao/oportunidades">
                <TrendingUp className="w-4 h-4 mr-2" />
                Pipeline
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Targets Ativos"
            value={stats.activeProspects}
            icon={Users}
            trend={`${stats.totalProspects} total`}
          />
          <StatCard
            title="Oportunidades"
            value={stats.totalOpportunities}
            icon={Target}
            trend={`${stats.wonOpportunities} ganhas`}
            color="text-emerald-500"
          />
          <StatCard
            title="Pipeline"
            value={formatCurrency(stats.pipelineValue)}
            icon={TrendingUp}
            color="text-amber-500"
          />
          <StatCard
            title="Atividades Hoje"
            value={stats.todayActivities}
            icon={stats.overdueActivities > 0 ? AlertTriangle : Clock}
            trend={stats.overdueActivities > 0 ? `${stats.overdueActivities} atrasadas` : 'Em dia'}
            color={stats.overdueActivities > 0 ? "text-red-500" : "text-primary"}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Activities */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-medium text-foreground">Atividades de Hoje</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                  {todayActivities.length} pendentes
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/prospeccao/atividades">
                  Ver todas
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {todayActivities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Nenhuma atividade pendente para hoje</p>
                  <p className="text-[10px] mt-1">Crie novas atividades a partir de uma oportunidade</p>
                </div>
              ) : (
                todayActivities.map((activity) => (
                  <TodayActivityCard
                    key={activity.id}
                    activity={activity}
                    onComplete={() => completeActivity(activity.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Quick Actions & Pipeline Summary */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Ações Rápidas</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/prospeccao/targets">
                    <Users className="w-4 h-4 mr-3" />
                    Adicionar Targets
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/prospeccao/cadencias">
                    <MessageSquare className="w-4 h-4 mr-3" />
                    Criar Cadência
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/prospeccao/oportunidades">
                    <TrendingUp className="w-4 h-4 mr-3" />
                    Ver Pipeline
                  </Link>
                </Button>
              </div>
            </div>

            {/* Pipeline Summary */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Pipeline por Estágio</h3>
              <div className="space-y-3">
                {OPPORTUNITY_STAGES.filter(s => !['won', 'lost'].includes(s.type)).map((stage) => {
                  const count = useProspectingStore.getState().getOpportunitiesByStage(stage.type).length;
                  return (
                    <div key={stage.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                        <span className="text-sm text-muted-foreground">{stage.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
