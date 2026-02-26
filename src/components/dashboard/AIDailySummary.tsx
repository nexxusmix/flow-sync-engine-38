import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDailySummaryMetrics } from '@/hooks/useDailySummaryMetrics';
import { motion } from 'framer-motion';
import {
  Sparkles, RefreshCw, AlertTriangle, TrendingUp, Users, Calendar,
  DollarSign, CheckCircle, Clock, Mail, FileText, Target, CircleDot,
  MessageSquare, Copy, ExternalLink, Phone
} from 'lucide-react';
import { toast } from 'sonner';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'trending-up': TrendingUp,
  'users': Users,
  'calendar': Calendar,
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
  positive: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  negative: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  neutral: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
};

const urgencyColors: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-red-500/15', text: 'text-red-400' },
  medium: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
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

Gere o resumo executivo com highlights, ações e mensagens sugeridas para clientes que precisam de atenção.`;
}

function getWhatsAppLink(phone: string | undefined, message: string): string {
  const text = encodeURIComponent(message);
  if (!phone) return `https://wa.me/?text=${text}`;
  const clean = phone.replace(/\D/g, '');
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  return isMobile ? `whatsapp://send?phone=${clean}&text=${text}` : `https://wa.me/${clean}?text=${text}`;
}

export function AIDailySummary() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const metrics = useDailySummaryMetrics();

  const { data: rawSummary, isLoading, isFetching, error } = useQuery({
    queryKey: ['ai-daily-summary', user?.id, refreshKey],
    queryFn: async () => {
      if (!user?.id) return null;
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return null;

      const metricsText = buildMetricsText(metrics);

      const { data, error } = await supabase.functions.invoke('polo-ai-chat', {
        body: {
          message: `${metricsText}\n\nGere o resumo executivo do dia baseado nesses dados.`,
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
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
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

          {/* Highlight Cards — up to 9 (3x3) */}
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

          {/* Action Items */}
          {summary.action_items?.length > 0 && (
            <motion.div
              className="space-y-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-mono text-muted-foreground font-medium uppercase tracking-wide">Ações recomendadas</p>
              {summary.action_items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Client Actions — Mensagens para Enviar */}
          {summary.client_actions && summary.client_actions.length > 0 && (
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

              {summary.client_actions.map((action, i) => {
                const urgency = urgencyColors[action.urgency] || urgencyColors.medium;
                return (
                  <motion.div
                    key={i}
                    className="rounded-xl border border-border/50 bg-card/50 p-3 space-y-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 + i * 0.08 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{action.client_name}</span>
                        <span className={`text-caption px-1.5 py-0.5 rounded-full font-medium uppercase ${urgency.bg} ${urgency.text}`}>
                          {action.urgency === 'high' ? 'Alta' : action.urgency === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                      <span className="text-caption text-muted-foreground capitalize">{action.channel}</span>
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
                          className="flex items-center gap-1 text-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      ) : rawSummary && !summary ? (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p>Formato inesperado. Clique em atualizar para tentar novamente.</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Sem dados para resumo.</p>
      )}
    </motion.div>
  );
}
