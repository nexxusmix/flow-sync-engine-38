import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDailySummaryMetrics } from '@/hooks/useDailySummaryMetrics';
import { useTasksUnified } from '@/hooks/useTasksUnified';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Sparkles, RefreshCw, AlertTriangle, TrendingUp, Users, Calendar as CalendarIcon,
  DollarSign, CheckCircle, Clock, Mail, FileText, Target, CircleDot,
  MessageSquare, Copy, ExternalLink, Phone, Pause, X, Check, Plus, ListTodo
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DailySummaryHistory } from './DailySummaryHistory';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'trending-up': TrendingUp,
  'users': Users,
  'calendar': CalendarIcon,
  'dollar-sign': DollarSign,
  'alert-triangle': AlertTriangle,
  'check-circle': CheckCircle,
  'clock': Clock,
  'mail': Mail,
  'file-text': FileText,
  'target': Target,
  'message-square': MessageSquare,
  'phone': Phone,
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  positive: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  warning: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  negative: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
  neutral: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
};

const urgencyColors: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-destructive/15', text: 'text-destructive' },
  medium: { bg: 'bg-muted', text: 'text-muted-foreground' },
  low: { bg: 'bg-primary/15', text: 'text-primary' },
};

interface SummaryHighlight {
  icon: string;
  label: string;
  value: string;
  status: string;
  detail: string;
}

interface ClientAction {
  client_name: string;
  reason: string;
  suggested_message: string;
  urgency: string;
  channel: string;
}

interface SummaryData {
  greeting: string;
  highlights: SummaryHighlight[];
  action_items: string[];
  client_actions?: ClientAction[];
}

interface SummaryAction {
  id: string;
  action_key: string;
  decision: string;
  standby_until: string | null;
}

