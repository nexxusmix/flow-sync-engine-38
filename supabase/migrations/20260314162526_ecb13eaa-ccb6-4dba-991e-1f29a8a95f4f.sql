
-- ══════════════════════════════════════════════════════════════
-- Central de Automações da Agência — Schema
-- ══════════════════════════════════════════════════════════════

-- Main automations table
CREATE TABLE public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  name text NOT NULL,
  description text,
  module text NOT NULL DEFAULT 'projects',
  status text NOT NULL DEFAULT 'draft',
  trigger_type text NOT NULL DEFAULT 'manual',
  trigger_config jsonb NOT NULL DEFAULT '{}',
  conditions jsonb NOT NULL DEFAULT '[]',
  require_approval boolean NOT NULL DEFAULT false,
  approval_config jsonb,
  retry_enabled boolean NOT NULL DEFAULT false,
  max_retries integer NOT NULL DEFAULT 3,
  is_template boolean NOT NULL DEFAULT false,
  template_key text,
  responsible_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_executed_at timestamptz,
  execution_count integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1
);

-- Automation actions (ordered steps)
CREATE TABLE public.automation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 0,
  action_type text NOT NULL,
  action_label text,
  action_config jsonb NOT NULL DEFAULT '{}',
  require_approval boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Execution records
CREATE TABLE public.automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  status text NOT NULL DEFAULT 'running',
  trigger_data jsonb,
  entity_type text,
  entity_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  created_by uuid
);

-- Execution step logs
CREATE TABLE public.automation_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES public.automation_executions(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 0,
  action_type text NOT NULL,
  action_label text,
  status text NOT NULL DEFAULT 'pending',
  input_data jsonb,
  output_data jsonb,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Approval queue
CREATE TABLE public.automation_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES public.automation_executions(id) ON DELETE CASCADE,
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  action_step integer NOT NULL,
  action_type text NOT NULL,
  context_data jsonb,
  preview_text text,
  status text NOT NULL DEFAULT 'pending',
  approver_id uuid,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_approvals ENABLE ROW LEVEL SECURITY;

-- RLS policies: workspace member access
CREATE POLICY "workspace_automations_select" ON public.automations
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "workspace_automations_insert" ON public.automations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "workspace_automations_update" ON public.automations
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "workspace_automations_delete" ON public.automations
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- automation_actions: access via parent
CREATE POLICY "actions_select" ON public.automation_actions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_id AND public.is_workspace_member(auth.uid(), a.workspace_id)));

CREATE POLICY "actions_insert" ON public.automation_actions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_id AND public.is_workspace_member(auth.uid(), a.workspace_id)));

CREATE POLICY "actions_update" ON public.automation_actions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_id AND public.is_workspace_member(auth.uid(), a.workspace_id)));

CREATE POLICY "actions_delete" ON public.automation_actions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_id AND public.is_workspace_member(auth.uid(), a.workspace_id)));

-- automation_executions
CREATE POLICY "executions_select" ON public.automation_executions
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "executions_insert" ON public.automation_executions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "executions_update" ON public.automation_executions
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- automation_execution_logs: access via parent
CREATE POLICY "exec_logs_select" ON public.automation_execution_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.automation_executions e WHERE e.id = execution_id AND public.is_workspace_member(auth.uid(), e.workspace_id)));

CREATE POLICY "exec_logs_insert" ON public.automation_execution_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.automation_executions e WHERE e.id = execution_id AND public.is_workspace_member(auth.uid(), e.workspace_id)));

-- automation_approvals
CREATE POLICY "approvals_select" ON public.automation_approvals
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "approvals_update" ON public.automation_approvals
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "approvals_insert" ON public.automation_approvals
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- Indexes
CREATE INDEX idx_automations_workspace ON public.automations(workspace_id);
CREATE INDEX idx_automations_status ON public.automations(status);
CREATE INDEX idx_automations_template ON public.automations(is_template) WHERE is_template = true;
CREATE INDEX idx_automation_actions_automation ON public.automation_actions(automation_id);
CREATE INDEX idx_automation_executions_automation ON public.automation_executions(automation_id);
CREATE INDEX idx_automation_executions_status ON public.automation_executions(status);
CREATE INDEX idx_automation_execution_logs_execution ON public.automation_execution_logs(execution_id);
CREATE INDEX idx_automation_approvals_status ON public.automation_approvals(status) WHERE status = 'pending';
CREATE INDEX idx_automation_approvals_workspace ON public.automation_approvals(workspace_id);

-- Updated_at trigger
CREATE TRIGGER set_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
