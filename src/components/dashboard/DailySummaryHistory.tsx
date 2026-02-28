import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, Check, X, Pause, RotateCcw, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryAction {
  id: string;
  action_key: string;
  action_text: string;
  action_type: string;
  decision: string;
  standby_until: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
}

const decisionConfig: Record<string, { label: string; icon: typeof Check; color: string; bg: string }> = {
  done: { label: 'Concluída', icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  dismissed: { label: 'Recusada', icon: X, color: 'text-red-400', bg: 'bg-red-500/10' },
  standby: { label: 'Adiada', icon: Pause, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

const filterOptions = [
  { key: 'all', label: 'Todas' },
  { key: 'done', label: 'Concluídas' },
  { key: 'dismissed', label: 'Recusadas' },
  { key: 'standby', label: 'Adiadas' },
];

export function DailySummaryHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState('all');

  const { data: actions, isLoading } = useQuery({
    queryKey: ['daily-summary-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('daily_summary_actions')
        .select('id, action_key, action_text, action_type, decision, standby_until, created_at, metadata')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100) as any;
      if (error) throw error;
      return (data || []) as HistoryAction[];
    },
    enabled: !!user?.id && expanded,
    staleTime: 1000 * 60 * 2,
  });

  const revertMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_summary_actions')
        .delete()
        .eq('id', id) as any;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-summary-history'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary-actions'] });
      toast.success('Ação revertida — voltará a aparecer no resumo');
    },
    onError: () => toast.error('Erro ao reverter ação'),
  });

  const filtered = (actions || []).filter(a => filter === 'all' || a.decision === filter);

  return (
    <div className="border-t border-border/50 mt-4 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <History className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-mono text-muted-foreground font-medium uppercase tracking-wide group-hover:text-foreground transition-colors">
          Histórico de Ações
        </span>
        {actions && actions.length > 0 && (
          <span className="text-caption bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
            {actions.length}
          </span>
        )}
        <span className="ml-auto">
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Filters */}
            <div className="flex items-center gap-1.5 mt-3 mb-3">
              <Filter className="w-3 h-3 text-muted-foreground" />
              {filterOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setFilter(opt.key)}
                  className={`text-caption px-2 py-1 rounded-full transition-colors ${
                    filter === opt.key
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Carregando histórico...</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                {filter === 'all' ? 'Nenhuma decisão registrada ainda.' : 'Nenhuma ação com esse filtro.'}
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {filtered.map((action) => {
                  const config = decisionConfig[action.decision] || decisionConfig.done;
                  const Icon = config.icon;
                  const isStandbyActive = action.decision === 'standby' && action.standby_until && new Date(action.standby_until) > new Date();

                  return (
                    <motion.div
                      key={action.id}
                      className="flex items-start gap-2 text-xs group rounded-lg p-2 hover:bg-muted/30 transition-colors"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className={`w-5 h-5 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-3 h-3 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground/80 leading-relaxed break-words">
                          {action.action_text}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-caption ${config.color}`}>{config.label}</span>
                          {action.created_at && (
                            <span className="text-caption text-muted-foreground">
                              {format(new Date(action.created_at), "dd/MM · HH:mm", { locale: ptBR })}
                            </span>
                          )}
                          {isStandbyActive && action.standby_until && (
                            <span className="text-caption text-amber-400">
                              até {format(new Date(action.standby_until), "dd/MM", { locale: ptBR })}
                            </span>
                          )}
                          {action.action_type === 'client_action' && action.metadata && (
                            <span className="text-caption text-muted-foreground">
                              · {(action.metadata as any).client_name || 'Cliente'}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                        onClick={() => revertMutation.mutate(action.id)}
                        disabled={revertMutation.isPending}
                        title="Reverter — ação voltará a aparecer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