// Simple hash for deduplication
function hashKey(type: string, text: string): string {
  const str = `${type}:${text.toLowerCase().trim().slice(0, 80)}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return `sa_${Math.abs(h).toString(36)}`;
}

// ── Entity extraction ──
function extractEntities(text: string): string[] {
  const entities: string[] = [];
  // Names in quotes
  const quoteRegex = /"([^"]+)"/g;
  let m;
  while ((m = quoteRegex.exec(text)) !== null) entities.push(m[1]);
  // Uppercase words (project-like names) — at least 2 consecutive uppercase words or uppercase+number
  const upperRegex = /\b([A-ZÀ-Ú][A-ZÀ-Ú0-9]+(?:\s+[A-ZÀ-Ú0-9]+)*(?:\s+\d+)?)\b/g;
  while ((m = upperRegex.exec(text)) !== null) {
    const val = m[1].trim();
    if (val.length > 2 && !['PORTO', 'TODO', 'ASAP', 'CRM', 'ROI', 'KPI'].includes(val) && !entities.includes(val)) {
      entities.push(val);
    }
  }
  return entities;
}

interface ProjectMatch { id: string; name: string; }

// ── Quick Task Creator ──
function QuickTaskCreator({ actionText, onCreated }: {
  actionText: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const { createTasksFromAI } = useTasksUnified();

  // Fetch projects for matching
  const { data: projects } = useQuery({
    queryKey: ['projects-names-for-tasks'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name');
      return (data || []) as ProjectMatch[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const entities = useMemo(() => extractEntities(actionText), [actionText]);

  const matchedProjects = useMemo(() => {
    if (!projects || entities.length === 0) return [];
    return entities
      .map(entity => {
        const match = projects.find(p =>
          p.name.toLowerCase().includes(entity.toLowerCase()) ||
          entity.toLowerCase().includes(p.name.toLowerCase())
        );
        return match ? { entity, project: match } : { entity, project: null };
      })
      .filter(m => m !== null);
  }, [entities, projects]);

  const createSingleTask = async () => {
    setCreating(true);
    try {
      const projectMatch = matchedProjects.find(m => m.project);
      await createTasksFromAI([{
        title: actionText.length > 120 ? actionText.slice(0, 117) + '...' : actionText,
        description: actionText,
        status: 'today',
        category: 'operacao',
        tags: ['polo-ai'],
        priority: 'high',
        due_date: new Date().toISOString().split('T')[0],
        position: 0,
        ...(projectMatch?.project ? { project_id: projectMatch.project.id } : {}),
      } as any]);
      toast.success('Tarefa criada com sucesso!', { description: 'Adicionada ao "Hoje"' });
      setOpen(false);
      onCreated();
    } catch {
      toast.error('Erro ao criar tarefa');
    } finally {
      setCreating(false);
    }
  };

  const createEntityTask = async (entity: string) => {
    setCreating(true);
    try {
      const match = matchedProjects.find(m => m.entity === entity);
      await createTasksFromAI([{
        title: `Acompanhar ${entity}`,
        description: `Ação recomendada pela IA: ${actionText}`,
        status: 'today',
        category: 'operacao',
        tags: ['polo-ai'],
        priority: 'high',
        due_date: new Date().toISOString().split('T')[0],
        position: 0,
        ...(match?.project ? { project_id: match.project.id } : {}),
      } as any]);
      toast.success(`Tarefa criada: ${entity}`, { description: 'Adicionada ao "Hoje"' });
      // Don't close if there are more entities
      if (entities.length <= 1) {
        setOpen(false);
        onCreated();
      }
    } catch {
      toast.error('Erro ao criar tarefa');
    } finally {
      setCreating(false);
    }
  };

  const createAllTasks = async () => {
    setCreating(true);
    try {
      const tasks = entities.map((entity, i) => {
        const match = matchedProjects.find(m => m.entity === entity);
        return {
          title: `Acompanhar ${entity}`,
          description: `Ação recomendada pela IA: ${actionText}`,
          status: 'today' as const,
          category: 'operacao' as const,
          tags: ['polo-ai'],
          priority: 'high',
          due_date: new Date().toISOString().split('T')[0],
          position: i,
          ...(match?.project ? { project_id: match.project.id } : {}),
        };
      });
      await createTasksFromAI(tasks as any);
      toast.success(`${tasks.length} tarefas criadas!`, { description: 'Adicionadas ao "Hoje"' });
      setOpen(false);
      onCreated();
    } catch {
      toast.error('Erro ao criar tarefas');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-primary hover:text-primary/80 hover:bg-primary/10"
          title="Criar tarefa"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end" side="top">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-2 py-1">
            Criar como tarefa
          </p>

          {/* Single task option */}
          <button
            onClick={createSingleTask}
            disabled={creating}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted/50 transition-colors text-left"
          >
            <ListTodo className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="truncate">Tarefa única</span>
          </button>

          {/* Individual entity tasks */}
          {entities.length > 0 && (
            <>
              <div className="h-px bg-border/50 mx-1" />
              {entities.map((entity, i) => {
                const match = matchedProjects.find(m => m.entity === entity);
                return (
                  <button
                    key={i}
                    onClick={() => createEntityTask(entity)}
                    disabled={creating}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted/50 transition-colors text-left"
                  >
                    <Target className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="truncate block">Acompanhar {entity}</span>
                      {match?.project && (
                        <span className="text-[10px] text-muted-foreground">→ {match.project.name}</span>
                      )}
                    </div>
                  </button>
                );
              })}

              {entities.length > 1 && (
                <>
                  <div className="h-px bg-border/50 mx-1" />
                  <button
                    onClick={createAllTasks}
                    disabled={creating}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-primary font-medium hover:bg-primary/10 transition-colors text-left"
                  >
                    <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Criar todas ({entities.length})</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Metrics text builder ──
function buildMetricsText(m: ReturnType<typeof useDailySummaryMetrics>): string {
  const dealsOverdueText = m.dealsActionOverdue.length > 0
    ? m.dealsActionOverdue.map(d => `${d.name} - ${d.next_action}`).join(', ')
    : 'Nenhum';
  const hotStaleText = m.dealsHotStale.length > 0
    ? m.dealsHotStale.map(d => `${d.name} (${d.days}d sem ação)`).join(', ')
    : 'Nenhum';
  const proposalsText = m.proposalsWaiting.length > 0
    ? m.proposalsWaiting.map(p => `${p.client_name} (há ${p.days}d)`).join(', ')
    : 'Nenhuma';
  const noTouchText = m.contactsNoTouch30d.length > 0
    ? m.contactsNoTouch30d.map(c => `${c.name} (${c.days}d)`).join(', ')
    : 'Nenhum';
  const contractsText = m.contractsExpiring15d.length > 0
    ? m.contractsExpiring15d.map(c => `${c.client_name} - vence ${c.end_date}`).join(', ')
    : 'Nenhum';
  const overdueProjectsText = m.projectsOverdue.length > 0
    ? m.projectsOverdue.map(p => `${p.name} (${p.days}d atrasado)`).join(', ')
    : 'Nenhum';
  const inactiveText = m.projectsInactive7d.length > 0
    ? m.projectsInactive7d.map(p => `${p.name} (${p.days}d sem atividade)`).join(', ')
    : 'Nenhum';

  return `Dados completos do workspace:

COMERCIAL:
- Leads novos (7d): ${m.newLeads}
- Deals com ação vencida: ${m.dealsActionOverdue.length} (${dealsOverdueText})
- Deals quentes parados: ${m.dealsHotStale.length} (${hotStaleText})
- Propostas aguardando resposta >3d: ${m.proposalsWaiting.length} (${proposalsText})
- Propostas enviadas (30d): ${m.sentProposals}

CLIENTES / RELACIONAMENTO:
- Clientes sem contato >30d: ${m.contactsNoTouch30d.length} (${noTouchText})
- Contratos vencendo em 15d: ${m.contractsExpiring15d.length} (${contractsText})
- Mensagens não respondidas (inbox aberto): ${m.inboxUnanswered}
- Clientes ativos: ${m.activeClients}
- Respostas recebidas (7d): ${m.inboundReplies}

OPERACIONAL:
- Entregas próximos 7d: ${m.upcomingDeliveries}
- Projetos atrasados: ${m.projectsOverdue.length} (${overdueProjectsText})
- Projetos inativos >7d: ${m.projectsInactive7d.length} (${inactiveText})
- Reuniões hoje: ${m.meetingsToday}, amanhã: ${m.meetingsTomorrow}

FINANCEIRO:
- A receber próximos 7d: R$${m.pendingPayments7d.toLocaleString('pt-BR')}
- Atrasados: R$${m.overduePaymentsTotal.toLocaleString('pt-BR')} (${m.overduePayments} parcelas)
- Pipeline aberto total: R$${m.pipelineOpenTotal.toLocaleString('pt-BR')}

IMPORTANTE: Ao mencionar projetos ou clientes específicos nas ações recomendadas, coloque os nomes entre aspas duplas para facilitar a extração. Ex: Priorizar "PORTO 153" e "Fazenda da Matta".

Gere o resumo executivo com highlights, ações e mensagens sugeridas para clientes que precisam de atenção.`;
}

function getWhatsAppLink(phone: string | undefined, message: string): string {
  const text = encodeURIComponent(message);
  if (!phone) return `https://wa.me/?text=${text}`;
  const clean = phone.replace(/\D/g, '');
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  return isMobile ? `whatsapp://send?phone=${clean}&text=${text}` : `https://wa.me/${clean}?text=${text}`;
}

