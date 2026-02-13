
-- =============================================
-- 1) project_media_items — Consolidated media feed per project
-- =============================================
CREATE TABLE public.project_media_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('deliverable', 'file', 'link', 'project_banner', 'project_cover')),
  source_id UUID,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'external_video', 'file', 'link')),
  title TEXT NOT NULL DEFAULT '',
  thumb_url TEXT,
  media_url TEXT,
  external_url TEXT,
  duration_sec INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  pinned BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  workspace_id TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_media_items_project ON public.project_media_items(project_id);
CREATE INDEX idx_project_media_items_status ON public.project_media_items(project_id, status);

ALTER TABLE public.project_media_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_project_media" ON public.project_media_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_project_media" ON public.project_media_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_update_project_media" ON public.project_media_items
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_delete_project_media" ON public.project_media_items
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_media_items;

-- =============================================
-- 2) ui_state — Persist UI state per user (slide position, etc.)
-- =============================================
CREATE TABLE public.ui_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  scope_key TEXT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, scope, scope_key)
);

CREATE INDEX idx_ui_state_user ON public.ui_state(user_id, scope);

ALTER TABLE public.ui_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_own_ui_state" ON public.ui_state
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "auth_insert_own_ui_state" ON public.ui_state
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auth_update_own_ui_state" ON public.ui_state
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "auth_delete_own_ui_state" ON public.ui_state
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
