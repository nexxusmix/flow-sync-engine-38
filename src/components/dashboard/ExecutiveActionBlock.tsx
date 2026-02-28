import { Card } from '@/components/ui/card';
import { Crosshair, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionItem {
  priority: number;
  title: string;
  reason: string;
  impact_area: string;
}

const areaLabels: Record<string, string> = {
  financeiro: '💰 Financeiro',
  operacional: '⚙️ Operacional',
  comercial: '📈 Comercial',
  capacidade: '🔥 Capacidade',
};

export function ExecutiveActionBlock({ actions }: { actions: ActionItem[] }) {
  if (!actions || actions.length === 0) return null;

  const sorted = [...actions].sort((a, b) => a.priority - b.priority).slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Crosshair className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-medium text-primary uppercase tracking-widest">O que fazer hoje</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sorted.map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="glass-card p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{action.priority}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-muted-foreground">{areaLabels[action.impact_area] || action.impact_area}</span>
                  </div>
                  <h4 className="text-sm font-medium text-foreground">{action.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                    <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {action.reason}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
