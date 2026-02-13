import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, AlertTriangle, Info, Sparkles, X, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useAlerts, type Alert } from '@/hooks/useAlerts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500' },
  warning: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  info: { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', dot: 'bg-cyan-500' },
};

type TabKey = 'all' | 'critical' | 'pending' | 'sent';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('all');
  const { alerts, unreadCount, markAsRead, updateStatus } = useAlerts({ status: 'open', limit: 30 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const filteredAlerts = alerts.filter(a => {
    if (tab === 'critical') return a.severity === 'critical';
    if (tab === 'pending') return !a.read_at;
    if (tab === 'sent') return a.read_at !== null;
    return true;
  }).slice(0, 20);

  const handleSnooze = (alertId: string, hours: number) => {
    const until = new Date(Date.now() + hours * 3600000).toISOString();
    updateStatus.mutate({ alertId, status: 'snoozed', snoozedUntil: until });
    toast.success(`Adiado por ${hours}h`);
  };

  const handleResolve = (alertId: string) => {
    updateStatus.mutate({ alertId, status: 'resolved' });
    toast.success('Alerta resolvido');
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'critical', label: 'Críticas' },
    { key: 'pending', label: 'Pendentes' },
    { key: 'sent', label: 'Lidas' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 md:w-9 md:h-9 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              ref={dropdownRef}
              className="absolute right-0 top-full mt-2 w-[380px] max-h-[520px] bg-[#0a0a0f]/98 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="text-xs font-medium text-white/80 uppercase tracking-wider">Notificações</h3>
                <button
                  onClick={() => { setOpen(false); navigate('/avisos'); }}
                  className="text-[10px] text-primary hover:text-primary/80 uppercase tracking-wider"
                >
                  Ver Todos
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/[0.06]">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "flex-1 py-2 text-[10px] uppercase tracking-wider transition-colors",
                      tab === t.key ? "text-primary border-b-2 border-primary" : "text-white/30 hover:text-white/50"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {filteredAlerts.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-xs text-white/30">Nenhuma notificação</p>
                  </div>
                ) : (
                  filteredAlerts.map(alert => {
                    const config = severityConfig[alert.severity];
                    const Icon = config.icon;
                    const isUnread = !alert.read_at;

                    return (
                      <div
                        key={alert.id}
                        className={cn(
                          "px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer",
                          isUnread && "bg-white/[0.01]"
                        )}
                        onClick={() => {
                          if (isUnread) markAsRead.mutate(alert.id);
                          if (alert.action_url) navigate(alert.action_url);
                        }}
                      >
                        <div className="flex gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                            <Icon className={cn("w-4 h-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn("text-xs font-medium truncate", isUnread ? "text-white/90" : "text-white/50")}>
                                {alert.title}
                              </p>
                              {isUnread && <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1", config.dot)} />}
                            </div>
                            {alert.message && (
                              <p className="text-[11px] text-white/30 mt-0.5 line-clamp-2">{alert.message}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-white/20">
                                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}
                                  className="text-[10px] text-emerald-400/60 hover:text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors"
                                >
                                  Resolver
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSnooze(alert.id, 1); }}
                                  className="text-[10px] text-white/20 hover:text-white/40 px-1.5 py-0.5 rounded hover:bg-white/[0.04] transition-colors"
                                >
                                  1h
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSnooze(alert.id, 24); }}
                                  className="text-[10px] text-white/20 hover:text-white/40 px-1.5 py-0.5 rounded hover:bg-white/[0.04] transition-colors"
                                >
                                  24h
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
