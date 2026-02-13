
-- Create prospect_audio table for persisting generated audio files
CREATE TABLE public.prospect_audio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id UUID REFERENCES public.prospects(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.prospect_opportunities(id) ON DELETE SET NULL,
  campaign_id UUID NULL,
  script_text TEXT NOT NULL,
  voice_id TEXT NOT NULL DEFAULT 'onwK4e9ZLuTAKqWW03F9',
  audio_url TEXT,
  duration_seconds NUMERIC,
  status TEXT NOT NULL DEFAULT 'processing',
  trace_id TEXT,
  error_message TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  workspace_id TEXT NOT NULL DEFAULT ''::text
);

-- Enable RLS
ALTER TABLE public.prospect_audio ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "auth_prospect_audio_select" ON public.prospect_audio
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_prospect_audio_insert" ON public.prospect_audio
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_prospect_audio_update" ON public.prospect_audio
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Add automation config columns to prospecting_settings
ALTER TABLE public.prospecting_settings
  ADD COLUMN IF NOT EXISTS approve_first BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_send BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS global_enabled BOOLEAN DEFAULT false;

-- Trigger for updated_at
CREATE TRIGGER update_prospect_audio_updated_at
  BEFORE UPDATE ON public.prospect_audio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Make scout-audio bucket public for playback
UPDATE storage.buckets SET public = true WHERE id = 'scout-audio';
