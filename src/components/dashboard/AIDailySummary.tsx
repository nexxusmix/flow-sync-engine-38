import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useKPIMetrics } from '@/hooks/useKPIMetrics';
import { motion } from 'framer-motion';
import {
  Sparkles, RefreshCw, AlertTriangle, TrendingUp, Users, Calendar,
  DollarSign, CheckCircle, Clock, Mail, FileText, Target, CircleDot
} from 'lucide-react';

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
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  positive: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  negative: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  neutral: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
};

interface SummaryHighlight {
  icon: string;
  label: string;
  value: string;
  status: string;
  detail: string;
}

interface SummaryData {
  greeting: string;
  highlights: SummaryHighlight[];
  action_items: string[];
}

export function AIDailySummary() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const kpi = useKPIMetrics();

  const { data: rawSummary, isLoading, isFetching, error } = useQuery({
    queryKey: ['ai-daily-summary', user?.id, refreshKey],
    queryFn: async () => {
      if (!user?.id) return null;

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return null;

      const metricsText = `Dados atuais do dashboard:
- Leads novos (últimos 7 dias): ${kpi.newLeads}
- Respostas recebidas: ${kpi.inboundReplies}
- Reuniões agendadas: ${kpi.upcomingMeetings}
- Propostas enviadas: ${kpi.sentProposals}
- Pagamentos pendentes (próx. 7 dias): R$${kpi.pendingPaymentsTotal.toLocaleString('pt-BR')}
- Entregas próximas: ${kpi.upcomingDeliveries}`;

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
    enabled: !!user?.id && !kpi.isLoading,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const summary: SummaryData | null = useMemo(() => {
    if (!rawSummary) return null;
    try {
      let cleaned = typeof rawSummary === 'string'
        ? rawSummary.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        : rawSummary;
      // Extract JSON object if preceded by text
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

  return (
    <motion.div
      className="glass-card rounded-2xl p-6 border-l-4 border-primary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Resumo do Dia</h3>
          <span className="text-[8px] bg-primary/15 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Polo AI</span>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={isFetching}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading || isFetching || kpi.isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </motion.div>
          <p className="text-xs text-muted-foreground">Analisando dados...</p>
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
        <div className="space-y-4">
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
            {summary.highlights.map((h, i) => {
              const colors = statusColors[h.status] || statusColors.neutral;
              const IconComp = iconMap[h.icon] || CircleDot;
              return (
                <motion.div
                  key={i}
                  className={`rounded-xl p-3 border ${colors.border} ${colors.bg} transition-all hover:scale-[1.02]`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <IconComp className={`w-3.5 h-3.5 ${colors.text}`} />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{h.label}</span>
                  </div>
                  <p className={`text-sm font-semibold ${colors.text}`}>{h.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{h.detail}</p>
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
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Ações recomendadas</p>
              {summary.action_items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
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
