-- Create ai_runs audit table for logging all AI actions
CREATE TABLE public.ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  action_key TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error')),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_ai_runs_user_id ON public.ai_runs(user_id);
CREATE INDEX idx_ai_runs_action_key ON public.ai_runs(action_key);
CREATE INDEX idx_ai_runs_entity ON public.ai_runs(entity_type, entity_id);
CREATE INDEX idx_ai_runs_created_at ON public.ai_runs(created_at DESC);

-- RLS: Users can only see their own AI runs
CREATE POLICY "auth_ai_runs_select" ON public.ai_runs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS: Users can only insert their own AI runs
CREATE POLICY "auth_ai_runs_insert" ON public.ai_runs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS: Users can only update their own AI runs (for status updates)
CREATE POLICY "auth_ai_runs_update" ON public.ai_runs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON TABLE public.ai_runs IS 'Immutable audit log for all AI generation actions across the platform';