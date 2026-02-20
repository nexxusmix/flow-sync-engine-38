import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface KPIMetrics {
  newLeads: number;
  inboundReplies: number;
  upcomingMeetings: number;
  sentProposals: number;
  pendingPaymentsTotal: number;
  upcomingDeliveries: number;
  isLoading: boolean;
}

export function useKPIMetrics(): KPIMetrics {
  const { user } = useAuth();

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const nowISO = now.toISOString();
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
  const sevenDaysFromNowISO = sevenDaysFromNow.toISOString();

  // Leads Novos: crm_deals criados nos últimos 7 dias
  const { data: leadsData, isLoading: l1 } = useQuery({
    queryKey: ["kpi-leads", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("crm_deals")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgoISO);
      if (error) console.warn("KPI leads error:", error.message);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  // Respostas: inbox_messages com direction = 'inbound' nos últimos 7 dias
  // inbox_messages usa sent_at em vez de created_at
  const { data: repliesData, isLoading: l2 } = useQuery({
    queryKey: ["kpi-replies", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("inbox_messages")
        .select("id", { count: "exact", head: true })
        .eq("direction", "in")
        .gte("sent_at", sevenDaysAgoISO);
      if (error) console.warn("KPI replies error:", error.message);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  // Calls: calendar_events com event_type = 'meeting' agendadas no futuro
  const { data: meetingsData, isLoading: l3 } = useQuery({
    queryKey: ["kpi-meetings", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("calendar_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "meeting")
        .gte("start_at", nowISO);
      if (error) console.warn("KPI meetings error:", error.message);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  // Propostas Enviadas: proposals com status = 'sent' nos últimos 30 dias
  const { data: proposalsData, isLoading: l4 } = useQuery({
    queryKey: ["kpi-proposals", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("created_at", thirtyDaysAgoISO);
      if (error) console.warn("KPI proposals error:", error.message);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  // Pagamentos Previstos: soma de revenues com status pending/overdue vencendo nos próximos 7 dias
  const { data: paymentsData, isLoading: l5 } = useQuery({
    queryKey: ["kpi-payments", user?.id],
    queryFn: async () => {
      const todayDate = now.toISOString().split("T")[0]; // date only for due_date (date column)
      const sevenDaysFromNowDate = sevenDaysFromNow.toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("revenues")
        .select("amount")
        .in("status", ["pending", "overdue"])
        .lte("due_date", sevenDaysFromNowDate)
        .gte("due_date", todayDate);
      if (error) console.warn("KPI payments error:", error.message);
      if (!data) return 0;
      return (data as Array<{ amount: number }>).reduce(
        (sum, r) => sum + (Number(r.amount) || 0),
        0
      );
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  // Entregas: calendar_events com event_type = 'delivery' nos próximos 7 dias
  const { data: deliveriesData, isLoading: l6 } = useQuery({
    queryKey: ["kpi-deliveries", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("calendar_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "delivery")
        .gte("start_at", nowISO)
        .lte("start_at", sevenDaysFromNowISO);
      if (error) console.warn("KPI deliveries error:", error.message);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  return {
    newLeads: leadsData ?? 0,
    inboundReplies: repliesData ?? 0,
    upcomingMeetings: meetingsData ?? 0,
    sentProposals: proposalsData ?? 0,
    pendingPaymentsTotal: paymentsData ?? 0,
    upcomingDeliveries: deliveriesData ?? 0,
    isLoading: l1 || l2 || l3 || l4 || l5 || l6,
  };
}
