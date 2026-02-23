import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addDays, isPast, isBefore, differenceInDays, differenceInHours } from 'date-fns';

interface AlertDraft {
  title: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  project_id: string;
  due_at?: string;
  idempotency_key: string;
  scope: 'hub';
  channels: Record<string, boolean>;
  created_by: string;
  message?: string;
}

export function GenerateAlertsButton() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const generate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [projectsRes, portalLinksRes, meetingsRes, revisionsRes, revenuesRes] = await Promise.all([
        supabase.from('projects').select('id, name, due_date, status, health_score, stage_current, client_name, updated_at, start_date').neq('status', 'archived'),
        supabase.from('portal_links').select('id, project_id'),
        supabase.from('calendar_events').select('id, project_id, title, start_at, status').gte('start_at', new Date().toISOString()).order('start_at', { ascending: true }),
        supabase.from('portal_change_requests').select('id, portal_link_id, status, created_at').eq('status', 'pending'),
        supabase.from('revenues').select('id, project_id, status, due_date, description').in('status', ['pending', 'overdue']),
      ]);

      const projects = projectsRes.data || [];
      const portalLinks = portalLinksRes.data || [];
      const meetings = meetingsRes.data || [];
      const revisions = revisionsRes.data || [];
      const revenues = revenuesRes.data || [];

      if (!projects.length) {
        toast.info('Nenhum projeto ativo encontrado');
        setLoading(false);
        return;
      }

      // Map portal_link_id -> project_id
      const portalLinkMap = new Map(portalLinks.map((pl: any) => [pl.id, pl.project_id]));

      // Fetch deliverables via portal links
      const portalLinkIds = portalLinks.map((pl: any) => pl.id);
      const { data: deliverables } = portalLinkIds.length > 0
        ? await supabase.from('portal_deliverables').select('id, portal_link_id, title, status, created_at').in('portal_link_id', portalLinkIds)
        : { data: [] };

      const now = new Date();
      const in7days = addDays(now, 7);
      const in3days = addDays(now, 3);
      const alertsToCreate: AlertDraft[] = [];

      for (const p of projects) {
        const pid = p.id;
        const isActive = p.status !== 'concluido' && p.status !== 'completed';

        // ─── 1. PRAZOS DO PROJETO ───
        if (p.due_date && isActive) {
          const dueDate = new Date(p.due_date);
          const daysUntil = differenceInDays(dueDate, now);

          if (isPast(dueDate)) {
            const daysLate = Math.abs(daysUntil);
            alertsToCreate.push({
              title: `⚠️ Prazo vencido há ${daysLate}d: ${p.name}`,
              type: 'deadline_overdue',
              severity: 'critical',
              project_id: pid,
              due_at: p.due_date,
              idempotency_key: `deadline_overdue_${pid}`,
              scope: 'hub',
              channels: { in_app: true },
              created_by: user.id,
              message: `O projeto "${p.name}" está ${daysLate} dia(s) atrasado. Cliente: ${p.client_name || 'N/A'}.`,
            });
          } else if (isBefore(dueDate, in3days)) {
            alertsToCreate.push({
              title: `🔴 Prazo em ${daysUntil}d: ${p.name}`,
              type: 'deadline_due',
              severity: 'critical',
              project_id: pid,
              due_at: p.due_date,
              idempotency_key: `deadline_due_urgent_${pid}`,
              scope: 'hub',
              channels: { in_app: true },
              created_by: user.id,
              message: `Faltam apenas ${daysUntil} dia(s) para o prazo. Etapa: ${p.stage_current || 'N/A'}.`,
            });
          } else if (isBefore(dueDate, in7days)) {
            alertsToCreate.push({
              title: `🟡 Prazo próximo (${daysUntil}d): ${p.name}`,
              type: 'deadline_due',
              severity: 'warning',
              project_id: pid,
              due_at: p.due_date,
              idempotency_key: `deadline_due_${pid}`,
              scope: 'hub',
              channels: { in_app: true },
              created_by: user.id,
              message: `Prazo em ${daysUntil} dias. Planeje as entregas finais.`,
            });
          }
        }


        const projectRevenues = revenues.filter((r: any) => r.project_id === pid);
        for (const rev of projectRevenues) {
          if (rev.due_date && isPast(new Date(rev.due_date))) {
            alertsToCreate.push({
              title: `💸 Receita vencida: ${p.name} - ${rev.description || 'Parcela'}`,
              type: 'payment_overdue',
              severity: 'warning',
              project_id: pid,
              due_at: rev.due_date,
              idempotency_key: `revenue_overdue_${rev.id}`,
              scope: 'hub',
              channels: { in_app: true },
              created_by: user.id,
              message: `Receita "${rev.description || 'Parcela'}" venceu em ${rev.due_date}.`,
            });
          } else if (rev.due_date && isBefore(new Date(rev.due_date), in7days)) {
            alertsToCreate.push({
              title: `📅 Receita próxima: ${p.name} - ${rev.description || 'Parcela'}`,
              type: 'payment_due',
              severity: 'info',
              project_id: pid,
              due_at: rev.due_date,
              idempotency_key: `revenue_due_${rev.id}`,
              scope: 'hub',
              channels: { in_app: true },
              created_by: user.id,
            });
          }
        }

        // ─── 3. SAÚDE CRÍTICA ───
        if (p.health_score != null && p.health_score < 50 && isActive) {
          alertsToCreate.push({
            title: `🏥 Saúde crítica (${p.health_score}%): ${p.name}`,
            type: 'risk_health_drop',
            severity: p.health_score < 30 ? 'critical' : 'warning',
            project_id: pid,
            idempotency_key: `risk_health_${pid}`,
            scope: 'hub',
            channels: { in_app: true },
            created_by: user.id,
            message: `Saúde em ${p.health_score}%. Ação imediata necessária.`,
          });
        }

        // ─── 4. ENTREGAS PENDENTES (via portal) ───
        const projectPortalLinks = portalLinks.filter((pl: any) => pl.project_id === pid);
        const projectLinkIds = projectPortalLinks.map((pl: any) => pl.id);
        const projectDeliverables = (deliverables || []).filter((d: any) => projectLinkIds.includes(d.portal_link_id));
        const pendingDeliverables = projectDeliverables.filter((d: any) => d.status === 'pending' || d.status === 'in_review' || d.status === 'awaiting_approval');
        
        if (pendingDeliverables.length >= 3) {
          alertsToCreate.push({
            title: `📦 ${pendingDeliverables.length} entrega(s) pendente(s): ${p.name}`,
            type: 'delivery_overdue',
            severity: 'warning',
            project_id: pid,
            idempotency_key: `deliverables_pending_${pid}_${pendingDeliverables.length}`,
            scope: 'hub',
            channels: { in_app: true },
            created_by: user.id,
            message: `${pendingDeliverables.length} entregas pendentes: ${pendingDeliverables.slice(0, 3).map((d: any) => d.title).join(', ')}.`,
          });
        }

        // ─── 5. REVISÕES PENDENTES ───
        const projectRevisions = revisions.filter((r: any) => projectLinkIds.includes(r.portal_link_id));
        if (projectRevisions.length > 0) {
          const oldestRevision = projectRevisions.reduce((oldest: any, r: any) =>
            new Date(r.created_at) < new Date(oldest.created_at) ? r : oldest
          );
          const waitingDays = differenceInDays(now, new Date(oldestRevision.created_at));
          alertsToCreate.push({
            title: `✏️ ${projectRevisions.length} revisão(ões) pendente(s): ${p.name}`,
            type: 'review_pending',
            severity: waitingDays >= 3 ? 'critical' : 'warning',
            project_id: pid,
            idempotency_key: `revisions_pending_${pid}_${projectRevisions.length}`,
            scope: 'hub',
            channels: { in_app: true },
            created_by: user.id,
            message: `${projectRevisions.length} revisão(ões) aguardando há ${waitingDays} dia(s).`,
          });
        }

        // ─── 6. REUNIÕES PRÓXIMAS (24h) ───
        const projectMeetings = meetings.filter((m: any) => m.project_id === pid);
        for (const m of projectMeetings) {
          const meetingDate = new Date(m.start_at);
          const hoursUntil = differenceInHours(meetingDate, now);
          if (hoursUntil > 0 && hoursUntil <= 24) {
            alertsToCreate.push({
              title: `📅 Reunião em ${hoursUntil}h: ${m.title}`,
              type: 'meeting_upcoming',
              severity: hoursUntil <= 2 ? 'critical' : 'info',
              project_id: pid,
              due_at: m.start_at,
              idempotency_key: `meeting_${m.id}`,
              scope: 'hub',
              channels: { in_app: true },
              created_by: user.id,
              message: `Reunião "${m.title}" do projeto "${p.name}" em ${hoursUntil}h.`,
            });
          }
        }

        // ─── 7. PROJETO PARADO ───
        if (isActive && p.updated_at) {
          const daysSinceUpdate = differenceInDays(now, new Date(p.updated_at));
          if (daysSinceUpdate >= 7) {
            alertsToCreate.push({
              title: `🔇 Projeto parado há ${daysSinceUpdate}d: ${p.name}`,
              type: 'production_stalled',
              severity: daysSinceUpdate >= 14 ? 'critical' : 'warning',
              project_id: pid,
              idempotency_key: `stalled_${pid}_w${Math.floor(daysSinceUpdate / 7)}`,
              scope: 'hub',
              channels: { in_app: true },
              created_by: user.id,
              message: `Sem atualizações há ${daysSinceUpdate} dias. Verifique bloqueios.`,
            });
          }
        }

        // ─── 8. SEM CONTATO COM CLIENTE ───
        if (isActive && p.client_name) {
          const { count } = await supabase
            .from('client_messages')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', pid)
            .gte('created_at', addDays(now, -14).toISOString());

          if (count === 0) {
            alertsToCreate.push({
              title: `📵 Sem contato com cliente: ${p.name}`,
              type: 'no_client_contact',
              severity: 'warning',
              project_id: pid,
              idempotency_key: `no_contact_${pid}`,
              scope: 'hub',
              channels: { in_app: true },
              created_by: user.id,
              message: `Nenhuma mensagem ao cliente "${p.client_name}" nos últimos 14 dias.`,
            });
          }
        }
      }

      if (!alertsToCreate.length) {
        toast.info('✅ Tudo em dia! Nenhum alerta necessário.');
        setLoading(false);
        return;
      }

      // Insert alerts avoiding duplicates
      let created = 0;
      for (const alert of alertsToCreate) {
        const { data: existing } = await supabase
          .from('alerts')
          .select('id')
          .eq('idempotency_key', alert.idempotency_key)
          .eq('status', 'open' as any)
          .maybeSingle();

        if (!existing) {
          const { error } = await supabase.from('alerts').insert([alert as any]);
          if (!error) created++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(`${created} aviso(s) criado(s) de ${alertsToCreate.length} detectado(s)`);
    } catch (err) {
      console.error('Error generating alerts:', err);
      toast.error('Erro ao gerar avisos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="gap-2">
      <Sparkles className="w-4 h-4" />
      {loading ? 'Analisando...' : 'Gerar Avisos Inteligentes'}
    </Button>
  );
}
