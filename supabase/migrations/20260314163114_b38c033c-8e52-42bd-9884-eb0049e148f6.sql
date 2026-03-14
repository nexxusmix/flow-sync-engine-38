
-- ══════════════════════════════════════════════════════════════
-- Inbox Unificada Operacional — Schema
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.inbox_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  source_module text NOT NULL DEFAULT 'system',
  source_entity_type text,
  source_entity_id text,
  item_type text NOT NULL DEFAULT 'notification',
  title text NOT NULL,
  summary text,
  payload_json jsonb DEFAULT '{}',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'unread',
  requires_approval boolean NOT NULL DEFAULT false,
  requires_action boolean NOT NULL DEFAULT false,
  assigned_to uuid,
  client_id text,
  project_id text,
  automation_id uuid,
  created_by uuid,
  resolved_at timestamptz,
  resolved_by uuid,
  archived_at timestamptz,
  snoozed_until timestamptz,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inbox_item_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_item_id uuid NOT NULL REFERENCES public.inbox_items(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_data jsonb DEFAULT '{}',
  performed_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_item_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "inbox_items_select" ON public.inbox_items
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "inbox_items_insert" ON public.inbox_items
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "inbox_items_update" ON public.inbox_items
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "inbox_items_delete" ON public.inbox_items
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "inbox_actions_select" ON public.inbox_item_actions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.inbox_items i WHERE i.id = inbox_item_id AND public.is_workspace_member(auth.uid(), i.workspace_id)));

CREATE POLICY "inbox_actions_insert" ON public.inbox_item_actions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.inbox_items i WHERE i.id = inbox_item_id AND public.is_workspace_member(auth.uid(), i.workspace_id)));

-- Indexes
CREATE INDEX idx_inbox_items_workspace ON public.inbox_items(workspace_id);
CREATE INDEX idx_inbox_items_status ON public.inbox_items(status);
CREATE INDEX idx_inbox_items_priority ON public.inbox_items(priority);
CREATE INDEX idx_inbox_items_assigned ON public.inbox_items(assigned_to);
CREATE INDEX idx_inbox_items_source ON public.inbox_items(source_module);
CREATE INDEX idx_inbox_items_created ON public.inbox_items(created_at DESC);
CREATE INDEX idx_inbox_items_unread ON public.inbox_items(status, created_at DESC) WHERE status = 'unread';
CREATE INDEX idx_inbox_item_actions_item ON public.inbox_item_actions(inbox_item_id);

-- Updated_at trigger
CREATE TRIGGER set_inbox_items_updated_at
  BEFORE UPDATE ON public.inbox_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbox_items;
