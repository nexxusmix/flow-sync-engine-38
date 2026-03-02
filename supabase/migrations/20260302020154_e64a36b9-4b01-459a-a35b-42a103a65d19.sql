
-- Campaign Templates table
CREATE TABLE public.instagram_campaign_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  target_audience TEXT,
  budget NUMERIC,
  duration_days INTEGER,
  formats JSONB DEFAULT '[]'::jsonb,
  pillars JSONB DEFAULT '[]'::jsonb,
  post_templates JSONB DEFAULT '[]'::jsonb,
  tone TEXT,
  themes JSONB DEFAULT '[]'::jsonb,
  times_used INTEGER DEFAULT 0,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_campaign_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view campaign templates"
  ON public.instagram_campaign_templates FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert campaign templates"
  ON public.instagram_campaign_templates FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update campaign templates"
  ON public.instagram_campaign_templates FOR UPDATE
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete campaign templates"
  ON public.instagram_campaign_templates FOR DELETE
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Campaign Goals table for OKR tracking
CREATE TABLE public.instagram_campaign_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.instagram_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT '',
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_campaign_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage campaign goals"
  ON public.instagram_campaign_goals FOR ALL
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Add review fields to instagram_posts
ALTER TABLE public.instagram_posts
  ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
