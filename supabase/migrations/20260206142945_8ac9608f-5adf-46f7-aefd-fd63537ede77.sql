-- =============================================
-- POLO AI - Agent Execution Framework
-- =============================================

-- Table: agent_runs (logs each chat execution session)
CREATE TABLE public.agent_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  input_text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  context_json JSONB DEFAULT '{}'::jsonb,
  plan_json JSONB DEFAULT NULL,
  result_json JSONB DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'planning', 'executing', 'success', 'error', 'needs_confirmation')),
  error_message TEXT,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Table: agent_actions (logs each action within a run)
CREATE TABLE public.agent_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL DEFAULT 0,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  input_json JSONB DEFAULT '{}'::jsonb,
  before_json JSONB,
  after_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error', 'skipped')),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_runs
CREATE POLICY "auth_agent_runs_select" ON public.agent_runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "auth_agent_runs_insert" ON public.agent_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auth_agent_runs_update" ON public.agent_runs
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for agent_actions (via run ownership)
CREATE POLICY "auth_agent_actions_select" ON public.agent_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.agent_runs WHERE id = run_id AND user_id = auth.uid())
  );

CREATE POLICY "auth_agent_actions_insert" ON public.agent_actions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.agent_runs WHERE id = run_id AND user_id = auth.uid())
  );

CREATE POLICY "auth_agent_actions_update" ON public.agent_actions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.agent_runs WHERE id = run_id AND user_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX idx_agent_runs_user_id ON public.agent_runs(user_id);
CREATE INDEX idx_agent_runs_status ON public.agent_runs(status);
CREATE INDEX idx_agent_runs_created_at ON public.agent_runs(created_at DESC);
CREATE INDEX idx_agent_actions_run_id ON public.agent_actions(run_id);
CREATE INDEX idx_agent_actions_entity ON public.agent_actions(entity_type, entity_id);