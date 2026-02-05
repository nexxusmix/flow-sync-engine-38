-- Marketing & Content Module Schema (Fixed)

-- A) content_ideas (banco de ideias)
CREATE TABLE public.content_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    hook TEXT,
    pillar TEXT CHECK (pillar IN ('autoridade', 'bastidores', 'cases', 'oferta', 'prova_social', 'educacional')),
    format TEXT CHECK (format IN ('reel', 'post', 'carousel', 'story', 'short', 'long', 'ad', 'youtube', 'email')),
    channel TEXT CHECK (channel IN ('instagram', 'tiktok', 'youtube', 'linkedin', 'email', 'site')),
    target TEXT,
    reference_links JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'selected', 'discarded')),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- B) campaigns
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    objective TEXT,
    offer TEXT,
    audience TEXT,
    start_date DATE,
    end_date DATE,
    budget NUMERIC,
    kpis JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- C) content_items (pipeline real)
CREATE TABLE public.content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
    idea_id UUID REFERENCES public.content_ideas(id) ON DELETE SET NULL,
    project_id TEXT,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    channel TEXT CHECK (channel IN ('instagram', 'tiktok', 'youtube', 'linkedin', 'email', 'site')),
    format TEXT CHECK (format IN ('reel', 'post', 'carousel', 'story', 'short', 'long', 'ad')),
    pillar TEXT CHECK (pillar IN ('autoridade', 'bastidores', 'cases', 'oferta', 'prova_social', 'educacional')),
    status TEXT DEFAULT 'briefing' CHECK (status IN ('briefing', 'writing', 'recording', 'editing', 'review', 'approved', 'scheduled', 'published', 'archived')),
    owner_id UUID,
    owner_name TEXT,
    owner_initials TEXT,
    due_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    post_url TEXT,
    hook TEXT,
    caption_short TEXT,
    caption_long TEXT,
    cta TEXT,
    hashtags TEXT,
    script TEXT,
    notes TEXT,
    assets JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- D) content_comments (revisão interna)
CREATE TABLE public.content_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
    author_id UUID,
    author_name TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- E) content_checklist (checklist por item)
CREATE TABLE public.content_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- F) instagram_references (import do IG)
CREATE TABLE public.instagram_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id TEXT,
    content_idea_id UUID REFERENCES public.content_ideas(id) ON DELETE SET NULL,
    content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
    media_id TEXT,
    media_type TEXT,
    media_url TEXT,
    thumbnail_url TEXT,
    permalink TEXT,
    caption TEXT,
    timestamp TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_references ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_ideas
CREATE POLICY "Users can view all content_ideas" ON public.content_ideas FOR SELECT USING (true);
CREATE POLICY "Users can insert content_ideas" ON public.content_ideas FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update content_ideas" ON public.content_ideas FOR UPDATE USING (true);
CREATE POLICY "Users can delete content_ideas" ON public.content_ideas FOR DELETE USING (true);

-- RLS Policies for campaigns
CREATE POLICY "Users can view all campaigns" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Users can insert campaigns" ON public.campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update campaigns" ON public.campaigns FOR UPDATE USING (true);
CREATE POLICY "Users can delete campaigns" ON public.campaigns FOR DELETE USING (true);

-- RLS Policies for content_items
CREATE POLICY "Users can view all content_items" ON public.content_items FOR SELECT USING (true);
CREATE POLICY "Users can insert content_items" ON public.content_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update content_items" ON public.content_items FOR UPDATE USING (true);
CREATE POLICY "Users can delete content_items" ON public.content_items FOR DELETE USING (true);

-- RLS Policies for content_comments
CREATE POLICY "Users can view all content_comments" ON public.content_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert content_comments" ON public.content_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update content_comments" ON public.content_comments FOR UPDATE USING (true);
CREATE POLICY "Users can delete content_comments" ON public.content_comments FOR DELETE USING (true);

-- RLS Policies for content_checklist
CREATE POLICY "Users can view all content_checklist" ON public.content_checklist FOR SELECT USING (true);
CREATE POLICY "Users can insert content_checklist" ON public.content_checklist FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update content_checklist" ON public.content_checklist FOR UPDATE USING (true);
CREATE POLICY "Users can delete content_checklist" ON public.content_checklist FOR DELETE USING (true);

-- RLS Policies for instagram_references
CREATE POLICY "Users can view all instagram_references" ON public.instagram_references FOR SELECT USING (true);
CREATE POLICY "Users can insert instagram_references" ON public.instagram_references FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update instagram_references" ON public.instagram_references FOR UPDATE USING (true);
CREATE POLICY "Users can delete instagram_references" ON public.instagram_references FOR DELETE USING (true);

-- Create storage bucket for marketing assets
INSERT INTO storage.buckets (id, name, public) VALUES ('marketing-assets', 'marketing-assets', true);

-- Storage policies for marketing assets
CREATE POLICY "Marketing assets are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'marketing-assets');
CREATE POLICY "Users can upload marketing assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketing-assets');
CREATE POLICY "Users can update marketing assets" ON storage.objects FOR UPDATE USING (bucket_id = 'marketing-assets');
CREATE POLICY "Users can delete marketing assets" ON storage.objects FOR DELETE USING (bucket_id = 'marketing-assets');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_marketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_content_ideas_updated_at BEFORE UPDATE ON public.content_ideas FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();
CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.update_marketing_updated_at();