import { useNotifications } from '@/hooks/useNotifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeColors: Record<string, string> = {
  info: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
};

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.04] transition-all">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-xs font-semibold uppercase tracking-wider">Notificações</span>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate()}
              className="text-[10px] text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" /> Marcar todas
            </button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs">
              Nenhuma notificação
            </div>
          ) : (
            notifications.slice(0, 20).map(n => (
              <button
                key={n.id}
                onClick={() => !n.read && markAsRead.mutate(n.id)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors flex gap-3',
                  !n.read && 'bg-primary/5'
                )}
              >
                <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', typeColors[n.type] || typeColors.info)} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                  {n.message && <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>}
                  <p className="text-[9px] text-muted-foreground/60 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {!n.read && <Check className="w-3 h-3 text-primary/40 mt-1 flex-shrink-0" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
