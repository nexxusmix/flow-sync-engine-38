-- =============================================
-- CALENDAR & MEETINGS MODULE - Complete Schema
-- =============================================

-- 1) Calendar Connections (OAuth tokens)
CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'google' CHECK (provider IN ('google')),
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  calendar_id text,
  email text,
  connected_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Calendar Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid,
  provider text NOT NULL DEFAULT 'internal' CHECK (provider IN ('google', 'internal')),
  provider_event_id text,
  title text NOT NULL,
  description text,
  location text,
  meet_url text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  timezone text DEFAULT 'America/Sao_Paulo',
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
  visibility text DEFAULT 'workspace' CHECK (visibility IN ('private', 'workspace', 'client')),
  related_type text DEFAULT 'none' CHECK (related_type IN ('lead', 'deal', 'project', 'deliverable', 'campaign', 'invoice', 'none')),
  related_id uuid,
  attendees jsonb DEFAULT '[]',
  recurrence text,
  all_day boolean DEFAULT false,
  color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) Meeting Notes (AI-generated summaries)
CREATE TABLE IF NOT EXISTS public.meeting_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  summary text,
  pain_points text,
  objections text,
  requirements text,
  next_steps jsonb DEFAULT '[]',
  recommendations text,
  owner text,
  ai_generated boolean DEFAULT false,
  transcript text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4) Deadlines
CREATE TABLE IF NOT EXISTS public.deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  deliverable_id uuid,
  title text NOT NULL,
  description text,
  due_at timestamptz NOT NULL,
  status text DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'late', 'done', 'blocked')),
  block_reason text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assignee_id uuid,
  assignee_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5) Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  related_type text NOT NULL,
  related_id uuid,
  title text,
  remind_at timestamptz NOT NULL,
  channel text DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'whatsapp')),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- 6) Notification Events (alerts feed)
CREATE TABLE IF NOT EXISTS public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info')),
  title text NOT NULL,
  body text,
  meta jsonb DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user ON public.calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_workspace ON public.calendar_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_owner ON public.calendar_events(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON public.calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_related ON public.calendar_events(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_provider ON public.calendar_events(provider, provider_event_id);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_event ON public.meeting_notes(event_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_workspace ON public.deadlines(workspace_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_project ON public.deadlines(project_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due ON public.deadlines(due_at);
CREATE INDEX IF NOT EXISTS idx_deadlines_status ON public.deadlines(status);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON public.reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON public.reminders(status);
CREATE INDEX IF NOT EXISTS idx_notification_events_user ON public.notification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_read ON public.notification_events(read_at);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Calendar Connections
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all calendar_connections" ON public.calendar_connections FOR SELECT USING (true);
CREATE POLICY "Users can insert calendar_connections" ON public.calendar_connections FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update calendar_connections" ON public.calendar_connections FOR UPDATE USING (true);
CREATE POLICY "Users can delete calendar_connections" ON public.calendar_connections FOR DELETE USING (true);

-- Calendar Events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all calendar_events" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "Users can insert calendar_events" ON public.calendar_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update calendar_events" ON public.calendar_events FOR UPDATE USING (true);
CREATE POLICY "Users can delete calendar_events" ON public.calendar_events FOR DELETE USING (true);

-- Meeting Notes
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all meeting_notes" ON public.meeting_notes FOR SELECT USING (true);
CREATE POLICY "Users can insert meeting_notes" ON public.meeting_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update meeting_notes" ON public.meeting_notes FOR UPDATE USING (true);
CREATE POLICY "Users can delete meeting_notes" ON public.meeting_notes FOR DELETE USING (true);

-- Deadlines
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all deadlines" ON public.deadlines FOR SELECT USING (true);
CREATE POLICY "Users can insert deadlines" ON public.deadlines FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update deadlines" ON public.deadlines FOR UPDATE USING (true);
CREATE POLICY "Users can delete deadlines" ON public.deadlines FOR DELETE USING (true);

-- Reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all reminders" ON public.reminders FOR SELECT USING (true);
CREATE POLICY "Users can insert reminders" ON public.reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update reminders" ON public.reminders FOR UPDATE USING (true);
CREATE POLICY "Users can delete reminders" ON public.reminders FOR DELETE USING (true);

-- Notification Events
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all notification_events" ON public.notification_events FOR SELECT USING (true);
CREATE POLICY "Users can insert notification_events" ON public.notification_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update notification_events" ON public.notification_events FOR UPDATE USING (true);
CREATE POLICY "Users can delete notification_events" ON public.notification_events FOR DELETE USING (true);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_calendar_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER update_calendar_connections_updated_at
BEFORE UPDATE ON public.calendar_connections
FOR EACH ROW EXECUTE FUNCTION public.update_calendar_updated_at();

CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.update_calendar_updated_at();

CREATE TRIGGER update_meeting_notes_updated_at
BEFORE UPDATE ON public.meeting_notes
FOR EACH ROW EXECUTE FUNCTION public.update_calendar_updated_at();

CREATE TRIGGER update_deadlines_updated_at
BEFORE UPDATE ON public.deadlines
FOR EACH ROW EXECUTE FUNCTION public.update_calendar_updated_at();