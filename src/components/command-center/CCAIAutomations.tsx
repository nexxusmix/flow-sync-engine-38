import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Bot, Zap, AlertTriangle, CheckCircle2, Clock, BarChart3 } from 'lucide-react';
import type { AutomationStats, AIUsageStats } from '@/hooks/useCommandCenter';

interface Props {
  automation: AutomationStats;
  ai: AIUsageStats;
}

export function CCAIAutomations({ automation, ai }: Props) {
  const automationCards = [
    { label: 'Execuções', value: automation.totalExecutions, icon: Zap, color: 'text-primary' },
    { label: 'Sucesso', value: automation.successCount, icon: CheckCircle2, color: 'text-primary' },
    { label: 'Falhas', value: automation.failureCount, icon: AlertTriangle, color: automation.failureCount > 0 ? 'text-destructive' : 'text-foreground' },
    { label: 'Aprovações Pendentes', value: automation.pendingApprovals, icon: Clock, color: automation.pendingApprovals > 0 ? 'text-yellow-500' : 'text-foreground' },
    { label: 'Taxa de Falha', value: `${automation.failureRate.toFixed(1)}%`, icon: BarChart3, color: automation.failureRate > 10 ? 'text-destructive' : 'text-foreground' },
  ];

  const aiCards = [
    { label: 'Execuções IA', value: ai.totalRuns, icon: Bot, color: 'text-primary' },
    { label: 'Taxa de Sucesso', value: `${ai.successRate.toFixed(1)}%`, icon: CheckCircle2, color: 'text-primary' },
    { label: 'Duração Média', value: `${(ai.avgDurationMs / 1000).toFixed(1)}s`, icon: Clock, color: 'text-foreground' },
  ];

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Automações */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-medium text-primary uppercase tracking-widest">Central de Automações</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {automationCards.map(c => (
            <Card key={c.label} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`w-4 h-4 ${c.color}`} />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{c.label}</p>
              </div>
              <p className={`text-lg font-semibold ${c.color}`}>{c.value}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* IA */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-medium text-primary uppercase tracking-widest">Inteligência Artificial</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {aiCards.map(c => (
            <Card key={c.label} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`w-4 h-4 ${c.color}`} />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{c.label}</p>
              </div>
              <p className={`text-lg font-semibold ${c.color}`}>{c.value}</p>
            </Card>
          ))}
        </div>

        {/* Top Modules */}
        {ai.topModules.length > 0 && (
          <Card className="glass-card p-4 mt-3">
            <h4 className="text-xs font-medium text-foreground mb-3">Uso por Módulo</h4>
            <div className="space-y-2">
              {ai.topModules.map(mod => (
                <div key={mod.module} className="flex items-center gap-3">
                  <span className="text-xs text-foreground capitalize flex-1">{mod.module}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (mod.count / Math.max(ai.totalRuns, 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{mod.count}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
