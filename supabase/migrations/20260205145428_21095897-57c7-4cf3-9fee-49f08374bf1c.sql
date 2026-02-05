-- Brand Kits
CREATE TABLE IF NOT EXISTS public.brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  account_id UUID NULL,
  name TEXT NOT NULL,
  tone_of_voice TEXT,
  do_list TEXT,
  dont_list TEXT,
  colors JSONB DEFAULT '[]'::jsonb,
  fonts JSONB DEFAULT '[]'::jsonb,
  reference_links JSONB DEFAULT '[]'::jsonb,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Content Scripts (linked to ideas)
CREATE TABLE IF NOT EXISTS public.content_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.content_ideas(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
  script TEXT,
  shotlist JSONB DEFAULT '[]'::jsonb,
  caption_variations JSONB DEFAULT '[]'::jsonb,
  hashtags TEXT[] DEFAULT '{}',
  cta TEXT,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketing Assets
CREATE TABLE IF NOT EXISTS public.marketing_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  brand_kit_id UUID REFERENCES public.brand_kits(id) ON DELETE SET NULL,
  project_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('logo', 'luts', 'template', 'font', 'photo', 'video', 'doc', 'other')),
  title TEXT NOT NULL,
  storage_path TEXT,
  public_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Instagram Connections
CREATE TABLE IF NOT EXISTS public.instagram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  ig_username TEXT NOT NULL,
  ig_user_id TEXT,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Instagram Snapshots (cache)
CREATE TABLE IF NOT EXISTS public.instagram_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.instagram_connections(id) ON DELETE CASCADE,
  profile_data JSONB DEFAULT '{}'::jsonb,
  latest_posts JSONB DEFAULT '[]'::jsonb,
  insights JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign Creatives
CREATE TABLE IF NOT EXISTS public.campaign_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  format TEXT,
  copy TEXT,
  hook TEXT,
  cta TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_design', 'ready', 'launched', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing columns to content_ideas
ALTER TABLE public.content_ideas ADD COLUMN IF NOT EXISTS angle TEXT;
ALTER TABLE public.content_ideas ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE public.content_ideas ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3;

-- Add ai_generated to content_items
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_creatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_kits
CREATE POLICY "Users can view all brand_kits" ON public.brand_kits FOR SELECT USING (true);
CREATE POLICY "Users can insert brand_kits" ON public.brand_kits FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update brand_kits" ON public.brand_kits FOR UPDATE USING (true);
CREATE POLICY "Users can delete brand_kits" ON public.brand_kits FOR DELETE USING (true);

-- RLS Policies for content_scripts
CREATE POLICY "Users can view all content_scripts" ON public.content_scripts FOR SELECT USING (true);
CREATE POLICY "Users can insert content_scripts" ON public.content_scripts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update content_scripts" ON public.content_scripts FOR UPDATE USING (true);
CREATE POLICY "Users can delete content_scripts" ON public.content_scripts FOR DELETE USING (true);

-- RLS Policies for marketing_assets
CREATE POLICY "Users can view all marketing_assets" ON public.marketing_assets FOR SELECT USING (true);
CREATE POLICY "Users can insert marketing_assets" ON public.marketing_assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update marketing_assets" ON public.marketing_assets FOR UPDATE USING (true);
CREATE POLICY "Users can delete marketing_assets" ON public.marketing_assets FOR DELETE USING (true);

-- RLS Policies for instagram_connections
CREATE POLICY "Users can view all instagram_connections" ON public.instagram_connections FOR SELECT USING (true);
CREATE POLICY "Users can insert instagram_connections" ON public.instagram_connections FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update instagram_connections" ON public.instagram_connections FOR UPDATE USING (true);
CREATE POLICY "Users can delete instagram_connections" ON public.instagram_connections FOR DELETE USING (true);

-- RLS Policies for instagram_snapshots
CREATE POLICY "Users can view all instagram_snapshots" ON public.instagram_snapshots FOR SELECT USING (true);
CREATE POLICY "Users can insert instagram_snapshots" ON public.instagram_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update instagram_snapshots" ON public.instagram_snapshots FOR UPDATE USING (true);
CREATE POLICY "Users can delete instagram_snapshots" ON public.instagram_snapshots FOR DELETE USING (true);

-- RLS Policies for campaign_creatives
CREATE POLICY "Users can view all campaign_creatives" ON public.campaign_creatives FOR SELECT USING (true);
CREATE POLICY "Users can insert campaign_creatives" ON public.campaign_creatives FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update campaign_creatives" ON public.campaign_creatives FOR UPDATE USING (true);
CREATE POLICY "Users can delete campaign_creatives" ON public.campaign_creatives FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_brand_kits_updated_at BEFORE UPDATE ON public.brand_kits FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();
CREATE TRIGGER update_content_scripts_updated_at BEFORE UPDATE ON public.content_scripts FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();
CREATE TRIGGER update_instagram_connections_updated_at BEFORE UPDATE ON public.instagram_connections FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();
CREATE TRIGGER update_campaign_creatives_updated_at BEFORE UPDATE ON public.campaign_creatives FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();