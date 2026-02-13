
-- Table for panorama snapshots & audit log
CREATE TABLE public.panorama_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL DEFAULT '',
  generated_by UUID REFERENCES auth.users(id),
  tone TEXT DEFAULT 'natural',
  text_content TEXT,
  pdf_url TEXT,
  pdf_file_path TEXT,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  share_expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  version INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.panorama_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_panorama_select" ON public.panorama_snapshots FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_panorama_insert" ON public.panorama_snapshots FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_panorama_update" ON public.panorama_snapshots FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Table for panorama access audit
CREATE TABLE public.panorama_access_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_id UUID REFERENCES public.panorama_snapshots(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.panorama_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_panorama_log_select" ON public.panorama_access_log FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_panorama_log_insert" ON public.panorama_access_log FOR INSERT WITH CHECK (true);

-- Enable realtime for panorama snapshots
ALTER PUBLICATION supabase_realtime ADD TABLE public.panorama_snapshots;
