import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────
export type AutomationStatus = "draft" | "active" | "paused" | "error" | "testing";
export type AutomationModule = "crm" | "projects" | "contracts" | "finance" | "portal" | "communication";
export type ExecutionStatus = "running" | "success" | "error" | "awaiting_approval" | "cancelled";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export interface Automation {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  module: AutomationModule;
  status: AutomationStatus;
  trigger_type: string;
  trigger_config: Record<string, any>;
  conditions: any[];
  require_approval: boolean;
  approval_config: Record<string, any> | null;
  retry_enabled: boolean;
  max_retries: number;
  is_template: boolean;
  template_key: string | null;
  responsible_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_executed_at: string | null;
  execution_count: number;
  success_count: number;
  version: number;
}

export interface AutomationAction {
  id: string;
  automation_id: string;
  step_order: number;
  action_type: string;
  action_label: string | null;
  action_config: Record<string, any>;
  require_approval: boolean;
  created_at: string;
}

export interface AutomationExecution {
  id: string;
  automation_id: string;
  workspace_id: string;
  status: ExecutionStatus;
  trigger_data: Record<string, any> | null;
  entity_type: string | null;
  entity_id: string | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_by: string | null;
  automation?: { name: string; module: string };
}

export interface AutomationApproval {
  id: string;
  execution_id: string;
  automation_id: string;
  workspace_id: string;
  action_step: number;
  action_type: string;
  context_data: Record<string, any> | null;
  preview_text: string | null;
  status: ApprovalStatus;
  approver_id: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
  automation?: { name: string };
  execution?: { entity_type: string; entity_id: string };
}

// ── Trigger & Action definitions ──────────────────────────
export const TRIGGER_TYPES = [
  { key: "lead_stage_changed", label: "Lead entrou em etapa do pipeline", module: "crm", icon: "person_add" },
  { key: "project_overdue", label: "Projeto atrasou", module: "projects", icon: "schedule" },
  { key: "contract_signed", label: "Contrato foi assinado", module: "contracts", icon: "draw" },
  { key: "invoice_overdue", label: "Fatura venceu", module: "finance", icon: "payments" },
  { key: "invoice_due_soon", label: "Fatura próxima do vencimento", module: "finance", icon: "event_upcoming" },
  { key: "client_approved_delivery", label: "Cliente aprovou entrega", module: "portal", icon: "verified" },
  { key: "task_completed", label: "Tarefa foi concluída", module: "projects", icon: "task_alt" },
  { key: "new_client_created", label: "Novo cliente criado", module: "crm", icon: "group_add" },
  { key: "deadline_approaching", label: "Deadline está próximo", module: "projects", icon: "alarm" },
] as const;

export const ACTION_TYPES = [
  { key: "generate_briefing", label: "Gerar briefing com IA", icon: "auto_awesome", sensitive: false },
  { key: "send_message", label: "Enviar mensagem", icon: "chat", sensitive: true },
  { key: "send_email", label: "Enviar e-mail", icon: "mail", sensitive: true },
  { key: "create_project", label: "Criar projeto", icon: "create_new_folder", sensitive: false },
  { key: "create_milestones", label: "Criar milestones", icon: "flag", sensitive: false },
  { key: "create_tasks", label: "Criar tarefas padrão", icon: "checklist", sensitive: false },
  { key: "notify_pm", label: "Notificar PM", icon: "notifications", sensitive: false },
  { key: "notify_client", label: "Notificar cliente", icon: "campaign", sensitive: true },
  { key: "generate_proposal", label: "Gerar proposta", icon: "request_quote", sensitive: true },
  { key: "log_crm_note", label: "Registrar no CRM", icon: "edit_note", sensitive: false },
  { key: "create_reminder", label: "Criar lembrete", icon: "alarm_add", sensitive: false },
  { key: "trigger_billing", label: "Disparar cobrança", icon: "receipt_long", sensitive: true },
  { key: "change_status", label: "Mudar status", icon: "swap_horiz", sensitive: false },
  { key: "log_activity", label: "Registrar atividade", icon: "history", sensitive: false },
  { key: "require_approval", label: "Solicitar aprovação", icon: "approval", sensitive: false },
] as const;

