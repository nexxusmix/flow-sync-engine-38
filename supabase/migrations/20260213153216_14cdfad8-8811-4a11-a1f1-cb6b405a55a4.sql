
-- ══════════════════════════════════════════════════
-- SCOUT PIPELINE TABLES
-- ══════════════════════════════════════════════════

-- 1) scout_opportunities
CREATE TABLE public.scout_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  user_id UUID NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  source_ref TEXT,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_role TEXT,
  contact_phone_e164 TEXT,
  context JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW','COPY_READY','AUDIO_READY','PENDING_APPROVAL','SENDING','SENT','FAILED','ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE UNIQUE INDEX idx_scout_opp_dedup ON public.scout_opportunities (workspace_id, source, source_ref) WHERE source_ref IS NOT NULL;
CREATE INDEX idx_scout_opp_status ON public.scout_opportunities (status, created_at DESC);

ALTER TABLE public.scout_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scout opportunities" ON public.scout_opportunities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2) scout_messages (versioned copy)
CREATE TABLE public.scout_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.scout_opportunities(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  version INT NOT NULL DEFAULT 1,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  text_message TEXT,
  audio_script TEXT,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_scout_msg_opp ON public.scout_messages (opportunity_id, is_active, version DESC);

ALTER TABLE public.scout_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage scout messages via opportunity" ON public.scout_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.scout_opportunities o WHERE o.id = opportunity_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.scout_opportunities o WHERE o.id = opportunity_id AND o.user_id = auth.uid()));

-- 3) scout_audio_assets
CREATE TABLE public.scout_audio_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.scout_opportunities(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.scout_messages(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  storage_path TEXT NOT NULL,
  public_url TEXT,
  duration_seconds NUMERIC,
  voice_id TEXT,
  content_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scout_audio_opp ON public.scout_audio_assets (opportunity_id);

ALTER TABLE public.scout_audio_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage scout audio via opportunity" ON public.scout_audio_assets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.scout_opportunities o WHERE o.id = opportunity_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.scout_opportunities o WHERE o.id = opportunity_id AND o.user_id = auth.uid()));

-- 4) whatsapp_outbox
CREATE TABLE public.whatsapp_outbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  user_id UUID NOT NULL,
  opportunity_id UUID REFERENCES public.scout_opportunities(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.scout_messages(id) ON DELETE SET NULL,
  audio_asset_id UUID REFERENCES public.scout_audio_assets(id) ON DELETE SET NULL,
  to_phone_e164 TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  provider TEXT NOT NULL DEFAULT 'n8n',
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED','SENDING','SENT','DELIVERED','READ','FAILED','CANCELLED')),
  error_code TEXT,
  error_message TEXT,
  attempts INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  client_request_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_whatsapp_outbox_idempotent ON public.whatsapp_outbox (workspace_id, client_request_id);
CREATE INDEX idx_whatsapp_outbox_status ON public.whatsapp_outbox (status, next_retry_at);

ALTER TABLE public.whatsapp_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own whatsapp outbox" ON public.whatsapp_outbox FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5) crm_activities (if not exists)
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_activities' AND policyname = 'Users manage own crm activities') THEN
    CREATE POLICY "Users manage own crm activities" ON public.crm_activities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Enable realtime for pipeline tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.scout_opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_outbox;

-- Auto-update updated_at triggers
CREATE TRIGGER update_scout_opportunities_updated_at
  BEFORE UPDATE ON public.scout_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_outbox_updated_at
  BEFORE UPDATE ON public.whatsapp_outbox
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for scout audio
INSERT INTO storage.buckets (id, name, public) VALUES ('scout-audio', 'scout-audio', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users upload scout audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'scout-audio' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users read scout audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'scout-audio' AND auth.role() = 'authenticated');
