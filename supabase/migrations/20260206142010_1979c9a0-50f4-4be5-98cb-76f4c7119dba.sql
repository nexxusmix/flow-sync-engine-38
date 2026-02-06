-- =============================================
-- Creative Studio Central - Core Tables
-- =============================================

-- Enum types
CREATE TYPE creative_work_type AS ENUM (
  'script', 'storyboard', 'identity', 'motion', 'campaign_pack', 'full_package'
);

CREATE TYPE creative_work_status AS ENUM (
  'draft', 'in_production', 'review', 'approved', 'archived'
);

CREATE TYPE creative_source AS ENUM (
  'manual', 'ai', 'hybrid'
);

CREATE TYPE creative_block_type AS ENUM (
  'brief', 'narrative_script', 'storyboard', 'storyboard_images', 'shotlist',
  'moodboard', 'visual_identity', 'motion_direction', 'lettering', 'copy_variations'
);

CREATE TYPE creative_block_status AS ENUM (
  'empty', 'draft', 'ready', 'approved'
);

-- =============================================
-- Main Table: creative_works
-- =============================================
CREATE TABLE public.creative_works (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  title TEXT NOT NULL,
  type creative_work_type NOT NULL DEFAULT 'full_package',
  status creative_work_status NOT NULL DEFAULT 'draft',
  source creative_source NOT NULL DEFAULT 'manual',
  
  -- Context links (all optional for flexibility)
  client_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  brand_kit_id UUID REFERENCES public.brand_kits(id) ON DELETE SET NULL,
  
  -- Derivation support
  parent_work_id UUID REFERENCES public.creative_works(id) ON DELETE SET NULL,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- Creative Blocks Table
-- =============================================
CREATE TABLE public.creative_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id UUID NOT NULL REFERENCES public.creative_works(id) ON DELETE CASCADE,
  type creative_block_type NOT NULL,
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  source creative_source NOT NULL DEFAULT 'manual',
  version INT NOT NULL DEFAULT 1,
  order_index INT NOT NULL DEFAULT 0,
  status creative_block_status NOT NULL DEFAULT 'empty',
  ai_run_id UUID REFERENCES public.ai_runs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Each work can have only one block of each type
  UNIQUE(work_id, type)
);

-- =============================================
-- Block Versions Table (History)
-- =============================================
CREATE TABLE public.creative_block_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id UUID NOT NULL REFERENCES public.creative_blocks(id) ON DELETE CASCADE,
  version INT NOT NULL,
  content JSONB NOT NULL,
  source creative_source NOT NULL,
  ai_run_id UUID REFERENCES public.ai_runs(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(block_id, version)
);

-- =============================================
-- Storyboard Frames Table (for images)
-- =============================================
CREATE TABLE public.storyboard_frames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id UUID NOT NULL REFERENCES public.creative_works(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.creative_blocks(id) ON DELETE SET NULL,
  scene_index INT NOT NULL,
  prompt TEXT,
  image_url TEXT,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_creative_works_workspace ON public.creative_works(workspace_id);
CREATE INDEX idx_creative_works_project ON public.creative_works(project_id);
CREATE INDEX idx_creative_works_campaign ON public.creative_works(campaign_id);
CREATE INDEX idx_creative_works_client ON public.creative_works(client_id);
CREATE INDEX idx_creative_works_status ON public.creative_works(status);
CREATE INDEX idx_creative_blocks_work ON public.creative_blocks(work_id);
CREATE INDEX idx_creative_blocks_type ON public.creative_blocks(type);
CREATE INDEX idx_creative_block_versions_block ON public.creative_block_versions(block_id);
CREATE INDEX idx_storyboard_frames_work ON public.storyboard_frames(work_id);

-- =============================================
-- RLS Policies
-- =============================================
ALTER TABLE public.creative_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_block_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storyboard_frames ENABLE ROW LEVEL SECURITY;

-- Creative Works policies
CREATE POLICY "Users can view creative works" ON public.creative_works
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create creative works" ON public.creative_works
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update creative works" ON public.creative_works
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete creative works" ON public.creative_works
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Creative Blocks policies
CREATE POLICY "Users can view creative blocks" ON public.creative_blocks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create creative blocks" ON public.creative_blocks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update creative blocks" ON public.creative_blocks
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete creative blocks" ON public.creative_blocks
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Block Versions policies
CREATE POLICY "Users can view block versions" ON public.creative_block_versions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create block versions" ON public.creative_block_versions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Storyboard Frames policies
CREATE POLICY "Users can view storyboard frames" ON public.storyboard_frames
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create storyboard frames" ON public.storyboard_frames
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update storyboard frames" ON public.storyboard_frames
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete storyboard frames" ON public.storyboard_frames
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- =============================================
-- Triggers for updated_at
-- =============================================
CREATE TRIGGER update_creative_works_updated_at
  BEFORE UPDATE ON public.creative_works
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creative_blocks_updated_at
  BEFORE UPDATE ON public.creative_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_storyboard_frames_updated_at
  BEFORE UPDATE ON public.storyboard_frames
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();