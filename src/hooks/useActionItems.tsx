import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEFAULT_WORKSPACE_ID } from "@/constants/workspace";

export interface ActionItem {
  id: string;
  workspace_id: string;
  scope: string;
  project_id: string | null;
  client_id: string | null;
  type: string;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: string;
  status: string;
  snoozed_until: string | null;
  source: string;
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageDraft {
  id: string;
  workspace_id: string;
  action_item_id: string | null;
  scope: string;
  project_id: string | null;
  client_id: string | null;
  channel: string;
  tone: string;
  content: string;
  variables_used: Record<string, any>;
  status: string;
  sent_at: string | null;
  sent_by: string | null;
  attachments: any[];
  created_at: string;
  updated_at: string;
}

async function fetchActionItems(projectId?: string): Promise<ActionItem[]> {
  let query = supabase
    .from("action_items" as any)
    .select("*")
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .in("status", ["open", "snoozed"])
    .order("priority", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(50);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as ActionItem[];
}

async function fetchDrafts(actionItemId: string): Promise<MessageDraft[]> {
  const { data, error } = await supabase
    .from("message_drafts" as any)
    .select("*")
    .eq("action_item_id", actionItemId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as MessageDraft[];
}

export function useActionItems(projectId?: string) {
  const qc = useQueryClient();
  const queryKey = projectId ? ["action-items", projectId] : ["action-items"];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchActionItems(projectId),
    staleTime: 30_000,
  });

  const completeAction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("action_items" as any)
        .update({ status: "done" } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action-items"] });
      toast.success("Ação concluída!");
    },
  });

  const snoozeAction = useMutation({
    mutationFn: async ({ id, until }: { id: string; until: string }) => {
      const { error } = await supabase
        .from("action_items" as any)
        .update({ status: "snoozed", snoozed_until: until } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action-items"] });
      toast.success("Ação adiada!");
    },
  });

  const createAction = useMutation({
    mutationFn: async (item: Partial<ActionItem>) => {
      const { error } = await supabase
        .from("action_items" as any)
        .insert(item as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action-items"] });
    },
  });

  return {
    items,
    isLoading,
    completeAction,
    snoozeAction,
    createAction,
    fetchDrafts,
  };
}

// Auto-generate action items from project/financial data
export async function generateActionItems() {
  try {
    // Fetch overdue revenues
    const { data: overdueRevenues } = await supabase
      .from("revenues")
      .select("id, project_id, description, due_date, amount, status")
      .in("status", ["pending", "overdue"])
      .lt("due_date", new Date().toISOString())
      .limit(20);

    // Fetch projects with upcoming deadlines
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, client_name, due_date, status, stage_current")
      .eq("status", "active")
      .limit(50);

    // Fetch pending portal change requests
    const { data: pendingApprovals } = await supabase
      .from("portal_change_requests" as any)
      .select("id, portal_link_id, status, type, description")
      .eq("status", "pending")
      .limit(20);

    const actions: Partial<ActionItem>[] = [];

    // Financial overdue actions
    overdueRevenues?.forEach((rev: any) => {
      actions.push({
        scope: rev.project_id ? "project" : "global",
        project_id: rev.project_id,
        type: "financial",
        title: `Fatura em atraso: ${rev.description || "Sem descrição"}`,
        description: `Valor: R$ ${(rev.amount / 100).toLocaleString("pt-BR")} — Vencimento: ${new Date(rev.due_date).toLocaleDateString("pt-BR")}`,
        due_at: rev.due_date,
        priority: "P0",
        source: "system",
        metadata: { financialRef: rev.id },
      });
    });

    // Project deadline actions
    projects?.forEach((proj: any) => {
      if (!proj.due_date) return;
      const dueDate = new Date(proj.due_date);
      const now = new Date();
      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 2 && daysUntil >= 0) {
        actions.push({
          scope: "project",
          project_id: proj.id,
          type: "deadline",
          title: `Prazo em ${daysUntil}d: ${proj.name}`,
          description: `Projeto "${proj.name}" (${proj.client_name}) vence em ${daysUntil} dia(s).`,
          due_at: proj.due_date,
          priority: "P0",
          source: "system",
          metadata: { projectName: proj.name, clientName: proj.client_name },
        });
      } else if (daysUntil < 0) {
        actions.push({
          scope: "project",
          project_id: proj.id,
          type: "deadline",
          title: `ATRASADO ${Math.abs(daysUntil)}d: ${proj.name}`,
          description: `Projeto "${proj.name}" está ${Math.abs(daysUntil)} dia(s) atrasado.`,
          due_at: proj.due_date,
          priority: "P0",
          source: "system",
          metadata: { projectName: proj.name, clientName: proj.client_name },
        });
      }
    });

    // Portal pending approvals
    pendingApprovals?.forEach((req: any) => {
      actions.push({
        scope: "project",
        type: "delivery",
        title: `Aprovação pendente: ${req.type || "Revisão"}`,
        description: req.description || "Cliente aguardando resposta no portal.",
        priority: "P1",
        source: "system",
        metadata: { portalRequestId: req.id },
      });
    });

    // Fetch overdue/urgent tasks and create action items
    const { data: overdueTasks } = await supabase
      .from("tasks")
      .select("id, title, due_date, priority, status, user_id")
      .neq("status", "done")
      .not("due_date", "is", null)
      .lt("due_date", new Date().toISOString())
      .limit(20);

    overdueTasks?.forEach((task: any) => {
      actions.push({
        scope: "global",
        type: "task_overdue",
        title: `Tarefa atrasada: ${task.title}`,
        description: `Venceu em ${new Date(task.due_date).toLocaleDateString("pt-BR")}`,
        due_at: task.due_date,
        priority: task.priority === "urgent" ? "P0" : "P1",
        source: "system",
        metadata: { task_id: task.id },
        created_by: task.user_id,
      });
    });

    // Insert actions avoiding duplicates (use upsert-like logic)
    for (const action of actions) {
      // Check if similar open action exists
      let dupQuery = supabase
        .from("action_items" as any)
        .select("id")
        .eq("workspace_id", DEFAULT_WORKSPACE_ID)
        .eq("type", action.type!)
        .in("status", ["open", "snoozed"])
        .limit(1);

      if (action.project_id) {
        dupQuery = dupQuery.eq("project_id", action.project_id);
      } else {
        dupQuery = dupQuery.is("project_id", null);
      }

      const { data: existing } = await dupQuery;

      if (!existing || existing.length === 0) {
        await supabase.from("action_items" as any).insert({
          ...action,
          workspace_id: DEFAULT_WORKSPACE_ID,
        } as any);
      }
    }

    return actions.length;
  } catch (err) {
    console.error("Error generating action items:", err);
    return 0;
  }
}
