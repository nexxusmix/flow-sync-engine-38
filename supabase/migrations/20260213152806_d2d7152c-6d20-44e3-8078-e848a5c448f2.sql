
-- Action log table for universal undo/redo
CREATE TABLE public.action_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  before_snapshot JSONB,
  after_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  undone_at TIMESTAMPTZ,
  undone_by UUID,
  group_id UUID DEFAULT gen_random_uuid(),
  client_request_id TEXT
);

-- Indexes
CREATE INDEX idx_action_log_user_recent ON public.action_log (user_id, created_at DESC);
CREATE INDEX idx_action_log_entity ON public.action_log (entity_type, entity_id);
CREATE INDEX idx_action_log_group ON public.action_log (group_id);

-- RLS
ALTER TABLE public.action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own action logs"
  ON public.action_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own action logs"
  ON public.action_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own action logs"
  ON public.action_log FOR UPDATE
  USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.action_log;
