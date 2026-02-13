import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addDays, isPast, isBefore } from 'date-fns';

export function GenerateAlertsButton() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const generate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch active projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, due_date, status, has_payment_block, health_score')
        .neq('status', 'archived');

      if (!projects?.length) {
        toast.info('Nenhum projeto ativo encontrado');
        setLoading(false);
        return;
      }

      const now = new Date();
      const in7days = addDays(now, 7);
      const alertsToCreate: any[] = [];

      for (const p of projects) {
        // Overdue deadline
        if (p.due_date && isPast(new Date(p.due_date)) && p.status !== 'concluido' && p.status !== 'completed') {
          alertsToCreate.push({
            title: `Prazo vencido: ${p.name}`,
            type: 'deadline_overdue' as const,
            severity: 'critical' as const,
            project_id: p.id,
            due_at: p.due_date,
            idempotency_key: `deadline_overdue_${p.id}`,
            scope: 'hub' as const,
            channels: { in_app: true },
            created_by: user.id,
          });
        }
        // Upcoming deadline (next 7 days)
        else if (p.due_date && !isPast(new Date(p.due_date)) && isBefore(new Date(p.due_date), in7days) && p.status !== 'concluido' && p.status !== 'completed') {
          alertsToCreate.push({
            title: `Prazo próximo: ${p.name}`,
            type: 'deadline_due' as const,
            severity: 'warning' as const,
            project_id: p.id,
            due_at: p.due_date,
            idempotency_key: `deadline_due_${p.id}`,
            scope: 'hub' as const,
            channels: { in_app: true },
            created_by: user.id,
          });
        }

        // Payment block
        if (p.has_payment_block) {
          alertsToCreate.push({
            title: `Pagamento bloqueado: ${p.name}`,
            type: 'payment_overdue' as const,
            severity: 'critical' as const,
            project_id: p.id,
            idempotency_key: `payment_overdue_${p.id}`,
            scope: 'hub' as const,
            channels: { in_app: true },
            created_by: user.id,
          });
        }

        // Low health
        if (p.health_score != null && p.health_score < 50) {
          alertsToCreate.push({
            title: `Saúde crítica: ${p.name} (${p.health_score}%)`,
            type: 'risk_health_drop' as const,
            severity: 'warning' as const,
            project_id: p.id,
            idempotency_key: `risk_health_${p.id}`,
            scope: 'hub' as const,
            channels: { in_app: true },
            created_by: user.id,
          });
        }
      }

      if (!alertsToCreate.length) {
        toast.info('Nenhum alerta necessário no momento');
        setLoading(false);
        return;
      }

      // Use upsert with idempotency_key to avoid duplicates
      let created = 0;
      for (const alert of alertsToCreate) {
        const { data: existing } = await supabase
          .from('alerts')
          .select('id')
          .eq('idempotency_key', alert.idempotency_key)
          .eq('status', 'open' as any)
          .maybeSingle();

        if (!existing) {
          const { error } = await supabase.from('alerts').insert(alert);
          if (!error) created++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(`${created} aviso(s) gerado(s) de ${alertsToCreate.length} detectado(s)`);
    } catch (err) {
      toast.error('Erro ao gerar avisos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="gap-2">
      <Sparkles className="w-4 h-4" />
      {loading ? 'Gerando...' : 'Gerar dos Projetos'}
    </Button>
  );
}
