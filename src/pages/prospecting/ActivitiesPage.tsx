import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useProspectingStore } from "@/stores/prospectingStore";
import { ProspectActivity, ACTIVITY_TYPES, CHANNELS } from "@/types/prospecting";
import { 
  Plus, CheckCircle, Clock, AlertTriangle, 
  Calendar, Filter, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

function ActivityItem({ 
  activity, 
  onComplete,
  showOpportunity = true,
}: { 
  activity: ProspectActivity;
  onComplete: (outcome?: string) => void;
  showOpportunity?: boolean;
}) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [outcome, setOutcome] = useState('');
  
  const isOverdue = activity.due_at && new Date(activity.due_at) < new Date() && !activity.completed;
  const activityType = ACTIVITY_TYPES.find(t => t.type === activity.type);
  const opportunity = (activity as any).prospect_opportunities;
  const prospect = opportunity?.prospects;

  const handleComplete = () => {
    onComplete(outcome);
    setIsCompleting(false);
    setOutcome('');
  };

  return (
    <>
      <div className={`glass-card rounded-xl p-4 border-l-2 ${
        activity.completed ? 'border-l-emerald-500 opacity-60' : 
        isOverdue ? 'border-l-red-500' : 
        'border-l-primary'
      }`}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            activity.completed ? 'bg-emerald-500/10 text-emerald-500' :
            isOverdue ? 'bg-red-500/10 text-red-500' :
            'bg-primary/10 text-primary'
          }`}>
            <span className="material-symbols-outlined">{activityType?.icon || 'task'}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-foreground">{activity.title}</h4>
                {showOpportunity && prospect && (
                  <p className="text-[10px] text-primary font-medium uppercase tracking-wider mt-0.5">
                    {prospect.company_name}
                  </p>
                )}
                {activity.description && (
                  <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">
                    {activity.description}
                  </p>
                )}
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {activity.completed ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Concluída
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => setIsCompleting(true)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Concluir
                  </Button>
                )}
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 capitalize">
                <span className="material-symbols-outlined text-sm">{activityType?.icon}</span>
                {activityType?.name}
              </span>
              {activity.channel && (
                <span className="capitalize">
                  {CHANNELS.find(c => c.type === activity.channel)?.name || activity.channel}
                </span>
              )}
              {activity.due_at && (
                <span className={`flex items-center gap-1 ${isOverdue && !activity.completed ? 'text-red-500 font-medium' : ''}`}>
                  {isOverdue && !activity.completed ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {new Date(activity.due_at).toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>

            {/* Outcome */}
            {activity.completed && activity.outcome && (
              <div className="mt-3 p-3 rounded-lg bg-muted/30 text-[11px] text-muted-foreground">
                <span className="font-medium">Resultado:</span> {activity.outcome}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Dialog */}
      <Dialog open={isCompleting} onOpenChange={setIsCompleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Atividade</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Resultado / Notas (opcional)</Label>
            <Textarea
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="O que aconteceu? Próximos passos..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleting(false)}>Cancelar</Button>
            <Button onClick={handleComplete}>Concluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ActivitiesPage() {
  const { 
    activities, 
    opportunities,
    fetchActivities, 
    fetchOpportunities,
    completeActivity,
    createActivity,
    getOverdueActivities,
  } = useProspectingStore();

  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'completed'>('today');
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    opportunity_id: '',
    title: '',
    type: 'followup',
    channel: 'whatsapp',
    description: '',
    due_at: '',
  });

  useEffect(() => {
    fetchActivities();
    fetchOpportunities();
  }, []);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const filteredActivities = activities.filter(a => {
    if (filter === 'completed') return a.completed;
    if (filter === 'overdue') return !a.completed && a.due_at && new Date(a.due_at) < new Date();
    if (filter === 'today') return !a.completed && a.due_at && new Date(a.due_at) <= today;
    return true;
  }).sort((a, b) => {
    // Overdue first, then by due date
    if (!a.completed && !b.completed) {
      const aOverdue = a.due_at && new Date(a.due_at) < new Date();
      const bOverdue = b.due_at && new Date(b.due_at) < new Date();
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
    }
    if (!a.due_at || !b.due_at) return 0;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  const overdueCount = getOverdueActivities().length;
  const todayCount = activities.filter(a => !a.completed && a.due_at && new Date(a.due_at) <= today).length;

  const handleCompleteActivity = async (id: string, outcome?: string) => {
    await completeActivity(id, outcome);
    toast.success('Atividade concluída');
  };

  const handleCreateActivity = async () => {
    if (!newActivity.opportunity_id) {
      toast.error('Selecione uma oportunidade');
      return;
    }
    if (!newActivity.title) {
      toast.error('Título é obrigatório');
      return;
    }

    await createActivity(newActivity.opportunity_id, {
      title: newActivity.title,
      type: newActivity.type as any,
      channel: newActivity.channel as any,
      description: newActivity.description,
      due_at: newActivity.due_at || undefined,
    });

    setNewActivity({
      opportunity_id: '',
      title: '',
      type: 'followup',
      channel: 'whatsapp',
      description: '',
      due_at: '',
    });
    setIsNewActivityOpen(false);
    toast.success('Atividade criada');
  };

  return (
    <DashboardLayout title="Atividades">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Atividades</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {overdueCount > 0 && <span className="text-red-500 font-medium">{overdueCount} atrasadas • </span>}
              {todayCount} para hoje
            </p>
          </div>
          <Button onClick={() => setIsNewActivityOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Atividade
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'today', label: 'Hoje', count: todayCount },
            { key: 'overdue', label: 'Atrasadas', count: overdueCount },
            { key: 'all', label: 'Todas', count: activities.filter(a => !a.completed).length },
            { key: 'completed', label: 'Concluídas', count: activities.filter(a => a.completed).length },
          ].map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key as any)}
              className={f.key === 'overdue' && f.count > 0 ? 'border-red-500/30 text-red-500' : ''}
            >
              {f.label}
              {f.count > 0 && (
                <span className="ml-2 bg-white/10 px-1.5 py-0.5 rounded text-[10px]">{f.count}</span>
              )}
            </Button>
          ))}
        </div>

        {/* Activities List */}
        <div className="space-y-3">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Nenhuma atividade {filter === 'today' ? 'para hoje' : filter === 'overdue' ? 'atrasada' : ''}</p>
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onComplete={(outcome) => handleCompleteActivity(activity.id, outcome)}
              />
            ))
          )}
        </div>

        {/* New Activity Dialog */}
        <Dialog open={isNewActivityOpen} onOpenChange={setIsNewActivityOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Atividade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Oportunidade *</Label>
                <Select 
                  value={newActivity.opportunity_id} 
                  onValueChange={(v) => setNewActivity({ ...newActivity, opportunity_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {opportunities.filter(o => !['won', 'lost'].includes(o.stage)).map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Título *</Label>
                <Input
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  placeholder="Ex: Follow-up inicial"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select 
                    value={newActivity.type} 
                    onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((t) => (
                        <SelectItem key={t.type} value={t.type}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Canal</Label>
                  <Select 
                    value={newActivity.channel} 
                    onValueChange={(v) => setNewActivity({ ...newActivity, channel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c.type} value={c.type}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Data/Hora</Label>
                <Input
                  type="datetime-local"
                  value={newActivity.due_at}
                  onChange={(e) => setNewActivity({ ...newActivity, due_at: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  placeholder="Detalhes da atividade..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewActivityOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateActivity}>Criar Atividade</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
