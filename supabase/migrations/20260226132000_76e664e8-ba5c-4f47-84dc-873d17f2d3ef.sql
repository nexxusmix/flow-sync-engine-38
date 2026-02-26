
-- =====================================================
-- FASE 19: Portal do Cliente v2 - Chat + Timeline
-- =====================================================

-- 1. PORTAL CHAT MESSAGES - Chat bidirecional em tempo real
CREATE TABLE public.portal_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_link_id UUID NOT NULL REFERENCES portal_links(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'client' CHECK (sender_type IN ('client', 'team')),
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  sender_user_id UUID, -- NULL for clients, set for team members
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  mentions JSONB DEFAULT '[]'::jsonb, -- [{name, email}]
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_chat_messages;

-- Indexes
CREATE INDEX idx_portal_chat_link ON portal_chat_messages(portal_link_id, created_at DESC);
CREATE INDEX idx_portal_chat_unread ON portal_chat_messages(portal_link_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE public.portal_chat_messages ENABLE ROW LEVEL SECURITY;

-- Anon can read messages from active portals
CREATE POLICY "anon_read_portal_chat" ON portal_chat_messages
  FOR SELECT TO anon
  USING (
    portal_link_id IN (
      SELECT id FROM portal_links WHERE is_active = true
    )
  );

-- Anon can insert messages (client chat)
CREATE POLICY "anon_insert_portal_chat" ON portal_chat_messages
  FOR INSERT TO anon
  WITH CHECK (
    sender_type = 'client'
    AND portal_link_id IN (
      SELECT id FROM portal_links WHERE is_active = true
    )
  );

-- Authenticated team members can read/insert/update
CREATE POLICY "auth_read_portal_chat" ON portal_chat_messages
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_insert_portal_chat" ON portal_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'team'
    AND sender_user_id = auth.uid()
  );

CREATE POLICY "auth_update_portal_chat" ON portal_chat_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 2. PORTAL TIMELINE EVENTS - Timeline consolidada
CREATE TABLE public.portal_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_link_id UUID NOT NULL REFERENCES portal_links(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('status_change', 'delivery', 'chat_message', 'approval', 'revision', 'file_upload', 'stage_change', 'comment')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  actor_name TEXT,
  actor_type TEXT DEFAULT 'system' CHECK (actor_type IN ('client', 'team', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_timeline_events;

-- Index
CREATE INDEX idx_portal_timeline_link ON portal_timeline_events(portal_link_id, created_at DESC);

-- RLS
ALTER TABLE public.portal_timeline_events ENABLE ROW LEVEL SECURITY;

-- Anon can read timeline from active portals
CREATE POLICY "anon_read_portal_timeline" ON portal_timeline_events
  FOR SELECT TO anon
  USING (
    portal_link_id IN (
      SELECT id FROM portal_links WHERE is_active = true
    )
  );

-- Authenticated can read and insert
CREATE POLICY "auth_read_portal_timeline" ON portal_timeline_events
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_insert_portal_timeline" ON portal_timeline_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- System/anon can also insert timeline events (for client actions)
CREATE POLICY "anon_insert_portal_timeline" ON portal_timeline_events
  FOR INSERT TO anon
  WITH CHECK (
    actor_type = 'client'
    AND portal_link_id IN (
      SELECT id FROM portal_links WHERE is_active = true
    )
  );

-- 3. Trigger: auto-create timeline event when chat message is sent
CREATE OR REPLACE FUNCTION public.portal_chat_to_timeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO portal_timeline_events (
    portal_link_id, event_type, title, description, actor_name, actor_type, metadata
  ) VALUES (
    NEW.portal_link_id,
    'chat_message',
    CASE WHEN NEW.sender_type = 'client' THEN 'Mensagem do cliente' ELSE 'Mensagem da equipe' END,
    LEFT(NEW.content, 120),
    NEW.sender_name,
    NEW.sender_type,
    jsonb_build_object('chat_message_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_portal_chat_timeline
  AFTER INSERT ON portal_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION portal_chat_to_timeline();

-- 4. Add client_email to portal_links for optional login
ALTER TABLE portal_links ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE portal_links ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE portal_links ADD COLUMN IF NOT EXISTS allow_chat BOOLEAN DEFAULT true;