// ── Action Buttons Component ──
function ActionButtons({ actionKey, actionType, actionText, metadata, onDecided }: {
  actionKey: string;
  actionType: 'action_item' | 'client_action';
  actionText: string;
  metadata?: Record<string, unknown>;
  onDecided: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [standbyDate, setStandbyDate] = useState<Date>();
  const [standbyOpen, setStandbyOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ decision, standbyUntil }: { decision: string; standbyUntil?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('daily_summary_actions').insert({
        user_id: user.id,
        action_type: actionType,
        action_text: actionText,
        action_key: actionKey,
        decision,
        standby_until: standbyUntil || null,
        metadata: metadata || {},
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['daily-summary-actions'] });
      const labels: Record<string, string> = { done: '✅ Marcado como feito', dismissed: '❌ Ação recusada', standby: '⏸️ Adiado' };
      toast.success(labels[vars.decision] || 'Salvo');
      onDecided();
    },
    onError: () => toast.error('Erro ao salvar decisão'),
  });

  const handleStandbyConfirm = () => {
    if (!standbyDate) return;
    mutation.mutate({ decision: 'standby', standbyUntil: standbyDate.toISOString() });
    setStandbyOpen(false);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-1.5 text-primary hover:text-primary/80 hover:bg-primary/10"
        onClick={() => mutation.mutate({ decision: 'done' })}
        disabled={mutation.isPending}
        title="Marcar como feito"
      >
        <Check className="w-3 h-3" />
      </Button>

      <Popover open={standbyOpen} onOpenChange={setStandbyOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            disabled={mutation.isPending}
            title="Adiar (Stand By)"
          >
            <Pause className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <p className="text-xs text-muted-foreground mb-2">Relembrar em:</p>
          <Calendar
            mode="single"
            selected={standbyDate}
            onSelect={setStandbyDate}
            disabled={(d) => d < new Date()}
            className={cn("p-2 pointer-events-auto")}
            locale={ptBR}
          />
          {standbyDate && (
            <Button size="sm" className="w-full mt-2 text-xs" onClick={handleStandbyConfirm}>
              Adiar até {format(standbyDate, "dd/MM/yyyy")}
            </Button>
          )}
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-1.5 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
        onClick={() => mutation.mutate({ decision: 'dismissed' })}
        disabled={mutation.isPending}
        title="Recusar"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}

export function AIDailySummary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const [decidedKeys, setDecidedKeys] = useState<Set<string>>(new Set());
  const metrics = useDailySummaryMetrics();

  // Fetch existing decisions
  const { data: existingActions } = useQuery({
    queryKey: ['daily-summary-actions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('daily_summary_actions')
        .select('id, action_key, decision, standby_until')
        .eq('user_id', user.id) as any;
      if (error) throw error;
      return (data || []) as SummaryAction[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Build set of hidden action keys
  const hiddenKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!existingActions) return keys;
    const now = new Date();
    for (const a of existingActions) {
      if (a.decision === 'done' || a.decision === 'dismissed') {
        keys.add(a.action_key);
      } else if (a.decision === 'standby' && a.standby_until) {
        if (new Date(a.standby_until) > now) keys.add(a.action_key);
      }
    }
    return keys;
  }, [existingActions]);

  const markDecided = useCallback((key: string) => {
    setDecidedKeys(prev => new Set(prev).add(key));
  }, []);

  const { data: rawSummary, isLoading, isFetching, error } = useQuery({
    queryKey: ['ai-daily-summary', user?.id, refreshKey],
    queryFn: async () => {
      if (!user?.id) return null;
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return null;

      const metricsText = buildMetricsText(metrics);

      // Include past decisions for AI context
      let pastActionsText = '';
      if (existingActions && existingActions.length > 0) {
        const doneItems = existingActions.filter(a => a.decision === 'done').length;
        const dismissedItems = existingActions.filter(a => a.decision === 'dismissed').length;
        if (doneItems > 0 || dismissedItems > 0) {
          pastActionsText = `\n\nHISTÓRICO DE DECISÕES DO USUÁRIO (NÃO repita estas ações):\n- ${doneItems} ações já concluídas\n- ${dismissedItems} ações recusadas pelo usuário`;
        }
      }

      const { data, error } = await supabase.functions.invoke('polo-ai-chat', {
        body: {
          message: `${metricsText}${pastActionsText}\n\nGere o resumo executivo do dia baseado nesses dados.`,
          context: { type: 'daily_summary' },
        },
      });

      if (error) {
        const msg = error?.message || '';
        if (msg.includes('402') || msg.includes('CREDITS_EXHAUSTED') || msg.includes('payment')) {
          throw new Error('CREDITS_EXHAUSTED');
        }
        throw error;
      }
      return data?.response || data?.message || null;
    },
    enabled: !!user?.id && !metrics.isLoading,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const summary: SummaryData | null = useMemo(() => {
    if (!rawSummary) return null;
    try {
      let cleaned = typeof rawSummary === 'string'
        ? rawSummary.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        : rawSummary;
      if (typeof cleaned === 'string') {
        const jsonStart = cleaned.indexOf('{');
        if (jsonStart > 0) cleaned = cleaned.substring(jsonStart);
      }
      const parsed = typeof cleaned === 'string' ? JSON.parse(cleaned) : cleaned;
      if (parsed?.highlights && Array.isArray(parsed.highlights)) return parsed;
      return null;
    } catch {
      return null;
    }
  }, [rawSummary]);

  // Filter visible items
  const visibleActionItems = useMemo(() => {
    if (!summary?.action_items) return [];
    return summary.action_items.filter(item => {
      const key = hashKey('action_item', item);
      return !hiddenKeys.has(key) && !decidedKeys.has(key);
    });
  }, [summary, hiddenKeys, decidedKeys]);

  const visibleClientActions = useMemo(() => {
    if (!summary?.client_actions) return [];
    return summary.client_actions.filter(action => {
      const key = hashKey('client_action', `${action.client_name}:${action.reason}`);
      return !hiddenKeys.has(key) && !decidedKeys.has(key);
    });
  }, [summary, hiddenKeys, decidedKeys]);

  const totalActions = (summary?.action_items?.length || 0) + (summary?.client_actions?.length || 0);
  const completedActions = totalActions - visibleActionItems.length - visibleClientActions.length;

  const isCreditsError = error?.message === 'CREDITS_EXHAUSTED' ||
    (error?.message && (error.message.includes('402') || error.message.includes('payment')));

  const copyMessage = (msg: string) => {
    navigator.clipboard.writeText(msg);
    toast.success('Mensagem copiada!');
  };

  return (
    <motion.div
      className="glass-card rounded-2xl p-6 border-l-4 border-primary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Resumo do Dia — Visão 360°</h3>
          <span className="text-micro bg-primary/15 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Polo AI</span>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={isFetching}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading || isFetching || metrics.isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </motion.div>
          <p className="text-xs text-muted-foreground">Analisando dados completos do workspace...</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p>
            {isCreditsError
              ? 'Créditos de IA esgotados. Adicione créditos ao workspace para reativar o resumo diário.'
              : 'Não foi possível gerar o resumo. Tente novamente mais tarde.'}
          </p>
        </div>
      ) : summary ? (
        <div className="space-y-5">
          {/* Greeting */}
          <motion.p
            className="text-xs text-muted-foreground leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {summary.greeting}
          </motion.p>

          {/* Highlight Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {summary.highlights.slice(0, 9).map((h, i) => {
              const colors = statusColors[h.status] || statusColors.neutral;
              const IconComp = iconMap[h.icon] || CircleDot;
              return (
                <motion.div
                  key={i}
                  className={`rounded-xl p-3 border ${colors.border} ${colors.bg} transition-all hover:scale-[1.02]`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.06 }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <IconComp className={`w-3.5 h-3.5 ${colors.text}`} />
                    <span className="text-mono text-muted-foreground font-medium uppercase tracking-wide">{h.label}</span>
                  </div>
                  <p className={`text-sm font-semibold ${colors.text}`}>{h.value}</p>
                  <p className="text-mono text-muted-foreground mt-0.5 leading-tight">{h.detail}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Action Items with buttons + Quick Task Creator */}
          {(visibleActionItems.length > 0 || completedActions > 0) && (
            <motion.div
              className="space-y-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between">
                <p className="text-mono text-muted-foreground font-medium uppercase tracking-wide">Ações recomendadas</p>
                {totalActions > 0 && (
                  <span className="text-caption text-muted-foreground">
                    {completedActions} de {totalActions} concluídas
                  </span>
                )}
              </div>
              <AnimatePresence>
                {visibleActionItems.map((item) => {
                  const key = hashKey('action_item', item);
                  return (
                    <motion.div
                      key={key}
                      className="flex items-center justify-between gap-2 text-xs text-muted-foreground group"
                      initial={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <CheckCircle className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 flex items-center gap-0.5">
                        <QuickTaskCreator
                          actionText={item}
                          onCreated={() => markDecided(key)}
                        />
                        <ActionButtons
                          actionKey={key}
                          actionType="action_item"
                          actionText={item}
                          onDecided={() => markDecided(key)}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Client Actions with buttons */}
          {visibleClientActions.length > 0 && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                <p className="text-mono text-muted-foreground font-medium uppercase tracking-wide">Clientes para Contatar</p>
              </div>

              <AnimatePresence>
                {visibleClientActions.map((action) => {
                  const key = hashKey('client_action', `${action.client_name}:${action.reason}`);
                  const urgency = urgencyColors[action.urgency] || urgencyColors.medium;
                  return (
                    <motion.div
                      key={key}
                      className="rounded-xl border border-border/50 bg-card/50 p-3 space-y-2"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{action.client_name}</span>
                          <span className={`text-caption px-1.5 py-0.5 rounded-full font-medium uppercase ${urgency.bg} ${urgency.text}`}>
                            {action.urgency === 'high' ? 'Alta' : action.urgency === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-caption text-muted-foreground capitalize mr-1">{action.channel}</span>
                          <QuickTaskCreator
                            actionText={`Contatar ${action.client_name}: ${action.reason}`}
                            onCreated={() => markDecided(key)}
                          />
                          <ActionButtons
                            actionKey={key}
                            actionType="client_action"
                            actionText={`${action.client_name}:${action.reason}`}
                            metadata={{ client_name: action.client_name, urgency: action.urgency }}
                            onDecided={() => markDecided(key)}
                          />
                        </div>
                      </div>

                      <p className="text-mono text-muted-foreground">{action.reason}</p>

                      <div className="bg-muted/30 rounded-lg p-2">
                        <p className="text-body-sm text-foreground/80 leading-relaxed">{action.suggested_message}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyMessage(action.suggested_message)}
                          className="flex items-center gap-1 text-mono text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          Copiar
                        </button>
                        {action.channel === 'whatsapp' && (
                          <a
                            href={getWhatsAppLink(undefined, action.suggested_message)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-mono text-primary hover:text-primary/80 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      ) : rawSummary && !summary ? (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p>Formato inesperado. Clique em atualizar para tentar novamente.</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Sem dados para resumo.</p>
      )}

      {/* Action History */}
      <DailySummaryHistory />
    </motion.div>
  );
}
