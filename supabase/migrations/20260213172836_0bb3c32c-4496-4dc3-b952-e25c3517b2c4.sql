
-- Table: client_messages
CREATE TABLE public.client_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT ''::text,
  project_id TEXT NOT NULL,
  client_id TEXT,
  channel TEXT NOT NULL DEFAULT 'copy',
  subject TEXT,
  content TEXT NOT NULL DEFAULT '',
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  error TEXT,
  ai_goal TEXT,
  ai_variant TEXT,
  material_id TEXT,
  material_link TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_client_messages_select" ON public.client_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_client_messages_insert" ON public.client_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_client_messages_update" ON public.client_messages
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_client_messages_delete" ON public.client_messages
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Table: client_message_events
CREATE TABLE public.client_message_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.client_messages(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_message_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_cme_select" ON public.client_message_events
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_cme_insert" ON public.client_message_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_client_messages_project ON public.client_messages(project_id);
CREATE INDEX idx_client_messages_status ON public.client_messages(status);
CREATE INDEX idx_cme_message ON public.client_message_events(message_id);

-- Trigger for updated_at
CREATE TRIGGER update_client_messages_updated_at
  BEFORE UPDATE ON public.client_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