export const MODULE_OPTIONS: { key: AutomationModule; label: string; icon: string }[] = [
  { key: "crm", label: "CRM", icon: "handshake" },
  { key: "projects", label: "Projetos", icon: "movie_filter" },
  { key: "contracts", label: "Contratos", icon: "gavel" },
  { key: "finance", label: "Financeiro", icon: "payments" },
  { key: "portal", label: "Portal do Cliente", icon: "language" },
  { key: "communication", label: "Comunicação", icon: "forum" },
];

// ── Templates ─────────────────────────────────────────────
export const AUTOMATION_TEMPLATES = [
  {
    template_key: "lead_briefing",
    name: "Lead → Briefing Automático",
    description: "Quando lead entra em etapa qualificada, gera briefing com IA, registra no CRM e notifica time comercial.",
    module: "crm" as AutomationModule,
    trigger_type: "lead_stage_changed",
    trigger_config: { stage: "qualified" },
    conditions: [],
    actions: [
      { action_type: "generate_briefing", action_label: "Gerar briefing inicial com IA", step_order: 0, require_approval: false },
      { action_type: "log_crm_note", action_label: "Registrar briefing no CRM", step_order: 1, require_approval: false },
      { action_type: "notify_pm", action_label: "Notificar time comercial", step_order: 2, require_approval: false },
    ],
  },
  {
    template_key: "project_overdue_alert",
    name: "Projeto Atrasou → Avisar PM + Cliente",
    description: "Quando projeto atrasa, notifica PM, gera sugestão de mensagem e envia ao cliente com aprovação.",
    module: "projects" as AutomationModule,
    trigger_type: "project_overdue",
    trigger_config: {},
    conditions: [],
    actions: [
      { action_type: "notify_pm", action_label: "Notificar PM internamente", step_order: 0, require_approval: false },
      { action_type: "generate_briefing", action_label: "Gerar sugestão de mensagem para cliente", step_order: 1, require_approval: false },
      { action_type: "notify_client", action_label: "Enviar comunicação ao cliente", step_order: 2, require_approval: true },
    ],
  },
  {
    template_key: "contract_to_project",
    name: "Contrato Assinado → Criar Projeto Completo",
    description: "Quando contrato é assinado, cria projeto, milestones, tarefas iniciais e notifica equipe.",
    module: "contracts" as AutomationModule,
    trigger_type: "contract_signed",
    trigger_config: {},
    conditions: [],
    actions: [
      { action_type: "create_project", action_label: "Criar projeto automaticamente", step_order: 0, require_approval: false },
      { action_type: "create_milestones", action_label: "Aplicar template de milestones", step_order: 1, require_approval: false },
      { action_type: "create_tasks", action_label: "Gerar tarefas iniciais", step_order: 2, require_approval: false },
      { action_type: "notify_pm", action_label: "Notificar equipe interna", step_order: 3, require_approval: false },
    ],
  },
  {
    template_key: "billing_collection",
    name: "Fatura Vencida → Cobrança Automática",
    description: "Quando fatura vence, verifica pagamento, gera cobrança, exige aprovação e envia ao cliente.",
    module: "finance" as AutomationModule,
    trigger_type: "invoice_overdue",
    trigger_config: {},
    conditions: [],
    actions: [
      { action_type: "log_crm_note", action_label: "Verificar status de pagamento", step_order: 0, require_approval: false },
      { action_type: "generate_briefing", action_label: "Gerar mensagem de cobrança", step_order: 1, require_approval: false },
      { action_type: "require_approval", action_label: "Aguardar aprovação humana", step_order: 2, require_approval: true },
      { action_type: "send_message", action_label: "Enviar cobrança", step_order: 3, require_approval: false },
      { action_type: "log_activity", action_label: "Registrar histórico da cobrança", step_order: 4, require_approval: false },
    ],
  },
];

// ── Hooks ─────────────────────────────────────────────────
export function useAutomationsList() {
  return useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .eq("is_template", false)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Automation[];
    },
  });
}

