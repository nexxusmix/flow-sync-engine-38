
-- Storyboards table
CREATE TABLE public.project_storyboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('script', 'file', 'text')),
  source_text TEXT,
  source_reference_id UUID,
  style_global TEXT DEFAULT 'Original neutro',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_storyboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_storyboards_select" ON public.project_storyboards FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_storyboards_insert" ON public.project_storyboards FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());
CREATE POLICY "auth_storyboards_update" ON public.project_storyboards FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_storyboards_delete" ON public.project_storyboards FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_project_storyboards_updated_at
  BEFORE UPDATE ON public.project_storyboards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scenes table
CREATE TABLE public.project_storyboard_scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  storyboard_id UUID NOT NULL REFERENCES public.project_storyboards(id) ON DELETE CASCADE,
  scene_number INT NOT NULL,
  title TEXT,
  description TEXT,
  direction TEXT,
  lens TEXT,
  fps TEXT,
  camera_movement TEXT,
  lighting TEXT,
  mood TEXT,
  color_grading TEXT,
  production_type TEXT CHECK (production_type IN ('motion', 'motion_3d', 'vfx', 'video_real', 'fotografia_still', 'mixed_media')),
  ai_prompt TEXT,
  negative_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_storyboard_scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_scenes_select" ON public.project_storyboard_scenes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_scenes_insert" ON public.project_storyboard_scenes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_scenes_update" ON public.project_storyboard_scenes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_scenes_delete" ON public.project_storyboard_scenes FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_project_storyboard_scenes_updated_at
  BEFORE UPDATE ON public.project_storyboard_scenes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_storyboards_project ON public.project_storyboards(project_id);
CREATE INDEX idx_scenes_storyboard ON public.project_storyboard_scenes(storyboard_id);
