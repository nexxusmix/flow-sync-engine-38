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
  Bell, MoreVertical, Trash2, Eye, Clock3, Plus, ExternalLink,
  MessageSquare, Copy, Send, Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { CreateAlertModal } from '@/components/alerts/CreateAlertModal';
import { GenerateAlertsButton } from '@/components/alerts/GenerateAlertsButton';
import { WhatsAppMessageModal } from '@/components/alerts/WhatsAppMessageModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Crítico', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.15)]' },
  warning: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Atenção', glow: '' },
  info: { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Info', glow: '' },
};

const typeIcons: Record<string, string> = {
  deadline_due: '⏰', deadline_overdue: '🔴', delivery_due: '📦', delivery_overdue: '🚨',
  no_client_contact: '📵', client_waiting_reply: '💬', payment_due: '💰', payment_overdue: '💸',
  production_stalled: '⚙️', materials_missing: '📎', review_pending: '👁️', meeting_upcoming: '📅',
  custom_reminder: '📌',
};

const typeLabels: Record<string, string> = {
  deadline_due: 'PRAZO PRÓXIMO', deadline_overdue: 'PRAZO VENCIDO',
  delivery_due: 'ENTREGA PRÓXIMA', delivery_overdue: 'ENTREGA ATRASADA',
  no_client_contact: 'SEM CONTATO', client_waiting_reply: 'CLIENTE AGUARDANDO',
  internal_waiting_reply: 'AGUARDANDO INTERNO', meeting_upcoming: 'REUNIÃO',
  meeting_followup: 'FOLLOW-UP', payment_due: 'PAGAMENTO',
  payment_overdue: 'PAGAMENTO VENCIDO', production_stalled: 'PRODUÇÃO TRAVADA',
  risk_health_drop: 'SAÚDE CRÍTICA', materials_missing: 'MATERIAIS',
  review_pending: 'REVISÃO PENDENTE', custom_reminder: 'LEMBRETE',
};

