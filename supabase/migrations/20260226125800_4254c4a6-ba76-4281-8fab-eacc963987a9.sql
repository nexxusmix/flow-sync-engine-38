
-- Add columns to calendar_events for Google Calendar sync and source tracking
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS google_event_id text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS reminder_minutes integer[] DEFAULT '{30}';

-- Index for Google sync lookups
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_event_id
  ON public.calendar_events(google_event_id) WHERE google_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_source
  ON public.calendar_events(source);

-- Create event_reminders table
CREATE TABLE public.event_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'whatsapp', 'email')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  error_message text,
  recipient text,
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for cron job to find pending reminders
CREATE INDEX idx_event_reminders_pending
  ON public.event_reminders(remind_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_reminders
CREATE POLICY "Members can view reminders"
  ON public.event_reminders FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert reminders"
  ON public.event_reminders FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update reminders"
  ON public.event_reminders FOR UPDATE
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete reminders"
  ON public.event_reminders FOR DELETE
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Enable realtime for event_reminders
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_reminders;
