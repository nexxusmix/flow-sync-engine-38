import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAlerts, type Alert } from '@/hooks/useAlerts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, isToday, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Clock, Info, Search, CheckCircle2,
  Bell, MoreVertical, Trash2, Eye, Clock3, Plus, ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { CreateAlertModal } from '@/components/alerts/CreateAlertModal';
import { GenerateAlertsButton } from '@/components/alerts/GenerateAlertsButton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Crítico' },
  warning: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Atenção' },
  info: { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Info' },
};

const typeLabels: Record<string, string> = {
  deadline_due: 'Prazo próximo', deadline_overdue: 'Prazo vencido',
  delivery_due: 'Entrega próxima', delivery_overdue: 'Entrega atrasada',
  no_client_contact: 'Sem contato', client_waiting_reply: 'Cliente aguardando',
  internal_waiting_reply: 'Aguardando interno', meeting_upcoming: 'Reunião próxima',
  meeting_followup: 'Follow-up reunião', payment_due: 'Pagamento próximo',
  payment_overdue: 'Pagamento vencido', production_stalled: 'Produção travada',
  risk_health_drop: 'Saúde crítica', materials_missing: 'Materiais faltando',
  review_pending: 'Revisão pendente', custom_reminder: 'Lembrete',
};

export default function AlertsBoardPage() {
  const { alerts, isLoading, updateStatus, deleteAlert } = useAlerts();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-alert-filter'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name').neq('status', 'archived').order('name');
      return (data || []) as Array<{ id: string; name: string }>;
    },
  });

  // Build a project name map
  const projectMap = new Map(projects.map(p => [p.id, p.name]));

  const filtered = alerts.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.message?.toLowerCase().includes(search.toLowerCase())) return false;
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (projectFilter !== 'all' && a.project_id !== projectFilter) return false;
    return true;
  });

  const overdue = filtered.filter(a => a.due_at && isPast(new Date(a.due_at)) && a.status === 'open');
  const today = filtered.filter(a => a.due_at && isToday(new Date(a.due_at)) && a.status === 'open' && !overdue.includes(a));
  const upcoming = filtered.filter(a => a.due_at && isFuture(new Date(a.due_at)) && !isToday(new Date(a.due_at)) && a.status === 'open');
  const noDue = filtered.filter(a => !a.due_at && a.status === 'open');
  const resolved = filtered.filter(a => a.status === 'resolved' || a.status === 'dismissed');

  const groups = [
    { label: 'Vencidos', items: overdue, color: 'text-red-400' },
    { label: 'Hoje', items: today, color: 'text-amber-400' },
    { label: 'Próximos', items: upcoming, color: 'text-cyan-400' },
    { label: 'Sem prazo', items: noDue, color: 'text-white/40' },
    { label: 'Resolvidos', items: resolved, color: 'text-emerald-400' },
  ].filter(g => g.items.length > 0);

  const handleResolve = (id: string) => {
    updateStatus.mutate({ alertId: id, status: 'resolved' });
    toast.success('Resolvido');
  };

  const handleSnooze = (id: string, hours: number) => {
    const until = new Date(Date.now() + hours * 3600000).toISOString();
    updateStatus.mutate({ alertId: id, status: 'snoozed', snoozedUntil: until });
    toast.success(`Adiado por ${hours}h`);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteAlert.mutate(deleteId);
      toast.success('Alerta excluído');
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout title="Quadro de Avisos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light text-foreground/90 uppercase tracking-wider">Quadro de Avisos</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {filtered.length} alertas • {overdue.length} vencidos • {today.length} hoje
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GenerateAlertsButton />
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Novo Aviso
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <Input placeholder="Buscar alertas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white/[0.02] border-white/[0.06]" />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-32 bg-white/[0.02] border-white/[0.06]"><SelectValue placeholder="Severidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
              <SelectItem value="warning">Atenção</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-white/[0.02] border-white/[0.06]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="snoozed">Adiados</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
              <SelectItem value="dismissed">Dispensados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-40 bg-white/[0.02] border-white/[0.06]"><SelectValue placeholder="Projeto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Alert Groups */}
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : groups.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">Nenhum alerta encontrado</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label} className="space-y-2">
              <h3 className={cn("text-[10px] uppercase tracking-wider font-medium", group.color)}>
                {group.label} ({group.items.length})
              </h3>
              <div className="space-y-1.5">
                {group.items.map((alert, i) => {
                  const config = severityConfig[alert.severity];
                  const Icon = config.icon;
                  const projectName = alert.project_id ? projectMap.get(alert.project_id) : null;
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        config.border, config.bg, "hover:bg-white/[0.04]"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                        <Icon className={cn("w-4 h-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 font-medium truncate">{alert.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-white/25 uppercase">{typeLabels[alert.type] || alert.type}</span>
                          {projectName && (
                            <button
                              onClick={() => navigate(`/projetos/${alert.project_id}`)}
                              className="text-[10px] text-primary/60 hover:text-primary flex items-center gap-0.5 transition-colors"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> {projectName}
                            </button>
                          )}
                          {alert.due_at && (
                            <span className="text-[10px] text-white/20">{format(new Date(alert.due_at), 'dd/MM HH:mm')}</span>
                          )}
                          <span className="text-[10px] text-white/15">
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {alert.status === 'open' && (
                          <>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-emerald-400/60 hover:text-emerald-400" onClick={() => handleResolve(alert.id)}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolver
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                  <MoreVertical className="w-3.5 h-3.5 text-white/20" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSnooze(alert.id, 1)}>
                                  <Clock3 className="w-3.5 h-3.5 mr-2" /> Adiar 1h
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSnooze(alert.id, 24)}>
                                  <Clock3 className="w-3.5 h-3.5 mr-2" /> Adiar 24h
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus.mutate({ alertId: alert.id, status: 'dismissed' })}>
                                  <Eye className="w-3.5 h-3.5 mr-2" /> Dispensar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(alert.id)}>
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <CreateAlertModal open={createOpen} onOpenChange={setCreateOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir alerta?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
