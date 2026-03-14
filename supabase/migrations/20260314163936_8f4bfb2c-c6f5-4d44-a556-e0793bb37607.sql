
-- AI Governance Policies
CREATE TABLE public.ai_governance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  name text NOT NULL,
  description text,
  policy_type text NOT NULL DEFAULT 'limit',
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_governance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_governance_policies_select" ON public.ai_governance_policies
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_governance_policies_insert" ON public.ai_governance_policies
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_governance_policies_update" ON public.ai_governance_policies
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- AI Workspace Limits
CREATE TABLE public.ai_workspace_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  limit_type text NOT NULL DEFAULT 'monthly_calls',
  max_value integer NOT NULL DEFAULT 1000,
  current_value integer NOT NULL DEFAULT 0,
  reset_period text NOT NULL DEFAULT 'monthly',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, limit_type)
);

ALTER TABLE public.ai_workspace_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_workspace_limits_select" ON public.ai_workspace_limits
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_workspace_limits_all" ON public.ai_workspace_limits
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- AI Usage Events (granular tracking)
CREATE TABLE public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  user_id uuid REFERENCES auth.users(id),
  source_module text NOT NULL DEFAULT 'system',
  source_entity_type text,
  source_entity_id text,
  action_type text NOT NULL,
  model_name text,
  provider_name text,
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  estimated_cost numeric(10,6) DEFAULT 0,
  execution_time_ms integer,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  requires_approval boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_usage_events_select" ON public.ai_usage_events
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_usage_events_insert" ON public.ai_usage_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- AI Alerts
CREATE TABLE public.ai_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  title text NOT NULL,
  message text,
  source_module text,
  user_id uuid REFERENCES auth.users(id),
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_ai_alerts_select" ON public.ai_alerts
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_ai_alerts_all" ON public.ai_alerts
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
