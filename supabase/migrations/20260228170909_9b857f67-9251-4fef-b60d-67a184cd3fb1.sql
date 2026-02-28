
-- Create project_file_categories table
CREATE TABLE public.project_file_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT DEFAULT 'folder',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_file_categories ENABLE ROW LEVEL SECURITY;

-- RLS: workspace members can read all (defaults + project-specific)
CREATE POLICY "Members can view categories"
  ON public.project_file_categories FOR SELECT
  USING (
    is_default = true
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_file_categories.project_id
        AND public.is_workspace_member(auth.uid())
    )
  );

-- RLS: workspace members can insert project categories
CREATE POLICY "Members can create project categories"
  ON public.project_file_categories FOR INSERT
  WITH CHECK (
    project_id IS NOT NULL
    AND public.is_workspace_member(auth.uid())
  );

-- RLS: workspace members can delete their project categories (not defaults)
CREATE POLICY "Members can delete project categories"
  ON public.project_file_categories FOR DELETE
  USING (
    is_default = false
    AND project_id IS NOT NULL
    AND public.is_workspace_member(auth.uid())
  );

-- Seed default categories
INSERT INTO public.project_file_categories (project_id, name, slug, icon, is_default) VALUES
  (NULL, 'Brutos', 'brutos', 'file-video', true),
  (NULL, 'Projeto', 'projeto', 'folder', true),
  (NULL, 'Referências', 'referencias', 'file-image', true),
  (NULL, 'Entregas', 'entregas', 'file', true),
  (NULL, 'Contratos', 'contratos', 'file-text', true),
  (NULL, 'Outros', 'outros', 'file', true);
