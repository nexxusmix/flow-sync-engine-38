import { useState } from 'react';
import { ProjectWithStages } from '@/hooks/useProjects';
import { useAlerts, type Alert } from '@/hooks/useAlerts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Clock, Info, CheckCircle2,
  Bell, MoreVertical, Trash2, Clock3, Sparkles, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { GenerateAlertsButton } from '@/components/alerts/GenerateAlertsButton';

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

interface AlertsTabProps {
  project: ProjectWithStages;
}

export function AlertsTab({ project }: AlertsTabProps) {
  const { alerts, isLoading, updateStatus, deleteAlert } = useAlerts({ projectId: project.id });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'open' | 'all'>('open');

  const filtered = alerts.filter(a => {
    if (statusFilter === 'open') return a.status === 'open';
    return true;
  });

  const openAlerts = filtered.filter(a => a.status === 'open');
  const resolvedAlerts = filtered.filter(a => a.status !== 'open');

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

  const renderAlert = (alert: Alert, i: number) => {
    const config = severityConfig[alert.severity];
    const Icon = config.icon;
    return (
      <motion.div
        key={alert.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        className={cn(
          "flex items-start gap-3 p-3.5 rounded-xl border transition-colors",
          config.border, config.bg, "hover:bg-white/[0.04]"
        )}
      >
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", config.bg)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/90 font-medium">{alert.title}</p>
          {alert.message && (
            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{alert.message}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground/50 uppercase">{typeLabels[alert.type] || alert.type}</span>
            {alert.due_at && (
              <span className={cn("text-[10px]", isPast(new Date(alert.due_at)) ? 'text-red-400' : 'text-muted-foreground/40')}>
                {format(new Date(alert.due_at), 'dd/MM HH:mm')}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/30">
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
                    <MoreVertical className="w-3.5 h-3.5 text-muted-foreground/30" />
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
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Avisos do Projeto</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {openAlerts.length} aberto(s) • Atualização em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={statusFilter === 'open' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('open')}
            className="h-7 text-xs"
          >
            Abertos
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            className="h-7 text-xs"
          >
            Todos
          </Button>
          <GenerateAlertsButton />
        </div>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center glass-card rounded-xl">
          <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground/50">Nenhum aviso para este projeto</p>
          <p className="text-xs text-muted-foreground/30 mt-1">Clique em "Gerar Avisos" para analisar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {openAlerts.length > 0 && (
            <div className="space-y-1.5">
              {openAlerts.map((a, i) => renderAlert(a, i))}
            </div>
          )}
          {statusFilter === 'all' && resolvedAlerts.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-wider text-emerald-400/60 font-medium pt-3">
                Resolvidos ({resolvedAlerts.length})
              </p>
              <div className="space-y-1.5 opacity-60">
                {resolvedAlerts.map((a, i) => renderAlert(a, i))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
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
    </div>
  );
}
