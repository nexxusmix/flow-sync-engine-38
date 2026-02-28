import { AlertTriangle, Calendar, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmergencyBannerProps {
  productivityScore: number;
  velocityPerDay: number;
  backlogClearDate: string | null;
  tasksPending: number;
}

export function EmergencyBanner({ productivityScore, velocityPerDay, backlogClearDate, tasksPending }: EmergencyBannerProps) {
  const isEmergency = productivityScore < 70 && velocityPerDay < 1;
  if (!isEmergency) return null;

  const daysToBacklog = velocityPerDay > 0 ? Math.ceil(tasksPending / velocityPerDay) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-destructive/40 bg-destructive/10 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="text-sm font-semibold text-destructive uppercase tracking-wide">
            Estado de Emergência Operacional
          </h3>
          <p className="text-sm text-foreground">
            O que você vai <strong>cortar ou delegar</strong> hoje?
          </p>
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingDown className="w-3.5 h-3.5 text-destructive" />
              <span>Score: <strong className="text-destructive">{productivityScore}</strong>/100</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingDown className="w-3.5 h-3.5 text-destructive" />
              <span>Velocity: <strong className="text-destructive">{velocityPerDay.toFixed(1)}</strong>/dia</span>
            </div>
            {daysToBacklog && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 text-destructive" />
                <span>Backlog zero em: <strong className="text-destructive">{daysToBacklog} dias</strong></span>
              </div>
            )}
            {backlogClearDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>Previsão: <strong>{backlogClearDate}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
