
CREATE TABLE public.daily_summary_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL DEFAULT 'default',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_text TEXT NOT NULL,
  action_key TEXT NOT NULL,
  decision TEXT NOT NULL,
  standby_until TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.daily_summary_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own summary actions"
  ON public.daily_summary_actions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_daily_summary_actions_user ON public.daily_summary_actions(user_id, decision);
CREATE INDEX idx_daily_summary_actions_key ON public.daily_summary_actions(action_key, user_id);