export default function AlertsBoardPage() {
  const { alerts, isLoading, updateStatus, deleteAlert } = useAlerts();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [messageAlert, setMessageAlert] = useState<Alert | null>(null);
  const navigate = useNavigate();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-alert-filter'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name').neq('status', 'archived').order('name');
      return (data || []) as Array<{ id: string; name: string }>;
    },
  });

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
    { label: 'VENCIDOS', items: overdue, color: 'text-red-400', chipClass: 'bg-red-500/20 text-red-400' },
    { label: 'HOJE', items: today, color: 'text-amber-400', chipClass: 'bg-amber-500/20 text-amber-400' },
    { label: 'PRÓXIMOS', items: upcoming, color: 'text-cyan-400', chipClass: 'bg-cyan-500/20 text-cyan-400' },
    { label: 'SEM PRAZO', items: noDue, color: 'text-white/40', chipClass: 'bg-white/5 text-white/40' },
    { label: 'RESOLVIDOS', items: resolved, color: 'text-emerald-400', chipClass: 'bg-emerald-500/20 text-emerald-400' },
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

  const handleCopyTitle = async (alert: Alert) => {
    await navigator.clipboard.writeText(alert.title + (alert.message ? `\n${alert.message}` : ''));
    toast.success('Copiado');
    await supabase.from("alert_actions" as any).insert({
      alert_id: alert.id, project_id: alert.project_id, action_type: "copy",
      payload: { content: alert.title },
    } as any);
  };

  const handleQuickWhatsApp = (alert: Alert) => {
    const text = encodeURIComponent(alert.title + (alert.message ? `\n${alert.message}` : ''));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <DashboardLayout title="Quadro de Avisos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-6 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--glow))]" />
              <h1 className="text-2xl font-light text-foreground/90 uppercase tracking-wider">Quadro de Avisos</h1>
            </div>
            <p className="text-sm text-muted-foreground/60 ml-4">
              {filtered.length} alertas • {overdue.length} vencidos • {today.length} hoje
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GenerateAlertsButton />
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/20">
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
            <SelectTrigger className="w-44 bg-white/[0.02] border-white/[0.06]"><SelectValue placeholder="Projeto" /></SelectTrigger>
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
              <div className="flex items-center gap-2">
                <h3 className={cn("text-[10px] uppercase tracking-wider font-medium font-mono", group.color)}>
                  {group.label}
                </h3>
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-mono", group.chipClass)}>
                  {group.items.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {group.items.map((alert, i) => {
                  const config = severityConfig[alert.severity];
                  const Icon = config.icon;
                  const projectName = alert.project_id ? projectMap.get(alert.project_id) : null;
                  const emoji = typeIcons[alert.type] || '📋';

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all group",
                        "bg-white/[0.01] border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.1]",
                        alert.severity === 'critical' && 'border-red-500/15 shadow-[0_0_12px_rgba(239,68,68,0.08)]',
                      )}
                    >
                      {/* Icon */}
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base", config.bg)}>
                        {emoji}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/85 font-normal truncate">{alert.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[9px] text-white/25 uppercase font-mono">{typeLabels[alert.type] || alert.type}</span>
                          {projectName && (
                            <button
                              onClick={() => navigate(`/projetos/${alert.project_id}`)}
                              className="text-[9px] text-primary/60 hover:text-primary flex items-center gap-0.5 transition-colors font-mono"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> {projectName}
                            </button>
                          )}
                          {alert.due_at && (
                            <span className={cn(
                              "text-[9px] font-mono px-1.5 py-0.5 rounded",
                              isPast(new Date(alert.due_at)) && alert.status === 'open'
                                ? "bg-red-500/15 text-red-400"
                                : isToday(new Date(alert.due_at))
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "text-white/20"
                            )}>
                              {isPast(new Date(alert.due_at)) && alert.status === 'open' ? 'VENCIDO' : 
                               isToday(new Date(alert.due_at)) ? 'HOJE' : 
                               format(new Date(alert.due_at), 'dd/MM HH:mm')}
                            </span>
                          )}
                          <span className="text-[9px] text-white/15 font-mono">
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {alert.status === 'open' && (
                          <>
                            {/* Gerar Mensagem IA */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[9px] text-primary/70 hover:text-primary hover:bg-primary/10 font-mono uppercase opacity-60 group-hover:opacity-100 transition-opacity"
                              onClick={() => setMessageAlert(alert)}
                            >
                              <Sparkles className="w-3 h-3 mr-1" /> Msg IA
                            </Button>

                            {/* Copiar */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 opacity-40 group-hover:opacity-80 transition-opacity"
                              onClick={() => handleCopyTitle(alert)}
                              title="Copiar"
                            >
                              <Copy className="w-3 h-3 text-white/40" />
                            </Button>

                            {/* WhatsApp rápido */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 opacity-40 group-hover:opacity-80 transition-opacity"
                              onClick={() => handleQuickWhatsApp(alert)}
                              title="Enviar WhatsApp (rápido)"
                            >
                              <Send className="w-3 h-3 text-emerald-400/60" />
                            </Button>

                            {/* Resolver */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[9px] text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 font-mono uppercase"
                              onClick={() => handleResolve(alert.id)}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Resolver
                            </Button>

                            {/* More */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                  <MoreVertical className="w-3.5 h-3.5 text-white/20" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-black/95 border-white/[0.06]">
                                <DropdownMenuItem onClick={() => setMessageAlert(alert)}>
                                  <Sparkles className="w-3.5 h-3.5 mr-2 text-primary" /> Gerar Mensagem IA
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/[0.04]" />
                                <DropdownMenuItem onClick={() => handleSnooze(alert.id, 1)}>
                                  <Clock3 className="w-3.5 h-3.5 mr-2" /> Adiar 1h
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSnooze(alert.id, 3)}>
                                  <Clock3 className="w-3.5 h-3.5 mr-2" /> Adiar 3h
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSnooze(alert.id, 24)}>
                                  <Clock3 className="w-3.5 h-3.5 mr-2" /> Adiar amanhã
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSnooze(alert.id, 168)}>
                                  <Clock3 className="w-3.5 h-3.5 mr-2" /> Adiar 7 dias
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/[0.04]" />
                                <DropdownMenuItem onClick={() => navigate(`/projetos/${alert.project_id}`)}>
                                  <ExternalLink className="w-3.5 h-3.5 mr-2" /> Abrir projeto
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

      <WhatsAppMessageModal
        alert={messageAlert}
        open={!!messageAlert}
        onClose={() => setMessageAlert(null)}
        onResolved={(id) => handleResolve(id)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-black/95 border-white/[0.06]">
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
