import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useKPIMetrics } from '@/hooks/useKPIMetrics';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function AIDailySummary() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const kpi = useKPIMetrics();

  const { data: summary, isLoading, isFetching, error } = useQuery({
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

  const isCreditsError = error?.message === 'CREDITS_EXHAUSTED' || 
    (error?.message && (error.message.includes('402') || error.message.includes('payment')));

  return (
    <motion.div
      className="glass-card rounded-2xl p-6 border-l-4 border-primary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="flex items-center justify-between mb-3">
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
      {isLoading || kpi.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
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
      ) : (
        <div className="text-xs text-muted-foreground leading-relaxed prose prose-sm prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-0.5">
          <ReactMarkdown>{summary || 'Clique em atualizar para gerar o resumo.'}</ReactMarkdown>
        </div>
      )}
    </motion.div>
  );
}
