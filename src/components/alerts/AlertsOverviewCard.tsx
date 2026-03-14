import { useAlerts } from '@/hooks/useAlerts';
import { AlertTriangle, Clock, Info, Bell, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  warning: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10' },
};

export function AlertsOverviewCard() {
  const { alerts, unreadCount, criticalCount } = useAlerts({ status: 'open', limit: 5 });
  const navigate = useNavigate();

  const openAlerts = alerts.filter(a => a.status === 'open').slice(0, 5);
  const overdueCount = alerts.filter(a => a.due_at && new Date(a.due_at) < new Date() && a.status === 'open').length;
  const waitingCount = alerts.filter(a => (a.type === 'client_waiting_reply' || a.type === 'no_client_contact') && a.status === 'open').length;

  if (openAlerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-medium text-white/70 uppercase tracking-wider">Alertas & Próximas Ações</h3>
        </div>
        <button
          onClick={() => navigate('/avisos')}
          className="text-[10px] text-primary hover:text-primary/80 uppercase tracking-wider flex items-center gap-1"
        >
          Ver todos <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {criticalCount > 0 && (
          <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive text-[10px] font-medium">
            {criticalCount} críticos
          </span>
        )}
        {overdueCount > 0 && (
          <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-[10px] font-medium">
            {overdueCount} atrasados
          </span>
        )}
        {waitingCount > 0 && (
          <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-medium">
            {waitingCount} sem contato
          </span>
        )}
        <span className="px-2 py-1 rounded-md bg-white/[0.04] text-white/30 text-[10px] font-medium">
          {unreadCount} não lidos
        </span>
      </div>

      {/* Top 5 */}
      <div className="space-y-1">
        {openAlerts.map(alert => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;
          return (
            <div
              key={alert.id}
              onClick={() => navigate('/avisos')}
              className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors"
            >
              <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", config.color)} />
              <span className="text-xs text-white/60 flex-1 truncate">{alert.title}</span>
              <span className="text-[10px] text-white/20 flex-shrink-0">
                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
