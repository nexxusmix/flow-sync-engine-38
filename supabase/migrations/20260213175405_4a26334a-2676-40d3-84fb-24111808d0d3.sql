
-- ACTION ITEMS TABLE
CREATE TABLE public.action_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT ''::text,
  scope TEXT NOT NULL DEFAULT 'global',
  project_id TEXT,
  client_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'P2',
  status TEXT NOT NULL DEFAULT 'open',
  snoozed_until TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'system',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_actionitems_workspace ON public.action_items(workspace_id);
CREATE INDEX idx_actionitems_projectid ON public.action_items(project_id);
CREATE INDEX idx_actionitems_status ON public.action_items(status);
CREATE INDEX idx_actionitems_priority ON public.action_items(priority);
CREATE INDEX idx_actionitems_type ON public.action_items(type);
CREATE INDEX idx_actionitems_dueat ON public.action_items(due_at);

ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "action_items_select" ON public.action_items FOR SELECT USING (true);
CREATE POLICY "action_items_insert" ON public.action_items FOR INSERT WITH CHECK (true);
CREATE POLICY "action_items_update" ON public.action_items FOR UPDATE USING (true);
CREATE POLICY "action_items_delete" ON public.action_items FOR DELETE USING (true);

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MESSAGE DRAFTS TABLE
CREATE TABLE public.message_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT ''::text,
  action_item_id UUID REFERENCES public.action_items(id) ON DELETE SET NULL,
  scope TEXT NOT NULL DEFAULT 'global',
  project_id TEXT,
  client_id TEXT,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  tone TEXT NOT NULL DEFAULT 'neutro',
  content TEXT NOT NULL DEFAULT '',
  variables_used JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  sent_by TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_msgdrafts_workspace ON public.message_drafts(workspace_id);
CREATE INDEX idx_msgdrafts_projectid ON public.message_drafts(project_id);
CREATE INDEX idx_msgdrafts_status ON public.message_drafts(status);
CREATE INDEX idx_msgdrafts_actionitem ON public.message_drafts(action_item_id);

ALTER TABLE public.message_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_drafts_select" ON public.message_drafts FOR SELECT USING (true);
CREATE POLICY "message_drafts_insert" ON public.message_drafts FOR INSERT WITH CHECK (true);
CREATE POLICY "message_drafts_update" ON public.message_drafts FOR UPDATE USING (true);
CREATE POLICY "message_drafts_delete" ON public.message_drafts FOR DELETE USING (true);

CREATE TRIGGER update_message_drafts_updated_at
  BEFORE UPDATE ON public.message_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.action_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_drafts;
