import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useEffect } from "react";
import { DEFAULT_WORKSPACE_ID } from "@/constants/workspace";

// ── Types ──────────────────────────────────────────────────
export type InboxPriority = "low" | "medium" | "high" | "critical";
export type InboxItemStatus = "unread" | "read" | "in_progress" | "resolved" | "archived";
export type InboxSourceModule = "crm" | "projects" | "contracts" | "finance" | "portal" | "automations" | "tasks" | "system";
export type InboxItemType = "notification" | "approval" | "message" | "alert" | "error" | "reminder" | "task" | "event";

export interface InboxItem {
  id: string;
  workspace_id: string;
  source_module: InboxSourceModule;
  source_entity_type: string | null;
  source_entity_id: string | null;
  item_type: InboxItemType;
  title: string;
  summary: string | null;
  payload_json: Record<string, any>;
  priority: InboxPriority;
  status: InboxItemStatus;
  requires_approval: boolean;
  requires_action: boolean;
  assigned_to: string | null;
  client_id: string | null;
  project_id: string | null;
  automation_id: string | null;
  created_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  archived_at: string | null;
  snoozed_until: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface InboxItemAction {
  id: string;
  inbox_item_id: string;
  action_type: string;
  action_data: Record<string, any>;
  performed_by: string | null;
  note: string | null;
  created_at: string;
}

export interface InboxFilters {
  status?: InboxItemStatus | "all";
  priority?: InboxPriority | "all";
  source_module?: InboxSourceModule | "all";
  item_type?: InboxItemType | "all";
  assigned_to?: string | "all" | "me";
  search?: string;
  view?: "all" | "pending" | "critical" | "approvals" | "messages" | "automations" | "finance" | "projects" | "crm" | "archived";
}

// ── Constants ─────────────────────────────────────────────
export const SOURCE_MODULES: { key: InboxSourceModule; label: string; icon: string }[] = [
  { key: "crm", label: "CRM", icon: "handshake" },
  { key: "projects", label: "Projetos", icon: "movie_filter" },
  { key: "contracts", label: "Contratos", icon: "gavel" },
  { key: "finance", label: "Financeiro", icon: "payments" },
  { key: "portal", label: "Portal", icon: "language" },
  { key: "automations", label: "Automações", icon: "manufacturing" },
  { key: "tasks", label: "Tarefas", icon: "checklist" },
  { key: "system", label: "Sistema", icon: "settings" },
];

export const ITEM_TYPES: { key: InboxItemType; label: string; icon: string }[] = [
  { key: "notification", label: "Notificação", icon: "notifications" },
  { key: "approval", label: "Aprovação", icon: "approval" },
  { key: "message", label: "Mensagem", icon: "chat" },
  { key: "alert", label: "Alerta", icon: "warning" },
  { key: "error", label: "Erro", icon: "error" },
  { key: "reminder", label: "Lembrete", icon: "alarm" },
  { key: "task", label: "Tarefa", icon: "task_alt" },
  { key: "event", label: "Evento", icon: "event" },
];

export const PRIORITY_OPTIONS: { key: InboxPriority; label: string }[] = [
  { key: "low", label: "Baixa" },
  { key: "medium", label: "Média" },
  { key: "high", label: "Alta" },
  { key: "critical", label: "Crítica" },
];

// ── Main Hook ─────────────────────────────────────────────
export function useUnifiedInbox(filters: InboxFilters = {}) {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("inbox-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "inbox_items" }, () => {
        qc.invalidateQueries({ queryKey: ["unified-inbox"] });
        qc.invalidateQueries({ queryKey: ["inbox-counts"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const itemsQuery = useQuery({
    queryKey: ["unified-inbox", filters],
    queryFn: async () => {
      let q = supabase
        .from("inbox_items")
        .select("*")
        .eq("workspace_id", DEFAULT_WORKSPACE_ID)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);

      // View-based filters
      switch (filters.view) {
        case "pending":
          q = q.in("status", ["unread", "read", "in_progress"]);
          break;
        case "critical":
          q = q.eq("priority", "critical").neq("status", "archived");
          break;
        case "approvals":
          q = q.eq("requires_approval", true).neq("status", "resolved").neq("status", "archived");
          break;
        case "messages":
          q = q.eq("item_type", "message").neq("status", "archived");
          break;
        case "automations":
          q = q.eq("source_module", "automations").neq("status", "archived");
          break;
        case "finance":
          q = q.eq("source_module", "finance").neq("status", "archived");
          break;
        case "projects":
          q = q.eq("source_module", "projects").neq("status", "archived");
          break;
        case "crm":
          q = q.eq("source_module", "crm").neq("status", "archived");
          break;
        case "archived":
          q = q.eq("status", "archived");
          break;
        default:
          q = q.neq("status", "archived");
      }

      if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
      if (filters.priority && filters.priority !== "all") q = q.eq("priority", filters.priority);
      if (filters.source_module && filters.source_module !== "all") q = q.eq("source_module", filters.source_module);
      if (filters.item_type && filters.item_type !== "all") q = q.eq("item_type", filters.item_type);
      if (filters.assigned_to === "me" && user?.id) q = q.eq("assigned_to", user.id);
      else if (filters.assigned_to && filters.assigned_to !== "all") q = q.eq("assigned_to", filters.assigned_to);
      if (filters.search) q = q.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as InboxItem[];
    },
  });

  const countsQuery = useQuery({
    queryKey: ["inbox-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inbox_items")
        .select("status, priority, source_module, requires_approval, item_type")
        .eq("workspace_id", DEFAULT_WORKSPACE_ID)
        .neq("status", "archived");
      if (error) throw error;
      const items = (data ?? []) as any[];
      return {
        total: items.length,
        unread: items.filter((i) => i.status === "unread").length,
        critical: items.filter((i) => i.priority === "critical").length,
        approvals: items.filter((i) => i.requires_approval && !["resolved", "archived"].includes(i.status)).length,
        byModule: SOURCE_MODULES.reduce((acc, m) => {
          acc[m.key] = items.filter((i) => i.source_module === m.key).length;
          return acc;
        }, {} as Record<string, number>),
      };
    },
  });

  return {
    items: itemsQuery.data ?? [],
    isLoading: itemsQuery.isLoading,
    counts: countsQuery.data,
    refetch: itemsQuery.refetch,
  };
}

// ── Item Actions Hook ─────────────────────────────────────
export function useInboxItemActions(itemId: string | null) {
  return useQuery({
    queryKey: ["inbox-item-actions", itemId],
    enabled: !!itemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inbox_item_actions")
        .select("*")
        .eq("inbox_item_id", itemId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as InboxItemAction[];
    },
  });
}

// ── Mutations ─────────────────────────────────────────────
export function useInboxMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InboxItemStatus }) => {
      const updates: any = { status };
      if (status === "resolved") {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user?.id;
      }
      if (status === "archived") updates.archived_at = new Date().toISOString();
      const { error } = await supabase.from("inbox_items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unified-inbox"] });
      qc.invalidateQueries({ queryKey: ["inbox-counts"] });
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inbox_items").update({ status: "read" } as any).eq("id", id).eq("status", "unread");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unified-inbox"] });
      qc.invalidateQueries({ queryKey: ["inbox-counts"] });
    },
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from("inbox_items").update({ pinned } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unified-inbox"] }),
  });

  const snooze = useMutation({
    mutationFn: async ({ id, until }: { id: string; until: string }) => {
      const { error } = await supabase.from("inbox_items").update({ snoozed_until: until, status: "read" } as any).eq("id", id);
      if (error) throw error;
      toast.success("Item adiado");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unified-inbox"] });
      qc.invalidateQueries({ queryKey: ["inbox-counts"] });
    },
  });

  const logAction = useMutation({
    mutationFn: async ({ inbox_item_id, action_type, note, action_data }: { inbox_item_id: string; action_type: string; note?: string; action_data?: Record<string, any> }) => {
      const { error } = await supabase.from("inbox_item_actions").insert({
        inbox_item_id,
        action_type,
        note: note || null,
        action_data: action_data || {},
        performed_by: user?.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inbox-item-actions"] }),
  });

  const bulkAction = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: InboxItemStatus }) => {
      const updates: any = { status };
      if (status === "resolved") { updates.resolved_at = new Date().toISOString(); updates.resolved_by = user?.id; }
      if (status === "archived") updates.archived_at = new Date().toISOString();
      const { error } = await supabase.from("inbox_items").update(updates).in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} itens atualizados`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unified-inbox"] });
      qc.invalidateQueries({ queryKey: ["inbox-counts"] });
    },
  });

  return { updateStatus, markRead, togglePin, snooze, logAction, bulkAction };
}