export function useAutomationActions(automationId: string | null) {
  return useQuery({
    queryKey: ["automation-actions", automationId],
    enabled: !!automationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_actions")
        .select("*")
        .eq("automation_id", automationId!)
        .order("step_order");
      if (error) throw error;
      return (data ?? []) as unknown as AutomationAction[];
    },
  });
}

export function useAutomationExecutions(automationId?: string) {
  return useQuery({
    queryKey: ["automation-executions", automationId],
    queryFn: async () => {
      let q = supabase
        .from("automation_executions")
        .select("*, automation:automations(name, module)")
        .order("started_at", { ascending: false })
        .limit(100);
      if (automationId) q = q.eq("automation_id", automationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as AutomationExecution[];
    },
  });
}

export function useAutomationApprovals() {
  return useQuery({
    queryKey: ["automation-approvals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_approvals")
        .select("*, automation:automations(name), execution:automation_executions(entity_type, entity_id)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AutomationApproval[];
    },
  });
}

export function useSaveAutomation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      automation: Partial<Automation>;
      actions: Omit<AutomationAction, "id" | "automation_id" | "created_at">[];
    }) => {
      const isNew = !payload.automation.id;
      const autoData = {
        ...payload.automation,
        created_by: payload.automation.created_by || user?.id,
      };

      let automationId: string;

      if (isNew) {
        const { data, error } = await supabase
          .from("automations")
          .insert(autoData as any)
          .select("id")
          .single();
        if (error) throw error;
        automationId = data.id;
      } else {
        automationId = payload.automation.id!;
        const { error } = await supabase
          .from("automations")
          .update(autoData as any)
          .eq("id", automationId);
        if (error) throw error;
        // Delete old actions
        await supabase.from("automation_actions").delete().eq("automation_id", automationId);
      }

      // Insert actions
      if (payload.actions.length > 0) {
        const actionsToInsert = payload.actions.map((a) => ({
          ...a,
          automation_id: automationId,
          action_config: a.action_config || {},
        }));
        const { error: actErr } = await supabase
          .from("automation_actions")
          .insert(actionsToInsert as any);
        if (actErr) throw actErr;
      }

      return automationId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      qc.invalidateQueries({ queryKey: ["automation-actions"] });
      toast.success("Automação salva com sucesso");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar automação"),
  });
}

export function useToggleAutomationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AutomationStatus }) => {
      const { error } = await supabase.from("automations").update({ status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Status atualizado");
    },
  });
}

export function useDecideApproval() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, decision, note }: { id: string; decision: "approved" | "rejected"; note?: string }) => {
      const { error } = await supabase
        .from("automation_approvals")
        .update({
          status: decision,
          approver_id: user?.id,
          decided_at: new Date().toISOString(),
          decision_note: note || null,
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation-approvals"] });
      qc.invalidateQueries({ queryKey: ["automation-executions"] });
      toast.success("Decisão registrada");
    },
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Automação excluída");
    },
  });
}

export function useDuplicateAutomation() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (sourceId: string) => {
      // Fetch source
      const { data: source, error: srcErr } = await supabase
        .from("automations")
        .select("*")
        .eq("id", sourceId)
        .single();
      if (srcErr) throw srcErr;

      const { data: actions, error: actErr } = await supabase
        .from("automation_actions")
        .select("*")
        .eq("automation_id", sourceId)
        .order("step_order");
      if (actErr) throw actErr;

      // Create copy
      const { id, created_at, updated_at, last_executed_at, execution_count, success_count, ...rest } = source as any;
      const { data: newAuto, error: insErr } = await supabase
        .from("automations")
        .insert({
          ...rest,
          name: `${rest.name} (cópia)`,
          status: "draft",
          created_by: user?.id,
          is_template: false,
        } as any)
        .select("id")
        .single();
      if (insErr) throw insErr;

      if (actions && actions.length > 0) {
        const newActions = (actions as any[]).map(({ id: _, automation_id, created_at: _c, ...a }) => ({
          ...a,
          automation_id: newAuto.id,
        }));
        await supabase.from("automation_actions").insert(newActions as any);
      }

      return newAuto.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      toast.success("Automação duplicada");
    },
  });
}
