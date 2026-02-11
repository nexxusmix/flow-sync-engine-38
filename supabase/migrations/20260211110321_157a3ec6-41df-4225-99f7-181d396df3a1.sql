
-- ============================================
-- POLO AI - Persistence, Memory & Conversations
-- ============================================

-- 1. Agent Conversations
CREATE TABLE public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL DEFAULT ''::text::uuid,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  summary TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_conversations_select" ON public.agent_conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "auth_conversations_insert" ON public.agent_conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_conversations_update" ON public.agent_conversations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "auth_conversations_delete" ON public.agent_conversations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_agent_conversations_user ON public.agent_conversations(user_id, updated_at DESC);

-- 2. Agent Messages
CREATE TABLE public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL DEFAULT '',
  attachments JSONB,
  plan_json JSONB,
  result_json JSONB,
  run_id UUID REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- RLS via join to conversation owner
CREATE POLICY "auth_messages_select" ON public.agent_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.agent_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );
CREATE POLICY "auth_messages_insert" ON public.agent_messages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.agent_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );
CREATE POLICY "auth_messages_delete" ON public.agent_messages
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.agent_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );

CREATE INDEX idx_agent_messages_conv ON public.agent_messages(conversation_id, created_at);

-- 3. Agent Memory
CREATE TABLE public.agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL DEFAULT ''::text::uuid,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  source_conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id, key)
);

ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_memory_select" ON public.agent_memory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "auth_memory_insert" ON public.agent_memory
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_memory_update" ON public.agent_memory
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "auth_memory_delete" ON public.agent_memory
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_agent_memory_user ON public.agent_memory(user_id, workspace_id);

-- Triggers for updated_at
CREATE TRIGGER update_agent_conversations_updated_at
  BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_memory_updated_at
  BEFORE UPDATE ON public.agent_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
