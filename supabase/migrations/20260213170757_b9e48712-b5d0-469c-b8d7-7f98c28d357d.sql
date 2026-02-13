
-- Alert types enum
CREATE TYPE public.alert_type AS ENUM (
  'deadline_due', 'deadline_overdue',
  'delivery_due', 'delivery_overdue',
  'no_client_contact',
  'client_waiting_reply', 'internal_waiting_reply',
  'meeting_upcoming', 'meeting_followup',
  'payment_due', 'payment_overdue',
  'production_stalled', 'risk_health_drop',
  'materials_missing', 'review_pending',
  'custom_reminder'
);

CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE public.alert_status AS ENUM ('open', 'snoozed', 'resolved', 'dismissed');
CREATE TYPE public.alert_scope AS ENUM ('hub', 'portal', 'both');
CREATE TYPE public.outbox_status AS ENUM ('draft', 'queued', 'sending', 'sent', 'failed', 'canceled');

-- Main alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL DEFAULT '',
  scope public.alert_scope NOT NULL DEFAULT 'hub',
  project_id TEXT,
  client_id TEXT,
  entity_type TEXT,
  entity_id TEXT,
  type public.alert_type NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  due_at TIMESTAMPTZ,
  trigger_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status public.alert_status NOT NULL DEFAULT 'open',
  read_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  assigned_to UUID,
  channels JSONB NOT NULL DEFAULT '{"inApp": true, "email": false, "push": false, "whatsapp": false}',
  ai_assist_enabled BOOLEAN NOT NULL DEFAULT true,
  ai_context JSONB,
  action_label TEXT,
  action_url TEXT,
  meta JSONB,
  idempotency_key TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_alerts_idempotency ON public.alerts (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_alerts_workspace_status ON public.alerts (workspace_id, status);
CREATE INDEX idx_alerts_project ON public.alerts (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_alerts_severity ON public.alerts (severity, status);
CREATE INDEX idx_alerts_assigned ON public.alerts (assigned_to) WHERE assigned_to IS NOT NULL;

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_alerts_select" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_alerts_insert" ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_alerts_update" ON public.alerts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_alerts_delete" ON public.alerts FOR DELETE TO authenticated USING (public.has_app_role(auth.uid(), 'admin'));

-- Alert rules table
CREATE TABLE public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  rule_type TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '{}',
  severity public.alert_severity NOT NULL DEFAULT 'warning',
  channels JSONB NOT NULL DEFAULT '{"inApp": true}',
  scope public.alert_scope NOT NULL DEFAULT 'hub',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_alert_rules_select" ON public.alert_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_alert_rules_update" ON public.alert_rules FOR UPDATE TO authenticated USING (public.has_app_role(auth.uid(), 'admin'));
CREATE POLICY "auth_alert_rules_insert" ON public.alert_rules FOR INSERT TO authenticated WITH CHECK (public.has_app_role(auth.uid(), 'admin'));

-- Alert audit events
CREATE TABLE public.alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alert_events_alert ON public.alert_events (alert_id);
ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_alert_events_select" ON public.alert_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_alert_events_insert" ON public.alert_events FOR INSERT TO authenticated WITH CHECK (true);

-- AI Outbox
CREATE TABLE public.ai_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL DEFAULT '',
  project_id TEXT,
  client_id TEXT,
  alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'inapp',
  recipient TEXT,
  subject TEXT,
  content TEXT NOT NULL,
  attachments JSONB,
  status public.outbox_status NOT NULL DEFAULT 'draft',
  provider_message_id TEXT,
  error TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_outbox_status ON public.ai_outbox (status);
CREATE INDEX idx_ai_outbox_alert ON public.ai_outbox (alert_id) WHERE alert_id IS NOT NULL;
ALTER TABLE public.ai_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_ai_outbox_select" ON public.ai_outbox FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_ai_outbox_insert" ON public.ai_outbox FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_ai_outbox_update" ON public.ai_outbox FOR UPDATE TO authenticated USING (true);

-- Triggers
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON public.alert_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_outbox_updated_at BEFORE UPDATE ON public.ai_outbox FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Default rules
INSERT INTO public.alert_rules (rule_type, params, severity, scope) VALUES
  ('no_contact_x_days', '{"days": 7}', 'warning', 'hub'),
  ('no_contact_x_days', '{"days": 14}', 'critical', 'hub'),
  ('delivery_due_n_days_before', '{"days": 2}', 'warning', 'both'),
  ('delivery_due_n_days_before', '{"days": 1}', 'critical', 'both'),
  ('client_waiting_reply_x_hours', '{"hours": 12}', 'warning', 'hub'),
  ('client_waiting_reply_x_hours', '{"hours": 24}', 'critical', 'hub'),
  ('meeting_reminder', '{"hours": 24}', 'info', 'both'),
  ('meeting_reminder', '{"hours": 1}', 'warning', 'both'),
  ('payment_due_n_days_before', '{"days": 5}', 'info', 'hub'),
  ('payment_due_n_days_before', '{"days": 1}', 'warning', 'hub'),
  ('payment_overdue', '{"days": 0}', 'critical', 'hub'),
  ('production_stalled_x_days', '{"days": 5}', 'warning', 'hub'),
  ('materials_missing_x_days', '{"days": 3}', 'warning', 'both'),
  ('health_below_threshold', '{"threshold": 50}', 'critical', 'hub'),
  ('meeting_followup_after_hours', '{"hours": 2}', 'info', 'hub');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
