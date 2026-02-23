import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DailySummaryMetrics {
  // Comercial
  newLeads: number;
  dealsActionOverdue: Array<{ name: string; next_action: string }>;
  dealsHotStale: Array<{ name: string; days: number }>;
  proposalsWaiting: Array<{ client_name: string; days: number }>;

  // Relacionamento
  contactsNoTouch30d: Array<{ name: string; days: number }>;
  contractsExpiring15d: Array<{ client_name: string; end_date: string }>;
  inboxUnanswered: number;
  activeClients: number;

  // Operacional
  upcomingDeliveries: number;
  projectsOverdue: Array<{ name: string; days: number }>;
  projectsInactive7d: Array<{ name: string; days: number }>;
  meetingsToday: number;
  meetingsTomorrow: number;

  // Financeiro
  pendingPayments7d: number;
  overduePayments: number;
  overduePaymentsTotal: number;
  pipelineOpenTotal: number;

  // KPI base
  inboundReplies: number;
  sentProposals: number;

  isLoading: boolean;
}

export function useDailySummaryMetrics(): DailySummaryMetrics {
  const { user } = useAuth();

  const now = new Date();
  const todayDate = now.toISOString().split("T")[0];
  const nowISO = now.toISOString();

  const daysAgo = (d: number) => {
    const dt = new Date(now);
    dt.setDate(now.getDate() - d);
    return dt.toISOString();
  };
  const daysFromNow = (d: number) => {
    const dt = new Date(now);
    dt.setDate(now.getDate() + d);
    return dt.toISOString();
  };
  const dateFromNow = (d: number) => {
    const dt = new Date(now);
    dt.setDate(now.getDate() + d);
    return dt.toISOString().split("T")[0];
  };

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()).toISOString();
  const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const enabled = !!user;

  // 1. New leads (7d)
  const { data: newLeads, isLoading: l1 } = useQuery({
    queryKey: ["ds-leads", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("crm_deals").select("id", { count: "exact", head: true })
        .gte("created_at", daysAgo(7));
      return count ?? 0;
    },
    enabled, staleTime: 120_000,
  });

  // 2. Deals with overdue next_action
  const { data: dealsActionOverdue, isLoading: l2 } = useQuery({
    queryKey: ["ds-deals-overdue", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_deals").select("title, next_action, contact_id")
        .lte("next_action_at", nowISO)
        .not("next_action_at", "is", null)
        .not("stage_key", "in", '("won","lost")');
      return (data || []).map(d => ({ name: d.title || "Deal", next_action: d.next_action || "" }));
    },
    enabled, staleTime: 120_000,
  });

  // 3. Hot deals stale >5 days
  const { data: dealsHotStale, isLoading: l3 } = useQuery({
    queryKey: ["ds-deals-hot-stale", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_deals").select("title, updated_at")
        .eq("temperature", "hot")
        .lt("updated_at", daysAgo(5))
        .not("stage_key", "in", '("won","lost")');
      return (data || []).map(d => {
        const days = Math.floor((now.getTime() - new Date(d.updated_at).getTime()) / 86400000);
        return { name: d.title || "Deal", days };
      });
    },
    enabled, staleTime: 120_000,
  });

  // 4. Proposals waiting >3 days
  const { data: proposalsWaiting, isLoading: l4 } = useQuery({
    queryKey: ["ds-proposals-waiting", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("proposals").select("client_name, created_at")
        .eq("status", "sent")
        .lt("created_at", daysAgo(3));
      return (data || []).map(p => {
        const days = Math.floor((now.getTime() - new Date(p.created_at).getTime()) / 86400000);
        return { client_name: p.client_name || "Cliente", days };
      });
    },
    enabled, staleTime: 120_000,
  });

  // 5. Contacts no touch >30d
  const { data: contactsNoTouch30d, isLoading: l5 } = useQuery({
    queryKey: ["ds-contacts-notouch", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_contacts").select("name, updated_at")
        .lt("updated_at", daysAgo(30));
      return (data || []).map(c => {
        const days = Math.floor((now.getTime() - new Date(c.updated_at).getTime()) / 86400000);
        return { name: c.name || "Contato", days };
      }).slice(0, 10);
    },
    enabled, staleTime: 120_000,
  });

  // 6. Contracts expiring in 15d
  const { data: contractsExpiring, isLoading: l6 } = useQuery({
    queryKey: ["ds-contracts-expiring", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("contracts").select("client_name, end_date")
        .gte("end_date", todayDate)
        .lte("end_date", dateFromNow(15))
        .neq("status", "cancelled");
      return (data || []).map(c => ({ client_name: c.client_name || "Cliente", end_date: c.end_date || "" }));
    },
    enabled, staleTime: 120_000,
  });

  // 7. Inbox unanswered threads
  const { data: inboxUnanswered, isLoading: l7 } = useQuery({
    queryKey: ["ds-inbox-unanswered", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("inbox_threads").select("id", { count: "exact", head: true })
        .eq("status", "open");
      return count ?? 0;
    },
    enabled, staleTime: 120_000,
  });

  // 8. Active clients (projects em andamento)
  const { data: activeClients, isLoading: l8 } = useQuery({
    queryKey: ["ds-active-clients", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects").select("client_name")
        .in("status", ["em_andamento", "em_producao", "em_revisao"]);
      const unique = new Set((data || []).map(p => p.client_name).filter(Boolean));
      return unique.size;
    },
    enabled, staleTime: 120_000,
  });

  // 9. Upcoming deliveries (7d)
  const { data: upcomingDeliveries, isLoading: l9 } = useQuery({
    queryKey: ["ds-deliveries", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("calendar_events").select("id", { count: "exact", head: true })
        .eq("event_type", "delivery")
        .gte("start_at", nowISO).lte("start_at", daysFromNow(7));
      return count ?? 0;
    },
    enabled, staleTime: 120_000,
  });

  // 10. Projects overdue
  const { data: projectsOverdue, isLoading: l10 } = useQuery({
    queryKey: ["ds-projects-overdue", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects").select("name, due_date")
        .lt("due_date", todayDate)
        .not("status", "in", '("concluido","cancelado","arquivado")');
      return (data || []).map(p => {
        const days = Math.floor((now.getTime() - new Date(p.due_date!).getTime()) / 86400000);
        return { name: p.name, days };
      });
    },
    enabled, staleTime: 120_000,
  });

  // 11. Projects inactive >7d
  const { data: projectsInactive, isLoading: l11 } = useQuery({
    queryKey: ["ds-projects-inactive", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects").select("name, updated_at")
        .in("status", ["em_andamento", "em_producao"])
        .lt("updated_at", daysAgo(7));
      return (data || []).map(p => {
        const days = Math.floor((now.getTime() - new Date(p.updated_at).getTime()) / 86400000);
        return { name: p.name, days };
      });
    },
    enabled, staleTime: 120_000,
  });

  // 12. Meetings today
  const { data: meetingsToday, isLoading: l12 } = useQuery({
    queryKey: ["ds-meetings-today", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("calendar_events").select("id", { count: "exact", head: true })
        .eq("event_type", "meeting")
        .gte("start_at", todayStart).lt("start_at", todayEnd);
      return count ?? 0;
    },
    enabled, staleTime: 120_000,
  });

  // 13. Meetings tomorrow
  const { data: meetingsTomorrow, isLoading: l13 } = useQuery({
    queryKey: ["ds-meetings-tomorrow", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("calendar_events").select("id", { count: "exact", head: true })
        .eq("event_type", "meeting")
        .gte("start_at", tomorrowStart).lt("start_at", tomorrowEnd);
      return count ?? 0;
    },
    enabled, staleTime: 120_000,
  });

  // 14. Pending payments 7d
  const { data: pendingPayments7d, isLoading: l14 } = useQuery({
    queryKey: ["ds-payments-7d", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("revenues").select("amount")
        .in("status", ["pending", "overdue"])
        .gte("due_date", todayDate).lte("due_date", dateFromNow(7));
      return (data || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
    },
    enabled, staleTime: 120_000,
  });

  // 15. Overdue payments
  const { data: overduePaymentsData, isLoading: l15 } = useQuery({
    queryKey: ["ds-payments-overdue", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("revenues").select("amount")
        .eq("status", "overdue");
      const total = (data || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
      return { count: data?.length ?? 0, total };
    },
    enabled, staleTime: 120_000,
  });

  // 16. Pipeline open total
  const { data: pipelineTotal, isLoading: l16 } = useQuery({
    queryKey: ["ds-pipeline-total", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_deals").select("value")
        .not("stage_key", "in", '("won","lost")');
      return (data || []).reduce((s, d) => s + (Number(d.value) || 0), 0);
    },
    enabled, staleTime: 120_000,
  });

  // 17. Inbound replies (7d)
  const { data: inboundReplies, isLoading: l17 } = useQuery({
    queryKey: ["ds-replies", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("inbox_messages").select("id", { count: "exact", head: true })
        .eq("direction", "in").gte("sent_at", daysAgo(7));
      return count ?? 0;
    },
    enabled, staleTime: 120_000,
  });

  // 18. Sent proposals
  const { data: sentProposals, isLoading: l18 } = useQuery({
    queryKey: ["ds-sent-proposals", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("proposals").select("id", { count: "exact", head: true })
        .eq("status", "sent").gte("created_at", daysAgo(30));
      return count ?? 0;
    },
    enabled, staleTime: 120_000,
  });

  return {
    newLeads: newLeads ?? 0,
    dealsActionOverdue: dealsActionOverdue ?? [],
    dealsHotStale: dealsHotStale ?? [],
    proposalsWaiting: proposalsWaiting ?? [],
    contactsNoTouch30d: contactsNoTouch30d ?? [],
    contractsExpiring15d: contractsExpiring ?? [],
    inboxUnanswered: inboxUnanswered ?? 0,
    activeClients: activeClients ?? 0,
    upcomingDeliveries: upcomingDeliveries ?? 0,
    projectsOverdue: projectsOverdue ?? [],
    projectsInactive7d: projectsInactive ?? [],
    meetingsToday: meetingsToday ?? 0,
    meetingsTomorrow: meetingsTomorrow ?? 0,
    pendingPayments7d: pendingPayments7d ?? 0,
    overduePayments: overduePaymentsData?.count ?? 0,
    overduePaymentsTotal: overduePaymentsData?.total ?? 0,
    pipelineOpenTotal: pipelineTotal ?? 0,
    inboundReplies: inboundReplies ?? 0,
    sentProposals: sentProposals ?? 0,
    isLoading: l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12 || l13 || l14 || l15 || l16 || l17 || l18,
  };
}
