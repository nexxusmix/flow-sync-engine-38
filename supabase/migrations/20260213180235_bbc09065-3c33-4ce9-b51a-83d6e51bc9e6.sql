
-- Table for tracking alert actions (generate_message, copy, send_whatsapp, resolve)
CREATE TABLE IF NOT EXISTS public.alert_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  action_item_id UUID NULL,
  project_id TEXT NULL,
  client_id TEXT NULL,
  action_type TEXT NOT NULL, -- generate_message, copy, send_whatsapp, resolve, edit
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  workspace_id TEXT NOT NULL DEFAULT ''
);

ALTER TABLE public.alert_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alert actions" ON public.alert_actions
  FOR SELECT USING (true);
CREATE POLICY "Users can insert alert actions" ON public.alert_actions
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_alert_actions_alert_id ON public.alert_actions(alert_id);
CREATE INDEX idx_alert_actions_project_id ON public.alert_actions(project_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_actions;
