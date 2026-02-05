-- Creative Studio Tables

-- Briefs: Input do usuário para geração criativa
CREATE TABLE public.creative_briefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  account_id UUID NULL,
  project_id TEXT NULL,
  brand_kit_id UUID NULL REFERENCES public.brand_kits(id),
  title TEXT NOT NULL,
  input_text TEXT NULL,
  input_files JSONB DEFAULT '[]'::jsonb,
  extracted_context JSONB DEFAULT '{}'::jsonb,
  package_type TEXT DEFAULT 'full' CHECK (package_type IN ('full', 'storyboard', 'campaign', 'weekly', 'images_only')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Outputs: Cada entregável gerado
CREATE TABLE public.creative_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brief_id UUID NOT NULL REFERENCES public.creative_briefs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('concept', 'script', 'storyboard', 'shotlist', 'moodboard', 'campaign', 'weekly_plan', 'pdf_pack')),
  format TEXT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Storyboard Scenes: Cenas detalhadas
CREATE TABLE public.storyboard_scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brief_id UUID NOT NULL REFERENCES public.creative_briefs(id) ON DELETE CASCADE,
  output_id UUID NULL REFERENCES public.creative_outputs(id) ON DELETE CASCADE,
  scene_number INT NOT NULL,
  title TEXT,
  description TEXT,
  emotion TEXT,
  camera TEXT,
  duration_sec INT NULL,
  audio TEXT NULL,
  notes TEXT NULL,
  image_url TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generated Images: Imagens geradas via Nano Banana Pro
CREATE TABLE public.generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
  account_id UUID NULL,
  project_id TEXT NULL,
  brief_id UUID NULL REFERENCES public.creative_briefs(id) ON DELETE SET NULL,
  scene_id UUID NULL REFERENCES public.storyboard_scenes(id) ON DELETE SET NULL,
  purpose TEXT DEFAULT 'storyboard_frame' CHECK (purpose IN ('storyboard_frame', 'mood_tile', 'key_visual')),
  prompt TEXT NOT NULL,
  storage_path TEXT NULL,
  public_url TEXT NULL,
  width INT NULL,
  height INT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creative_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storyboard_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creative_briefs
CREATE POLICY "Users can view all creative_briefs" ON public.creative_briefs FOR SELECT USING (true);
CREATE POLICY "Users can insert creative_briefs" ON public.creative_briefs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update creative_briefs" ON public.creative_briefs FOR UPDATE USING (true);
CREATE POLICY "Users can delete creative_briefs" ON public.creative_briefs FOR DELETE USING (true);

-- RLS Policies for creative_outputs
CREATE POLICY "Users can view all creative_outputs" ON public.creative_outputs FOR SELECT USING (true);
CREATE POLICY "Users can insert creative_outputs" ON public.creative_outputs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update creative_outputs" ON public.creative_outputs FOR UPDATE USING (true);
CREATE POLICY "Users can delete creative_outputs" ON public.creative_outputs FOR DELETE USING (true);

-- RLS Policies for storyboard_scenes
CREATE POLICY "Users can view all storyboard_scenes" ON public.storyboard_scenes FOR SELECT USING (true);
CREATE POLICY "Users can insert storyboard_scenes" ON public.storyboard_scenes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update storyboard_scenes" ON public.storyboard_scenes FOR UPDATE USING (true);
CREATE POLICY "Users can delete storyboard_scenes" ON public.storyboard_scenes FOR DELETE USING (true);

-- RLS Policies for generated_images
CREATE POLICY "Users can view all generated_images" ON public.generated_images FOR SELECT USING (true);
CREATE POLICY "Users can insert generated_images" ON public.generated_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update generated_images" ON public.generated_images FOR UPDATE USING (true);
CREATE POLICY "Users can delete generated_images" ON public.generated_images FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_creative_briefs_updated_at
  BEFORE UPDATE ON public.creative_briefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketing_updated_at();

-- Create index for better query performance
CREATE INDEX idx_creative_outputs_brief_id ON public.creative_outputs(brief_id);
CREATE INDEX idx_storyboard_scenes_brief_id ON public.storyboard_scenes(brief_id);
CREATE INDEX idx_generated_images_brief_id ON public.generated_images(brief_id);
CREATE INDEX idx_generated_images_scene_id ON public.generated_images(scene_id);