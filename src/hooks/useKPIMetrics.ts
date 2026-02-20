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

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const now = new Date().toISOString();

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysFromNowISO = sevenDaysFromNow.toISOString();

  const { data: leadsData, isLoading: l1 } = useQuery({
    queryKey: ["kpi-leads", user?.id],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("crm_deals")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgoISO);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: repliesData, isLoading: l2 } = useQuery({
    queryKey: ["kpi-replies", user?.id],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("inbox_messages")
        .select("id", { count: "exact", head: true })
        .eq("direction", "inbound")
        .gte("created_at", sevenDaysAgoISO);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: meetingsData, isLoading: l3 } = useQuery({
    queryKey: ["kpi-meetings", user?.id],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("calendar_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "meeting")
        .gte("start_at", now);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: proposalsData, isLoading: l4 } = useQuery({
    queryKey: ["kpi-proposals", user?.id],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("created_at", thirtyDaysAgoISO);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: paymentsData, isLoading: l5 } = useQuery({
    queryKey: ["kpi-payments", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("revenues")
        .select("amount")
        .eq("status", "pending")
        .lte("due_date", sevenDaysFromNowISO);
      if (!data) return 0;
      return (data as Array<{ amount: number }>).reduce((sum, r) => sum + (r.amount || 0), 0);
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: deliveriesData, isLoading: l6 } = useQuery({
    queryKey: ["kpi-deliveries", user?.id],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("calendar_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "delivery")
        .gte("start_at", now)
        .lte("start_at", sevenDaysFromNowISO);
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
