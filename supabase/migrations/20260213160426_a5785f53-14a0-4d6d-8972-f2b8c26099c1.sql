
-- =============================================
-- project_assets: Central table for files + links
-- =============================================
CREATE TABLE public.project_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT ''::text,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID,
  uploaded_by_client_name TEXT,
  source_type TEXT NOT NULL DEFAULT 'file' CHECK (source_type IN ('file', 'link')),
  asset_type TEXT NOT NULL DEFAULT 'other' CHECK (asset_type IN ('image', 'video', 'pdf', 'audio', 'zip', 'link', 'other')),
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'client', 'both')),
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('deliverable', 'reference', 'raw', 'contract', 'finance', 'other')),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  stage_key TEXT,
  deliverable_id UUID,
  -- File fields
  storage_bucket TEXT,
  storage_path TEXT,
  file_name TEXT,
  file_ext TEXT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  -- Link fields
  url TEXT,
  provider TEXT CHECK (provider IS NULL OR provider IN ('youtube', 'vimeo', 'drive', 'generic')),
  embed_url TEXT,
  og_image_url TEXT,
  -- Preview fields
  thumb_url TEXT,
  preview_url TEXT,
  duration_seconds NUMERIC,
  width INTEGER,
  height INTEGER,
  -- AI fields
  ai_title TEXT,
  ai_summary TEXT,
  ai_tags TEXT[],
  ai_entities JSONB,
  ai_confidence NUMERIC,
  -- Processing
  ai_processed BOOLEAN NOT NULL DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast project lookups
CREATE INDEX idx_project_assets_project ON public.project_assets(project_id);
CREATE INDEX idx_project_assets_category ON public.project_assets(project_id, category);
CREATE INDEX idx_project_assets_status ON public.project_assets(status);

-- Updated_at trigger
CREATE TRIGGER update_project_assets_updated_at
  BEFORE UPDATE ON public.project_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_project_assets_select" ON public.project_assets
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_project_assets_insert" ON public.project_assets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_project_assets_update" ON public.project_assets
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_project_assets_delete" ON public.project_assets
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- =============================================
-- asset_processing_jobs: Processing queue
-- =============================================
CREATE TABLE public.asset_processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.project_assets(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('thumb', 'preview', 'metadata', 'ai_enrich')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_jobs_asset ON public.asset_processing_jobs(asset_id);
CREATE INDEX idx_asset_jobs_status ON public.asset_processing_jobs(status);

CREATE TRIGGER update_asset_jobs_updated_at
  BEFORE UPDATE ON public.asset_processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.asset_processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_asset_jobs_select" ON public.asset_processing_jobs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_asset_jobs_insert" ON public.asset_processing_jobs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_asset_jobs_update" ON public.asset_processing_jobs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Enable realtime for project_assets
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_assets;
