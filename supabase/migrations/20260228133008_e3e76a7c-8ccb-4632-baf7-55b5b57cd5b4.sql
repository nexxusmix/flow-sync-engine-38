
-- Instagram Engine: Profile Configuration
CREATE TABLE public.instagram_profile_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  profile_handle TEXT,
  profile_name TEXT,
  avatar_url TEXT,
  niche TEXT,
  sub_niche TEXT,
  target_audience TEXT,
  brand_voice TEXT,
  competitors JSONB DEFAULT '[]',
  content_pillars JSONB DEFAULT '[]',
  posting_frequency JSONB DEFAULT '{"posts_per_week": 3, "preferred_days": [], "preferred_times": []}',
  bio_current TEXT,
  bio_suggestions JSONB DEFAULT '[]',
  profile_score INTEGER DEFAULT 0,
  profile_analysis JSONB,
  strategic_briefing JSONB,
  last_analysis_at TIMESTAMPTZ,
  autopilot_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.instagram_profile_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage instagram config" ON public.instagram_profile_config
  FOR ALL USING (public.is_workspace_member(auth.uid()));

-- Instagram Posts Pipeline
CREATE TABLE public.instagram_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  project_id TEXT,
  campaign_id UUID,
  title TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'reel',
  pillar TEXT,
  objective TEXT,
  status TEXT NOT NULL DEFAULT 'idea',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  hook TEXT,
  script TEXT,
  caption_short TEXT,
  caption_medium TEXT,
  caption_long TEXT,
  cta TEXT,
  pinned_comment TEXT,
  hashtags TEXT[] DEFAULT '{}',
  cover_suggestion TEXT,
  carousel_slides JSONB DEFAULT '[]',
  story_sequence JSONB DEFAULT '[]',
  checklist JSONB DEFAULT '[]',
  ai_generated BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage instagram posts" ON public.instagram_posts
  FOR ALL USING (public.is_workspace_member(auth.uid()));

-- Instagram Hooks Library
CREATE TABLE public.instagram_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  hook_text TEXT NOT NULL,
  category TEXT,
  format TEXT,
  hook_score INTEGER DEFAULT 0,
  score_breakdown JSONB,
  times_used INTEGER DEFAULT 0,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.instagram_hooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage instagram hooks" ON public.instagram_hooks
  FOR ALL USING (public.is_workspace_member(auth.uid()));

-- Instagram Post Metrics (manual entry)
CREATE TABLE public.instagram_post_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.instagram_posts(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  profile_visits INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  dm_received INTEGER DEFAULT 0,
  retention_rate NUMERIC(5,2),
  collected_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.instagram_post_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage instagram post metrics" ON public.instagram_post_metrics
  FOR ALL USING (public.is_workspace_member(auth.uid()));

-- Instagram Profile Snapshots (weekly/monthly metrics)
CREATE TABLE public.instagram_profile_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  avg_engagement NUMERIC(5,2) DEFAULT 0,
  avg_reach INTEGER DEFAULT 0,
  best_posting_time TEXT,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.instagram_profile_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage instagram snapshots" ON public.instagram_profile_snapshots
  FOR ALL USING (public.is_workspace_member(auth.uid()));

-- Instagram Campaigns
CREATE TABLE public.instagram_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  name TEXT NOT NULL,
  objective TEXT,
  target_audience TEXT,
  start_date DATE,
  end_date DATE,
  budget NUMERIC(12,2),
  status TEXT DEFAULT 'planning',
  key_messages JSONB DEFAULT '[]',
  content_plan JSONB DEFAULT '[]',
  kpis JSONB,
  result_report JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.instagram_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage instagram campaigns" ON public.instagram_campaigns
  FOR ALL USING (public.is_workspace_member(auth.uid()));

-- Instagram Bio History
CREATE TABLE public.instagram_bio_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  bio_text TEXT NOT NULL,
  focus TEXT,
  conversion_rate NUMERIC(5,2),
  active_from DATE DEFAULT CURRENT_DATE,
  active_until DATE,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.instagram_bio_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage instagram bio history" ON public.instagram_bio_history
  FOR ALL USING (public.is_workspace_member(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_instagram_profile_config_updated_at
  BEFORE UPDATE ON public.instagram_profile_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instagram_posts_updated_at
  BEFORE UPDATE ON public.instagram_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instagram_campaigns_updated_at
  BEFORE UPDATE ON public.instagram_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
