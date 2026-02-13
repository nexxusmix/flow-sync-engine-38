
-- Extend project_deliverables with full deliverable fields
ALTER TABLE public.project_deliverables
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'file',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lock_reason text,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS file_size bigint,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS link_provider text,
  ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1;

-- Create deliverable_comments table
CREATE TABLE IF NOT EXISTS public.deliverable_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deliverable_id uuid NOT NULL REFERENCES public.project_deliverables(id) ON DELETE CASCADE,
  workspace_id text NOT NULL DEFAULT ''::text,
  author_type text NOT NULL DEFAULT 'manager',
  author_id uuid,
  author_name text NOT NULL DEFAULT 'Anônimo',
  content text NOT NULL,
  attachments jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for deliverable_comments
ALTER TABLE public.deliverable_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_comments_select" ON public.deliverable_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_comments_insert" ON public.deliverable_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_comments_delete" ON public.deliverable_comments
  FOR DELETE USING (auth.uid() = author_id);

-- Enable realtime for deliverables
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_deliverables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverable_comments;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_deliverables_project ON public.project_deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_comments_deliverable ON public.deliverable_comments(deliverable_id);
