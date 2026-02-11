
-- Table to persist Scout outputs and WhatsApp send status
CREATE TABLE public.agent_scout_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  user_id UUID NOT NULL,
  conversation_id UUID,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT,
  audio_url TEXT,
  message_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'failed')),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  n8n_execution_id TEXT,
  idempotency_key TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_scout_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scout outputs"
  ON public.agent_scout_outputs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scout outputs"
  ON public.agent_scout_outputs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scout outputs"
  ON public.agent_scout_outputs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_agent_scout_outputs_updated_at
  BEFORE UPDATE ON public.agent_scout_outputs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
